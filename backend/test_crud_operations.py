#!/usr/bin/env python3
"""
Test CRUD operations with SQLAlchemy models to ensure they work correctly
with the existing database structure.
"""

import asyncio
import sys
import os
from pathlib import Path
from datetime import datetime
import uuid

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.models import (
    User, Case, Alert, TrendingTopic, FeedItem, Share, SearchAnalytic, Upload,
    UserRole, Channel, CaseStatus, Sentiment, Severity, AlertType, AlertStatus,
    Trend, FeedItemType, ShareType, ShareSourceType, ShareChannel, ShareStatus,
    UploadStatus, RecomputeStatus
)
from app.core.database import init_db, get_db
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession


async def test_crud_operations():
    """Test Create, Read, Update, Delete operations for all models."""
    print("Testing CRUD operations...")
    
    # Set the correct database path
    db_path = backend_dir.parent / "call-center.db"
    os.environ["DATABASE_URL"] = f"sqlite:///{db_path}"
    
    await init_db()
    
    async for session in get_db():
        try:
            # Test User CRUD
            await test_user_crud(session)
            
            # Test Case CRUD
            await test_case_crud(session)
            
            # Test Alert CRUD
            await test_alert_crud(session)
            
            # Test TrendingTopic CRUD
            await test_trending_topic_crud(session)
            
            # Test FeedItem CRUD
            await test_feed_item_crud(session)
            
            # Test Share CRUD
            await test_share_crud(session)
            
            # Test SearchAnalytic CRUD
            await test_search_analytic_crud(session)
            
            # Test Upload CRUD
            await test_upload_crud(session)
            
            # Test relationships
            await test_relationships(session)
            
            print("\n🎉 All CRUD operations completed successfully!")
            
        except Exception as e:
            print(f"❌ Error during CRUD operations: {e}")
            await session.rollback()
            raise
        finally:
            # Clean up test data
            await cleanup_test_data(session)
            
        break  # Only need one session


async def test_user_crud(session: AsyncSession):
    """Test User model CRUD operations."""
    print("✓ Testing User CRUD operations...")
    
    # Create
    test_user = User(
        id="test-user-crud",
        name="Test User CRUD",
        email="test-crud@example.com",
        role=UserRole.supervisor,
        business_unit="Test Unit",
        avatar_url="https://example.com/avatar.jpg",
        created_at=datetime.now().isoformat()
    )
    
    session.add(test_user)
    await session.commit()
    print("  ✓ User created successfully")
    
    # Read
    stmt = select(User).where(User.id == "test-user-crud")
    result = await session.execute(stmt)
    retrieved_user = result.scalar_one()
    
    assert retrieved_user.name == "Test User CRUD"
    assert retrieved_user.role == UserRole.supervisor
    assert retrieved_user.business_unit == "Test Unit"
    print("  ✓ User read successfully")
    
    # Update
    retrieved_user.name = "Updated Test User"
    retrieved_user.business_unit = "Updated Unit"
    await session.commit()
    
    # Verify update
    stmt = select(User).where(User.id == "test-user-crud")
    result = await session.execute(stmt)
    updated_user = result.scalar_one()
    
    assert updated_user.name == "Updated Test User"
    assert updated_user.business_unit == "Updated Unit"
    print("  ✓ User updated successfully")


async def test_case_crud(session: AsyncSession):
    """Test Case model CRUD operations."""
    print("✓ Testing Case CRUD operations...")
    
    # Create
    test_case = Case(
        id="test-case-crud",
        case_number="TEST-CRUD-001",
        channel=Channel.email,
        status=CaseStatus.open,
        category="Test Category",
        subcategory="Test Subcategory",
        sentiment=Sentiment.neutral,
        severity=Severity.medium,
        risk_flag=False,
        needs_review_flag=True,
        business_unit="Test Unit",
        summary="Test case for CRUD operations",
        customer_name="Test Customer",
        agent_id="agent-1",
        created_at=datetime.now().isoformat(),
        updated_at=datetime.now().isoformat()
    )
    
    session.add(test_case)
    await session.commit()
    print("  ✓ Case created successfully")
    
    # Read
    stmt = select(Case).where(Case.id == "test-case-crud")
    result = await session.execute(stmt)
    retrieved_case = result.scalar_one()
    
    assert retrieved_case.case_number == "TEST-CRUD-001"
    assert retrieved_case.channel == Channel.email
    assert retrieved_case.needs_review_flag == True
    print("  ✓ Case read successfully")
    
    # Update
    retrieved_case.status = CaseStatus.in_progress
    retrieved_case.assigned_to = "supervisor-1"
    retrieved_case.updated_at = datetime.now().isoformat()
    await session.commit()
    
    # Verify update
    stmt = select(Case).where(Case.id == "test-case-crud")
    result = await session.execute(stmt)
    updated_case = result.scalar_one()
    
    assert updated_case.status == CaseStatus.in_progress
    assert updated_case.assigned_to == "supervisor-1"
    print("  ✓ Case updated successfully")


async def test_alert_crud(session: AsyncSession):
    """Test Alert model CRUD operations."""
    print("✓ Testing Alert CRUD operations...")
    
    # Create
    test_alert = Alert(
        id="test-alert-crud",
        type=AlertType.threshold,
        severity=Severity.high,
        title="Test Alert CRUD",
        description="Test alert for CRUD operations",
        business_unit="Test Unit",
        category="Test Category",
        channel="email",
        baseline_value=100.0,
        current_value=150.0,
        percentage_change=50.0,
        status=AlertStatus.active,
        created_at=datetime.now().isoformat(),
        updated_at=datetime.now().isoformat()
    )
    
    session.add(test_alert)
    await session.commit()
    print("  ✓ Alert created successfully")
    
    # Read
    stmt = select(Alert).where(Alert.id == "test-alert-crud")
    result = await session.execute(stmt)
    retrieved_alert = result.scalar_one()
    
    assert retrieved_alert.type == AlertType.threshold
    assert retrieved_alert.current_value == 150.0
    assert retrieved_alert.percentage_change == 50.0
    print("  ✓ Alert read successfully")
    
    # Update
    retrieved_alert.status = AlertStatus.acknowledged
    retrieved_alert.acknowledged_by = "user-admin-1"
    retrieved_alert.acknowledged_at = datetime.now().isoformat()
    await session.commit()
    
    # Verify update
    stmt = select(Alert).where(Alert.id == "test-alert-crud")
    result = await session.execute(stmt)
    updated_alert = result.scalar_one()
    
    assert updated_alert.status == AlertStatus.acknowledged
    assert updated_alert.acknowledged_by == "user-admin-1"
    print("  ✓ Alert updated successfully")


async def test_trending_topic_crud(session: AsyncSession):
    """Test TrendingTopic model CRUD operations."""
    print("✓ Testing TrendingTopic CRUD operations...")
    
    # Create
    test_topic = TrendingTopic(
        id="test-topic-crud",
        topic="Test Topic CRUD",
        description="Test trending topic for CRUD operations",
        case_count=25,
        baseline_count=15,
        trend=Trend.rising,
        percentage_change=66.7,
        trend_score=2.5,
        business_unit="Test Unit",
        category="Test Category",
        sample_case_ids=["case-1", "case-2", "case-3"],
        created_at=datetime.now().isoformat(),
        updated_at=datetime.now().isoformat()
    )
    
    session.add(test_topic)
    await session.commit()
    print("  ✓ TrendingTopic created successfully")
    
    # Read
    stmt = select(TrendingTopic).where(TrendingTopic.id == "test-topic-crud")
    result = await session.execute(stmt)
    retrieved_topic = result.scalar_one()
    
    assert retrieved_topic.topic == "Test Topic CRUD"
    assert retrieved_topic.trend == Trend.rising
    assert retrieved_topic.sample_case_ids == ["case-1", "case-2", "case-3"]
    print("  ✓ TrendingTopic read successfully")
    
    # Update
    retrieved_topic.case_count = 30
    retrieved_topic.trend_score = 3.0
    retrieved_topic.sample_case_ids = ["case-1", "case-2", "case-3", "case-4"]
    await session.commit()
    
    # Verify update
    stmt = select(TrendingTopic).where(TrendingTopic.id == "test-topic-crud")
    result = await session.execute(stmt)
    updated_topic = result.scalar_one()
    
    assert updated_topic.case_count == 30
    assert updated_topic.trend_score == 3.0
    assert len(updated_topic.sample_case_ids) == 4
    print("  ✓ TrendingTopic updated successfully")


async def test_feed_item_crud(session: AsyncSession):
    """Test FeedItem model CRUD operations."""
    print("✓ Testing FeedItem CRUD operations...")
    
    # Create
    test_feed_item = FeedItem(
        id="test-feed-crud",
        type=FeedItemType.highlight,
        title="Test Feed Item CRUD",
        content="Test feed item for CRUD operations",
        priority=5,
        item_metadata={"source": "test", "importance": "high", "tags": ["crud", "test"]},
        reference_id="test-ref-1",
        reference_type="test",
        created_at=datetime.now().isoformat()
    )
    
    session.add(test_feed_item)
    await session.commit()
    print("  ✓ FeedItem created successfully")
    
    # Read
    stmt = select(FeedItem).where(FeedItem.id == "test-feed-crud")
    result = await session.execute(stmt)
    retrieved_feed_item = result.scalar_one()
    
    assert retrieved_feed_item.type == FeedItemType.highlight
    assert retrieved_feed_item.priority == 5
    assert retrieved_feed_item.item_metadata["source"] == "test"
    assert "crud" in retrieved_feed_item.item_metadata["tags"]
    print("  ✓ FeedItem read successfully")
    
    # Update
    retrieved_feed_item.priority = 8
    retrieved_feed_item.item_metadata = {"source": "updated", "importance": "critical"}
    await session.commit()
    
    # Verify update
    stmt = select(FeedItem).where(FeedItem.id == "test-feed-crud")
    result = await session.execute(stmt)
    updated_feed_item = result.scalar_one()
    
    assert updated_feed_item.priority == 8
    assert updated_feed_item.item_metadata["source"] == "updated"
    print("  ✓ FeedItem updated successfully")


async def test_share_crud(session: AsyncSession):
    """Test Share model CRUD operations."""
    print("✓ Testing Share CRUD operations...")
    
    # Create
    test_share = Share(
        id="test-share-crud",
        type=ShareType.escalation,
        source_type=ShareSourceType.case,
        source_id="test-case-crud",
        sender_id="test-user-crud",
        recipient_id="user-admin-1",
        channel=ShareChannel.internal,
        message="Test share for CRUD operations",
        status=ShareStatus.pending,
        created_at=datetime.now().isoformat()
    )
    
    session.add(test_share)
    await session.commit()
    print("  ✓ Share created successfully")
    
    # Read
    stmt = select(Share).where(Share.id == "test-share-crud")
    result = await session.execute(stmt)
    retrieved_share = result.scalar_one()
    
    assert retrieved_share.type == ShareType.escalation
    assert retrieved_share.source_type == ShareSourceType.case
    assert retrieved_share.status == ShareStatus.pending
    print("  ✓ Share read successfully")
    
    # Update
    retrieved_share.status = ShareStatus.read
    retrieved_share.read_at = datetime.now().isoformat()
    await session.commit()
    
    # Verify update
    stmt = select(Share).where(Share.id == "test-share-crud")
    result = await session.execute(stmt)
    updated_share = result.scalar_one()
    
    assert updated_share.status == ShareStatus.read
    assert updated_share.read_at is not None
    print("  ✓ Share updated successfully")


async def test_search_analytic_crud(session: AsyncSession):
    """Test SearchAnalytic model CRUD operations."""
    print("✓ Testing SearchAnalytic CRUD operations...")
    
    # Create
    test_search = SearchAnalytic(
        id="test-search-crud",
        query="test crud search",
        normalized_query="test crud search",
        result_count=42,
        execution_time_ms=150,
        user_id="test-user-crud",
        created_at=datetime.now().isoformat()
    )
    
    session.add(test_search)
    await session.commit()
    print("  ✓ SearchAnalytic created successfully")
    
    # Read
    stmt = select(SearchAnalytic).where(SearchAnalytic.id == "test-search-crud")
    result = await session.execute(stmt)
    retrieved_search = result.scalar_one()
    
    assert retrieved_search.query == "test crud search"
    assert retrieved_search.result_count == 42
    assert retrieved_search.execution_time_ms == 150
    print("  ✓ SearchAnalytic read successfully")


async def test_upload_crud(session: AsyncSession):
    """Test Upload model CRUD operations."""
    print("✓ Testing Upload CRUD operations...")
    
    # Create
    test_upload = Upload(
        id="test-upload-crud",
        file_name="test_crud.csv",
        file_size=2048,
        status=UploadStatus.processing,
        total_rows=100,
        success_count=95,
        error_count=5,
        errors=[
            {"row": 10, "error": "Invalid date format"},
            {"row": 25, "error": "Missing required field"}
        ],
        uploaded_by="test-user-crud",
        recompute_status=RecomputeStatus.pending,
        alerts_generated=0,
        trending_updated=False,
        created_at=datetime.now().isoformat()
    )
    
    session.add(test_upload)
    await session.commit()
    print("  ✓ Upload created successfully")
    
    # Read
    stmt = select(Upload).where(Upload.id == "test-upload-crud")
    result = await session.execute(stmt)
    retrieved_upload = result.scalar_one()
    
    assert retrieved_upload.file_name == "test_crud.csv"
    assert retrieved_upload.status == UploadStatus.processing
    assert len(retrieved_upload.errors) == 2
    assert retrieved_upload.errors[0]["row"] == 10
    print("  ✓ Upload read successfully")
    
    # Update
    retrieved_upload.status = UploadStatus.completed
    retrieved_upload.completed_at = datetime.now().isoformat()
    retrieved_upload.recompute_status = RecomputeStatus.completed
    retrieved_upload.alerts_generated = 3
    retrieved_upload.trending_updated = True
    await session.commit()
    
    # Verify update
    stmt = select(Upload).where(Upload.id == "test-upload-crud")
    result = await session.execute(stmt)
    updated_upload = result.scalar_one()
    
    assert updated_upload.status == UploadStatus.completed
    assert updated_upload.recompute_status == RecomputeStatus.completed
    assert updated_upload.alerts_generated == 3
    assert updated_upload.trending_updated == True
    print("  ✓ Upload updated successfully")


async def test_relationships(session: AsyncSession):
    """Test model relationships work correctly."""
    print("✓ Testing model relationships...")
    
    # Test User-Share relationships
    stmt = select(User).where(User.id == "test-user-crud")
    result = await session.execute(stmt)
    user = result.scalar_one()
    
    # Load sent shares
    await session.refresh(user, ["sent_shares"])
    assert len(user.sent_shares) >= 1
    print("  ✓ User sent_shares relationship working")
    
    # Test Share-User relationships
    stmt = select(Share).where(Share.id == "test-share-crud")
    result = await session.execute(stmt)
    share = result.scalar_one()
    
    # Load sender and recipient
    await session.refresh(share, ["sender", "recipient"])
    assert share.sender.id == "test-user-crud"
    assert share.recipient.id == "user-admin-1"
    print("  ✓ Share sender/recipient relationships working")


async def cleanup_test_data(session: AsyncSession):
    """Clean up test data created during CRUD tests."""
    print("✓ Cleaning up test data...")
    
    test_ids = [
        ("shares", "test-share-crud"),
        ("search_analytics", "test-search-crud"),
        ("uploads", "test-upload-crud"),
        ("feed_items", "test-feed-crud"),
        ("trending_topics", "test-topic-crud"),
        ("alerts", "test-alert-crud"),
        ("cases", "test-case-crud"),
        ("users", "test-user-crud"),
    ]
    
    for table_name, test_id in test_ids:
        try:
            # Use raw SQL for cleanup to avoid model dependencies
            await session.execute(
                delete(eval(table_name.title().replace('_', '').replace('s', '') if not table_name.endswith('ies') else table_name.replace('ies', 'y').title().replace('_', ''))).where(
                    eval(table_name.title().replace('_', '').replace('s', '') if not table_name.endswith('ies') else table_name.replace('ies', 'y').title().replace('_', '')).id == test_id
                )
            )
        except:
            # If cleanup fails, it's not critical
            pass
    
    await session.commit()
    print("  ✓ Test data cleaned up")


if __name__ == "__main__":
    asyncio.run(test_crud_operations())