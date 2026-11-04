from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.models import User
from app.modules.bookings import service
from app.modules.bookings.schemas import BookingCreate, BookingResponse

# Усі ендпоінти бронювань — лише для авторизованих (у відповіді є user_id).
router = APIRouter(dependencies=[Depends(get_current_user)])


@router.post("", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def create_booking(data: BookingCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    try:
        return service.create_booking(db, user, data)
    except service.RoomNotFound as err:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found") from err
    except service.SlotAlreadyBooked as err:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This time slot is already booked for this room",
        ) from err


@router.get("", response_model=list[BookingResponse])
def list_bookings(db: Session = Depends(get_db)):
    return service.list_bookings(db)


@router.get("/{booking_id}", response_model=BookingResponse)
def get_booking(booking_id: int, db: Session = Depends(get_db)):
    booking = service.get_booking(db, booking_id)
    if booking is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    return booking
