"""
Unit tests for cases endpoints.

Tests the CRUD operations, filtering, pagination, and business logic
for the cases API endpoints.
"""

import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient

from app.models.case import Case
from app.models.base import Channel, CaseStatus, Sentiment, Severity
from app.schemas.case import CaseCreate, CaseUpdate


def get_timestamp() -> str:
    """Get current timestamp in ISO format."""
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def test_get_cases_empty(client: TestClient):
    """Test getting cases when database is empty."""
    response = client.get("/api/cases/")
    assert response.status_code == 200

    data = response.json()
    assert "cases" in data
    assert "pagination" in data
    assert data["cases"] == []
    assert data["pagination"]["total"] == 0


def test_get_cases_stats_empty(client: TestClient):
    """Test getting case statistics when database is empty."""
    response = client.get("/api/cases/stats")
    assert response.status_code == 200

    data = response.json()
    assert "total" in data
    assert "by_status" in data
    assert "by_severity" in data
    assert "by_channel" in data
    assert "flags" in data
    # Don't assert exact count since database might have data from other tests
    assert isinstance(data["total"], int)
    assert data["total"] >= 0


def test_get_case_not_found(client: TestClient):
    """Test getting a non-existent case."""
    response = client.get("/api/cases/non-existent-id")
    assert response.status_code == 404

    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == "NOT_FOUND"


def test_create_case_without_auth(client: TestClient):
    """Test creating a case without authentication."""
    case_data = {
        "case_number": "CS-2024-0001",
        "channel": "phone",
        "status": "open",  # Include status for CaseBase validation
        "category": "Technical Issues",
        "sentiment": "negative",
        "severity": "high",
        "business_unit": "Business Unit A",
        "summary": "Customer unable to login to the system",
        "risk_flag": False,
        "needs_review_flag": True,
    }

    response = client.post("/api/cases/", json=case_data)
    # Should require authentication
    assert response.status_code == 401


def test_case_list_pagination(client: TestClient):
    """Test case list pagination parameters."""
    # Test with pagination parameters
    response = client.get("/api/cases/?page=1&limit=10")
    assert response.status_code == 200

    data = response.json()
    assert data["pagination"]["page"] == 1
    assert data["pagination"]["limit"] == 10


def test_case_list_filtering(client: TestClient):
    """Test case list filtering parameters."""
    # Test with various filters
    response = client.get(
        "/api/cases/?channel=phone&status=open&severity=high&category=Technical"
    )
    assert response.status_code == 200

    data = response.json()
    assert "cases" in data
    assert "pagination" in data


def test_case_list_search(client: TestClient):
    """Test case list search functionality."""
    response = client.get("/api/cases/?search=login")
    assert response.status_code == 200

    data = response.json()
    assert "cases" in data


def test_case_list_sorting(client: TestClient):
    """Test case list sorting."""
    response = client.get("/api/cases/?sort_by=created_at&sort_order=desc")
    assert response.status_code == 200

    data = response.json()
    assert "cases" in data


def test_update_case_without_auth(client: TestClient):
    """Test updating a case without authentication."""
    update_data = {"status": "in_progress", "summary": "Updated summary"}

    response = client.put("/api/cases/test-id", json=update_data)
    # Should require authentication
    assert response.status_code == 401


def test_delete_case_without_auth(client: TestClient):
    """Test deleting a case without authentication."""
    response = client.delete("/api/cases/test-id")
    # Should require authentication
    assert response.status_code == 401


def test_assign_case_without_auth(client: TestClient):
    """Test assigning a case without authentication."""
    assignment_data = {"assigned_to": "user-123", "agent_id": "agent-456"}

    response = client.put("/api/cases/test-id/assign", json=assignment_data)
    # Should require authentication
    assert response.status_code == 401


def test_update_case_status_without_auth(client: TestClient):
    """Test updating case status without authentication."""
    status_data = {"status": "resolved", "resolved_at": get_timestamp()}

    response = client.put("/api/cases/test-id/status", json=status_data)
    # Should require authentication
    assert response.status_code == 401


def test_case_schema_validation():
    """Test case schema validation."""
    # Test valid case creation data
    case_data = CaseCreate(
        case_number="CS-2024-0001",
        channel=Channel.phone,
        status=CaseStatus.open,  # Include status for CaseBase validation
        category="Technical Issues",
        sentiment=Sentiment.negative,
        severity=Severity.high,
        business_unit="Business Unit A",
        summary="Customer unable to login to the system",
        risk_flag=False,
        needs_review_flag=True,
    )

    assert case_data.case_number == "CS-2024-0001"
    assert case_data.channel == Channel.phone
    assert case_data.severity == Severity.high

    # Test case update data
    update_data = CaseUpdate(
        status=CaseStatus.in_progress, summary="Updated summary", assigned_to="user-123"
    )

    assert update_data.status == CaseStatus.in_progress
    assert update_data.summary == "Updated summary"
    assert update_data.assigned_to == "user-123"


def test_case_model_creation():
    """Test case model creation."""
    timestamp = get_timestamp()

    case = Case(
        id="case-123",
        case_number="CS-2024-0001",
        channel=Channel.phone,
        status=CaseStatus.open,
        category="Technical Issues",
        sentiment=Sentiment.negative,
        severity=Severity.high,
        business_unit="Business Unit A",
        summary="Customer unable to login to the system",
        risk_flag=False,
        needs_review_flag=True,
        created_at=timestamp,
        updated_at=timestamp,
    )

    assert case.id == "case-123"
    assert case.case_number == "CS-2024-0001"
    assert case.channel == Channel.phone
    assert case.status == CaseStatus.open
    assert case.severity == Severity.high
    assert case.business_unit == "Business Unit A"
    assert case.risk_flag is False
    assert case.needs_review_flag is True


def test_case_enum_values():
    """Test that case enums have correct values."""
    # Test Channel enum
    assert Channel.phone.value == "phone"
    assert Channel.email.value == "email"
    assert Channel.line.value == "line"
    assert Channel.web.value == "web"

    # Test CaseStatus enum
    assert CaseStatus.open.value == "open"
    assert CaseStatus.in_progress.value == "in_progress"
    assert CaseStatus.resolved.value == "resolved"
    assert CaseStatus.closed.value == "closed"

    # Test Severity enum
    assert Severity.low.value == "low"
    assert Severity.medium.value == "medium"
    assert Severity.high.value == "high"
    assert Severity.critical.value == "critical"

    # Test Sentiment enum
    assert Sentiment.positive.value == "positive"
    assert Sentiment.neutral.value == "neutral"
    assert Sentiment.negative.value == "negative"
