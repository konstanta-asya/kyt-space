from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.modules.auth.dependencies import get_current_user, require_role
from app.modules.auth.models import Role, User
from app.modules.bookings import service
from app.modules.bookings.models import BookingStatus
from app.modules.bookings.schemas import (
    BlockedSlotResponse,
    BlockRequest,
    BookingResponse,
    HoldRequest,
    ManagerBookingResponse,
    SlotResponse,
    SubmitRequest,
)

router = APIRouter()
blocked_router = APIRouter()

manager_only = require_role(Role.MANAGER)  # manager і superadmin

_STATUS_CODES = {
    service.RoomNotFound: status.HTTP_404_NOT_FOUND,
    service.BookingNotFound: status.HTTP_404_NOT_FOUND,
    service.BlockedSlotNotFound: status.HTTP_404_NOT_FOUND,
    service.MembersOnly: status.HTTP_403_FORBIDDEN,
    service.InvalidSlot: status.HTTP_400_BAD_REQUEST,
    service.DeadlinePassed: status.HTTP_400_BAD_REQUEST,
    service.SlotBlocked: status.HTTP_409_CONFLICT,
    service.SlotTaken: status.HTTP_409_CONFLICT,
    service.HoldExpired: status.HTTP_409_CONFLICT,
    service.InvalidTransition: status.HTTP_409_CONFLICT,
    service.EquipmentUnavailable: status.HTTP_409_CONFLICT,
}


def _http(err: service.BookingError) -> HTTPException:
    return HTTPException(status_code=_STATUS_CODES[type(err)], detail=str(err))


# --- Публічне


@router.get("/slots", response_model=list[SlotResponse])
def get_slots(room_id: int, date: date, db: Session = Depends(get_db)):
    """Сітка слотів кімнати на день. Доступна без авторизації, без даних клієнтів."""
    try:
        return service.get_slots(db, room_id, date)
    except service.BookingError as err:
        raise _http(err) from err


# --- Клієнт


@router.post("", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def hold_slot(data: HoldRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Крок 1: тримає слот 5 хв (status=holding)."""
    try:
        return service.hold_slot(db, user, data.room_id, data.start_time, data.end_time)
    except service.BookingError as err:
        raise _http(err) from err


@router.post("/{booking_id}/submit", response_model=BookingResponse)
def submit_booking(
    booking_id: int, data: SubmitRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Крок 2: подає заявку (status=pending)."""
    try:
        return service.submit_booking(db, user, booking_id, data)
    except service.BookingError as err:
        raise _http(err) from err


@router.get("/me", response_model=list[BookingResponse])
def my_bookings(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return service.list_my_bookings(db, user)


@router.post("/{booking_id}/cancel", response_model=BookingResponse)
def cancel_booking(booking_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        return service.cancel_booking(db, user, booking_id)
    except service.BookingError as err:
        raise _http(err) from err


# --- Менеджер


@router.get("", response_model=list[ManagerBookingResponse], dependencies=[Depends(manager_only)])
def list_bookings(
    status: BookingStatus | None = None,
    room_id: int | None = None,
    date: date | None = None,
    db: Session = Depends(get_db),
):
    """Inbox (?status=pending) і календар усіх кімнат (?date=&room_id=), з контактами клієнтів."""
    return service.list_bookings(db, status.value if status else None, room_id, date)


@router.post("/{booking_id}/confirm", response_model=ManagerBookingResponse)
def confirm_booking(booking_id: int, manager: User = Depends(manager_only), db: Session = Depends(get_db)):
    try:
        return service.review_booking(db, manager, booking_id, confirm=True)
    except service.BookingError as err:
        raise _http(err) from err


@router.post("/{booking_id}/reject", response_model=ManagerBookingResponse)
def reject_booking(booking_id: int, manager: User = Depends(manager_only), db: Session = Depends(get_db)):
    try:
        return service.review_booking(db, manager, booking_id, confirm=False)
    except service.BookingError as err:
        raise _http(err) from err


# --- Блокування слотів (менеджер)


@blocked_router.post("", response_model=list[BlockedSlotResponse], status_code=status.HTTP_201_CREATED)
def create_blocks(data: BlockRequest, manager: User = Depends(manager_only), db: Session = Depends(get_db)):
    """room_ids=null блокує всі кімнати (напр. планове відключення світла)."""
    try:
        return service.create_blocks(db, manager, data.room_ids, data.start_time, data.end_time, data.reason)
    except service.BookingError as err:
        raise _http(err) from err


@blocked_router.get("", response_model=list[BlockedSlotResponse], dependencies=[Depends(manager_only)])
def list_blocks(room_id: int | None = None, date: date | None = None, db: Session = Depends(get_db)):
    return service.list_blocks(db, room_id, date)


@blocked_router.delete("/{block_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(manager_only)])
def delete_block(block_id: int, db: Session = Depends(get_db)):
    try:
        service.delete_block(db, block_id)
    except service.BookingError as err:
        raise _http(err) from err
    return Response(status_code=status.HTTP_204_NO_CONTENT)
