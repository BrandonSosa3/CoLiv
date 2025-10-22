"""restore_tenant_preferences_table

Revision ID: 5b39e162a76a
Revises: d26224c7b3c8
Create Date: 2025-10-22 12:18:40.286590

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5b39e162a76a'
down_revision: Union[str, None] = 'd26224c7b3c8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create tenant_preferences table
    op.create_table('tenant_preferences',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), autoincrement=False, nullable=False),
        sa.Column('tenant_id', sa.UUID(), autoincrement=False, nullable=False),
        sa.Column('cleanliness_importance', sa.INTEGER(), server_default=sa.text('3'), autoincrement=False, nullable=True),
        sa.Column('noise_tolerance', sa.INTEGER(), server_default=sa.text('3'), autoincrement=False, nullable=True),
        sa.Column('guest_frequency', sa.INTEGER(), server_default=sa.text('3'), autoincrement=False, nullable=True),
        sa.Column('sleep_schedule', sa.VARCHAR(length=50), server_default=sa.text("'flexible'::character varying"), autoincrement=False, nullable=True),
        sa.Column('work_schedule', sa.VARCHAR(length=50), server_default=sa.text("'remote'::character varying"), autoincrement=False, nullable=True),
        sa.Column('social_preference', sa.INTEGER(), server_default=sa.text('3'), autoincrement=False, nullable=True),
        sa.Column('smoking', sa.BOOLEAN(), server_default=sa.text('false'), autoincrement=False, nullable=True),
        sa.Column('pets', sa.BOOLEAN(), server_default=sa.text('false'), autoincrement=False, nullable=True),
        sa.Column('overnight_guests', sa.BOOLEAN(), server_default=sa.text('true'), autoincrement=False, nullable=True),
        sa.Column('interests', sa.TEXT(), autoincrement=False, nullable=True),
        sa.Column('notes', sa.TEXT(), autoincrement=False, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), autoincrement=False, nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), autoincrement=False, nullable=True),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], name='tenant_preferences_tenant_id_fkey', ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name='tenant_preferences_pkey'),
        sa.UniqueConstraint('tenant_id', name='tenant_preferences_tenant_id_key')
    )


def downgrade() -> None:
    op.drop_table('tenant_preferences')
