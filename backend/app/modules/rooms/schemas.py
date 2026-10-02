from datetime import time

from pydantic import BaseModel, ConfigDict


class RoomResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None
    capacity: int | None
    area: float | None
    photo_url: str | None
    is_members_only: bool
    open_from: time | None
    open_to: time | None
