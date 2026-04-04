"""add_items_and_sourcing_status

Revision ID: fca2ad597e1f
Revises: fca2ad597e1e
Create Date: 2026-04-04 22:40:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fca2ad597e1f'
down_revision: Union[str, Sequence[str], None] = 'fca2ad597e1e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('wakas', sa.Column('items', sa.JSON(), nullable=True))
    op.add_column('wakas', sa.Column('sourcing_status', sa.String(length=20), server_default='pending', nullable=True))


def downgrade() -> None:
    op.drop_column('wakas', 'sourcing_status')
    op.drop_column('wakas', 'items')
