"""recreate_maintenance_priority_enum

Revision ID: d26224c7b3c8
Revises: aed0c1273476
Create Date: 2025-10-22 11:59:29.444798

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd26224c7b3c8'
down_revision: Union[str, None] = 'aed0c1273476'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop the existing enum and recreate it with the correct values
    op.execute("ALTER TABLE maintenance_requests ALTER COLUMN priority TYPE VARCHAR(10)")
    op.execute("DROP TYPE maintenancepriority")
    op.execute("CREATE TYPE maintenancepriority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT')")
    op.execute("ALTER TABLE maintenance_requests ALTER COLUMN priority TYPE maintenancepriority USING priority::maintenancepriority")


def downgrade() -> None:
    # Revert back to the original enum
    op.execute("ALTER TABLE maintenance_requests ALTER COLUMN priority TYPE VARCHAR(10)")
    op.execute("DROP TYPE maintenancepriority")
    op.execute("CREATE TYPE maintenancepriority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT')")
    op.execute("ALTER TABLE maintenance_requests ALTER COLUMN priority TYPE maintenancepriority USING priority::maintenancepriority")
