"""
SearchAnalytic model definition.

Matches the existing Drizzle schema for the search_analytics table.
"""

from typing import Optional
from sqlalchemy import String, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import CreatedAtMixin


class SearchAnalytic(Base, CreatedAtMixin):
    """
    SearchAnalytic model matching the existing Drizzle schema.
    
    Tracks search queries for popularity metrics and analytics.
    """
    __tablename__ = "search_analytics"
    
    # Primary key
    id: Mapped[str] = mapped_column(String, primary_key=True)
    
    # Required fields
    query: Mapped[str] = mapped_column(String, nullable=False)
    normalized_query: Mapped[str] = mapped_column(String, nullable=False, name="normalized_query")
    result_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0, name="result_count")
    
    # Optional fields
    execution_time_ms: Mapped[Optional[int]] = mapped_column(Integer, name="execution_time_ms")
    user_id: Mapped[Optional[str]] = mapped_column(String, name="user_id")
    
    def __repr__(self) -> str:
        return f"<SearchAnalytic(id='{self.id}', query='{self.query}', result_count={self.result_count})>"