"""create bookings

Revision ID: 0ca27dc97cb8
Revises: 079a60b08655
Create Date: 2026-11-04 15:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '0ca27dc97cb8'
down_revision: Union[str, Sequence[str], None] = '079a60b08655'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # btree_gist дає GiST-оператор `=` для integer — без нього EXCLUDE по room_id не створиться.
    op.execute("CREATE EXTENSION IF NOT EXISTS btree_gist")

    op.create_table('bookings',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('room_id', sa.Integer(), nullable=False),
    sa.Column('start_time', sa.DateTime(timezone=True), nullable=False),
    sa.Column('end_time', sa.DateTime(timezone=True), nullable=False),
    sa.Column('type', sa.String(length=20), nullable=False),
    sa.Column('status', sa.String(length=20), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.CheckConstraint('end_time > start_time', name='bookings_end_after_start'),
    # Дві активні броні однієї кімнати не можуть перетинатись у часі; межі [start, end).
    postgresql.ExcludeConstraint(
        (sa.column('room_id'), '='),
        (sa.text("tstzrange(start_time, end_time, '[)')"), '&&'),
        name='bookings_no_overlap',
        using='gist',
        where=sa.text("status NOT IN ('cancelled', 'rejected')"),
    ),
    sa.ForeignKeyConstraint(['room_id'], ['rooms.id'], ),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('bookings')
    # Розширення не видаляємо: ним можуть користуватись інші об'єкти БД.
