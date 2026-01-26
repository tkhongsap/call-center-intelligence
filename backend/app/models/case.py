"""
Case model definition.

Matches the existing Drizzle schema for the cases table.
"""

from typing import Optional
from sqlalchemy import String, Boolean, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import Channel, CaseStatus, Sentiment, Severity, TimestampMixin


class Case(Base, TimestampMixin):
    """
    Case model matching the existing Drizzle schema.
    
    Represents customer service cases with status tracking and categorization.
    """
    __tablename__ = "cases"
    
    # Primary key
    id: Mapped[str] = mapped_column(String, primary_key=True)
    
    # Required fields
    case_number: Mapped[str] = mapped_column(String, nullable=False, unique=True, name="case_number")
    channel: Mapped[Channel] = mapped_column(SQLEnum(Channel), nullable=False)
    status: Mapped[CaseStatus] = mapped_column(SQLEnum(CaseStatus), nullable=False)
    category: Mapped[str] = mapped_column(String, nullable=False)
    sentiment: Mapped[Sentiment] = mapped_column(SQLEnum(Sentiment), nullable=False)
    severity: Mapped[Severity] = mapped_column(SQLEnum(Severity), nullable=False)
    business_unit: Mapped[str] = mapped_column(String, nullable=False, name="business_unit")
    summary: Mapped[str] = mapped_column(String, nullable=False)
    
    # Boolean flags
    risk_flag: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, name="risk_flag")
    needs_review_flag: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, name="needs_review_flag")
    
    # Optional fields
    subcategory: Mapped[Optional[str]] = mapped_column(String)
    customer_name: Mapped[Optional[str]] = mapped_column(String, name="customer_name")
    agent_id: Mapped[Optional[str]] = mapped_column(String, name="agent_id")
    assigned_to: Mapped[Optional[str]] = mapped_column(String, name="assigned_to")
    resolved_at: Mapped[Optional[str]] = mapped_column(String, name="resolved_at")
    upload_id: Mapped[Optional[str]] = mapped_column(String, name="upload_id")
    
    def __repr__(self) -> str:
        return f"<Case(id='{self.id}', case_number='{self.case_number}', status='{self.status}')>"