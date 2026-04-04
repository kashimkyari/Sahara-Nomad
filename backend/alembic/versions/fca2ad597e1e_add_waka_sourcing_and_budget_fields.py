"""add_waka_sourcing_and_budget_fields

Revision ID: fca2ad597e1e
Revises: 18f1231c3e6b
Create Date: 2026-04-04 22:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fca2ad597e1e'
down_revision: Union[str, Sequence[str], None] = '18f1231c3e6b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add sourcing / budget columns to waka table
    op.add_column('wakas', sa.Column('sourcing_budget', sa.Numeric(precision=12, scale=2), nullable=True))
    op.add_column('wakas', sa.Column('budget_min', sa.Numeric(precision=12, scale=2), nullable=True))
    op.add_column('wakas', sa.Column('budget_max', sa.Numeric(precision=12, scale=2), nullable=True))
    op.add_column('wakas', sa.Column('sourcing_bank_name', sa.String(length=100), nullable=True))
    op.add_column('wakas', sa.Column('sourcing_account_number', sa.String(length=20), nullable=True))
    op.add_column('wakas', sa.Column('sourcing_account_name', sa.String(length=100), nullable=True))
    op.add_column('wakas', sa.Column('is_sourcing_funded', sa.Boolean(), server_default='false', nullable=False))


def downgrade() -> None:
    op.drop_column('wakas', 'is_sourcing_funded')
    op.drop_column('wakas', 'sourcing_account_name')
    op.drop_column('wakas', 'sourcing_account_number')
    op.drop_column('wakas', 'sourcing_bank_name')
    op.drop_column('wakas', 'budget_max')
    op.drop_column('wakas', 'budget_min')
    op.drop_column('wakas', 'sourcing_budget')
