#!/usr/bin/env python3
"""
Minimal reproduction case for the FeedItemResponse validation error.

This script demonstrates the exact validation failure that occurs when
FeedItemResponse.model_validate() is called with a SQLAlchemy FeedItem object.
"""

import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__)))

from typing import Dict, Any, Optional
from sqlalchemy import create_engine, String, Integer, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, sessionmaker, DeclarativeBase
from pydantic import BaseModel, Field, ConfigDict, ValidationError

from app.models.base import FeedItemType
from app.models.json_type import JSONType


# Minimal SQLAlchemy setup for reproduction
class Base(DeclarativeBase):
    pass


class MinimalFeedItem(Base):
    """Minimal FeedItem model to reproduce the validation error."""

    __tablename__ = "feed_items_test"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    type: Mapped[FeedItemType] = mapped_column(SQLEnum(FeedItemType), nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    content: Mapped[str] = mapped_column(String, nullable=False)
    priority: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # This is the problematic field
    item_metadata: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONType, name="metadata"
    )

    created_at: Mapped[str] = mapped_column(String, nullable=False)


class MinimalFeedItemResponse(BaseModel):
    """Minimal FeedItemResponse schema to reproduce the validation error."""

    id: str = Field(..., description="Feed item ID")
    type: FeedItemType = Field(..., description="Feed item type")
    title: str = Field(..., description="Feed item title")
    content: str = Field(..., description="Feed item content")
    priority: int = Field(..., description="Priority level")

    # This field has an alias that causes the validation issue
    item_metadata: Optional[Dict[str, Any]] = Field(
        None, alias="metadata", description="Additional metadata"
    )

    created_at: str = Field(..., description="Creation timestamp")

    model_config = ConfigDict(from_attributes=True)


def reproduce_validation_error():
    """Reproduce the exact validation error from the logs."""

    print("=== FeedItemResponse Validation Error Reproduction ===\n")

    # Create a mock FeedItem object that simulates what comes from the database
    mock_feed_item = MinimalFeedItem(
        id="feed-test-123",
        type=FeedItemType.ALERT,
        title="Test Alert",
        content="This is a test alert content",
        priority=5,
        item_metadata={"businessUnit": "Test Unit", "severity": "high"},
        created_at="2024-01-15T10:30:00Z",
    )

    print("1. Created mock FeedItem object:")
    print(f"   - id: {mock_feed_item.id}")
    print(f"   - type: {mock_feed_item.type}")
    print(f"   - item_metadata: {mock_feed_item.item_metadata}")
    print(f"   - item_metadata type: {type(mock_feed_item.item_metadata)}")
    print()

    # Try to validate with FeedItemResponse - this should fail
    print("2. Attempting FeedItemResponse.model_validate(mock_feed_item)...")
    try:
        response = MinimalFeedItemResponse.model_validate(mock_feed_item)
        print("   ✅ Validation succeeded (unexpected!)")
        print(f"   Response: {response}")
    except ValidationError as e:
        print("   ❌ Validation failed as expected:")
        print(f"   Error: {e}")
        print()

        # Analyze the error details
        print("3. Error Analysis:")
        for error in e.errors():
            print(f"   - Field: {error['loc']}")
            print(f"   - Type: {error['type']}")
            print(f"   - Input: {error['input']}")
            print(f"   - Input Type: {type(error['input'])}")
        print()

    # Show what happens when we inspect the object attributes
    print("4. Object Attribute Inspection:")
    print(
        f"   - hasattr(mock_feed_item, 'item_metadata'): {hasattr(mock_feed_item, 'item_metadata')}"
    )
    print(
        f"   - hasattr(mock_feed_item, 'metadata'): {hasattr(mock_feed_item, 'metadata')}"
    )

    if hasattr(mock_feed_item, "metadata"):
        metadata_attr = getattr(mock_feed_item, "metadata")
        print(f"   - mock_feed_item.metadata: {metadata_attr}")
        print(f"   - type(mock_feed_item.metadata): {type(metadata_attr)}")

    print()

    # Show the field mapping issue
    print("5. Field Mapping Analysis:")
    print("   SQLAlchemy model has:")
    print("   - Field name: 'item_metadata'")
    print("   - Database column: 'metadata' (via name= parameter)")
    print()
    print("   Pydantic schema has:")
    print("   - Field name: 'item_metadata'")
    print("   - Alias: 'metadata'")
    print("   - from_attributes=True")
    print()
    print("   The issue: When from_attributes=True, Pydantic looks for 'item_metadata'")
    print("   attribute on the SQLAlchemy object, but the alias system doesn't work")
    print("   as expected during validation from objects.")


if __name__ == "__main__":
    reproduce_validation_error()
