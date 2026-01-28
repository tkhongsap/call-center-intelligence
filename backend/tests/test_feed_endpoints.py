"""
Test feed endpoints functionality.

Tests the feed API endpoints including GET, POST, and statistics.
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
from app.main import create_app
from app.models.feed_item import FeedItem
from app.models.base import FeedItemType
from app.core.database import get_db


@pytest.mark.asyncio
async def test_get_feed_empty(test_db):
    """Test getting feed items when database is empty."""
    app = create_app()

    # Override database dependency
    async def override_get_db():
        yield test_db

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/api/feed/")

    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "pagination" in data
    assert data["items"] == []
    assert data["pagination"]["total"] == 0


@pytest.mark.asyncio
async def test_get_feed_with_items(test_db):
    """Test getting feed items with data."""
    app = create_app()

    # Override database dependency
    async def override_get_db():
        yield test_db

    app.dependency_overrides[get_db] = override_get_db

    # Use current date for test data
    current_time = datetime.now(timezone.utc)
    time1 = current_time.isoformat().replace("+00:00", "Z")
    time2 = (
        (
            current_time.replace(
                hour=current_time.hour + 1 if current_time.hour < 23 else 0
            )
        )
        .isoformat()
        .replace("+00:00", "Z")
    )

    # Create test feed items with explicit metadata=None
    feed_item1 = FeedItem(
        id="feed-test-1",
        type=FeedItemType.alert,
        title="Test Alert",
        content="Test alert content",
        priority=8,
        created_at=time1,
        item_metadata=None,
    )
    feed_item2 = FeedItem(
        id="feed-test-2",
        type=FeedItemType.upload,
        title="Test Upload",
        content="Test upload content",
        priority=5,
        created_at=time2,
        item_metadata=None,
    )

    test_db.add(feed_item1)
    test_db.add(feed_item2)
    await test_db.commit()

    # Test the endpoint with 30d range to include our test data
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/api/feed/?date_range=30d")

    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 2
    assert data["pagination"]["total"] == 2

    # Check ordering (priority descending, then created_at descending)
    assert data["items"][0]["priority"] == 8  # Higher priority first
    assert data["items"][1]["priority"] == 5


@pytest.mark.asyncio
async def test_get_feed_stats(test_db):
    """Test getting feed statistics."""
    app = create_app()

    # Override database dependency
    async def override_get_db():
        yield test_db

    app.dependency_overrides[get_db] = override_get_db

    # Use current date for test data
    current_time = datetime.now(timezone.utc)
    time_base = current_time.isoformat().replace("+00:00", "Z")

    # Create test feed items
    feed_items = [
        FeedItem(
            id="feed-stats-1",
            type=FeedItemType.alert,
            title="High Priority Alert",
            content="Content",
            priority=8,
            created_at=time_base,
            item_metadata=None,
        ),
        FeedItem(
            id="feed-stats-2",
            type=FeedItemType.alert,
            title="Medium Priority Alert",
            content="Content",
            priority=5,
            created_at=time_base,
            item_metadata=None,
        ),
        FeedItem(
            id="feed-stats-3",
            type=FeedItemType.upload,
            title="Low Priority Upload",
            content="Content",
            priority=2,
            created_at=time_base,
            item_metadata=None,
        ),
    ]

    for item in feed_items:
        test_db.add(item)
    await test_db.commit()

    # Test the stats endpoint
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/api/feed/stats")

    assert response.status_code == 200
    data = response.json()

    assert data["total_items"] == 3
    assert data["active_items"] == 3
    assert data["by_type"]["alert"] == 2
    assert data["by_type"]["upload"] == 1
    assert data["by_priority"]["high"] == 1  # priority >= 7
    assert data["by_priority"]["medium"] == 1  # 3 <= priority < 7
    assert data["by_priority"]["low"] == 1  # priority < 3


@pytest.mark.asyncio
async def test_create_feed_item_unauthorized(test_db):
    """Test creating feed item without authentication."""
    app = create_app()

    # Override database dependency
    async def override_get_db():
        yield test_db

    app.dependency_overrides[get_db] = override_get_db

    feed_data = {
        "type": "alert",
        "title": "Test Alert",
        "content": "Test content",
        "priority": 5,
    }

    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.post("/api/feed/", json=feed_data)

    # Should require authentication
    assert response.status_code == 401
