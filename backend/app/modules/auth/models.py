import enum

from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func

from app.core.db import Base


class Role(str, enum.Enum):
    """Ролі користувачів (див. docs/er-diagram.md). У БД зберігаються як рядок."""

    CLIENT = "client"
    KUTIVETS = "kutivets"
    ADMIN = "admin"
    MANAGER = "manager"
    SUPERADMIN = "superadmin"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default=Role.CLIENT.value)
    phone = Column(String(30))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
