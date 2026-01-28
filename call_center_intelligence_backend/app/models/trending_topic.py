"""
TrendingTopic model definition.

Matches the existing Drizzle schema for the trending_topics table.
"""

from typing import Optional, List, Any
from sqlalchemy import String, Integer, Float, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import Trend, TimestampMixin
from app.models.json_type import JSONType


class TrendingTopic(Base, TimestampMixin):
    """
    TrendingTopic model matching the existing Drizzle schema.
    
    Represents trending issues and topics with case counts and trend analysis.
    """
    __tablename__ = "trending_topics"
    
    # Primary key
    id: Mapped[str] = mapped_column(String, primary_key=True)
    
    # Required fields
    topic: Mapped[str] = mapped_column(String, nullable=False)
    trend: Mapped[Trend] = mapped_column(SQLEnum(Trend, create_type=False), nullable=False)
    case_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0, name="case_count")
    baseline_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0, name="baseline_count")
    trend_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0, name="trend_score")
    
    # Optional fields
    description: Mapped[Optional[str]] = mapped_column(String)
    business_unit: Mapped[Optional[str]] = mapped_column(String, name="business_unit")
    category: Mapped[Optional[str]] = mapped_column(String)
    percentage_change: Mapped[Optional[float]] = mapped_column(Float, name="percentage_change")
    
    # JSON field for sample case IDs (stored as text in SQLite, but handled as JSON)
    sample_case_ids: Mapped[Optional[List[str]]] = mapped_column(JSONType, name="sample_case_ids")
    
    def __repr__(self) -> str:
        return f"<TrendingTopic(id='{self.id}', topic='{self.topic}', trend='{self.trend}', case_count={self.case_count})>"