import enum

from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.sql import func

from app.core.db import Base


class Role(str, enum.Enum):
    """Ролі користувачів (див. docs/er-diagram.md). У БД зберігаються як рядок.

    Ієрархія лінійна, порядок оголошення = ранг: кожна роль має всі права нижчих
    (адмін/звукар — теж кутівець, менеджер — теж адмін тощо).
    """

    CLIENT = "client"
    KUTIVETS = "kutivets"
    ADMIN = "admin"
    MANAGER = "manager"
    SUPERADMIN = "superadmin"


_RANK = {role.value: rank for rank, role in enumerate(Role)}


def has_role(role: str, minimum: str) -> bool:
    """Чи роль `role` не нижча за `minimum`. Невідома роль у БД — без прав."""
    return _RANK.get(role, -1) >= _RANK[str(getattr(minimum, "value", minimum))]


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default=Role.CLIENT.value)
    phone = Column(String(30))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
