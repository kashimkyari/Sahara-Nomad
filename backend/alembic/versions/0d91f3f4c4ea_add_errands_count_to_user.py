"""add_errands_count_to_user

Revision ID: 0d91f3f4c4ea
Revises: 4f5834e62cf6
Create Date: 2026-04-05 05:46:35.213046

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0d91f3f4c4ea'
down_revision: Union[str, Sequence[str], None] = '4f5834e62cf6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add column as nullable
    op.add_column('users', sa.Column('errands_count', sa.Integer(), nullable=True))
    
    # 2. Seed existing rows
    op.execute("UPDATE users SET errands_count = 0")
    
    # 3. Alter to NOT NULL
    op.alter_column('users', 'errands_count', nullable=False)


def downgrade() -> None:
    op.drop_column('users', 'errands_count')
