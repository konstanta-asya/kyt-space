from datetime import datetime
from typing import Literal

from pydantic import AwareDatetime, BaseModel, ConfigDict, Field

from app.modules.bookings.models import BookingType


class HoldRequest(BaseModel):
    room_id: int
    start_time: AwareDatetime  # з часовою зоною, напр. 2026-12-01T18:00:00+02:00
    end_time: AwareDatetime


class EquipmentItem(BaseModel):
    equipment_id: int
    quantity: int = Field(gt=0, le=50)


class SubmitRequest(BaseModel):
    type: BookingType = BookingType.REHEARSAL
    comment: str | None = Field(default=None, max_length=1000)
    equipment: list[EquipmentItem] = []


class BookingEquipmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    equipment_id: int
    quantity: int


class BookingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    room_id: int
    start_time: datetime
    end_time: datetime
    type: str
    status: str
    hold_expires_at: datetime | None
    comment: str | None
    created_at: datetime | None
    cancelled_at: datetime | None
    late_cancel: bool
    equipment: list[BookingEquipmentResponse]


class BookingClient(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: str
    phone: str | None


class ManagerBookingResponse(BookingResponse):
    """Для менеджера: бронювання + контакти клієнта."""

    user: BookingClient


class SlotResponse(BaseModel):
    """Слот сітки для всіх, без даних про того, хто забронював."""

    start_time: datetime
    end_time: datetime
    status: Literal["free", "busy", "blocked"]


class BlockRequest(BaseModel):
    room_ids: list[int] | None = None  # None = усі кімнати (напр. відключення світла)
    start_time: AwareDatetime
    end_time: AwareDatetime
    reason: str | None = Field(default=None, max_length=255)


class BlockedSlotResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    room_id: int
    start_time: datetime
    end_time: datetime
    reason: str | None
    created_by: int
