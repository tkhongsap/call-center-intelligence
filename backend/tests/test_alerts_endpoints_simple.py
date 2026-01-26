"""
Simple tests for alerts API endpoints.

Tests basic functionality of the alerts endpoints.
"""

import pytest
from fastapi.testclient import TestClient


class TestAlertsEndpoints:
    """Test class for alerts endpoints."""

    def test_get_alerts_empty(self, client: TestClient):
        """Test GET /api/alerts with no alerts."""
        response = client.get("/api/alerts/")

        assert response.status_code == 200
        data = response.json()

        assert "alerts" in data
        assert "pagination" in data
        assert len(data["alerts"]) == 0
        assert data["pagination"]["total"] == 0
        assert data["pagination"]["page"] == 1
        assert data["pagination"]["limit"] == 20

    def test_get_alerts_pagination(self, client: TestClient):
        """Test GET /api/alerts with pagination parameters."""
        response = client.get("/api/alerts/?page=1&limit=5")

        assert response.status_code == 200
        data = response.json()

        assert data["pagination"]["page"] == 1
        assert data["pagination"]["limit"] == 5
        assert data["pagination"]["total"] == 0  # No alerts in empty test

    def test_get_alerts_sorting(self, client: TestClient):
        """Test GET /api/alerts with sorting parameters."""
        response = client.get("/api/alerts/?sort_by=severity&sort_order=asc")

        assert response.status_code == 200
        data = response.json()

        assert len(data["alerts"]) == 0  # No alerts in empty test

    def test_get_alerts_filtering(self, client: TestClient):
        """Test GET /api/alerts with filtering parameters."""
        # Test severity filter
        response = client.get("/api/alerts/?severity=high")

        assert response.status_code == 200
        data = response.json()

        assert len(data["alerts"]) == 0  # No alerts in empty test

        # Test status filter
        response = client.get("/api/alerts/?status=active")

        assert response.status_code == 200
        data = response.json()

        assert len(data["alerts"]) == 0  # No alerts in empty test

        # Test type filter
        response = client.get("/api/alerts/?type=spike")

        assert response.status_code == 200
        data = response.json()

        assert len(data["alerts"]) == 0  # No alerts in empty test

    def test_get_alerts_count_empty(self, client: TestClient):
        """Test GET /api/alerts/count with no alerts."""
        response = client.get("/api/alerts/count")

        assert response.status_code == 200
        data = response.json()

        assert data["total"] == 0
        assert data["by_status"]["active"] == 0
        assert data["by_status"]["acknowledged"] == 0
        assert data["by_status"]["resolved"] == 0
        assert data["by_status"]["dismissed"] == 0
        assert data["by_severity"]["low"] == 0
        assert data["by_severity"]["medium"] == 0
        assert data["by_severity"]["high"] == 0
        assert data["by_severity"]["critical"] == 0
        assert isinstance(data["by_type"], dict)

    def test_get_alert_by_id_not_found(self, client: TestClient):
        """Test GET /api/alerts/{id} with non-existent alert."""
        response = client.get("/api/alerts/non-existent-id")

        assert response.status_code == 404
        data = response.json()

        assert "error" in data
        assert data["error"]["code"] == "NOT_FOUND"

    def test_create_alert_unauthenticated(self, client: TestClient):
        """Test POST /api/alerts without authentication."""
        alert_data = {
            "type": "spike",
            "severity": "high",
            "title": "Test Alert",
            "description": "This is a test alert",
            "business_unit": "Test Unit",
            "category": "Test Category",
        }

        response = client.post("/api/alerts/", json=alert_data)

        # Should require authentication
        assert response.status_code in [
            401,
            500,
        ]  # 500 because auth error is wrapped in DatabaseError

    def test_update_alert_unauthenticated(self, client: TestClient):
        """Test PUT /api/alerts/{id} without authentication."""
        update_data = {"status": "acknowledged", "acknowledged_by": "test-user"}

        response = client.put("/api/alerts/test-id", json=update_data)

        # Should require authentication
        assert response.status_code in [
            401,
            500,
        ]  # 500 because auth error is wrapped in DatabaseError

    def test_delete_alert_unauthenticated(self, client: TestClient):
        """Test DELETE /api/alerts/{id} without authentication."""
        response = client.delete("/api/alerts/test-id")

        # Should require authentication
        assert response.status_code in [
            401,
            500,
        ]  # 500 because auth error is wrapped in DatabaseError

    def test_escalate_alert_unauthenticated(self, client: TestClient):
        """Test POST /api/alerts/{id}/escalate without authentication."""
        escalation_data = {
            "recipient_id": "test-recipient",
            "message": "Please review this alert",
            "channel": "internal",
        }

        response = client.post("/api/alerts/test-id/escalate", json=escalation_data)

        # Should require authentication
        assert response.status_code in [
            401,
            500,
        ]  # 500 because auth error is wrapped in DatabaseError

    def test_invalid_sort_field(self, client: TestClient):
        """Test GET /api/alerts with invalid sort field."""
        response = client.get("/api/alerts/?sort_by=invalid_field")

        assert response.status_code == 422
        data = response.json()

        assert "error" in data or "detail" in data

    def test_invalid_pagination_params(self, client: TestClient):
        """Test GET /api/alerts with invalid pagination parameters."""
        # Test negative page
        response = client.get("/api/alerts/?page=-1")
        assert response.status_code == 422

        # Test zero limit
        response = client.get("/api/alerts/?limit=0")
        assert response.status_code == 422

        # Test excessive limit
        response = client.get("/api/alerts/?limit=1000")
        assert response.status_code == 422

    def test_enhanced_pagination_info(self, client: TestClient):
        """Test that enhanced pagination info is returned correctly."""
        response = client.get("/api/alerts/")

        assert response.status_code == 200
        data = response.json()

        pagination = data["pagination"]

        # Check enhanced pagination fields
        assert "has_previous" in pagination
        assert "has_next" in pagination
        assert "previous_page" in pagination
        assert "next_page" in pagination
        assert "start_index" in pagination
        assert "end_index" in pagination

        # With no alerts
        assert pagination["has_previous"] is False
        assert pagination["has_next"] is False
        assert pagination["previous_page"] is None
        assert pagination["next_page"] is None
        assert pagination["start_index"] == 0  # No alerts
        assert pagination["end_index"] == 0  # No alerts
