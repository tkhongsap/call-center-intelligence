"""
Alert model definition.

Matches the existing Drizzle schema for the alerts table.
"""

from typing import Optional
from sqlalchemy import String, Float, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import AlertType, Severity, AlertStatus, TimestampMixin


class Alert(Base, TimestampMixin):
    """
    Alert model matching the existing Drizzle schema.
    
    Represents system alerts for spikes, thresholds, and other conditions.
    """
    __tablename__ = "alerts"
    
    # Primary key
    id: Mapped[str] = mapped_column(String, primary_key=True)
    
    # Required fields
    type: Mapped[AlertType] = mapped_column(SQLEnum(AlertType, create_type=False), nullable=False)
    severity: Mapped[Severity] = mapped_column(SQLEnum(Severity, create_type=False), nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[AlertStatus] = mapped_column(SQLEnum(AlertStatus, create_type=False), nullable=False, default=AlertStatus.active)
    
    # Optional fields
    business_unit: Mapped[Optional[str]] = mapped_column(String, name="business_unit")
    category: Mapped[Optional[str]] = mapped_column(String)
    channel: Mapped[Optional[str]] = mapped_column(String)
    
    # Numeric fields for metrics
    baseline_value: Mapped[Optional[float]] = mapped_column(Float, name="baseline_value")
    current_value: Mapped[Optional[float]] = mapped_column(Float, name="current_value")
    percentage_change: Mapped[Optional[float]] = mapped_column(Float, name="percentage_change")
    
    # Acknowledgment fields
    acknowledged_by: Mapped[Optional[str]] = mapped_column(String, name="acknowledged_by")
    acknowledged_at: Mapped[Optional[str]] = mapped_column(String, name="acknowledged_at")
    
    def __repr__(self) -> str:
        return f"<Alert(id='{self.id}', type='{self.type}', severity='{self.severity}', status='{self.status}')>"