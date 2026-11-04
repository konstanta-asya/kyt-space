import enum

from sqlalchemy import CheckConstraint, Column, DateTime, ForeignKey, Integer, String, func, text
from sqlalchemy.dialects.postgresql import ExcludeConstraint

from app.core.db import Base


class BookingType(str, enum.Enum):
    REHEARSAL = "rehearsal"
    PODCAST = "podcast"
    EVENT = "event"


class BookingStatus(str, enum.Enum):
    """Статуси бронювання (див. docs/er-diagram.md). У БД зберігаються як рядок."""

    HOLDING = "holding"
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    REJECTED = "rejected"


# Ім'я EXCLUDE-констрейнта: за ним router відрізняє «слот зайнятий» від інших помилок цілісності.
NO_OVERLAP_CONSTRAINT = "bookings_no_overlap"


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    type = Column(String(20), nullable=False)
    status = Column(String(20), nullable=False, default=BookingStatus.PENDING.value)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        CheckConstraint("end_time > start_time", name="bookings_end_after_start"),
        # Захист від подвійного бронювання на рівні БД (потрібне розширення btree_gist для `room_id WITH =`).
        # Діапазон [start, end): кінець виключно, тож стикові слоти 10:00–11:00 і 11:00–12:00 не конфліктують.
        # Скасовані/відхилені бронювання слот не тримають.
        ExcludeConstraint(
            (room_id, "="),
            (func.tstzrange(start_time, end_time, text("'[)'")), "&&"),
            name=NO_OVERLAP_CONSTRAINT,
            using="gist",
            where=text("status NOT IN ('cancelled', 'rejected')"),
        ),
    )
