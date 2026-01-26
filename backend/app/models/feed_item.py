"""
FeedItem model definition.

Matches the existing Drizzle schema for the feed_items table.
"""

from typing import Optional, Dict, Any
from sqlalchemy import String, Integer, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import FeedItemType, CreatedAtMixin
from app.models.json_type import JSONType


class FeedItem(Base, CreatedAtMixin):
    """
    FeedItem model matching the existing Drizzle schema.
    
    Represents items in the home feed with different types and priorities.
    """
    __tablename__ = "feed_items"
    
    # Primary key
    id: Mapped[str] = mapped_column(String, primary_key=True)
    
    # Required fields
    type: Mapped[FeedItemType] = mapped_column(SQLEnum(FeedItemType), nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    content: Mapped[str] = mapped_column(String, nullable=False)
    priority: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    
    # Optional fields
    item_metadata: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONType, name="metadata")  # JSON object
    reference_id: Mapped[Optional[str]] = mapped_column(String, name="reference_id")
    reference_type: Mapped[Optional[str]] = mapped_column(String, name="reference_type")
    expires_at: Mapped[Optional[str]] = mapped_column(String, name="expires_at")
    
    def __repr__(self) -> str:
        return f"<FeedItem(id='{self.id}', type='{self.type}', title='{self.title}', priority={self.priority})>"