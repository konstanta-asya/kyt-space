from pydantic import BaseModel, ConfigDict


class EquipmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    room_id: int | None
    name: str
    type: str
    status: str
    total_quantity: int | None
