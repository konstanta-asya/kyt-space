import enum

from sqlalchemy import Boolean, CheckConstraint, Column, DateTime, ForeignKey, Integer, String, Text, false, func, text
from sqlalchemy.dialects.postgresql import ExcludeConstraint
from sqlalchemy.orm import relationship

from app.core.db import Base
from app.modules.auth.models import User


class BookingType(str, enum.Enum):
    REHEARSAL = "rehearsal"
    PODCAST = "podcast"
    EVENT = "event"


class BookingStatus(str, enum.Enum):
    HOLDING = "holding"  # 5-хв lock, поки користувач заповнює заявку
    PENDING = "pending"  # заявку подано, чекає менеджера
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    REJECTED = "rejected"


# Статуси, що займають слот (той самий список, що в EXCLUDE нижче).
# Прострочений holding теж займає слот у БД — сервіс видаляє такі hold перед створенням нового.
ACTIVE_STATUSES = ("holding", "pending", "confirmed")


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    type = Column(String(20), nullable=False, default=BookingType.REHEARSAL.value)
    status = Column(String(20), nullable=False, default=BookingStatus.HOLDING.value)
    hold_expires_at = Column(DateTime(timezone=True))
    comment = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    cancelled_at = Column(DateTime(timezone=True))
    late_cancel = Column(
        Boolean, nullable=False, default=False, server_default=false()
    )  # скасовано менш ніж за 24 год — зі штрафом
    reviewed_by = Column(Integer, ForeignKey("users.id"))  # менеджер, що підтвердив/відхилив

    user = relationship(User, foreign_keys=[user_id])
    equipment = relationship("BookingEquipment", cascade="all, delete-orphan", lazy="selectin")

    __table_args__ = (
        CheckConstraint("end_time > start_time", name="bookings_time_order"),
        CheckConstraint(
            "status IN ('holding', 'pending', 'confirmed', 'cancelled', 'rejected')", name="bookings_status_valid"
        ),
        CheckConstraint("type IN ('rehearsal', 'podcast', 'event')", name="bookings_type_valid"),
        # Захист від подвійного бронювання на рівні БД: активні бронювання однієї кімнати не перетинаються.
        ExcludeConstraint(
            ("room_id", "="),
            (func.tstzrange(start_time, end_time), "&&"),
            using="gist",
            where=text("status IN ('holding', 'pending', 'confirmed')"),
            name="bookings_no_overlap",
        ),
    )


class BookingEquipment(Base):
    """Переносна апаратура в бронюванні (з кількістю)."""

    __tablename__ = "booking_equipment"

    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), primary_key=True)
    equipment_id = Column(Integer, ForeignKey("equipment.id"), primary_key=True)
    quantity = Column(Integer, nullable=False)

    __table_args__ = (CheckConstraint("quantity > 0", name="booking_equipment_quantity_positive"),)


class BlockedSlot(Base):
    """Форс-мажор / відключення світла. Масове блокування = по рядку на кожну кімнату."""

    __tablename__ = "blocked_slots"

    id = Column(Integer, primary_key=True)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False, index=True)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    reason = Column(String(255))
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (CheckConstraint("end_time > start_time", name="blocked_slots_time_order"),)
