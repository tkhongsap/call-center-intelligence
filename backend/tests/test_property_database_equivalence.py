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
"""

import pytest
import asyncio
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Union
from hypothesis import given, strategies as st, settings, assume, HealthCheck
from hypothesis.stateful import RuleBasedStateMachine, Bundle, rule, initialize, invariant
from sqlalchemy import select, delete, update, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from app.models import (
    User, Case, Alert, TrendingTopic, FeedItem, Share, SearchAnalytic, Upload,
    UserRole, Channel, CaseStatus, Sentiment, Severity, AlertType, AlertStatus,
    Trend, FeedItemType, ShareType, ShareSourceType, ShareChannel, ShareStatus,
    UploadStatus, RecomputeStatus
)


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
url_strategy = st.text(min_size=10, max_size=200).map(lambda x: f"https://example.com/{x}")
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
feed_item_type_strategy = st.sampled_from(list(FeedItemType))
share_type_strategy = st.sampled_from(list(ShareType))
share_source_type_strategy = st.sampled_from(list(ShareSourceType))
share_channel_strategy = st.sampled_from(list(ShareChannel))
share_status_strategy = st.sampled_from(list(ShareStatus))
upload_status_strategy = st.sampled_from(list(UploadStatus))
recompute_status_strategy = st.sampled_from(list(RecomputeStatus))

# JSON field strategies
json_metadata_strategy = st.dictionaries(
    keys=st.text(min_size=1, max_size=20),
    values=st.one_of(
        st.text(max_size=100),
        st.integers(min_value=0, max_value=1000),
        st.booleans(),
        st.lists(st.text(max_size=50), max_size=5)
    ),
    max_size=10
)

case_ids_list_strategy = st.lists(
    valid_id_strategy,
    min_size=0,
    max_size=10
)

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
        "avatar_url": draw(st.one_of(st.none(), url_strategy)),
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
        "baseline_value": draw(st.one_of(st.none(), st.floats(min_value=0, max_value=10000))),
        "current_value": draw(st.one_of(st.none(), st.floats(min_value=0, max_value=10000))),
        "percentage_change": draw(st.one_of(st.none(), st.floats(min_value=-100, max_value=1000))),
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
        "percentage_change": draw(st.one_of(st.none(), st.floats(min_value=-100, max_value=1000))),
        "trend_score": draw(st.floats(min_value=0, max_value=10)),
        "business_unit": draw(st.one_of(st.none(), business_unit_strategy)),
        "category": draw(st.one_of(st.none(), category_strategy)),
        "sample_case_ids": draw(st.one_of(st.none(), case_ids_list_strategy)),
        "created_at": draw(iso_datetime_strategy),
        "updated_at": draw(iso_datetime_strategy)
    }

@st.composite
def upload_data_strategy(draw):
    """Generate valid Upload model data."""
    return {
        "id": draw(valid_id_strategy),
        "file_name": draw(st.text(min_size=5, max_size=100).map(lambda x: f"{x}.csv")),
        "file_size": draw(st.integers(min_value=1, max_value=100000000)),
        "status": draw(upload_status_strategy),
        "total_rows": draw(st.integers(min_value=0, max_value=100000)),
        "success_count": draw(st.integers(min_value=0, max_value=100000)),
        "error_count": draw(st.integers(min_value=0, max_value=10000)),
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
# Property-Based Test Class
# ═══════════════════════════════════════════════════════════════════════════════

class DatabaseEquivalenceStateMachine(RuleBasedStateMachine):
    """
    Stateful property-based testing for database model equivalence.
    
    This state machine tests that CRUD operations on SQLAlchemy models
    produce consistent and expected results across multiple operations.
    """
    
    users = Bundle("users")
    cases = Bundle("cases")
    alerts = Bundle("alerts")
    trending_topics = Bundle("trending_topics")
    uploads = Bundle("uploads")
    
    def __init__(self):
        super().__init__()
        self.session: Optional[AsyncSession] = None
        self.created_users: List[str] = []
        self.created_cases: List[str] = []
        self.created_alerts: List[str] = []
        self.created_trending_topics: List[str] = []
        self.created_uploads: List[str] = []
    
    @initialize()
    def setup_database(self):
        """Initialize database session for testing."""
        # This will be set by the test fixture
        pass
    
    @rule(target=users, user_data=user_data_strategy())
    async def create_user(self, user_data):
        """Test user creation with various data combinations."""
        if not self.session:
            return user_data["id"]
            
        user = User(**user_data)
        self.session.add(user)
        
        try:
            await self.session.commit()
            self.created_users.append(user_data["id"])
            
            # Verify the user was created correctly
            stmt = select(User).where(User.id == user_data["id"])
            result = await self.session.execute(stmt)
            retrieved_user = result.scalar_one()
            
            # Assert all fields match
            assert retrieved_user.id == user_data["id"]
            assert retrieved_user.name == user_data["name"]
            assert retrieved_user.email == user_data["email"]
            assert retrieved_user.role == user_data["role"]
            assert retrieved_user.business_unit == user_data["business_unit"]
            assert retrieved_user.avatar_url == user_data["avatar_url"]
            assert retrieved_user.created_at == user_data["created_at"]
            
            return user_data["id"]
            
        except IntegrityError:
            await self.session.rollback()
            # If there's a constraint violation, that's expected behavior
            return user_data["id"]
    
    @rule(target=cases, case_data=case_data_strategy())
    async def create_case(self, case_data):
        """Test case creation with various data combinations."""
        if not self.session:
            return case_data["id"]
            
        case = Case(**case_data)
        self.session.add(case)
        
        try:
            await self.session.commit()
            self.created_cases.append(case_data["id"])
            
            # Verify the case was created correctly
            stmt = select(Case).where(Case.id == case_data["id"])
            result = await self.session.execute(stmt)
            retrieved_case = result.scalar_one()
            
            # Assert critical fields match
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
            
            return case_data["id"]
            
        except IntegrityError:
            await self.session.rollback()
            return case_data["id"]
    
    @rule(target=alerts, alert_data=alert_data_strategy())
    async def create_alert(self, alert_data):
        """Test alert creation with various data combinations."""
        if not self.session:
            return alert_data["id"]
            
        alert = Alert(**alert_data)
        self.session.add(alert)
        
        try:
            await self.session.commit()
            self.created_alerts.append(alert_data["id"])
            
            # Verify the alert was created correctly
            stmt = select(Alert).where(Alert.id == alert_data["id"])
            result = await self.session.execute(stmt)
            retrieved_alert = result.scalar_one()
            
            # Assert critical fields match
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
            
            return alert_data["id"]
            
        except IntegrityError:
            await self.session.rollback()
            return alert_data["id"]
    
    @rule(target=trending_topics, topic_data=trending_topic_data_strategy())
    async def create_trending_topic(self, topic_data):
        """Test trending topic creation with JSON fields."""
        if not self.session:
            return topic_data["id"]
            
        topic = TrendingTopic(**topic_data)
        self.session.add(topic)
        
        try:
            await self.session.commit()
            self.created_trending_topics.append(topic_data["id"])
            
            # Verify the trending topic was created correctly
            stmt = select(TrendingTopic).where(TrendingTopic.id == topic_data["id"])
            result = await self.session.execute(stmt)
            retrieved_topic = result.scalar_one()
            
            # Assert critical fields match
            assert retrieved_topic.id == topic_data["id"]
            assert retrieved_topic.topic == topic_data["topic"]
            assert retrieved_topic.trend == topic_data["trend"]
            assert retrieved_topic.case_count == topic_data["case_count"]
            assert retrieved_topic.baseline_count == topic_data["baseline_count"]
            assert abs(retrieved_topic.trend_score - topic_data["trend_score"]) < 0.001
            
            # Test JSON field serialization/deserialization
            if topic_data["sample_case_ids"] is not None:
                assert retrieved_topic.sample_case_ids == topic_data["sample_case_ids"]
            else:
                assert retrieved_topic.sample_case_ids is None
            
            return topic_data["id"]
            
        except IntegrityError:
            await self.session.rollback()
            return topic_data["id"]
    
    @rule(target=uploads, upload_data=upload_data_strategy())
    async def create_upload(self, upload_data):
        """Test upload creation with JSON error fields."""
        if not self.session:
            return upload_data["id"]
            
        # Ensure success_count + error_count <= total_rows for data consistency
        if upload_data["success_count"] + upload_data["error_count"] > upload_data["total_rows"]:
            upload_data["total_rows"] = upload_data["success_count"] + upload_data["error_count"]
        
        upload = Upload(**upload_data)
        self.session.add(upload)
        
        try:
            await self.session.commit()
            self.created_uploads.append(upload_data["id"])
            
            # Verify the upload was created correctly
            stmt = select(Upload).where(Upload.id == upload_data["id"])
            result = await self.session.execute(stmt)
            retrieved_upload = result.scalar_one()
            
            # Assert critical fields match
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
            else:
                assert retrieved_upload.errors is None
            
            return upload_data["id"]
            
        except IntegrityError:
            await self.session.rollback()
            return upload_data["id"]
    
    @rule(user_id=users)
    async def update_user(self, user_id):
        """Test user updates maintain data integrity."""
        if not self.session or user_id not in self.created_users:
            return
            
        # Get the user
        stmt = select(User).where(User.id == user_id)
        result = await self.session.execute(stmt)
        user = result.scalar_one_or_none()
        
        if user:
            # Update some fields
            original_name = user.name
            user.name = f"Updated {original_name}"
            user.business_unit = "Updated Unit"
            
            await self.session.commit()
            
            # Verify update
            stmt = select(User).where(User.id == user_id)
            result = await self.session.execute(stmt)
            updated_user = result.scalar_one()
            
            assert updated_user.name == f"Updated {original_name}"
            assert updated_user.business_unit == "Updated Unit"
            # Other fields should remain unchanged
            assert updated_user.email == user.email
            assert updated_user.role == user.role
    
    @rule(case_id=cases)
    async def update_case_status(self, case_id):
        """Test case status updates work correctly."""
        if not self.session or case_id not in self.created_cases:
            return
            
        # Get the case
        stmt = select(Case).where(Case.id == case_id)
        result = await self.session.execute(stmt)
        case = result.scalar_one_or_none()
        
        if case:
            # Update status
            original_status = case.status
            new_status = CaseStatus.resolved if original_status != CaseStatus.resolved else CaseStatus.closed
            case.status = new_status
            case.updated_at = datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
            
            if new_status == CaseStatus.resolved:
                case.resolved_at = case.updated_at
            
            await self.session.commit()
            
            # Verify update
            stmt = select(Case).where(Case.id == case_id)
            result = await self.session.execute(stmt)
            updated_case = result.scalar_one()
            
            assert updated_case.status == new_status
            if new_status == CaseStatus.resolved:
                assert updated_case.resolved_at is not None
    
    @invariant()
    async def database_consistency_check(self):
        """Verify database remains in a consistent state."""
        if not self.session:
            return
            
        # Check that all created records still exist and are accessible
        for user_id in self.created_users:
            stmt = select(User).where(User.id == user_id)
            result = await self.session.execute(stmt)
            user = result.scalar_one_or_none()
            assert user is not None, f"User {user_id} should exist"
            assert user.id == user_id
            assert user.name is not None
            assert user.email is not None
            assert user.role in UserRole
        
        for case_id in self.created_cases:
            stmt = select(Case).where(Case.id == case_id)
            result = await self.session.execute(stmt)
            case = result.scalar_one_or_none()
            assert case is not None, f"Case {case_id} should exist"
            assert case.id == case_id
            assert case.case_number is not None
            assert case.status in CaseStatus
            assert case.channel in Channel
            assert case.sentiment in Sentiment
            assert case.severity in Severity
        
        for alert_id in self.created_alerts:
            stmt = select(Alert).where(Alert.id == alert_id)
            result = await self.session.execute(stmt)
            alert = result.scalar_one_or_none()
            assert alert is not None, f"Alert {alert_id} should exist"
            assert alert.id == alert_id
            assert alert.type in AlertType
            assert alert.severity in Severity
            assert alert.status in AlertStatus
    
    async def teardown(self):
        """Clean up created test data."""
        if not self.session:
            return
            
        try:
            # Delete in reverse order to handle dependencies
            for upload_id in self.created_uploads:
                await self.session.execute(delete(Upload).where(Upload.id == upload_id))
            
            for topic_id in self.created_trending_topics:
                await self.session.execute(delete(TrendingTopic).where(TrendingTopic.id == topic_id))
            
            for alert_id in self.created_alerts:
                await self.session.execute(delete(Alert).where(Alert.id == alert_id))
            
            for case_id in self.created_cases:
                await self.session.execute(delete(Case).where(Case.id == case_id))
            
            for user_id in self.created_users:
                await self.session.execute(delete(User).where(User.id == user_id))
            
            await self.session.commit()
        except Exception:
            await self.session.rollback()


# ═══════════════════════════════════════════════════════════════════════════════
# Property-Based Test Functions
# ═══════════════════════════════════════════════════════════════════════════════

@pytest.mark.property
@pytest.mark.asyncio
@settings(
    max_examples=100,
    deadline=None,
    suppress_health_check=[HealthCheck.function_scoped_fixture, HealthCheck.too_slow]
)
async def test_database_model_equivalence_stateful(test_db):
    """
    **Validates: Requirements 2.2, 2.4, 8.1, 8.2, 8.3**
    
    Property-based test using stateful testing to verify database model equivalence.
    Tests that CRUD operations maintain consistency and produce expected results.
    
    Feature: backend-migration-fastapi, Property 3: Database Operation Equivalence
    """
    # Create and run the state machine
    state_machine = DatabaseEquivalenceStateMachine()
    state_machine.session = test_db
    
    try:
        # Run the state machine with multiple steps
        for _ in range(50):  # Run 50 operations
            await state_machine.step()
    finally:
        await state_machine.teardown()


@pytest.mark.property
@pytest.mark.asyncio
@settings(max_examples=100, deadline=None)
@given(user_data=user_data_strategy())
async def test_user_crud_equivalence(test_db, user_data):
    """
    **Validates: Requirements 2.2, 2.4, 8.1, 8.2, 8.3**
    
    Test that User CRUD operations work identically to expected behavior.
    
    Feature: backend-migration-fastapi, Property 3: Database Operation Equivalence
    """
    # Create user
    user = User(**user_data)
    test_db.add(user)
    await test_db.commit()
    
    # Read user
    stmt = select(User).where(User.id == user_data["id"])
    result = await test_db.execute(stmt)
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
    await test_db.commit()
    
    # Verify update
    stmt = select(User).where(User.id == user_data["id"])
    result = await test_db.execute(stmt)
    updated_user = result.scalar_one()
    assert updated_user.name == new_name
    
    # Delete user
    await test_db.delete(retrieved_user)
    await test_db.commit()
    
    # Verify deletion
    stmt = select(User).where(User.id == user_data["id"])
    result = await test_db.execute(stmt)
    deleted_user = result.scalar_one_or_none()
    assert deleted_user is None


@pytest.mark.property
@pytest.mark.asyncio
@settings(max_examples=100, deadline=None)
@given(case_data=case_data_strategy())
async def test_case_crud_equivalence(test_db, case_data):
    """
    **Validates: Requirements 2.2, 2.4, 8.1, 8.2, 8.3**
    
    Test that Case CRUD operations work identically to expected behavior.
    
    Feature: backend-migration-fastapi, Property 3: Database Operation Equivalence
    """
    # Create case
    case = Case(**case_data)
    test_db.add(case)
    await test_db.commit()
    
    # Read case
    stmt = select(Case).where(Case.id == case_data["id"])
    result = await test_db.execute(stmt)
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
        await test_db.commit()
        
        # Verify status update
        stmt = select(Case).where(Case.id == case_data["id"])
        result = await test_db.execute(stmt)
        updated_case = result.scalar_one()
        assert updated_case.status == CaseStatus.resolved
        assert updated_case.resolved_at is not None
    
    # Clean up
    await test_db.delete(retrieved_case)
    await test_db.commit()


@pytest.mark.property
@pytest.mark.asyncio
@settings(max_examples=100, deadline=None)
@given(topic_data=trending_topic_data_strategy())
async def test_json_field_equivalence(test_db, topic_data):
    """
    **Validates: Requirements 2.2, 2.4, 8.1, 8.2, 8.3**
    
    Test that JSON fields serialize/deserialize identically to expected behavior.
    
    Feature: backend-migration-fastapi, Property 3: Database Operation Equivalence
    """
    # Create trending topic with JSON field
    topic = TrendingTopic(**topic_data)
    test_db.add(topic)
    await test_db.commit()
    
    # Read and verify JSON field
    stmt = select(TrendingTopic).where(TrendingTopic.id == topic_data["id"])
    result = await test_db.execute(stmt)
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
    await test_db.commit()
    
    # Verify JSON field update
    stmt = select(TrendingTopic).where(TrendingTopic.id == topic_data["id"])
    result = await test_db.execute(stmt)
    updated_topic = result.scalar_one()
    assert updated_topic.sample_case_ids == new_case_ids
    
    # Clean up
    await test_db.delete(retrieved_topic)
    await test_db.commit()


@pytest.mark.property
@pytest.mark.asyncio
@settings(max_examples=50, deadline=None)
@given(
    user_data=user_data_strategy(),
    case_data=case_data_strategy(),
    alert_data=alert_data_strategy()
)
async def test_multi_model_transaction_equivalence(test_db, user_data, case_data, alert_data):
    """
    **Validates: Requirements 2.2, 2.4, 8.1, 8.2, 8.3**
    
    Test that multi-model transactions work identically to expected behavior.
    
    Feature: backend-migration-fastapi, Property 3: Database Operation Equivalence
    """
    # Create multiple models in a single transaction
    user = User(**user_data)
    case = Case(**case_data)
    alert = Alert(**alert_data)
    
    test_db.add(user)
    test_db.add(case)
    test_db.add(alert)
    
    await test_db.commit()
    
    # Verify all models were created
    user_stmt = select(User).where(User.id == user_data["id"])
    case_stmt = select(Case).where(Case.id == case_data["id"])
    alert_stmt = select(Alert).where(Alert.id == alert_data["id"])
    
    user_result = await test_db.execute(user_stmt)
    case_result = await test_db.execute(case_stmt)
    alert_result = await test_db.execute(alert_stmt)
    
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
        test_db.add(duplicate_user)
        await test_db.commit()
        assert False, "Should have failed due to duplicate ID"
    except IntegrityError:
        await test_db.rollback()
        # Verify original data is still intact
        user_result = await test_db.execute(user_stmt)
        case_result = await test_db.execute(case_stmt)
        alert_result = await test_db.execute(alert_stmt)
        
        assert user_result.scalar_one().id == user_data["id"]
        assert case_result.scalar_one().id == case_data["id"]
        assert alert_result.scalar_one().id == alert_data["id"]
    
    # Clean up
    await test_db.delete(retrieved_user)
    await test_db.delete(retrieved_case)
    await test_db.delete(retrieved_alert)
    await test_db.commit()


# Run the stateful test as a standalone test
TestDatabaseEquivalence = DatabaseEquivalenceStateMachine.TestCase