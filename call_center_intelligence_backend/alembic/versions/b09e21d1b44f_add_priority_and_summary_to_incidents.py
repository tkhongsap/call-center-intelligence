"""add_priority_and_summary_to_incidents

Revision ID: b09e21d1b44f
Revises: 81c3efb97e72
Create Date: 2026-02-03 17:03:31.553911

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'b09e21d1b44f'
down_revision: Union[str, None] = '81c3efb97e72'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Fix alerts table timestamps
    op.execute("ALTER TABLE alerts ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE USING created_at::timestamp with time zone")
    op.execute("ALTER TABLE alerts ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE USING updated_at::timestamp with time zone")
    op.execute("ALTER TABLE alerts ALTER COLUMN acknowledged_at TYPE TIMESTAMP WITH TIME ZONE USING CASE WHEN acknowledged_at IS NULL OR acknowledged_at = '' THEN NULL ELSE acknowledged_at::timestamp with time zone END")
    
    # Fix cases table timestamps
    op.execute("ALTER TABLE cases ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE USING created_at::timestamp with time zone")
    op.execute("ALTER TABLE cases ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE USING updated_at::timestamp with time zone")
    op.execute("ALTER TABLE cases ALTER COLUMN resolved_at TYPE TIMESTAMP WITH TIME ZONE USING CASE WHEN resolved_at IS NULL OR resolved_at = '' THEN NULL ELSE resolved_at::timestamp with time zone END")
    
    # Fix feed_items table
    op.execute("ALTER TABLE feed_items ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE USING created_at::timestamp with time zone")
    op.execute("ALTER TABLE feed_items ALTER COLUMN expires_at TYPE TIMESTAMP WITH TIME ZONE USING CASE WHEN expires_at IS NULL OR expires_at = '' THEN NULL ELSE expires_at::timestamp with time zone END")
    
    # Add priority and summary to incidents
    op.add_column('incidents', sa.Column('priority', sa.Enum('LOW', 'MEDIUM', 'HIGH', name='priority_level', native_enum=False), nullable=True))
    op.add_column('incidents', sa.Column('summary', sa.Text(), nullable=True))
    op.create_index(op.f('ix_incidents_priority'), 'incidents', ['priority'], unique=False)
    
    # Fix search_analytics table timestamps
    op.execute("ALTER TABLE search_analytics ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE USING created_at::timestamp with time zone")
    
    # Fix shares table timestamps
    op.execute("ALTER TABLE shares ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE USING created_at::timestamp with time zone")
    op.execute("ALTER TABLE shares ALTER COLUMN read_at TYPE TIMESTAMP WITH TIME ZONE USING CASE WHEN read_at IS NULL OR read_at = '' THEN NULL ELSE read_at::timestamp with time zone END")
    op.execute("ALTER TABLE shares ALTER COLUMN actioned_at TYPE TIMESTAMP WITH TIME ZONE USING CASE WHEN actioned_at IS NULL OR actioned_at = '' THEN NULL ELSE actioned_at::timestamp with time zone END")
    
    # Fix trending_topics table timestamps
    op.execute("ALTER TABLE trending_topics ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE USING created_at::timestamp with time zone")
    op.execute("ALTER TABLE trending_topics ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE USING updated_at::timestamp with time zone")
    
    # Fix uploads table timestamps
    op.execute("ALTER TABLE uploads ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE USING created_at::timestamp with time zone")
    op.execute("ALTER TABLE uploads ALTER COLUMN completed_at TYPE TIMESTAMP WITH TIME ZONE USING CASE WHEN completed_at IS NULL OR completed_at = '' THEN NULL ELSE completed_at::timestamp with time zone END")
    op.execute("ALTER TABLE uploads ALTER COLUMN recompute_started_at TYPE TIMESTAMP WITH TIME ZONE USING CASE WHEN recompute_started_at IS NULL OR recompute_started_at = '' THEN NULL ELSE recompute_started_at::timestamp with time zone END")
    op.execute("ALTER TABLE uploads ALTER COLUMN recompute_completed_at TYPE TIMESTAMP WITH TIME ZONE USING CASE WHEN recompute_completed_at IS NULL OR recompute_completed_at = '' THEN NULL ELSE recompute_completed_at::timestamp with time zone END")
    
    # Fix users table timestamps
    op.execute("ALTER TABLE users ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE USING created_at::timestamp with time zone")


def downgrade() -> None:
    # Revert users table
    op.execute("ALTER TABLE users ALTER COLUMN created_at TYPE VARCHAR")
    
    # Revert uploads table
    op.execute("ALTER TABLE uploads ALTER COLUMN recompute_completed_at TYPE VARCHAR")
    op.execute("ALTER TABLE uploads ALTER COLUMN recompute_started_at TYPE VARCHAR")
    op.execute("ALTER TABLE uploads ALTER COLUMN completed_at TYPE VARCHAR")
    op.execute("ALTER TABLE uploads ALTER COLUMN created_at TYPE VARCHAR")
    
    # Revert trending_topics table
    op.execute("ALTER TABLE trending_topics ALTER COLUMN updated_at TYPE VARCHAR")
    op.execute("ALTER TABLE trending_topics ALTER COLUMN created_at TYPE VARCHAR")
    
    # Revert shares table
    op.execute("ALTER TABLE shares ALTER COLUMN actioned_at TYPE VARCHAR")
    op.execute("ALTER TABLE shares ALTER COLUMN read_at TYPE VARCHAR")
    op.execute("ALTER TABLE shares ALTER COLUMN created_at TYPE VARCHAR")
    
    # Revert search_analytics table
    op.execute("ALTER TABLE search_analytics ALTER COLUMN created_at TYPE VARCHAR")
    
    # Remove priority and summary from incidents
    op.drop_index(op.f('ix_incidents_priority'), table_name='incidents')
    op.drop_column('incidents', 'summary')
    op.drop_column('incidents', 'priority')
    
    # Revert feed_items table
    op.execute("ALTER TABLE feed_items ALTER COLUMN expires_at TYPE VARCHAR")
    op.execute("ALTER TABLE feed_items ALTER COLUMN created_at TYPE VARCHAR")
    
    # Revert cases table
    op.execute("ALTER TABLE cases ALTER COLUMN resolved_at TYPE VARCHAR")
    op.execute("ALTER TABLE cases ALTER COLUMN updated_at TYPE VARCHAR")
    op.execute("ALTER TABLE cases ALTER COLUMN created_at TYPE VARCHAR")
    
    # Revert alerts table
    op.execute("ALTER TABLE alerts ALTER COLUMN acknowledged_at TYPE VARCHAR")
    op.execute("ALTER TABLE alerts ALTER COLUMN updated_at TYPE VARCHAR")
    op.execute("ALTER TABLE alerts ALTER COLUMN created_at TYPE VARCHAR")
