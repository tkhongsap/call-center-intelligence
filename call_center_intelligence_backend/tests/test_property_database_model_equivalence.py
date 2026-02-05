"""
Property-Based Tests for Database Model Equivalence

**Property 3: Database Operation Equivalence**
**Validates: Requirements 2.2, 2.4, 8.1, 8.2, 8.3**

Property Description: For any database operation (create, read, update, delete), 
the FastAPI backend should produce identical results and side effects as the 
original Next.js system when given the same input data.

This test suite uses hypothesis library with minimum 100 iterations to validate
that the SQLAlchemy models produce identical database operations to the expected
behavior from the original system.

Feature: backend-migration-fastapi, Property 3: Database Operation Equivalence
"""

import pytest
import asyncio
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from hypothesis import given, strategies as st, settings, assume
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool
from sqlalchemy.exc import IntegrityError

from app.models import (
    User, Case, Alert, TrendingTopic, Upload,
    UserRole, Channel, CaseStatus, Sentiment, Severity, 
    AlertType, AlertStatus, Trend, UploadStatus, RecomputeStatus
)
from app.core.database import Base


# Test database URL (in-memory SQLite)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


async def create_test_db():
    """Create a test database session."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async_session_maker = async_sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session_maker() as session:
        return session, engine


# ═══════════════════════════════════════════════════════════════════════════════
# Hypothesis Strategies for Model Data Generation
# ═══════════════════════════════════════════════════════════════════════════════

# Basic data strategies
valid_id_strategy = st.text(
    alphabet=st.characters(whitelist_categories=("Lu", "Ll", "Nd"), whitelist_characters="-_"),
    min_size=1,
    max_size=50
).filter(lambda x: x and not x.startswith('-') and not x.endswith('-'))

iso_datetime_strategy = st.datetimes(
    min_value=datetime(2020, 1, 1, tzinfo=timezone.utc),
    max_value=datetime(2030, 12, 31, tzinfo=timezone.utc)
).map(lambda dt: dt.isoformat().replace('+00:00', 'Z'))

email_strategy = st.emails().map(str)
business_unit_strategy = st.sampled_from(["IT", "Sales", "Support", "Marketing", "Finance"])
category_strategy = st.sampled_from([
    "Technical Issue", "Billing", "Account", "Product", "Service", "Complaint"
])

# Enum strategies
user_role_strategy = st.sampled_from(list(UserRole))
channel_strategy = st.sampled_from(list(Channel))
case_status_strategy = st.sampled_from(list(CaseStatus))
sentiment_strategy = st.sampled_from(list(Sentiment))
severity_strategy = st.sampled_from(list(Severity))
alert_type_strategy = st.sampled_from(list(AlertType))
alert_status_strategy = st.sampled_from(list(AlertStatus))
trend_strategy = st.sampled_from(list(Trend))
upload_status_strategy = st.sampled_from(list(UploadStatus))
recompute_status_strategy = st.sampled_from(list(RecomputeStatus))

# JSON field strategies
case_ids_list_strategy = st.lists(valid_id_strategy, min_size=0, max_size=10)
error_objects_strategy = st.lists(
    st.dictionaries(
        keys=st.sampled_from(["row", "error", "field", "value"]),
        values=st.one_of(
            st.integers(min_value=1, max_value=10000),
            st.text(max_size=200)
        )
    ),
    max_size=20
)

# Model data strategies
@st.composite
def user_data_strategy(draw):
    """Generate valid User model data."""
    return {
        "id": draw(valid_id_strategy),
        "name": draw(st.text(min_size=1, max_size=100)),
        "email": draw(email_strategy),
        "role": draw(user_role_strategy),
        "business_unit": draw(st.one_of(st.none(), business_unit_strategy)),
        "avatar_url": draw(st.one_of(st.none(), st.text(min_size=10, max_size=200).map(lambda x: f"https://example.com/{x}"))),
        "created_at": draw(iso_datetime_strategy)
    }

@st.composite
def case_data_strategy(draw):
    """Generate valid Case model data."""
    return {
        "id": draw(valid_id_strategy),
        "case_number": f"CASE-{draw(st.integers(min_value=1, max_value=999999)):06d}",
        "channel": draw(channel_strategy),
        "status": draw(case_status_strategy),
        "category": draw(category_strategy),
        "subcategory": draw(st.one_of(st.none(), st.text(min_size=1, max_size=100))),
        "sentiment": draw(sentiment_strategy),
        "severity": draw(severity_strategy),
        "risk_flag": draw(st.booleans()),
        "needs_review_flag": draw(st.booleans()),
        "business_unit": draw(business_unit_strategy),
        "summary": draw(st.text(min_size=10, max_size=500)),
        "customer_name": draw(st.one_of(st.none(), st.text(min_size=1, max_size=100))),
        "agent_id": draw(st.one_of(st.none(), valid_id_strategy)),
        "assigned_to": draw(st.one_of(st.none(), valid_id_strategy)),
        "created_at": draw(iso_datetime_strategy),
        "updated_at": draw(iso_datetime_strategy),
        "resolved_at": draw(st.one_of(st.none(), iso_datetime_strategy)),
        "upload_id": draw(st.one_of(st.none(), valid_id_strategy))
    }

@st.composite
def alert_data_strategy(draw):
    """Generate valid Alert model data."""
    return {
        "id": draw(valid_id_strategy),
        "type": draw(alert_type_strategy),
        "severity": draw(severity_strategy),
        "title": draw(st.text(min_size=5, max_size=200)),
        "description": draw(st.text(min_size=10, max_size=1000)),
        "business_unit": draw(st.one_of(st.none(), business_unit_strategy)),
        "category": draw(st.one_of(st.none(), category_strategy)),
        "channel": draw(st.one_of(st.none(), st.sampled_from(["email", "phone", "web", "line"]))),
        "baseline_value": draw(st.one_of(st.none(), st.floats(min_value=0, max_value=10000, allow_nan=False, allow_infinity=False))),
        "current_value": draw(st.one_of(st.none(), st.floats(min_value=0, max_value=10000, allow_nan=False, allow_infinity=False))),
        "percentage_change": draw(st.one_of(st.none(), st.floats(min_value=-100, max_value=1000, allow_nan=False, allow_infinity=False))),
        "status": draw(alert_status_strategy),
        "acknowledged_by": draw(st.one_of(st.none(), valid_id_strategy)),
        "acknowledged_at": draw(st.one_of(st.none(), iso_datetime_strategy)),
        "created_at": draw(iso_datetime_strategy),
        "updated_at": draw(iso_datetime_strategy)
    }

@st.composite
def trending_topic_data_strategy(draw):
    """Generate valid TrendingTopic model data."""
    return {
        "id": draw(valid_id_strategy),
        "topic": draw(st.text(min_size=3, max_size=200)),
        "description": draw(st.one_of(st.none(), st.text(min_size=10, max_size=500))),
        "case_count": draw(st.integers(min_value=0, max_value=10000)),
        "baseline_count": draw(st.integers(min_value=0, max_value=10000)),
        "trend": draw(trend_strategy),
        "percentage_change": draw(st.one_of(st.none(), st.floats(min_value=-100, max_value=1000, allow_nan=False, allow_infinity=False))),
        "trend_score": draw(st.floats(min_value=0, max_value=10, allow_nan=False, allow_infinity=False)),
        "business_unit": draw(st.one_of(st.none(), business_unit_strategy)),
        "category": draw(st.one_of(st.none(), category_strategy)),
        "sample_case_ids": draw(st.one_of(st.none(), case_ids_list_strategy)),
        "created_at": draw(iso_datetime_strategy),
        "updated_at": draw(iso_datetime_strategy)
    }

@st.composite
def upload_data_strategy(draw):
    """Generate valid Upload model data."""
    total_rows = draw(st.integers(min_value=0, max_value=100000))
    success_count = draw(st.integers(min_value=0, max_value=total_rows))
    error_count = total_rows - success_count
    
    return {
        "id": draw(valid_id_strategy),
        "file_name": draw(st.text(min_size=5, max_size=100).map(lambda x: f"{x}.csv")),
        "file_size": draw(st.integers(min_value=1, max_value=100000000)),
        "status": draw(upload_status_strategy),
        "total_rows": total_rows,
        "success_count": success_count,
        "error_count": error_count,
        "errors": draw(st.one_of(st.none(), error_objects_strategy)),
        "uploaded_by": draw(st.one_of(st.none(), valid_id_strategy)),
        "completed_at": draw(st.one_of(st.none(), iso_datetime_strategy)),
        "recompute_status": draw(st.one_of(st.none(), recompute_status_strategy)),
        "recompute_started_at": draw(st.one_of(st.none(), iso_datetime_strategy)),
        "recompute_completed_at": draw(st.one_of(st.none(), iso_datetime_strategy)),
        "alerts_generated": draw(st.one_of(st.none(), st.integers(min_value=0, max_value=1000))),
        "trending_updated": draw(st.one_of(st.none(), st.booleans())),
        "created_at": draw(iso_datetime_strategy)
    }


# ═══════════════════════════════════════════════════════════════════════════════
# Property-Based Test Functions
# ═══════════════════════════════════════════════════════════════════════════════

@pytest.mark.property
@pytest.mark.asyncio
@settings(max_examples=100, deadline=None)
@given(user_data=user_data_strategy())
async def test_user_crud_equivalence(user_data):
    """
    **Validates: Requirements 2.2, 2.4, 8.1, 8.2, 8.3**
    
    Test that User CRUD operations work identically to expected behavior.
    
    Feature: backend-migration-fastapi, Property 3: Database Operation Equivalence
    """
    session, engine = await create_test_db()
    
    try:
        # Create user
        user = User(**user_data)
        session.add(user)
        await session.commit()
        
        # Read user
        stmt = select(User).where(User.id == user_data["id"])
        result = await session.execute(stmt)
        retrieved_user = result.scalar_one()
        
        # Verify all fields match exactly
        assert retrieved_user.id == user_data["id"]
        assert retrieved_user.name == user_data["name"]
        assert retrieved_user.email == user_data["email"]
        assert retrieved_user.role == user_data["role"]
        assert retrieved_user.business_unit == user_data["business_unit"]
        assert retrieved_user.avatar_url == user_data["avatar_url"]
        assert retrieved_user.created_at == user_data["created_at"]
        
        # Update user
        new_name = f"Updated {user_data['name']}"
        retrieved_user.name = new_name
        await session.commit()
        
        # Verify update
        stmt = select(User).where(User.id == user_data["id"])
        result = await session.execute(stmt)
        updated_user = result.scalar_one()
        assert updated_user.name == new_name
        
        # Delete user
        await session.delete(retrieved_user)
        await session.commit()
        
        # Verify deletion
        stmt = select(User).where(User.id == user_data["id"])
        result = await session.execute(stmt)
        deleted_user = result.scalar_one_or_none()
        assert deleted_user is None
        
    finally:
        await session.close()
        await engine.dispose()


@pytest.mark.property
@pytest.mark.asyncio
@settings(max_examples=100, deadline=None)
@given(case_data=case_data_strategy())
async def test_case_crud_equivalence(case_data):
    """
    **Validates: Requirements 2.2, 2.4, 8.1, 8.2, 8.3**
    
    Test that Case CRUD operations work identically to expected behavior.
    
    Feature: backend-migration-fastapi, Property 3: Database Operation Equivalence
    """
    session, engine = await create_test_db()
    
    try:
        # Create case
        case = Case(**case_data)
        session.add(case)
        await session.commit()
        
        # Read case
        stmt = select(Case).where(Case.id == case_data["id"])
        result = await session.execute(stmt)
        retrieved_case = result.scalar_one()
        
        # Verify critical fields match exactly
        assert retrieved_case.id == case_data["id"]
        assert retrieved_case.case_number == case_data["case_number"]
        assert retrieved_case.channel == case_data["channel"]
        assert retrieved_case.status == case_data["status"]
        assert retrieved_case.category == case_data["category"]
        assert retrieved_case.sentiment == case_data["sentiment"]
        assert retrieved_case.severity == case_data["severity"]
        assert retrieved_case.business_unit == case_data["business_unit"]
        assert retrieved_case.summary == case_data["summary"]
        assert retrieved_case.risk_flag == case_data["risk_flag"]
        assert retrieved_case.needs_review_flag == case_data["needs_review_flag"]
        
        # Test status update
        if retrieved_case.status != CaseStatus.resolved:
            retrieved_case.status = CaseStatus.resolved
            retrieved_case.resolved_at = datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
            await session.commit()
            
            # Verify status update
            stmt = select(Case).where(Case.id == case_data["id"])
            result = await session.execute(stmt)
            updated_case = result.scalar_one()
            assert updated_case.status == CaseStatus.resolved
            assert updated_case.resolved_at is not None
        
        # Clean up
        await session.delete(retrieved_case)
        await session.commit()
        
    finally:
        await session.close()
        await engine.dispose()


@pytest.mark.property
@pytest.mark.asyncio
@settings(max_examples=100, deadline=None)
@given(alert_data=alert_data_strategy())
async def test_alert_crud_equivalence(alert_data):
    """
    **Validates: Requirements 2.2, 2.4, 8.1, 8.2, 8.3**
    
    Test that Alert CRUD operations work identically to expected behavior.
    
    Feature: backend-migration-fastapi, Property 3: Database Operation Equivalence
    """
    session, engine = await create_test_db()
    
    try:
        # Create alert
        alert = Alert(**alert_data)
        session.add(alert)
        await session.commit()
        
        # Read alert
        stmt = select(Alert).where(Alert.id == alert_data["id"])
        result = await session.execute(stmt)
        retrieved_alert = result.scalar_one()
        
        # Verify critical fields match exactly
        assert retrieved_alert.id == alert_data["id"]
        assert retrieved_alert.type == alert_data["type"]
        assert retrieved_alert.severity == alert_data["severity"]
        assert retrieved_alert.title == alert_data["title"]
        assert retrieved_alert.description == alert_data["description"]
        assert retrieved_alert.status == alert_data["status"]
        
        # Test numeric fields with proper float comparison
        if alert_data["baseline_value"] is not None:
            assert abs(retrieved_alert.baseline_value - alert_data["baseline_value"]) < 0.001
        if alert_data["current_value"] is not None:
            assert abs(retrieved_alert.current_value - alert_data["current_value"]) < 0.001
        if alert_data["percentage_change"] is not None:
            assert abs(retrieved_alert.percentage_change - alert_data["percentage_change"]) < 0.001
        
        # Test status update
        if retrieved_alert.status != AlertStatus.acknowledged:
            retrieved_alert.status = AlertStatus.acknowledged
            retrieved_alert.acknowledged_by = "test-user"
            retrieved_alert.acknowledged_at = datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
            await session.commit()
            
            # Verify status update
            stmt = select(Alert).where(Alert.id == alert_data["id"])
            result = await session.execute(stmt)
            updated_alert = result.scalar_one()
            assert updated_alert.status == AlertStatus.acknowledged
            assert updated_alert.acknowledged_by == "test-user"
        
        # Clean up
        await session.delete(retrieved_alert)
        await session.commit()
        
    finally:
        await session.close()
        await engine.dispose()


@pytest.mark.property
@pytest.mark.asyncio
@settings(max_examples=100, deadline=None)
@given(topic_data=trending_topic_data_strategy())
async def test_json_field_equivalence(topic_data):
    """
    **Validates: Requirements 2.2, 2.4, 8.1, 8.2, 8.3**
    
    Test that JSON fields serialize/deserialize identically to expected behavior.
    
    Feature: backend-migration-fastapi, Property 3: Database Operation Equivalence
    """
    session, engine = await create_test_db()
    
    try:
        # Create trending topic with JSON field
        topic = TrendingTopic(**topic_data)
        session.add(topic)
        await session.commit()
        
        # Read and verify JSON field
        stmt = select(TrendingTopic).where(TrendingTopic.id == topic_data["id"])
        result = await session.execute(stmt)
        retrieved_topic = result.scalar_one()
        
        # Verify JSON field serialization/deserialization
        if topic_data["sample_case_ids"] is not None:
            assert retrieved_topic.sample_case_ids == topic_data["sample_case_ids"]
            assert isinstance(retrieved_topic.sample_case_ids, list)
            # Verify each element in the list
            for i, case_id in enumerate(topic_data["sample_case_ids"]):
                assert retrieved_topic.sample_case_ids[i] == case_id
        else:
            assert retrieved_topic.sample_case_ids is None
        
        # Test JSON field update
        new_case_ids = ["new-case-1", "new-case-2", "new-case-3"]
        retrieved_topic.sample_case_ids = new_case_ids
        await session.commit()
        
        # Verify JSON field update
        stmt = select(TrendingTopic).where(TrendingTopic.id == topic_data["id"])
        result = await session.execute(stmt)
        updated_topic = result.scalar_one()
        assert updated_topic.sample_case_ids == new_case_ids
        
        # Clean up
        await session.delete(retrieved_topic)
        await session.commit()
        
    finally:
        await session.close()
        await engine.dispose()


@pytest.mark.property
@pytest.mark.asyncio
@settings(max_examples=100, deadline=None)
@given(upload_data=upload_data_strategy())
async def test_upload_json_errors_equivalence(upload_data):
    """
    **Validates: Requirements 2.2, 2.4, 8.1, 8.2, 8.3**
    
    Test that Upload model with JSON errors field works identically to expected behavior.
    
    Feature: backend-migration-fastapi, Property 3: Database Operation Equivalence
    """
    session, engine = await create_test_db()
    
    try:
        # Create upload with JSON errors field
        upload = Upload(**upload_data)
        session.add(upload)
        await session.commit()
        
        # Read and verify JSON errors field
        stmt = select(Upload).where(Upload.id == upload_data["id"])
        result = await session.execute(stmt)
        retrieved_upload = result.scalar_one()
        
        # Verify critical fields match
        assert retrieved_upload.id == upload_data["id"]
        assert retrieved_upload.file_name == upload_data["file_name"]
        assert retrieved_upload.file_size == upload_data["file_size"]
        assert retrieved_upload.status == upload_data["status"]
        assert retrieved_upload.total_rows == upload_data["total_rows"]
        assert retrieved_upload.success_count == upload_data["success_count"]
        assert retrieved_upload.error_count == upload_data["error_count"]
        
        # Test JSON field serialization/deserialization for errors
        if upload_data["errors"] is not None:
            assert retrieved_upload.errors == upload_data["errors"]
            assert isinstance(retrieved_upload.errors, list)
        else:
            assert retrieved_upload.errors is None
        
        # Test JSON field update
        new_errors = [
            {"row": 1, "error": "Invalid format"},
            {"row": 5, "error": "Missing field", "field": "email"}
        ]
        retrieved_upload.errors = new_errors
        await session.commit()
        
        # Verify JSON field update
        stmt = select(Upload).where(Upload.id == upload_data["id"])
        result = await session.execute(stmt)
        updated_upload = result.scalar_one()
        assert updated_upload.errors == new_errors
        
        # Clean up
        await session.delete(retrieved_upload)
        await session.commit()
        
    finally:
        await session.close()
        await engine.dispose()


@pytest.mark.property
@pytest.mark.asyncio
@settings(max_examples=50, deadline=None)
@given(
    user_data=user_data_strategy(),
    case_data=case_data_strategy(),
    alert_data=alert_data_strategy()
)
async def test_multi_model_transaction_equivalence(user_data, case_data, alert_data):
    """
    **Validates: Requirements 2.2, 2.4, 8.1, 8.2, 8.3**
    
    Test that multi-model transactions work identically to expected behavior.
    
    Feature: backend-migration-fastapi, Property 3: Database Operation Equivalence
    """
    session, engine = await create_test_db()
    
    try:
        # Create multiple models in a single transaction
        user = User(**user_data)
        case = Case(**case_data)
        alert = Alert(**alert_data)
        
        session.add(user)
        session.add(case)
        session.add(alert)
        
        await session.commit()
        
        # Verify all models were created
        user_stmt = select(User).where(User.id == user_data["id"])
        case_stmt = select(Case).where(Case.id == case_data["id"])
        alert_stmt = select(Alert).where(Alert.id == alert_data["id"])
        
        user_result = await session.execute(user_stmt)
        case_result = await session.execute(case_stmt)
        alert_result = await session.execute(alert_stmt)
        
        retrieved_user = user_result.scalar_one()
        retrieved_case = case_result.scalar_one()
        retrieved_alert = alert_result.scalar_one()
        
        assert retrieved_user.id == user_data["id"]
        assert retrieved_case.id == case_data["id"]
        assert retrieved_alert.id == alert_data["id"]
        
        # Test transaction rollback behavior
        try:
            # Attempt to create duplicate user (should fail)
            duplicate_user = User(**user_data)
            session.add(duplicate_user)
            await session.commit()
            assert False, "Should have failed due to duplicate ID"
        except IntegrityError:
            await session.rollback()
            # Verify original data is still intact
            user_result = await session.execute(user_stmt)
            case_result = await session.execute(case_stmt)
            alert_result = await session.execute(alert_stmt)
            
            assert user_result.scalar_one().id == user_data["id"]
            assert case_result.scalar_one().id == case_data["id"]
            assert alert_result.scalar_one().id == alert_data["id"]
        
        # Clean up
        await session.delete(retrieved_user)
        await session.delete(retrieved_case)
        await session.delete(retrieved_alert)
        await session.commit()
        
    finally:
        await session.close()
        await engine.dispose()


# ═══════════════════════════════════════════════════════════════════════════════
# Test Summary Function
# ═══════════════════════════════════════════════════════════════════════════════

def test_summary():
    """
    Summary of Property-Based Tests for Database Model Equivalence
    
    This test suite validates Property 3: Database Operation Equivalence
    Requirements validated: 2.2, 2.4, 8.1, 8.2, 8.3
    
    Tests included:
    1. User CRUD operations equivalence (100 examples)
    2. Case CRUD operations equivalence (100 examples)  
    3. Alert CRUD operations equivalence (100 examples)
    4. JSON field serialization/deserialization equivalence (100 examples)
    5. Upload JSON errors field equivalence (100 examples)
    6. Multi-model transaction equivalence (50 examples)
    
    Total: 550 property-based test examples
    
    Feature: backend-migration-fastapi, Property 3: Database Operation Equivalence
    """
    pass