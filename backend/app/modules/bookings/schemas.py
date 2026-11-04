from datetime import datetime

from pydantic import AwareDatetime, BaseModel, ConfigDict, model_validator

from app.modules.bookings.models import BookingType


class BookingCreate(BaseModel):
    room_id: int
    # Час лише з часовим поясом (напр. 2026-11-10T10:00:00+02:00), щоб не залежати від поясу сервера.
    start_time: AwareDatetime
    end_time: AwareDatetime
    type: BookingType

    @model_validator(mode="after")
    def check_range(self):
        if self.end_time <= self.start_time:
            raise ValueError("end_time must be after start_time")
        return self


class BookingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    room_id: int
    start_time: datetime
    end_time: datetime
    type: str
    status: str
    created_at: datetime | None
