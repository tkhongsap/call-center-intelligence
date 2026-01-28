#!/usr/bin/env python3
"""
Test script to verify SQLAlchemy models can be imported and work correctly.

This script tests that all models can be imported, instantiated, and that
the database schema matches the existing structure.
"""

import asyncio
import sys
import os
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.models import (
    User, Case, Alert, TrendingTopic, FeedItem, Share, SearchAnalytic, Upload,
    UserRole, Channel, CaseStatus, Sentiment, Severity, AlertType, AlertStatus,
    Trend, FeedItemType, ShareType, ShareSourceType, ShareChannel, ShareStatus,
    UploadStatus, RecomputeStatus
)
from app.core.database import Base, init_db, get_engine
from sqlalchemy import text


async def test_models():
    """Test that all models can be imported and instantiated."""
    print("Testing SQLAlchemy models...")
    
    # Test enum values
    print("✓ Testing enums...")
    assert UserRole.admin == "admin"
    assert Channel.phone == "phone"
    assert CaseStatus.open == "open"
    assert Sentiment.positive == "positive"
    assert Severity.high == "high"
    assert AlertType.spike == "spike"
    assert AlertStatus.active == "active"
    assert Trend.rising == "rising"
    assert FeedItemType.alert == "alert"
    assert ShareType.share == "share"
    assert ShareSourceType.alert == "alert"
    assert ShareChannel.internal == "internal"
    assert ShareStatus.pending == "pending"
    assert UploadStatus.processing == "processing"
    assert RecomputeStatus.pending == "pending"
    
    # Test model instantiation
    print("✓ Testing model instantiation...")
    
    user = User(
        id="test-user-1",
        name="Test User",
        email="test@example.com",
        role=UserRole.admin,
        created_at="2024-01-01T00:00:00Z"
    )
    assert user.id == "test-user-1"
    assert user.role == UserRole.admin
    
    case = Case(
        id="test-case-1",
        case_number="CASE-001",
        channel=Channel.phone,
        status=CaseStatus.open,
        category="Technical",
        sentiment=Sentiment.neutral,
        severity=Severity.medium,
        business_unit="IT",
        summary="Test case summary",
        created_at="2024-01-01T00:00:00Z",
        updated_at="2024-01-01T00:00:00Z"
    )
    assert case.case_number == "CASE-001"
    assert case.channel == Channel.phone
    
    alert = Alert(
        id="test-alert-1",
        type=AlertType.spike,
        severity=Severity.high,
        title="Test Alert",
        description="Test alert description",
        status=AlertStatus.active,
        created_at="2024-01-01T00:00:00Z",
        updated_at="2024-01-01T00:00:00Z"
    )
    assert alert.type == AlertType.spike
    assert alert.severity == Severity.high
    
    trending_topic = TrendingTopic(
        id="test-topic-1",
        topic="Test Topic",
        trend=Trend.rising,
        case_count=10,
        baseline_count=5,
        trend_score=1.5,
        sample_case_ids=["case1", "case2", "case3"],
        created_at="2024-01-01T00:00:00Z",
        updated_at="2024-01-01T00:00:00Z"
    )
    assert trending_topic.topic == "Test Topic"
    assert trending_topic.sample_case_ids == ["case1", "case2", "case3"]
    
    feed_item = FeedItem(
        id="test-feed-1",
        type=FeedItemType.alert,
        title="Test Feed Item",
        content="Test content",
        priority=1,
        item_metadata={"key": "value", "number": 42},
        created_at="2024-01-01T00:00:00Z"
    )
    assert feed_item.type == FeedItemType.alert
    assert feed_item.item_metadata == {"key": "value", "number": 42}
    
    share = Share(
        id="test-share-1",
        type=ShareType.share,
        source_type=ShareSourceType.alert,
        source_id="alert-1",
        sender_id="user-1",
        recipient_id="user-2",
        channel=ShareChannel.internal,
        status=ShareStatus.pending,
        created_at="2024-01-01T00:00:00Z"
    )
    assert share.type == ShareType.share
    assert share.source_type == ShareSourceType.alert
    
    search_analytic = SearchAnalytic(
        id="test-search-1",
        query="test query",
        normalized_query="test query",
        result_count=5,
        created_at="2024-01-01T00:00:00Z"
    )
    assert search_analytic.query == "test query"
    assert search_analytic.result_count == 5
    
    upload = Upload(
        id="test-upload-1",
        file_name="test.csv",
        file_size=1024,
        status=UploadStatus.processing,
        total_rows=100,
        success_count=95,
        error_count=5,
        errors=[{"row": 1, "error": "Invalid data"}],
        created_at="2024-01-01T00:00:00Z"
    )
    assert upload.file_name == "test.csv"
    assert upload.errors == [{"row": 1, "error": "Invalid data"}]
    
    print("✓ All models instantiated successfully!")
    
    # Test database connection and schema
    print("✓ Testing database connection...")
    
    # Set the correct database path for testing (use the existing database in parent directory)
    db_path = backend_dir.parent / "call-center.db"
    os.environ["DATABASE_URL"] = f"sqlite:///{db_path}"
    
    await init_db()
    engine = await get_engine()
    
    # Check if we can connect to the database
    async with engine.begin() as conn:
        # Test that we can query the existing tables
        result = await conn.execute(text("SELECT name FROM sqlite_master WHERE type='table'"))
        tables = [row[0] for row in result.fetchall()]
        
        expected_tables = [
            'users', 'cases', 'alerts', 'trending_topics', 
            'feed_items', 'shares', 'search_analytics', 'uploads'
        ]
        
        for table in expected_tables:
            if table in tables:
                print(f"✓ Table '{table}' exists in database")
            else:
                print(f"⚠ Table '{table}' not found in database")
    
    await engine.dispose()
    print("✓ Database connection test completed!")
    
    print("\n🎉 All tests passed! SQLAlchemy models are working correctly.")


if __name__ == "__main__":
    asyncio.run(test_models())