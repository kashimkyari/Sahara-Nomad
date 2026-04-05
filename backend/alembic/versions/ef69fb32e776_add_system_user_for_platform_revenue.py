"""Add system user for platform revenue

Revision ID: ef69fb32e776
Revises: 5fc7855462e6
Create Date: 2026-04-05 06:33:35.932918

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import geoalchemy2


# revision identifiers, used by Alembic.
revision: str = 'ef69fb32e776'
down_revision: Union[str, Sequence[str], None] = '5fc7855462e6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema: Insert System User for revenue tracking."""
    op.execute(
        "INSERT INTO users ("
        "id, full_name, phone_number, password_hash, email, "
        "push_notifications_enabled, location_services_enabled, is_dark_mode, "
        "language, region, is_otp_verified, is_verified, is_runner, "
        "role, stats_rating, is_user_deleted, is_online, is_available, "
        "stats_trips, errands_count, created_at, updated_at, is_deleted"
        ") VALUES ("
        "'00000000-0000-0000-0000-000000000000', 'SendAm System', 'SYSTEM', 'SYSTEM_ACCOUNT', 'system@sendam.com', "
        "true, true, false, 'en', 'NG', true, true, false, "
        "'user', 5.0, false, false, false, 0, 0, now(), now(), false"
        ") ON CONFLICT (id) DO NOTHING"
    )



def downgrade() -> None:
    """Downgrade schema."""
    pass
