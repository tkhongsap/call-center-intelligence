"""
Test incident feed transformer functionality.

Tests the transformation of incidents to feed items, including null field handling.
"""

import pytest
from datetime import datetime, timezone
from app.models.incident import Incident
from app.models.base import FeedItemType
from app.services.incident_feed_transformer import (
    transform_incident_to_feed_item,
    determine_priority,
    determine_feed_type,
)


def test_transform_incident_with_all_fields():
    """Test transformation with all fields populated."""
    incident = Incident(
        id=1,
        incident_number="INC-001",
        subject="Test Subject",
        details="Test details content",
        received_date=datetime(2024, 1, 1, 12, 0, 0, tzinfo=timezone.utc),
        created_at=datetime(2024, 1, 1, 10, 0, 0, tzinfo=timezone.utc),
        status="Open",
        issue_type="Technical",
        customer_name="Test Customer",
        province="Bangkok",
        contact_channel="Email",
        product="Product A",
        reference_number="REF-001",
    )
    
    feed_item = transform_incident_to_feed_item(incident)
    
    assert feed_item.id == "INC-001"
    assert feed_item.title == "Test Subject"
    assert feed_item.content == "Test details content"
    assert feed_item.type == FeedItemType.highlight
    assert feed_item.priority == 5
    assert feed_item.reference_id == "1"
    assert feed_item.reference_type == "incident"
    assert feed_item.item_metadata["customer_name"] == "Test Customer"
    assert feed_item.item_metadata["status"] == "Open"
    assert feed_item.item_metadata["issue_type"] == "Technical"
    assert feed_item.item_metadata["province"] == "Bangkok"
    assert feed_item.item_metadata["contact_channel"] == "Email"
    assert feed_item.item_metadata["product"] == "Product A"
    assert feed_item.item_metadata["reference_number"] == "REF-001"


def test_transform_incident_with_null_subject():
    """Test transformation when subject is null, should fallback to issue_type."""
    incident = Incident(
        id=2,
        incident_number="INC-002",
        subject=None,
        details="Test details",
        received_date=datetime(2024, 1, 1, 12, 0, 0, tzinfo=timezone.utc),
        created_at=datetime(2024, 1, 1, 10, 0, 0, tzinfo=timezone.utc),
        status="Open",
        issue_type="Network Issue",
        customer_name="Test Customer",
        province="Bangkok",
    )
    
    feed_item = transform_incident_to_feed_item(incident)
    
    assert feed_item.title == "Network Issue"


def test_transform_incident_with_null_subject_and_issue_type():
    """Test transformation when both subject and issue_type are null, should use default."""
    incident = Incident(
        id=3,
        incident_number="INC-003",
        subject=None,
        details="Test details",
        received_date=datetime(2024, 1, 1, 12, 0, 0, tzinfo=timezone.utc),
        created_at=datetime(2024, 1, 1, 10, 0, 0, tzinfo=timezone.utc),
        status="Open",
        issue_type=None,
        customer_name="Test Customer",
        province="Bangkok",
    )
    
    feed_item = transform_incident_to_feed_item(incident)
    
    assert feed_item.title == "Untitled Incident"


def test_transform_incident_with_null_details():
    """Test transformation when details is null, should use default content."""
    incident = Incident(
        id=4,
        incident_number="INC-004",
        subject="Test Subject",
        details=None,
        received_date=datetime(2024, 1, 1, 12, 0, 0, tzinfo=timezone.utc),
        created_at=datetime(2024, 1, 1, 10, 0, 0, tzinfo=timezone.utc),
        status="Open",
        issue_type="Technical",
        customer_name="Test Customer",
        province="Bangkok",
    )
    
    feed_item = transform_incident_to_feed_item(incident)
    
    assert feed_item.content == "No details available"


def test_transform_incident_with_null_received_date():
    """Test transformation when received_date is null, should fallback to created_at."""
    created_time = datetime(2024, 1, 1, 10, 0, 0, tzinfo=timezone.utc)
    incident = Incident(
        id=5,
        incident_number="INC-005",
        subject="Test Subject",
        details="Test details",
        received_date=None,
        created_at=created_time,
        status="Open",
        issue_type="Technical",
        customer_name="Test Customer",
        province="Bangkok",
    )
    
    feed_item = transform_incident_to_feed_item(incident)
    
    expected_time = created_time.isoformat().replace("+00:00", "Z")
    assert feed_item.created_at == expected_time


def test_transform_incident_with_null_timestamps():
    """Test transformation when both timestamps are null, should use current time."""
    incident = Incident(
        id=6,
        incident_number="INC-006",
        subject="Test Subject",
        details="Test details",
        received_date=None,
        created_at=None,
        status="Open",
        issue_type="Technical",
        customer_name="Test Customer",
        province="Bangkok",
    )
    
    feed_item = transform_incident_to_feed_item(incident)
    
    # Should have a timestamp (current time)
    assert feed_item.created_at is not None
    assert "Z" in feed_item.created_at


def test_transform_incident_with_null_customer_name():
    """Test transformation when customer_name is null, should use 'Unknown'."""
    incident = Incident(
        id=7,
        incident_number="INC-007",
        subject="Test Subject",
        details="Test details",
        received_date=datetime(2024, 1, 1, 12, 0, 0, tzinfo=timezone.utc),
        created_at=datetime(2024, 1, 1, 10, 0, 0, tzinfo=timezone.utc),
        status="Open",
        issue_type="Technical",
        customer_name=None,
        province="Bangkok",
    )
    
    feed_item = transform_incident_to_feed_item(incident)
    
    assert feed_item.item_metadata["customer_name"] == "Unknown"


def test_transform_incident_with_null_status():
    """Test transformation when status is null, should use 'Unknown'."""
    incident = Incident(
        id=8,
        incident_number="INC-008",
        subject="Test Subject",
        details="Test details",
        received_date=datetime(2024, 1, 1, 12, 0, 0, tzinfo=timezone.utc),
        created_at=datetime(2024, 1, 1, 10, 0, 0, tzinfo=timezone.utc),
        status=None,
        issue_type="Technical",
        customer_name="Test Customer",
        province="Bangkok",
    )
    
    feed_item = transform_incident_to_feed_item(incident)
    
    assert feed_item.item_metadata["status"] == "Unknown"
    assert feed_item.priority == 5  # Default priority when status is null


def test_transform_incident_with_null_optional_fields():
    """Test transformation when optional fields are null, should not include them."""
    incident = Incident(
        id=9,
        incident_number="INC-009",
        subject="Test Subject",
        details="Test details",
        received_date=datetime(2024, 1, 1, 12, 0, 0, tzinfo=timezone.utc),
        created_at=datetime(2024, 1, 1, 10, 0, 0, tzinfo=timezone.utc),
        status="Open",
        issue_type="Technical",
        customer_name="Test Customer",
        province="Bangkok",
        contact_channel=None,
        product=None,
        reference_number=None,
    )
    
    feed_item = transform_incident_to_feed_item(incident)
    
    # Optional fields should not be in metadata when null
    assert "contact_channel" not in feed_item.item_metadata
    assert "product" not in feed_item.item_metadata
    assert "reference_number" not in feed_item.item_metadata


def test_determine_priority_urgent_status():
    """Test priority determination for urgent status."""
    incident = Incident(status="Urgent")
    assert determine_priority(incident) == 9


def test_determine_priority_critical_status():
    """Test priority determination for critical status."""
    incident = Incident(status="Critical")
    assert determine_priority(incident) == 9


def test_determine_priority_open_status():
    """Test priority determination for open status."""
    incident = Incident(status="Open")
    assert determine_priority(incident) == 5


def test_determine_priority_pending_status():
    """Test priority determination for pending status."""
    incident = Incident(status="Pending")
    assert determine_priority(incident) == 5


def test_determine_priority_closed_status():
    """Test priority determination for closed status."""
    incident = Incident(status="Closed")
    assert determine_priority(incident) == 2


def test_determine_priority_resolved_status():
    """Test priority determination for resolved status."""
    incident = Incident(status="Resolved")
    assert determine_priority(incident) == 2


def test_determine_priority_null_status():
    """Test priority determination when status is null."""
    incident = Incident(status=None)
    assert determine_priority(incident) == 5


def test_determine_priority_case_insensitive():
    """Test priority determination is case-insensitive."""
    incident_upper = Incident(status="URGENT")
    incident_lower = Incident(status="urgent")
    incident_mixed = Incident(status="Urgent")
    
    assert determine_priority(incident_upper) == 9
    assert determine_priority(incident_lower) == 9
    assert determine_priority(incident_mixed) == 9


def test_determine_feed_type_urgent_status():
    """Test feed type determination for urgent status."""
    incident = Incident(status="Urgent")
    assert determine_feed_type(incident) == FeedItemType.alert


def test_determine_feed_type_critical_status():
    """Test feed type determination for critical status."""
    incident = Incident(status="Critical")
    assert determine_feed_type(incident) == FeedItemType.alert


def test_determine_feed_type_normal_status():
    """Test feed type determination for normal status."""
    incident = Incident(status="Open")
    assert determine_feed_type(incident) == FeedItemType.highlight


def test_determine_feed_type_null_status():
    """Test feed type determination when status is null."""
    incident = Incident(status=None)
    assert determine_feed_type(incident) == FeedItemType.highlight


def test_determine_feed_type_case_insensitive():
    """Test feed type determination is case-insensitive."""
    incident_upper = Incident(status="CRITICAL")
    incident_lower = Incident(status="critical")
    incident_mixed = Incident(status="Critical")
    
    assert determine_feed_type(incident_upper) == FeedItemType.alert
    assert determine_feed_type(incident_lower) == FeedItemType.alert
    assert determine_feed_type(incident_mixed) == FeedItemType.alert
