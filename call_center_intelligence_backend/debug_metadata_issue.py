#!/usr/bin/env python3
"""
Debug script to analyze the metadata validation issue.

This script investigates the exact cause of the validation error:
"Input should be a valid dictionary [type=dict_type, input_value=MetaData(), input_type=MetaData]"
"""

import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__)))

from typing import Dict, Any, Optional
from pydantic import BaseModel, Field, ConfigDict, ValidationError
from sqlalchemy import MetaData

# Import the actual models
from app.models.feed_item import FeedItem
from app.schemas.feed import FeedItemResponse
from app.models.base import FeedItemType


def analyze_field_mapping():
    """Analyze the field mapping issue between SQLAlchemy and Pydantic."""

    print("=== Field Mapping Analysis ===\n")

    # Create a mock FeedItem object
    mock_item = type(
        "MockFeedItem",
        (),
        {
            "id": "test-123",
            "type": FeedItemType.ALERT,
            "title": "Test Title",
            "content": "Test Content",
            "priority": 5,
            "item_metadata": {"test": "data"},
            "created_at": "2024-01-15T10:30:00Z",
            "reference_id": None,
            "reference_type": None,
            "expires_at": None,
        },
    )()

    print("1. Mock object attributes:")
    for attr in dir(mock_item):
        if not attr.startswith("_"):
            value = getattr(mock_item, attr)
            print(f"   - {attr}: {value} (type: {type(value).__name__})")
    print()

    # Test Pydantic validation
    print("2. Testing Pydantic validation:")
    try:
        response = FeedItemResponse.model_validate(mock_item)
        print("   ✅ Validation succeeded")
        print(f"   Response metadata: {response.item_metadata}")
    except ValidationError as e:
        print("   ❌ Validation failed:")
        for error in e.errors():
            print(f"   - Field: {error['loc']}")
            print(f"   - Type: {error['type']}")
            print(f"   - Input: {error['input']}")
            print(f"   - Input Type: {type(error['input']).__name__}")
    print()

    # Test what happens if we add a 'metadata' attribute
    print("3. Testing with 'metadata' attribute:")
    mock_item_with_metadata = type(
        "MockFeedItemWithMetadata",
        (),
        {
            "id": "test-123",
            "type": FeedItemType.ALERT,
            "title": "Test Title",
            "content": "Test Content",
            "priority": 5,
            "item_metadata": {"test": "data"},
            "metadata": MetaData(),  # This could be the issue!
            "created_at": "2024-01-15T10:30:00Z",
            "reference_id": None,
            "reference_type": None,
            "expires_at": None,
        },
    )()

    try:
        response = FeedItemResponse.model_validate(mock_item_with_metadata)
        print("   ✅ Validation succeeded")
    except ValidationError as e:
        print("   ❌ Validation failed (as expected):")
        for error in e.errors():
            print(f"   - Field: {error['loc']}")
            print(f"   - Type: {error['type']}")
            print(f"   - Input: {error['input']}")
            print(f"   - Input Type: {type(error['input']).__name__}")
    print()


def analyze_sqlalchemy_object():
    """Analyze what attributes a real SQLAlchemy object might have."""

    print("4. SQLAlchemy object analysis:")

    # Check if FeedItem has any metadata-related attributes
    print("   FeedItem class attributes:")
    for attr in dir(FeedItem):
        if "metadata" in attr.lower():
            print(f"   - {attr}: {getattr(FeedItem, attr, 'N/A')}")

    # Check the SQLAlchemy Base class
    from app.core.database import Base

    print(f"   Base class: {Base}")
    print(f"   Base.metadata: {Base.metadata}")
    print(f"   Base.metadata type: {type(Base.metadata)}")
    print()


def test_field_alias_behavior():
    """Test how Pydantic field aliases work with from_attributes=True."""

    print("5. Field alias behavior test:")

    class TestModel(BaseModel):
        test_field: str = Field(..., alias="aliased_field")
        model_config = ConfigDict(from_attributes=True)

    # Test with object that has the actual field name
    obj_with_field = type("TestObj", (), {"test_field": "value1"})()
    try:
        result = TestModel.model_validate(obj_with_field)
        print(f"   ✅ Validation with field name succeeded: {result.test_field}")
    except ValidationError as e:
        print(f"   ❌ Validation with field name failed: {e}")

    # Test with object that has the alias name
    obj_with_alias = type("TestObj", (), {"aliased_field": "value2"})()
    try:
        result = TestModel.model_validate(obj_with_alias)
        print(f"   ✅ Validation with alias succeeded: {result.test_field}")
    except ValidationError as e:
        print(f"   ❌ Validation with alias failed: {e}")

    print()


def main():
    """Run all analysis functions."""
    analyze_field_mapping()
    analyze_sqlalchemy_object()
    test_field_alias_behavior()

    print("=== Summary ===")
    print("The issue likely occurs because:")
    print("1. SQLAlchemy objects have a 'metadata' attribute (Base.metadata)")
    print("2. Pydantic with from_attributes=True looks for 'metadata' due to the alias")
    print(
        "3. It finds Base.metadata (SQLAlchemy MetaData object) instead of item_metadata"
    )
    print("4. This causes the validation error: MetaData() is not a dictionary")
    print()
    print("Solution: Fix the field mapping so Pydantic finds the correct attribute.")


if __name__ == "__main__":
    main()
