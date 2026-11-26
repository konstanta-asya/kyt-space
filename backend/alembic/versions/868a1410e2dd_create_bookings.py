"""create bookings, booking_equipment, blocked_slots

Revision ID: 868a1410e2dd
Revises: 079a60b08655
Create Date: 2026-11-26 12:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "868a1410e2dd"
down_revision: Union[str, Sequence[str], None] = "079a60b08655"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # btree_gist потрібен, щоб в одному EXCLUDE поєднати "=" по room_id і "&&" по діапазону часу
    op.execute("CREATE EXTENSION IF NOT EXISTS btree_gist")

    # Режим роботи 09:00–21:00 за замовчуванням, щоб сітка слотів не мала справи з NULL
    op.execute("UPDATE rooms SET open_from = '09:00' WHERE open_from IS NULL")
    op.execute("UPDATE rooms SET open_to = '21:00' WHERE open_to IS NULL")
    op.alter_column("rooms", "open_from", nullable=False, server_default="09:00")
    op.alter_column("rooms", "open_to", nullable=False, server_default="21:00")

    op.create_table(
        "bookings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("room_id", sa.Integer(), nullable=False),
        sa.Column("start_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("type", sa.String(length=20), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("hold_expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("cancelled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("late_cancel", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("reviewed_by", sa.Integer(), nullable=True),
        sa.CheckConstraint("end_time > start_time", name="bookings_time_order"),
        sa.CheckConstraint(
            "status IN ('holding', 'pending', 'confirmed', 'cancelled', 'rejected')", name="bookings_status_valid"
        ),
        sa.CheckConstraint("type IN ('rehearsal', 'podcast', 'event')", name="bookings_type_valid"),
        postgresql.ExcludeConstraint(
            (sa.column("room_id"), "="),
            (sa.text("tstzrange(start_time, end_time)"), "&&"),
            using="gist",
            where=sa.text("status IN ('holding', 'pending', 'confirmed')"),
            name="bookings_no_overlap",
        ),
        sa.ForeignKeyConstraint(
            ["reviewed_by"],
            ["users.id"],
        ),
        sa.ForeignKeyConstraint(
            ["room_id"],
            ["rooms.id"],
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_bookings_user_id"), "bookings", ["user_id"], unique=False)

    op.create_table(
        "booking_equipment",
        sa.Column("booking_id", sa.Integer(), nullable=False),
        sa.Column("equipment_id", sa.Integer(), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.CheckConstraint("quantity > 0", name="booking_equipment_quantity_positive"),
        sa.ForeignKeyConstraint(["booking_id"], ["bookings.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["equipment_id"],
            ["equipment.id"],
        ),
        sa.PrimaryKeyConstraint("booking_id", "equipment_id"),
    )

    op.create_table(
        "blocked_slots",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("room_id", sa.Integer(), nullable=False),
        sa.Column("start_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("reason", sa.String(length=255), nullable=True),
        sa.Column("created_by", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.CheckConstraint("end_time > start_time", name="blocked_slots_time_order"),
        sa.ForeignKeyConstraint(
            ["created_by"],
            ["users.id"],
        ),
        sa.ForeignKeyConstraint(
            ["room_id"],
            ["rooms.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_blocked_slots_room_id"), "blocked_slots", ["room_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_blocked_slots_room_id"), table_name="blocked_slots")
    op.drop_table("blocked_slots")
    op.drop_table("booking_equipment")
    op.drop_index(op.f("ix_bookings_user_id"), table_name="bookings")
    op.drop_table("bookings")
    op.alter_column("rooms", "open_to", nullable=True, server_default=None)
    op.alter_column("rooms", "open_from", nullable=True, server_default=None)
