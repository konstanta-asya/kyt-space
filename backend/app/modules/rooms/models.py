from sqlalchemy import Boolean, Column, Integer, Numeric, String, Text, Time

from app.core.db import Base


class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    capacity = Column(Integer)
    area = Column(Numeric)
    photo_url = Column(String(500))
    is_members_only = Column(Boolean, nullable=False, default=False)
    open_from = Column(Time, nullable=False, server_default="09:00")
    open_to = Column(Time, nullable=False, server_default="21:00")
