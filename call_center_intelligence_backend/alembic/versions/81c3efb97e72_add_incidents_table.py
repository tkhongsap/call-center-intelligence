"""add_incidents_table

Revision ID: 81c3efb97e72
Revises: b2c3d4e5f6g7
Create Date: 2026-02-03 11:40:09.007439

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '81c3efb97e72'
down_revision: Union[str, None] = 'b2c3d4e5f6g7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create incidents table
    op.create_table(
        "incidents",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("incident_number", sa.String(), nullable=False),
        sa.Column("reference_number", sa.String(), nullable=True),
        sa.Column("received_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("closed_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("contact_channel", sa.String(), nullable=True),
        sa.Column("customer_name", sa.String(), nullable=True),
        sa.Column("phone", sa.String(), nullable=True),
        sa.Column("issue_type", sa.String(), nullable=True),
        sa.Column("issue_subtype_1", sa.String(), nullable=True),
        sa.Column("issue_subtype_2", sa.String(), nullable=True),
        sa.Column("product", sa.String(), nullable=True),
        sa.Column("product_group", sa.String(), nullable=True),
        sa.Column("factory", sa.String(), nullable=True),
        sa.Column("production_code", sa.String(), nullable=True),
        sa.Column("details", sa.Text(), nullable=True),
        sa.Column("solution", sa.Text(), nullable=True),
        sa.Column("solution_from_thaibev", sa.Text(), nullable=True),
        sa.Column("subject", sa.String(), nullable=True),
        sa.Column("district", sa.String(), nullable=True),
        sa.Column("province", sa.String(), nullable=True),
        sa.Column("order_channel", sa.String(), nullable=True),
        sa.Column("status", sa.String(), nullable=True),
        sa.Column("receiver", sa.String(), nullable=True),
        sa.Column("closer", sa.String(), nullable=True),
        sa.Column("sla", sa.String(), nullable=True),
        sa.Column("upload_id", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("incident_number"),
    )
    
    # Create index on incident_number for faster lookups
    op.create_index(op.f("ix_incidents_incident_number"), "incidents", ["incident_number"], unique=False)


def downgrade() -> None:
    # Drop index
    op.drop_index(op.f("ix_incidents_incident_number"), table_name="incidents")
    
    # Drop incidents table
    op.drop_table("incidents")
