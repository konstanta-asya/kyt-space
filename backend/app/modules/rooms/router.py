from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.modules.equipment.models import Equipment
from app.modules.equipment.schemas import EquipmentResponse
from app.modules.rooms.models import Room
from app.modules.rooms.schemas import RoomResponse

router = APIRouter()


@router.get("", response_model=list[RoomResponse])
def list_rooms(db: Session = Depends(get_db)):
    return db.query(Room).all()


@router.get("/{room_id}", response_model=RoomResponse)
def get_room(room_id: int, db: Session = Depends(get_db)):
    room = db.get(Room, room_id)
    if room is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")
    return room


@router.get("/{room_id}/equipment", response_model=list[EquipmentResponse])
def list_room_equipment(room_id: int, db: Session = Depends(get_db)):
    if db.get(Room, room_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")
    return db.query(Equipment).filter(Equipment.room_id == room_id).all()
