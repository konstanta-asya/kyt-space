from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.modules.auth.models import User
from app.modules.bookings.models import NO_OVERLAP_CONSTRAINT, Booking, BookingStatus
from app.modules.bookings.schemas import BookingCreate
from app.modules.rooms.models import Room


class RoomNotFound(Exception):
    pass


class SlotAlreadyBooked(Exception):
    pass


def create_booking(db: Session, user: User, data: BookingCreate) -> Booking:
    if db.get(Room, data.room_id) is None:
        raise RoomNotFound
    booking = Booking(
        user_id=user.id,
        room_id=data.room_id,
        start_time=data.start_time,
        end_time=data.end_time,
        type=data.type.value,
        status=BookingStatus.PENDING.value,
    )
    db.add(booking)
    try:
        db.commit()
    except IntegrityError as err:
        db.rollback()
        # Перевірку перетину робить сама БД (EXCLUDE-констрейнт), а не код:
        # так два одночасні запити на той самий слот не проскочать обидва.
        if getattr(getattr(err.orig, "diag", None), "constraint_name", None) == NO_OVERLAP_CONSTRAINT:
            raise SlotAlreadyBooked from err
        raise
    db.refresh(booking)
    return booking


def list_bookings(db: Session) -> list[Booking]:
    return db.query(Booking).order_by(Booking.start_time, Booking.id).all()


def get_booking(db: Session, booking_id: int) -> Booking | None:
    return db.get(Booking, booking_id)
