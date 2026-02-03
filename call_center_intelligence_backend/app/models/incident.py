"""
Incident model definition.

Stores incident data imported from Excel files with Thai language support.
"""

from typing import Optional
from datetime import datetime
from sqlalchemy import String, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import TimestampMixin


class Incident(Base, TimestampMixin):
    """
    Incident model for storing imported incident data.
    
    Represents incidents imported from Excel files with full Thai language support
    for customer service tracking and analysis.
    """
    __tablename__ = "incidents"
    
    # Primary key
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    
    # Incident identification
    incident_number: Mapped[str] = mapped_column(String, nullable=False, unique=True, index=True)
    reference_number: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    # Dates
    received_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    closed_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Contact information
    contact_channel: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    customer_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    # Categorization
    issue_type: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    issue_subtype_1: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    issue_subtype_2: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    # Product information
    product: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    product_group: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    factory: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    production_code: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    # Details and resolution
    details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    solution: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    solution_from_thaibev: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    subject: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    # Location
    district: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    province: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    # Order and status
    order_channel: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    status: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    # Personnel
    receiver: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    closer: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    # SLA
    sla: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    # Upload tracking
    upload_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    def __repr__(self) -> str:
        return f"<Incident(id={self.id}, incident_number='{self.incident_number}', status='{self.status}')>"
