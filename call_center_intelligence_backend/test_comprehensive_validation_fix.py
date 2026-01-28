#!/usr/bin/env python3
"""
Comprehensive test to verify all metadata validation fixes work together.

This test validates that all the core fixes are working:
1. Field mapping between SQLAlchemy and Pydantic
2. Null metadata handling
3. Complex metadata structures
4. JSON serialization with aliases
5. Backward compatibility
"""

import sys
import os
import asyncio

sys.path.append(os.path.join(os.path.dirname(__file__)))

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import select, MetaData
from datetime import datetime, timezone

# Import the actual models and schemas
from app.core.database import Base
from app.models.feed_item import FeedItem
from app.schemas.feed import FeedItemResponse
from app.models.base import FeedItemType


async def test_comprehensive_validation():
    """Comprehensive test of all validation fixes."""

    print("=== Comprehensive Validation Fix Test ===\n")

    # Create in-memory SQLite database
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session_maker = async_sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    async with async_session_maker() as session:
        try:
            current_time = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

            # Test Case 1: Complex nested metadata
            complex_metadata = {
                "businessUnit": "Customer Service",
                "alertDetails": {
                    "severity": "critical",
                    "category": "volume_spike",
                    "metrics": {
                        "current_volume": 1250,
                        "threshold": 1000,
                        "percentage_increase": 25.0,
                    },
                    "affected_channels": ["phone", "email", "web"],
                    "time_window": "last_30_minutes",
                },
                "actions": [
                    {"type": "notification", "sent_to": ["manager1", "supervisor2"]},
                    {"type": "escalation", "level": 2},
                ],
                "metadata_version": "2.1",
                "unicode_test": "测试数据 🚨",
            }

            # Test Case 2: Simple metadata
            simple_metadata = {"businessUnit": "Sales", "priority": "high"}

            # Test Case 3: Null metadata
            null_metadata = None

            # Test Case 4: Empty metadata
            empty_metadata = {}

            test_cases = [
                (
                    "complex",
                    FeedItemType.alert,
                    complex_metadata,
                    "Complex nested metadata",
                ),
                ("simple", FeedItemType.trending, simple_metadata, "Simple metadata"),
                ("null", FeedItemType.upload, null_metadata, "Null metadata"),
                ("empty", FeedItemType.highlight, empty_metadata, "Empty metadata"),
            ]

            # Create test items
            feed_items = []
            for i, (case_id, item_type, metadata, description) in enumerate(test_cases):
                item = FeedItem(
                    id=f"test-{case_id}-{i+1}",
                    type=item_type,
                    title=f"Test {description}",
                    content=f"Content for {description.lower()}",
                    priority=8 - i,  # Varying priorities
                    item_metadata=metadata,
                    reference_id=f"ref-{case_id}" if i % 2 == 0 else None,
                    reference_type="test" if i % 2 == 0 else None,
                    expires_at=None,
                    created_at=current_time,
                )
                feed_items.append(item)
                session.add(item)

            await session.commit()
            print(f"1. Created {len(feed_items)} test feed items")

            # Retrieve items from database (simulating API behavior)
            result = await session.execute(
                select(FeedItem).order_by(FeedItem.priority.desc())
            )
            retrieved_items = result.scalars().all()

            print(f"2. Retrieved {len(retrieved_items)} items from database")

            # Test validation for each item
            print("3. Testing validation for each item:")
            validated_responses = []

            for item in retrieved_items:
                print(f"\n   Testing item: {item.id}")
                print(f"   - Type: {item.type}")
                print(f"   - Metadata: {item.item_metadata}")
                print(f"   - Has SQLAlchemy metadata attr: {hasattr(item, 'metadata')}")

                try:
                    # This is the critical test - the validation that was failing before
                    response = FeedItemResponse.model_validate(item)
                    validated_responses.append(response)

                    print(f"   ✅ Validation succeeded")
                    print(f"   - Response metadata: {response.item_metadata}")
                    print(
                        f"   - Response metadata type: {type(response.item_metadata)}"
                    )

                except Exception as e:
                    print(f"   ❌ Validation failed: {e}")
                    return False

            # Test JSON serialization
            print(
                f"\n4. Testing JSON serialization for {len(validated_responses)} responses:"
            )

            for response in validated_responses:
                try:
                    # Test with alias (should use "metadata" key)
                    json_with_alias = response.model_dump(by_alias=True)

                    # Test without alias (should use "item_metadata" key)
                    json_without_alias = response.model_dump(by_alias=False)

                    print(f"\n   Item: {response.id}")
                    print(f"   ✅ JSON serialization succeeded")
                    print(
                        f"   - With alias: has 'metadata' key = {'metadata' in json_with_alias}"
                    )
                    print(
                        f"   - Without alias: has 'item_metadata' key = {'item_metadata' in json_without_alias}"
                    )

                    # Verify alias behavior
                    if "metadata" not in json_with_alias:
                        print(f"   ❌ Alias not working - missing 'metadata' key")
                        return False

                    if "item_metadata" not in json_without_alias:
                        print(
                            f"   ❌ Field name not working - missing 'item_metadata' key"
                        )
                        return False

                    # Verify content is the same
                    alias_metadata = json_with_alias.get("metadata")
                    field_metadata = json_without_alias.get("item_metadata")

                    if alias_metadata != field_metadata:
                        print(
                            f"   ❌ Metadata content mismatch between alias and field"
                        )
                        return False

                except Exception as e:
                    print(f"   ❌ JSON serialization failed: {e}")
                    return False

            # Test backward compatibility with dict input
            print(f"\n5. Testing backward compatibility with dict input:")

            dict_input = {
                "id": "test-dict-compat",
                "type": "alert",
                "title": "Dict Compatibility Test",
                "content": "Testing dict input",
                "priority": 9,
                "reference_id": "dict-ref",
                "reference_type": "test",
                "expires_at": None,
                "created_at": current_time,
                "item_metadata": {"source": "dict_input", "test": True},
            }

            try:
                dict_response = FeedItemResponse.model_validate(dict_input)
                print("   ✅ Dict input validation succeeded")
                print(f"   - Metadata: {dict_response.item_metadata}")

                # Test JSON serialization
                dict_json = dict_response.model_dump(by_alias=True)
                if "metadata" not in dict_json:
                    print("   ❌ Dict input alias not working")
                    return False

                print("   ✅ Dict input JSON serialization succeeded")

            except Exception as e:
                print(f"   ❌ Dict input validation failed: {e}")
                return False

            print(f"\n🎉 All comprehensive validation tests passed!")
            print(f"✅ Field mapping fix working")
            print(f"✅ Null metadata handling working")
            print(f"✅ Complex metadata structures working")
            print(f"✅ JSON serialization with aliases working")
            print(f"✅ Backward compatibility working")

            return True

        except Exception as e:
            print(f"❌ Comprehensive test failed: {e}")
            import traceback

            traceback.print_exc()
            return False

        finally:
            await session.close()
            await engine.dispose()


async def main():
    """Run the comprehensive validation test."""
    return await test_comprehensive_validation()


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
