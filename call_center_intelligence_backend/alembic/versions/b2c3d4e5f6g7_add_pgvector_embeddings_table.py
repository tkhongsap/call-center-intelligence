"""add pgvector embeddings table

Revision ID: b2c3d4e5f6g7
Revises: f9b6b6a2024f
Create Date: 2026-01-29 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from pgvector.sqlalchemy import Vector


# revision identifiers, used by Alembic.
revision: str = 'b2c3d4e5f6g7'
down_revision: Union[str, None] = 'f9b6b6a2024f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Embedding dimension for text-embedding-3-large
EMBEDDING_DIM = 3072


def upgrade() -> None:
    # Create pgvector extension
    op.execute('CREATE EXTENSION IF NOT EXISTS vector')
    
    # Check if embeddings table already exists
    conn = op.get_bind()
    result = conn.execute(sa.text(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'embeddings')"
    ))
    table_exists = result.scalar()
    
    if not table_exists:
        # Create embeddings table with pgvector column
        op.create_table(
            'embeddings',
            sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
            sa.Column('document_id', sa.String(length=255), nullable=False),
            sa.Column('chunk_index', sa.Integer(), nullable=False),
            sa.Column('content', sa.Text(), nullable=False),
            sa.Column('embedding', Vector(EMBEDDING_DIM), nullable=False),
            sa.Column('filename', sa.String(length=255), nullable=True),
            sa.Column('metadata', sa.JSON(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.PrimaryKeyConstraint('id')
        )
        
        # Create index on document_id for fast lookups
        op.create_index('ix_embeddings_document_id', 'embeddings', ['document_id'], unique=False)


def downgrade() -> None:
    # Drop indexes
    op.drop_index('ix_embeddings_document_id', table_name='embeddings')
    
    # Drop table
    op.drop_table('embeddings')
    
    # Note: We don't drop the vector extension as it might be used by other tables
