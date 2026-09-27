from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.modules.equipment.models import Equipment
from app.modules.equipment.schemas import EquipmentResponse

router = APIRouter()


@router.get("", response_model=list[EquipmentResponse])
def list_equipment(room_id: int | None = None, db: Session = Depends(get_db)):
    query = db.query(Equipment)
    if room_id is not None:
        query = query.filter(Equipment.room_id == room_id)
    return query.all()
