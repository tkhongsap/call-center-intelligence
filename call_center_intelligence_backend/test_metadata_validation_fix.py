#!/usr/bin/env python3
"""
Test script to verify the metadata validation fix.

This script tests that FeedItemResponse.model_validate() works correctly
with SQLAlchemy FeedItem objects after the fix.
"""

import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__)))

from typing import Dict, Any, Optional
from pydantic import ValidationError
from sqlalchemy import MetaData

# Import the actual models
from app.models.feed_item import FeedItem
from app.schemas.feed import FeedItemResponse
from app.models.base import FeedItemType


def create_mock_sqlalchemy_object():
    """Create a mock object that simulates a SQLAlchemy FeedItem."""

    class MockSQLAlchemyFeedItem:
        """Mock SQLAlchemy object with both item_metadata and metadata attributes."""

        def __init__(self):
            # Regular FeedItem attributes
            self.id = "feed-test-123"
            self.type = FeedItemType.alert
            self.title = "Test Alert"
            self.content = "This is a test alert content"
            self.priority = 5
            self.reference_id = "alert-456"
            self.reference_type = "alert"
            self.expires_at = None
            self.created_at = "2024-01-15T10:30:00Z"

            # The actual metadata we want
            self.item_metadata = {
                "businessUnit": "Test Unit",
                "alertId": "alert-456",
                "severity": "high",
            }

            # The problematic SQLAlchemy metadata attribute
            self.metadata = MetaData()  # This is what was causing the error

    return MockSQLAlchemyFeedItem()


def test_validation_fix():
    """Test that the validation fix works correctly."""

    print("=== Testing Metadata Validation Fix ===\n")

    # Create mock SQLAlchemy object
    mock_item = create_mock_sqlalchemy_object()

    print("1. Mock SQLAlchemy object created:")
    print(f"   - id: {mock_item.id}")
    print(f"   - type: {mock_item.type}")
    print(f"   - item_metadata: {mock_item.item_metadata}")
    print(f"   - item_metadata type: {type(mock_item.item_metadata)}")
    print(f"   - metadata: {mock_item.metadata}")
    print(f"   - metadata type: {type(mock_item.metadata)}")
    print()

    # Test validation
    print("2. Testing FeedItemResponse.model_validate():")
    try:
        response = FeedItemResponse.model_validate(mock_item)
        print("   ✅ Validation succeeded!")
        print(f"   - Response ID: {response.id}")
        print(f"   - Response metadata: {response.item_metadata}")
        print(f"   - Response metadata type: {type(response.item_metadata)}")
        print()

        # Test JSON serialization (should use alias)
        print("3. Testing JSON serialization:")
        json_data = response.model_dump(by_alias=True)
        print(f"   - JSON keys: {list(json_data.keys())}")
        print(f"   - Has 'metadata' key: {'metadata' in json_data}")
        print(f"   - Has 'item_metadata' key: {'item_metadata' in json_data}")
        print(f"   - metadata value: {json_data.get('metadata')}")
        print()

        return True

    except ValidationError as e:
        print("   ❌ Validation failed:")
        for error in e.errors():
            print(f"   - Field: {error['loc']}")
            print(f"   - Type: {error['type']}")
            print(f"   - Input: {error['input']}")
            print(f"   - Input Type: {type(error['input'])}")
        print()
        return False
    except Exception as e:
        print(f"   ❌ Unexpected error: {e}")
        return False


def test_null_metadata():
    """Test that null metadata is handled correctly."""

    print("4. Testing null metadata handling:")

    class MockItemWithNullMetadata:
        def __init__(self):
            self.id = "feed-test-null"
            self.type = FeedItemType.highlight
            self.title = "Test Highlight"
            self.content = "Test content"
            self.priority = 3
            self.reference_id = None
            self.reference_type = None
            self.expires_at = None
            self.created_at = "2024-01-15T10:30:00Z"
            self.item_metadata = None  # Null metadata
            self.metadata = MetaData()  # SQLAlchemy metadata

    mock_item = MockItemWithNullMetadata()

    try:
        response = FeedItemResponse.model_validate(mock_item)
        print("   ✅ Null metadata validation succeeded!")
        print(f"   - Response metadata: {response.item_metadata}")
        return True
    except Exception as e:
        print(f"   ❌ Null metadata validation failed: {e}")
        return False


def test_dict_validation():
    """Test that regular dict validation still works."""

    print("5. Testing dict validation (backward compatibility):")

    dict_data = {
        "id": "feed-dict-test",
        "type": "upload",
        "title": "Dict Test",
        "content": "Test content",
        "priority": 7,
        "reference_id": None,
        "reference_type": None,
        "expires_at": None,
        "created_at": "2024-01-15T10:30:00Z",
        "item_metadata": {"test": "dict_data"},
    }

    try:
        response = FeedItemResponse.model_validate(dict_data)
        print("   ✅ Dict validation succeeded!")
        print(f"   - Response metadata: {response.item_metadata}")
        return True
    except Exception as e:
        print(f"   ❌ Dict validation failed: {e}")
        return False


def main():
    """Run all tests."""

    results = []
    results.append(test_validation_fix())
    results.append(test_null_metadata())
    results.append(test_dict_validation())

    print("=== Test Results ===")
    print(f"Passed: {sum(results)}/{len(results)}")

    if all(results):
        print("🎉 All tests passed! The metadata validation fix is working correctly.")
    else:
        print("❌ Some tests failed. The fix needs more work.")

    return all(results)


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
