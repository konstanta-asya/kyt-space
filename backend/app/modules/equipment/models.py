import enum

from sqlalchemy import Column, ForeignKey, Integer, String

from app.core.db import Base


class EquipmentType(str, enum.Enum):
    STATIONARY = "stationary"
    PORTABLE = "portable"


class EquipmentStatus(str, enum.Enum):
    OK = "ok"
    REPAIR = "repair"
    WRITTEN_OFF = "written_off"


class Equipment(Base):
    __tablename__ = "equipment"

    id = Column(Integer, primary_key=True)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=True)
    name = Column(String(255), nullable=False)
    type = Column(String(20), nullable=False)
    status = Column(String(20), nullable=False, default=EquipmentStatus.OK.value)
    total_quantity = Column(Integer)
