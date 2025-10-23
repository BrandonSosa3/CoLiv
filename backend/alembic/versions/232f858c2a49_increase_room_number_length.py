"""increase_room_number_length

Revision ID: [generated_id]
Revises: 5b39e162a76a
Create Date: [timestamp]
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '[generated_id]'
down_revision: Union[str, None] = '5b39e162a76a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Increase room_number from VARCHAR(10) to VARCHAR(50)
    op.alter_column('rooms', 'room_number', 
                   type_=sa.String(50),
                   existing_type=sa.String(10))

def downgrade() -> None:
    # Revert back to VARCHAR(10)
    op.alter_column('rooms', 'room_number',
                   type_=sa.String(10), 
                   existing_type=sa.String(50))