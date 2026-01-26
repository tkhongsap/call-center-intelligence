"""
Property-based tests for alerts API consistency.

**Feature: backend-migration-fastapi, Property 1: API Response Format Consistency**
**Validates: Requirements 1.2, 3.2, 4.2**

Tests that the FastAPI backend returns responses with identical structure, data types,
and content format as the original system for alerts endpoints.
"""

import pytest
from hypothesis import given, strategies as st, settings, assume, HealthCheck
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from fastapi.testclient import TestClient
from unittest.mock import Mock, AsyncMock, patch
import json

from app.models.base import AlertType, AlertStatus, Severity, UserRole
from app.schemas.alert import (
    AlertResponse,
    AlertListResponse,
    AlertCountResponse,
    AlertDetailResponse,
    AlertSampleCase,
)


# ═══════════════════════════════════════════════════════════════════════════════
# Test Data Strategies
# ═══════════════════════════════════════════════════════════════════════════════

# Strategy for generating valid alert IDs
alert_ids = st.text(
    min_size=8,
    max_size=20,
    alphabet=st.characters(
        whitelist_categories=("Lu", "Ll", "Nd"), whitelist_characters="-_"
    ),
).map(lambda x: f"alert-{x}")

# Strategy for generating business unit names
business_units = st.one_of(
    st.none(),
    st.text(
        min_size=1,
        max_size=50,
        alphabet=st.characters(
            whitelist_categories=("Lu", "Ll", "Nd"), whitelist_characters=" -_"
        ),
    ),
)

# Strategy for generating alert titles and descriptions
alert_titles = st.text(min_size=1, max_size=200)
alert_descriptions = st.text(min_size=1, max_size=1000)

# Strategy for generating categories and channels
categories = st.one_of(
    st.none(),
    st.text(
        min_size=1,
        max_size=100,
        alphabet=st.characters(
            whitelist_categories=("Lu", "Ll", "Nd"), whitelist_characters=" -_"
        ),
    ),
)

channels = st.one_of(
    st.none(),
    st.sampled_from(["phone", "email", "chat", "social", "web"]),
)

# Strategy for generating numeric values
numeric_values = st.one_of(
    st.none(),
    st.floats(min_value=0.0, max_value=10000.0, allow_nan=False, allow_infinity=False),
)

# Strategy for generating timestamps (naive datetimes, then add timezone)
timestamps = st.datetimes(
    min_value=datetime(2020, 1, 1),
    max_value=datetime(2030, 12, 31),
).map(lambda dt: dt.replace(tzinfo=timezone.utc).isoformat().replace("+00:00", "Z"))

# Strategy for generating user IDs
user_ids = st.text(
    min_size=1,
    max_size=50,
    alphabet=st.characters(
        whitelist_categories=("Lu", "Ll", "Nd"), whitelist_characters="-_"
    ),
)

# Strategy for generating complete alert data
alert_data = st.fixed_dictionaries(
    {
        "id": alert_ids,
        "type": st.sampled_from(list(AlertType)),
        "severity": st.sampled_from(list(Severity)),
        "title": alert_titles,
        "description": alert_descriptions,
        "status": st.sampled_from(list(AlertStatus)),
        "business_unit": business_units,
        "category": categories,
        "channel": channels,
        "baseline_value": numeric_values,
        "current_value": numeric_values,
        "percentage_change": numeric_values,
        "acknowledged_by": st.one_of(st.none(), user_ids),
        "acknowledged_at": st.one_of(st.none(), timestamps),
        "created_at": timestamps,
        "updated_at": timestamps,
    }
)

# Strategy for generating pagination parameters
pagination_params = st.fixed_dictionaries(
    {
        "page": st.integers(min_value=1, max_value=100),
        "limit": st.integers(min_value=1, max_value=100),
        "sort_by": st.sampled_from(
            ["created_at", "severity", "status", "type", "updated_at"]
        ),
        "sort_order": st.sampled_from(["asc", "desc"]),
    }
)

# Strategy for generating filter parameters
filter_params = st.fixed_dictionaries(
    {
        "bu": st.one_of(st.none(), business_units),
        "severity": st.one_of(st.none(), st.sampled_from(list(Severity))),
        "status": st.one_of(st.none(), st.sampled_from(list(AlertStatus))),
        "type": st.one_of(st.none(), st.sampled_from(list(AlertType))),
        "start_date": st.one_of(st.none(), timestamps),
        "end_date": st.one_of(st.none(), timestamps),
    }
)

# Strategy for generating sample case data
sample_case_data = st.fixed_dictionaries(
    {
        "id": st.text(min_size=8, max_size=20).map(lambda x: f"case-{x}"),
        "case_number": st.text(min_size=5, max_size=20).map(lambda x: f"CS-{x}"),
        "summary": st.text(min_size=10, max_size=500),
        "severity": st.sampled_from(list(Severity)),
        "status": st.sampled_from(["open", "in_progress", "resolved", "closed"]),
        "business_unit": st.text(min_size=1, max_size=50),
        "category": st.text(min_size=1, max_size=100),
        "created_at": timestamps,
    }
)


class TestAlertsAPIConsistency:
    """Property-based tests for alerts API response format consistency."""

    @given(alert=alert_data)
    @settings(max_examples=100, deadline=5000)
    def test_alert_response_schema_consistency(self, alert):
        """
        **Property 1: API Response Format Consistency**
        **Validates: Requirements 1.2, 3.2, 4.2**

        For any valid alert data, the AlertResponse schema should consistently
        serialize the data with the same structure, data types, and format.
        """
        # Create AlertResponse from alert data
        response = AlertResponse.model_validate(alert)

        # Verify all required fields are present
        assert hasattr(response, "id")
        assert hasattr(response, "type")
        assert hasattr(response, "severity")
        assert hasattr(response, "title")
        assert hasattr(response, "description")
        assert hasattr(response, "status")
        assert hasattr(response, "created_at")
        assert hasattr(response, "updated_at")

        # Verify data types are consistent
        assert isinstance(response.id, str)
        assert isinstance(response.type, AlertType)
        assert isinstance(response.severity, Severity)
        assert isinstance(response.title, str)
        assert isinstance(response.description, str)
        assert isinstance(response.status, AlertStatus)
        assert isinstance(response.created_at, str)
        assert isinstance(response.updated_at, str)

        # Verify optional fields maintain consistency
        if alert["business_unit"] is not None:
            assert response.business_unit == alert["business_unit"]
            assert isinstance(response.business_unit, str)
        else:
            assert response.business_unit is None

        if alert["category"] is not None:
            assert response.category == alert["category"]
            assert isinstance(response.category, str)
        else:
            assert response.category is None

        if alert["channel"] is not None:
            assert response.channel == alert["channel"]
            assert isinstance(response.channel, str)
        else:
            assert response.channel is None

        # Verify numeric fields maintain precision and type
        if alert["baseline_value"] is not None:
            assert response.baseline_value == alert["baseline_value"]
            assert isinstance(response.baseline_value, (int, float))
        else:
            assert response.baseline_value is None

        if alert["current_value"] is not None:
            assert response.current_value == alert["current_value"]
            assert isinstance(response.current_value, (int, float))
        else:
            assert response.current_value is None

        if alert["percentage_change"] is not None:
            assert response.percentage_change == alert["percentage_change"]
            assert isinstance(response.percentage_change, (int, float))
        else:
            assert response.percentage_change is None

        # Verify acknowledgment fields
        if alert["acknowledged_by"] is not None:
            assert response.acknowledged_by == alert["acknowledged_by"]
            assert isinstance(response.acknowledged_by, str)
        else:
            assert response.acknowledged_by is None

        if alert["acknowledged_at"] is not None:
            assert response.acknowledged_at == alert["acknowledged_at"]
            assert isinstance(response.acknowledged_at, str)
        else:
            assert response.acknowledged_at is None

        # Verify timestamp format consistency
        assert response.created_at == alert["created_at"]
        assert response.updated_at == alert["updated_at"]

        # Verify JSON serialization consistency
        json_data = response.model_dump()
        assert isinstance(json_data, dict)
        assert json_data["id"] == alert["id"]
        assert json_data["type"] == alert["type"].value
        assert json_data["severity"] == alert["severity"].value
        assert json_data["status"] == alert["status"].value

    @given(
        alerts_list=st.lists(alert_data, min_size=0, max_size=20),
        pagination=pagination_params,
    )
    @settings(max_examples=100, deadline=5000)
    def test_alert_list_response_consistency(self, alerts_list, pagination):
        """
        **Property 1: API Response Format Consistency**
        **Validates: Requirements 1.2, 3.2, 4.2**

        For any list of alerts and pagination parameters, the AlertListResponse
        should maintain consistent structure and data types.
        """
        # Create alert responses
        alert_responses = [AlertResponse.model_validate(alert) for alert in alerts_list]

        # Calculate pagination info
        total = len(alerts_list)
        total_pages = max(1, (total + pagination["limit"] - 1) // pagination["limit"])

        # Create enhanced pagination info
        from app.schemas.serializers import EnhancedPaginationInfo

        pagination_info = EnhancedPaginationInfo(
            page=pagination["page"],
            limit=pagination["limit"],
            total=total,
            total_pages=total_pages,
        )

        # Create list response
        list_response = AlertListResponse(
            alerts=alert_responses,
            pagination=pagination_info,
        )

        # Verify response structure
        assert hasattr(list_response, "alerts")
        assert hasattr(list_response, "pagination")

        # Verify alerts list consistency
        assert isinstance(list_response.alerts, list)
        assert len(list_response.alerts) == len(alerts_list)

        for i, alert_response in enumerate(list_response.alerts):
            assert isinstance(alert_response, AlertResponse)
            assert alert_response.id == alerts_list[i]["id"]
            assert alert_response.type == alerts_list[i]["type"]
            assert alert_response.severity == alerts_list[i]["severity"]

        # Verify pagination consistency
        assert isinstance(list_response.pagination, EnhancedPaginationInfo)
        assert list_response.pagination.page == pagination["page"]
        assert list_response.pagination.limit == pagination["limit"]
        assert list_response.pagination.total == total
        assert list_response.pagination.total_pages == total_pages

        # Verify enhanced pagination fields in serialized output
        pagination_dict = list_response.pagination.model_dump()
        assert "has_previous" in pagination_dict
        assert "has_next" in pagination_dict
        assert "previous_page" in pagination_dict
        assert "next_page" in pagination_dict
        assert "start_index" in pagination_dict
        assert "end_index" in pagination_dict

        # Verify JSON serialization consistency
        json_data = list_response.model_dump()
        assert isinstance(json_data, dict)
        assert "alerts" in json_data
        assert "pagination" in json_data
        assert isinstance(json_data["alerts"], list)
        assert isinstance(json_data["pagination"], dict)

    @given(
        total=st.integers(min_value=0, max_value=1000),
        status_counts=st.fixed_dictionaries(
            {
                "active": st.integers(min_value=0, max_value=250),
                "acknowledged": st.integers(min_value=0, max_value=250),
                "resolved": st.integers(min_value=0, max_value=250),
                "dismissed": st.integers(min_value=0, max_value=250),
            }
        ),
        severity_counts=st.fixed_dictionaries(
            {
                "low": st.integers(min_value=0, max_value=250),
                "medium": st.integers(min_value=0, max_value=250),
                "high": st.integers(min_value=0, max_value=250),
                "critical": st.integers(min_value=0, max_value=250),
            }
        ),
        type_counts=st.dictionaries(
            st.sampled_from(["spike", "threshold", "urgency", "misclassification"]),
            st.integers(min_value=0, max_value=250),
            min_size=0,
            max_size=4,
        ),
    )
    @settings(max_examples=100, deadline=5000)
    def test_alert_count_response_consistency(
        self, total, status_counts, severity_counts, type_counts
    ):
        """
        **Property 1: API Response Format Consistency**
        **Validates: Requirements 1.2, 3.2, 4.2**

        For any alert count data, the AlertCountResponse should maintain
        consistent structure and data types.
        """
        from app.schemas.alert import AlertCountByStatus, AlertCountBySeverity

        # Create count response
        count_response = AlertCountResponse(
            total=total,
            by_status=AlertCountByStatus(**status_counts),
            by_severity=AlertCountBySeverity(**severity_counts),
            by_type=type_counts,
        )

        # Verify response structure
        assert hasattr(count_response, "total")
        assert hasattr(count_response, "by_status")
        assert hasattr(count_response, "by_severity")
        assert hasattr(count_response, "by_type")

        # Verify data types
        assert isinstance(count_response.total, int)
        assert count_response.total == total

        # Verify status counts structure
        assert hasattr(count_response.by_status, "active")
        assert hasattr(count_response.by_status, "acknowledged")
        assert hasattr(count_response.by_status, "resolved")
        assert hasattr(count_response.by_status, "dismissed")

        assert isinstance(count_response.by_status.active, int)
        assert isinstance(count_response.by_status.acknowledged, int)
        assert isinstance(count_response.by_status.resolved, int)
        assert isinstance(count_response.by_status.dismissed, int)

        assert count_response.by_status.active == status_counts["active"]
        assert count_response.by_status.acknowledged == status_counts["acknowledged"]
        assert count_response.by_status.resolved == status_counts["resolved"]
        assert count_response.by_status.dismissed == status_counts["dismissed"]

        # Verify severity counts structure
        assert hasattr(count_response.by_severity, "low")
        assert hasattr(count_response.by_severity, "medium")
        assert hasattr(count_response.by_severity, "high")
        assert hasattr(count_response.by_severity, "critical")

        assert isinstance(count_response.by_severity.low, int)
        assert isinstance(count_response.by_severity.medium, int)
        assert isinstance(count_response.by_severity.high, int)
        assert isinstance(count_response.by_severity.critical, int)

        assert count_response.by_severity.low == severity_counts["low"]
        assert count_response.by_severity.medium == severity_counts["medium"]
        assert count_response.by_severity.high == severity_counts["high"]
        assert count_response.by_severity.critical == severity_counts["critical"]

        # Verify type counts structure
        assert isinstance(count_response.by_type, dict)
        for type_name, count in type_counts.items():
            assert count_response.by_type[type_name] == count
            assert isinstance(count_response.by_type[type_name], int)

        # Verify JSON serialization consistency
        json_data = count_response.model_dump()
        assert isinstance(json_data, dict)
        assert json_data["total"] == total
        assert isinstance(json_data["by_status"], dict)
        assert isinstance(json_data["by_severity"], dict)
        assert isinstance(json_data["by_type"], dict)

    @given(
        alert=alert_data,
        sample_cases=st.lists(sample_case_data, min_size=0, max_size=10),
        contributing_phrases=st.lists(
            st.text(min_size=1, max_size=50), min_size=0, max_size=10
        ),
        time_window=st.one_of(st.none(), st.text(min_size=1, max_size=100)),
    )
    @settings(max_examples=100, deadline=5000)
    def test_alert_detail_response_consistency(
        self, alert, sample_cases, contributing_phrases, time_window
    ):
        """
        **Property 1: API Response Format Consistency**
        **Validates: Requirements 1.2, 3.2, 4.2**

        For any alert detail data, the AlertDetailResponse should maintain
        consistent structure and data types.
        """
        # Create alert response
        alert_response = AlertResponse.model_validate(alert)

        # Create sample case responses
        sample_case_responses = [
            AlertSampleCase.model_validate(case) for case in sample_cases
        ]

        # Create detail response
        detail_response = AlertDetailResponse(
            alert=alert_response,
            sample_cases=sample_case_responses,
            contributing_phrases=contributing_phrases,
            time_window=time_window,
        )

        # Verify response structure
        assert hasattr(detail_response, "alert")
        assert hasattr(detail_response, "sample_cases")
        assert hasattr(detail_response, "contributing_phrases")
        assert hasattr(detail_response, "time_window")

        # Verify alert consistency
        assert isinstance(detail_response.alert, AlertResponse)
        assert detail_response.alert.id == alert["id"]
        assert detail_response.alert.type == alert["type"]
        assert detail_response.alert.severity == alert["severity"]

        # Verify sample cases consistency
        assert isinstance(detail_response.sample_cases, list)
        assert len(detail_response.sample_cases) == len(sample_cases)

        for i, case_response in enumerate(detail_response.sample_cases):
            assert isinstance(case_response, AlertSampleCase)
            assert case_response.id == sample_cases[i]["id"]
            assert case_response.case_number == sample_cases[i]["case_number"]
            assert case_response.summary == sample_cases[i]["summary"]
            assert case_response.severity == sample_cases[i]["severity"]
            assert case_response.status == sample_cases[i]["status"]

        # Verify contributing phrases consistency
        assert isinstance(detail_response.contributing_phrases, list)
        assert len(detail_response.contributing_phrases) == len(contributing_phrases)
        for phrase in detail_response.contributing_phrases:
            assert isinstance(phrase, str)

        # Verify time window consistency
        if time_window is not None:
            assert detail_response.time_window == time_window
            assert isinstance(detail_response.time_window, str)
        else:
            assert detail_response.time_window is None

        # Verify JSON serialization consistency
        json_data = detail_response.model_dump()
        assert isinstance(json_data, dict)
        assert "alert" in json_data
        assert "sample_cases" in json_data
        assert "contributing_phrases" in json_data
        assert "time_window" in json_data

        assert isinstance(json_data["alert"], dict)
        assert isinstance(json_data["sample_cases"], list)
        assert isinstance(json_data["contributing_phrases"], list)

    def test_alerts_count_endpoint_consistency(self, client: TestClient):
        """
        **Property 1: API Response Format Consistency**
        **Validates: Requirements 1.2, 3.2, 4.2**

        The alerts count endpoint should always return a response with
        consistent structure and data types.
        """
        # Make request to alerts count endpoint
        response = client.get("/api/alerts/count")

        # Should return 200
        assert response.status_code == 200

        # Verify response structure consistency
        data = response.json()
        assert isinstance(data, dict)
        assert "total" in data
        assert "by_status" in data
        assert "by_severity" in data
        assert "by_type" in data

        # Verify total is integer
        assert isinstance(data["total"], int)
        assert data["total"] >= 0

        # Verify by_status structure
        by_status = data["by_status"]
        assert isinstance(by_status, dict)
        assert "active" in by_status
        assert "acknowledged" in by_status
        assert "resolved" in by_status
        assert "dismissed" in by_status

        for status_count in by_status.values():
            assert isinstance(status_count, int)
            assert status_count >= 0

        # Verify by_severity structure
        by_severity = data["by_severity"]
        assert isinstance(by_severity, dict)
        assert "low" in by_severity
        assert "medium" in by_severity
        assert "high" in by_severity
        assert "critical" in by_severity

        for severity_count in by_severity.values():
            assert isinstance(severity_count, int)
            assert severity_count >= 0

        # Verify by_type structure
        by_type = data["by_type"]
        assert isinstance(by_type, dict)
        for type_count in by_type.values():
            assert isinstance(type_count, int)
            assert type_count >= 0


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
