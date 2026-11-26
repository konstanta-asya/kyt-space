"""Booking Engine: слоти, 5-хв hold, дедлайни, апаратура, блокування.

Усі бізнес-правила рахуються за київським часом. Захист від подвійного бронювання —
EXCLUDE constraint `bookings_no_overlap` у БД; тут лише перекладаємо його помилку в SlotTaken.
"""

from datetime import UTC, date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from sqlalchemy import and_, func, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.modules.auth.models import Role, User, has_role
from app.modules.bookings.models import ACTIVE_STATUSES, BlockedSlot, Booking, BookingEquipment, BookingStatus
from app.modules.bookings.schemas import SubmitRequest
from app.modules.equipment.models import Equipment, EquipmentStatus, EquipmentType
from app.modules.rooms.models import Room

KYIV = ZoneInfo("Europe/Kyiv")
SLOT = timedelta(minutes=30)
HOLD_TTL = timedelta(minutes=5)
BOOKING_DEADLINE = time(20, 0)  # на завтра — лише до 20:00 сьогодні
FREE_CANCEL_BEFORE = timedelta(hours=24)


class BookingError(Exception):
    """Базова помилка бронювання; текст іде в detail відповіді."""


class RoomNotFound(BookingError):
    pass


class BookingNotFound(BookingError):
    pass


class BlockedSlotNotFound(BookingError):
    pass


class MembersOnly(BookingError):
    pass


class InvalidSlot(BookingError):
    pass


class DeadlinePassed(BookingError):
    pass


class SlotBlocked(BookingError):
    pass


class SlotTaken(BookingError):
    pass


class HoldExpired(BookingError):
    pass


class InvalidTransition(BookingError):
    pass


class EquipmentUnavailable(BookingError):
    pass


def now() -> datetime:
    """Окрема функція, щоб тести могли підмінити поточний час."""
    return datetime.now(UTC)


def _overlaps(model, start: datetime, end: datetime):
    return and_(model.start_time < end, model.end_time > start)


def _not_expired(at: datetime):
    """Прострочений hold уже нічого не займає — ховаємо його з усіх вибірок."""
    return or_(Booking.status != BookingStatus.HOLDING.value, Booking.hold_expires_at > at)


def _day_bounds(day: date) -> tuple[datetime, datetime]:
    return datetime.combine(day, time(0), KYIV), datetime.combine(day + timedelta(days=1), time(0), KYIV)


def _get_room(db: Session, room_id: int) -> Room:
    room = db.get(Room, room_id)
    if room is None:
        raise RoomNotFound("Room not found")
    return room


def _get_own_booking(db: Session, user: User, booking_id: int) -> Booking:
    booking = db.get(Booking, booking_id)
    if booking is None or booking.user_id != user.id:  # чуже бронювання = 404, не світимо, що воно існує
        raise BookingNotFound("Booking not found")
    return booking


def _validate_slot(room: Room, start: datetime, end: datetime, at: datetime) -> None:
    start, end = start.astimezone(KYIV), end.astimezone(KYIV)
    if end <= start:
        raise InvalidSlot("end_time must be after start_time")
    if start.date() != end.date():
        raise InvalidSlot("Booking must fit in one day")
    for t in (start, end):
        if t.minute % 30 or t.second or t.microsecond:
            raise InvalidSlot("Time must be on the 30-minute grid (:00 or :30)")
    if start.time() < room.open_from or end.time() > room.open_to:
        raise InvalidSlot(f"Room is open {room.open_from:%H:%M}–{room.open_to:%H:%M}")
    deadline = datetime.combine(start.date() - timedelta(days=1), BOOKING_DEADLINE, KYIV)
    if at >= deadline:
        raise DeadlinePassed(f"Booking for {start.date()} closed at {deadline:%Y-%m-%d %H:%M}")


# --- Клієнт


def get_slots(db: Session, room_id: int, day: date) -> list[dict]:
    """Сітка 30-хв слотів на день: free / busy / blocked."""
    room = _get_room(db, room_id)
    day_start = datetime.combine(day, room.open_from, KYIV)
    day_end = datetime.combine(day, room.open_to, KYIV)
    at = now()
    bookings = (
        db.query(Booking.start_time, Booking.end_time)
        .filter(
            Booking.room_id == room_id,
            Booking.status.in_(ACTIVE_STATUSES),
            _not_expired(at),
            _overlaps(Booking, day_start, day_end),
        )
        .all()
    )
    blocks = (
        db.query(BlockedSlot.start_time, BlockedSlot.end_time)
        .filter(BlockedSlot.room_id == room_id, _overlaps(BlockedSlot, day_start, day_end))
        .all()
    )

    slots = []
    t = day_start
    while t + SLOT <= day_end:
        end = t + SLOT
        if any(s < end and e > t for s, e in blocks):
            status = "blocked"
        elif any(s < end and e > t for s, e in bookings):
            status = "busy"
        else:
            status = "free"
        slots.append({"start_time": t, "end_time": end, "status": status})
        t = end
    return slots


def hold_slot(db: Session, user: User, room_id: int, start: datetime, end: datetime) -> Booking:
    """Крок 1: займає слот на 5 хв, поки користувач заповнює заявку."""
    room = _get_room(db, room_id)
    if room.is_members_only and not has_role(user.role, Role.KUTIVETS):
        raise MembersOnly("This room is for KUT members only")
    at = now()
    _validate_slot(room, start, end, at)
    if db.query(BlockedSlot.id).filter(BlockedSlot.room_id == room_id, _overlaps(BlockedSlot, start, end)).first():
        raise SlotBlocked("Slot is blocked")

    # Звільняємо прострочені hold цієї кімнати (інакше EXCLUDE їх ще бачить)
    # і попередні hold цього ж користувача — одна заявка за раз, щоб не займати всю сітку.
    db.query(Booking).filter(
        Booking.status == BookingStatus.HOLDING.value,
        or_(and_(Booking.room_id == room_id, Booking.hold_expires_at <= at), Booking.user_id == user.id),
    ).delete(synchronize_session=False)

    booking = Booking(
        user_id=user.id,
        room_id=room_id,
        start_time=start,
        end_time=end,
        status=BookingStatus.HOLDING.value,
        hold_expires_at=at + HOLD_TTL,
    )
    db.add(booking)
    try:
        db.commit()
    except IntegrityError as err:
        db.rollback()
        if getattr(err.orig, "pgcode", None) == "23P01":  # exclusion_violation
            raise SlotTaken("Slot is already taken") from err
        raise
    db.refresh(booking)
    return booking


def submit_booking(db: Session, user: User, booking_id: int, data: SubmitRequest) -> Booking:
    """Крок 2: hold -> pending, з апаратурою і коментарем."""
    booking = _get_own_booking(db, user, booking_id)
    if booking.status != BookingStatus.HOLDING.value:
        raise InvalidTransition(f"Cannot submit booking in status {booking.status}")
    if booking.hold_expires_at <= now():
        raise HoldExpired("Hold expired, choose the slot again")

    requested: dict[int, int] = {}
    for item in data.equipment:
        requested[item.equipment_id] = requested.get(item.equipment_id, 0) + item.quantity
    if requested:
        # FOR UPDATE серіалізує паралельні заявки на ту саму апаратуру — EXCLUDE суми не рахує.
        items = db.query(Equipment).filter(Equipment.id.in_(requested)).order_by(Equipment.id).with_for_update().all()
        if len(items) != len(requested):
            raise EquipmentUnavailable("Equipment not found")
        used = dict(
            db.query(BookingEquipment.equipment_id, func.sum(BookingEquipment.quantity))
            .join(Booking)
            .filter(
                BookingEquipment.equipment_id.in_(requested),
                Booking.status.in_((BookingStatus.PENDING.value, BookingStatus.CONFIRMED.value)),
                _overlaps(Booking, booking.start_time, booking.end_time),
            )
            .group_by(BookingEquipment.equipment_id)
            .all()
        )
        for eq in items:
            if eq.type != EquipmentType.PORTABLE.value or eq.status != EquipmentStatus.OK.value:
                raise EquipmentUnavailable(f"{eq.name} cannot be booked")
            free = (eq.total_quantity or 0) - used.get(eq.id, 0)
            if requested[eq.id] > free:
                raise EquipmentUnavailable(f"{eq.name}: only {max(free, 0)} available for this time")

    booking.equipment = [BookingEquipment(equipment_id=i, quantity=q) for i, q in requested.items()]
    booking.type = data.type.value
    booking.comment = data.comment
    booking.status = BookingStatus.PENDING.value
    booking.hold_expires_at = None
    db.commit()
    db.refresh(booking)
    return booking


def list_my_bookings(db: Session, user: User) -> list[Booking]:
    return (
        db.query(Booking)
        .filter(Booking.user_id == user.id, _not_expired(now()))
        .order_by(Booking.start_time.desc())
        .all()
    )


def cancel_booking(db: Session, user: User, booking_id: int) -> Booking:
    """Скасувати можна завжди до початку; менш ніж за 24 год — late_cancel (штрафне)."""
    booking = _get_own_booking(db, user, booking_id)
    at = now()
    if booking.status not in ACTIVE_STATUSES:
        raise InvalidTransition(f"Cannot cancel booking in status {booking.status}")
    if booking.start_time <= at:
        raise InvalidTransition("Booking has already started")
    booking.late_cancel = booking.status != BookingStatus.HOLDING.value and booking.start_time - at < FREE_CANCEL_BEFORE
    booking.status = BookingStatus.CANCELLED.value
    booking.cancelled_at = at
    booking.hold_expires_at = None
    db.commit()
    db.refresh(booking)
    return booking


# --- Менеджер


def list_bookings(
    db: Session, status: str | None = None, room_id: int | None = None, day: date | None = None
) -> list[Booking]:
    """Inbox (status=pending) і календар усіх кімнат (day, room_id)."""
    query = db.query(Booking).filter(_not_expired(now()))
    if status:
        query = query.filter(Booking.status == status)
    if room_id:
        query = query.filter(Booking.room_id == room_id)
    if day:
        query = query.filter(_overlaps(Booking, *_day_bounds(day)))
    return query.order_by(Booking.start_time).all()


def review_booking(db: Session, manager: User, booking_id: int, confirm: bool) -> Booking:
    booking = db.get(Booking, booking_id)
    if booking is None:
        raise BookingNotFound("Booking not found")
    if booking.status != BookingStatus.PENDING.value:
        raise InvalidTransition(f"Cannot review booking in status {booking.status}")
    booking.status = BookingStatus.CONFIRMED.value if confirm else BookingStatus.REJECTED.value
    booking.reviewed_by = manager.id
    db.commit()
    db.refresh(booking)
    return booking


def create_blocks(
    db: Session, manager: User, room_ids: list[int] | None, start: datetime, end: datetime, reason: str | None
) -> list[BlockedSlot]:
    """Точкове (room_ids) або масове (None = усі кімнати) блокування. Наявні бронювання не чіпаємо —
    менеджер бачить їх у календарі й пише клієнтам вручну."""
    if end <= start:
        raise InvalidSlot("end_time must be after start_time")
    if room_ids is None:
        room_ids = [r for (r,) in db.query(Room.id).all()]
    for room_id in room_ids:
        _get_room(db, room_id)
    blocks = [
        BlockedSlot(room_id=r, start_time=start, end_time=end, reason=reason, created_by=manager.id)
        for r in sorted(set(room_ids))
    ]
    db.add_all(blocks)
    db.commit()
    for b in blocks:
        db.refresh(b)
    return blocks


def list_blocks(db: Session, room_id: int | None = None, day: date | None = None) -> list[BlockedSlot]:
    query = db.query(BlockedSlot)
    if room_id:
        query = query.filter(BlockedSlot.room_id == room_id)
    if day:
        query = query.filter(_overlaps(BlockedSlot, *_day_bounds(day)))
    return query.order_by(BlockedSlot.start_time).all()


def delete_block(db: Session, block_id: int) -> None:
    block = db.get(BlockedSlot, block_id)
    if block is None:
        raise BlockedSlotNotFound("Blocked slot not found")
    db.delete(block)
    db.commit()
