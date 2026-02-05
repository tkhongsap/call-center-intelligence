#!/usr/bin/env python3
"""
Test null metadata handling in FeedItemResponse validation.

This test specifically verifies that None values are handled gracefully
during validation and that the Optional typing works correctly.
"""

import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__)))

from typing import Dict, Any, Optional
from pydantic import ValidationError

# Import the actual models and schemas
from app.schemas.feed import FeedItemResponse
from app.models.base import FeedItemType


def test_null_metadata_scenarios():
    """Test various null metadata scenarios."""

    print("=== Testing Null Metadata Handling ===\n")

    # Test 1: Explicit None value
    print("1. Testing explicit None metadata:")
    test_data_none = {
        "id": "test-none",
        "type": FeedItemType.alert,
        "title": "Test Alert",
        "content": "Test content",
        "priority": 5,
        "reference_id": None,
        "reference_type": None,
        "expires_at": None,
        "created_at": "2024-01-15T10:30:00Z",
        "item_metadata": None,
    }

    try:
        response = FeedItemResponse.model_validate(test_data_none)
        print("   ✅ Validation succeeded")
        print(f"   - metadata: {response.item_metadata}")
        print(f"   - metadata type: {type(response.item_metadata)}")

        # Test JSON serialization
        json_data = response.model_dump(by_alias=True)
        print(f"   - JSON metadata: {json_data.get('metadata')}")
        print()
    except Exception as e:
        print(f"   ❌ Validation failed: {e}")
        return False

    # Test 2: Missing metadata field entirely
    print("2. Testing missing metadata field:")
    test_data_missing = {
        "id": "test-missing",
        "type": FeedItemType.upload,
        "title": "Test Upload",
        "content": "Test content",
        "priority": 3,
        "reference_id": None,
        "reference_type": None,
        "expires_at": None,
        "created_at": "2024-01-15T10:30:00Z",
        # item_metadata field is completely missing
    }

    try:
        response = FeedItemResponse.model_validate(test_data_missing)
        print("   ✅ Validation succeeded")
        print(f"   - metadata: {response.item_metadata}")
        print(f"   - metadata type: {type(response.item_metadata)}")
        print()
    except Exception as e:
        print(f"   ❌ Validation failed: {e}")
        return False

    # Test 3: Empty dict vs None
    print("3. Testing empty dict vs None:")
    test_data_empty_dict = {
        "id": "test-empty-dict",
        "type": FeedItemType.highlight,
        "title": "Test Highlight",
        "content": "Test content",
        "priority": 7,
        "reference_id": None,
        "reference_type": None,
        "expires_at": None,
        "created_at": "2024-01-15T10:30:00Z",
        "item_metadata": {},  # Empty dict instead of None
    }

    try:
        response = FeedItemResponse.model_validate(test_data_empty_dict)
        print("   ✅ Empty dict validation succeeded")
        print(f"   - metadata: {response.item_metadata}")
        print(f"   - metadata type: {type(response.item_metadata)}")
        print(f"   - is empty dict: {response.item_metadata == {}}")
        print()
    except Exception as e:
        print(f"   ❌ Empty dict validation failed: {e}")
        return False

    # Test 4: SQLAlchemy object with None metadata
    print("4. Testing SQLAlchemy object with None metadata:")

    class MockSQLAlchemyItem:
        def __init__(self):
            self.id = "test-sqlalchemy-none"
            self.type = FeedItemType.trending
            self.title = "Test Trending"
            self.content = "Test content"
            self.priority = 4
            self.reference_id = None
            self.reference_type = None
            self.expires_at = None
            self.created_at = "2024-01-15T10:30:00Z"
            self.item_metadata = None  # None metadata
            # This object also has the problematic SQLAlchemy metadata attribute
            from sqlalchemy import MetaData

            self.metadata = MetaData()

    mock_item = MockSQLAlchemyItem()

    try:
        response = FeedItemResponse.model_validate(mock_item)
        print("   ✅ SQLAlchemy None validation succeeded")
        print(f"   - metadata: {response.item_metadata}")
        print(f"   - metadata type: {type(response.item_metadata)}")
        print()
    except Exception as e:
        print(f"   ❌ SQLAlchemy None validation failed: {e}")
        return False

    return True


def test_type_validation():
    """Test that the Optional[Dict[str, Any]] typing is enforced correctly."""

    print("5. Testing type validation:")

    # Test invalid type (string instead of dict)
    test_data_invalid = {
        "id": "test-invalid",
        "type": FeedItemType.alert,
        "title": "Test Alert",
        "content": "Test content",
        "priority": 5,
        "reference_id": None,
        "reference_type": None,
        "expires_at": None,
        "created_at": "2024-01-15T10:30:00Z",
        "item_metadata": "invalid_string",  # Should be dict or None
    }

    try:
        response = FeedItemResponse.model_validate(test_data_invalid)
        print("   ❌ Invalid type validation should have failed but succeeded")
        return False
    except ValidationError as e:
        print("   ✅ Invalid type correctly rejected")
        print(f"   - Error: {e}")
        return True
    except Exception as e:
        print(f"   ❌ Unexpected error: {e}")
        return False


def main():
    """Run all null metadata tests."""

    results = []
    results.append(test_null_metadata_scenarios())
    results.append(test_type_validation())

    print("=== Test Results ===")
    print(f"Passed: {sum(results)}/{len(results)}")

    if all(results):
        print("🎉 All null metadata tests passed!")
    else:
        print("❌ Some null metadata tests failed.")

    return all(results)


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
