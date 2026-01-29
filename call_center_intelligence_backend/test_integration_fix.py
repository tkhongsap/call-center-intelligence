#!/usr/bin/env python3
"""
Integration test to verify the metadata validation fix works with the actual API.

This test creates a real database session and tests the feed endpoint
to ensure the validation error is resolved.
"""

import sys
import os
import asyncio

sys.path.append(os.path.join(os.path.dirname(__file__)))

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import text
from datetime import datetime, timezone

# Import the actual models and schemas
from app.core.database import Base
from app.models.feed_item import FeedItem
from app.schemas.feed import FeedItemResponse
from app.models.base import FeedItemType


async def test_integration():
    """Test the metadata validation fix with a real database session."""

    print("=== Integration Test: Metadata Validation Fix ===\n")

    # Create in-memory SQLite database for testing
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)

    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Create session maker
    async_session_maker = async_sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    async with async_session_maker() as session:
        try:
            # Create test feed items with various metadata scenarios
            current_time = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

            test_items = [
                FeedItem(
                    id="test-1",
                    type=FeedItemType.alert,
                    title="Alert with metadata",
                    content="Test alert content",
                    priority=8,
                    item_metadata={"businessUnit": "Test Unit", "severity": "high"},
                    created_at=current_time,
                ),
                FeedItem(
                    id="test-2",
                    type=FeedItemType.upload,
                    title="Upload with null metadata",
                    content="Test upload content",
                    priority=5,
                    item_metadata=None,
                    created_at=current_time,
                ),
                FeedItem(
                    id="test-3",
                    type=FeedItemType.highlight,
                    title="Highlight with complex metadata",
                    content="Test highlight content",
                    priority=3,
                    item_metadata={
                        "category": "performance",
                        "metrics": {"response_time": 1.5, "success_rate": 0.98},
                        "tags": ["important", "trending"],
                    },
                    created_at=current_time,
                ),
            ]

            # Add items to database
            for item in test_items:
                session.add(item)
            await session.commit()

            print("1. Created test feed items in database")
            print(f"   - {len(test_items)} items created")
            print()

            # Query items from database (simulating what the API does)
            from sqlalchemy import select

            result = await session.execute(select(FeedItem))
            feed_items = result.scalars().all()

            print("2. Retrieved items from database:")
            for item in feed_items:
                print(f"   - {item.id}: metadata={item.item_metadata}")
                print(f"     Has 'metadata' attr: {hasattr(item, 'metadata')}")
                if hasattr(item, "metadata"):
                    print(f"     item.metadata type: {type(item.metadata)}")
            print()

            # Test validation (this is where the error was occurring)
            print("3. Testing FeedItemResponse validation:")
            validated_items = []

            for item in feed_items:
                try:
                    response = FeedItemResponse.model_validate(item)
                    validated_items.append(response)
                    print(f"   ✅ {item.id}: validation succeeded")
                    print(f"      metadata: {response.item_metadata}")
                except Exception as e:
                    print(f"   ❌ {item.id}: validation failed - {e}")
                    return False

            print()

            # Test JSON serialization
            print("4. Testing JSON serialization:")
            for response in validated_items:
                try:
                    json_data = response.model_dump(by_alias=True)
                    has_metadata_key = "metadata" in json_data
                    print(f"   ✅ {response.id}: serialization succeeded")
                    print(f"      Has 'metadata' key: {has_metadata_key}")
                    print(f"      metadata value: {json_data.get('metadata')}")
                except Exception as e:
                    print(f"   ❌ {response.id}: serialization failed - {e}")
                    return False

            print()
            print(
                "🎉 Integration test passed! The metadata validation fix is working correctly."
            )
            return True

        except Exception as e:
            print(f"❌ Integration test failed: {e}")
            import traceback

            traceback.print_exc()
            return False

        finally:
            await session.close()
            await engine.dispose()


async def main():
    """Run the integration test."""
    success = await test_integration()
    return success


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
