"""
Property-based test for input validation consistency.

**Feature: backend-migration-fastapi, Property 13: Input Validation Error Consistency**

This test validates that for any invalid input data, the FastAPI backend returns 
validation errors with the same structure, error codes, and messages as the 
original system would.

**Validates: Requirements 8.4, 8.5**
"""

import pytest
from hypothesis import given, strategies as st, settings, assume
from hypothesis.strategies import composite
from fastapi.testclient import TestClient
from typing import Dict, Any, List, Optional
import json
from datetime import datetime, timedelta

from main import app
from app.models.base import (
    Channel, CaseStatus, Sentiment, Severity, AlertType, AlertStatus,
    UserRole, FeedItemType, ShareType, ShareChannel, UploadStatus
)


# Test client setup
client = TestClient(app)


# ═══════════════════════════════════════════════════════════════════════════════
# Strategy Generators for Invalid Data
# ═══════════════════════════════════════════════════════════════════════════════

@composite
def invalid_string_data(draw):
    """Generate invalid string data."""
    return draw(st.one_of(
        st.none(),  # None values
        st.just(""),  # Empty strings
        st.text(min_size=0, max_size=0),  # Empty text
        st.text().filter(lambda x: len(x.strip()) == 0),  # Whitespace only
        st.text(min_size=1001),  # Too long strings (for summary fields)
        st.text(min_size=201).filter(lambda x: len(x) > 200),  # Too long for titles
        st.integers(),  # Wrong type (integer instead of string)
        st.floats(),  # Wrong type (float instead of string)
        st.lists(st.text()),  # Wrong type (list instead of string)
        st.dictionaries(st.text(), st.text()),  # Wrong type (dict instead of string)
    ))


@composite
def invalid_enum_data(draw, enum_class):
    """Generate invalid enum data."""
    valid_values = [e.value for e in enum_class]
    return draw(st.one_of(
        st.text().filter(lambda x: x not in valid_values),  # Invalid enum values
        st.integers(),  # Wrong type
        st.floats(),  # Wrong type
        st.none(),  # None when required
        st.just(""),  # Empty string
        st.just("INVALID_VALUE"),  # Clearly invalid value
    ))


@composite
def invalid_pagination_data(draw):
    """Generate invalid pagination parameters."""
    return draw(st.one_of(
        st.integers(max_value=0),  # Zero or negative page/limit
        st.integers(min_value=101),  # Limit too high (max 100)
        st.floats(),  # Wrong type
        st.text(),  # Wrong type
        st.none(),  # None when integer expected
    ))


@composite
def invalid_date_data(draw):
    """Generate invalid date strings."""
    return draw(st.one_of(
        st.text().filter(lambda x: x not in ["", None] and not _is_valid_iso_date(x)),
        st.just("invalid-date"),
        st.just("2024-13-45"),  # Invalid date components
        st.just("not-a-date"),
        st.integers(),  # Wrong type
        st.floats(),  # Wrong type
    ))


def _is_valid_iso_date(date_str: str) -> bool:
    """Check if string is valid ISO date."""
    try:
        datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        return True
    except (ValueError, AttributeError):
        return False


@composite
def invalid_case_data(draw):
    """Generate invalid case creation data."""
    base_valid_case = {
        "case_number": "CS-2024-001",
        "channel": "phone",
        "status": "open",
        "category": "Technical Issues",
        "sentiment": "neutral",
        "severity": "medium",
        "business_unit": "Business Unit A",
        "summary": "Valid summary"
    }
    
    # Choose which field to make invalid
    field_to_invalidate = draw(st.sampled_from([
        "case_number", "channel", "status", "category", "sentiment", 
        "severity", "business_unit", "summary"
    ]))
    
    invalid_case = base_valid_case.copy()
    
    if field_to_invalidate in ["channel", "status", "sentiment", "severity"]:
        # Enum fields
        enum_map = {
            "channel": Channel,
            "status": CaseStatus,
            "sentiment": Sentiment,
            "severity": Severity
        }
        invalid_case[field_to_invalidate] = draw(invalid_enum_data(enum_map[field_to_invalidate]))
    else:
        # String fields
        invalid_case[field_to_invalidate] = draw(invalid_string_data())
    
    return invalid_case, field_to_invalidate


@composite
def invalid_alert_data(draw):
    """Generate invalid alert creation data."""
    base_valid_alert = {
        "type": "spike",
        "severity": "high",
        "title": "Valid Alert Title",
        "description": "Valid alert description",
        "business_unit": "Business Unit A"
    }
    
    field_to_invalidate = draw(st.sampled_from([
        "type", "severity", "title", "description", "business_unit"
    ]))
    
    invalid_alert = base_valid_alert.copy()
    
    if field_to_invalidate in ["type", "severity"]:
        enum_map = {
            "type": AlertType,
            "severity": Severity
        }
        invalid_alert[field_to_invalidate] = draw(invalid_enum_data(enum_map[field_to_invalidate]))
    else:
        invalid_alert[field_to_invalidate] = draw(invalid_string_data())
    
    return invalid_alert, field_to_invalidate


# ═══════════════════════════════════════════════════════════════════════════════
# Property Tests
# ═══════════════════════════════════════════════════════════════════════════════

@given(invalid_case_data())
@settings(max_examples=100, deadline=None)
def test_case_validation_error_consistency(invalid_data_tuple):
    """
    Property: Input validation errors for cases should be consistent.
    
    For any invalid case data, the API should return a 422 status code
    with a structured error response containing field-specific validation messages.
    """
    invalid_case, invalid_field = invalid_data_tuple
    
    # Skip if the invalid data is actually valid (edge case)
    assume(invalid_case[invalid_field] is not None or invalid_field in ["case_number", "channel", "status", "category", "sentiment", "severity", "business_unit", "summary"])
    
    response = client.post("/api/cases", json=invalid_case)
    
    # Should return validation error
    assert response.status_code == 422, f"Expected 422 for invalid {invalid_field}, got {response.status_code}"
    
    error_data = response.json()
    
    # Validate error response structure
    assert "detail" in error_data, "Error response should contain 'detail' field"
    
    # Should be a list of validation errors
    assert isinstance(error_data["detail"], list), "Detail should be a list of errors"
    assert len(error_data["detail"]) > 0, "Should have at least one validation error"
    
    # Each error should have required fields
    for error in error_data["detail"]:
        assert "type" in error, "Each error should have a 'type' field"
        assert "msg" in error, "Each error should have a 'msg' field"
        assert "loc" in error, "Each error should have a 'loc' field"
        
        # Location should be a list indicating the field path
        assert isinstance(error["loc"], list), "Location should be a list"
        assert len(error["loc"]) > 0, "Location should not be empty"


@given(invalid_alert_data())
@settings(max_examples=100, deadline=None)
def test_alert_validation_error_consistency(invalid_data_tuple):
    """
    Property: Input validation errors for alerts should be consistent.
    
    For any invalid alert data, the API should return a 422 status code
    with a structured error response.
    """
    invalid_alert, invalid_field = invalid_data_tuple
    
    # Skip if the invalid data is actually valid
    assume(invalid_alert[invalid_field] is not None or invalid_field in ["type", "severity", "title", "description"])
    
    response = client.post("/api/alerts", json=invalid_alert)
    
    # Should return validation error
    assert response.status_code == 422, f"Expected 422 for invalid {invalid_field}, got {response.status_code}"
    
    error_data = response.json()
    
    # Validate error response structure
    assert "detail" in error_data, "Error response should contain 'detail' field"
    assert isinstance(error_data["detail"], list), "Detail should be a list of errors"
    assert len(error_data["detail"]) > 0, "Should have at least one validation error"


@given(
    page=invalid_pagination_data(),
    limit=invalid_pagination_data()
)
@settings(max_examples=50, deadline=None)
def test_pagination_validation_consistency(page, limit):
    """
    Property: Pagination parameter validation should be consistent.
    
    For any invalid pagination parameters, endpoints should return
    consistent validation errors.
    """
    # Test with cases endpoint
    params = {}
    if page is not None:
        params["page"] = page
    if limit is not None:
        params["limit"] = limit
    
    # Skip if both parameters are valid
    assume(not (isinstance(page, int) and page > 0 and isinstance(limit, int) and 1 <= limit <= 100))
    
    response = client.get("/api/cases", params=params)
    
    # Should return validation error for invalid pagination
    if not (isinstance(page, int) and page > 0) or not (isinstance(limit, int) and 1 <= limit <= 100):
        assert response.status_code == 422, f"Expected 422 for invalid pagination, got {response.status_code}"
        
        error_data = response.json()
        assert "detail" in error_data, "Error response should contain 'detail' field"


@given(
    start_date=invalid_date_data(),
    end_date=invalid_date_data()
)
@settings(max_examples=50, deadline=None)
def test_date_range_validation_consistency(start_date, end_date):
    """
    Property: Date range parameter validation should be consistent.
    
    For any invalid date parameters, endpoints should return
    consistent validation errors.
    """
    params = {}
    if start_date is not None:
        params["start_date"] = start_date
    if end_date is not None:
        params["end_date"] = end_date
    
    # Skip if dates are valid or None
    assume(start_date is not None and not _is_valid_iso_date(str(start_date)))
    
    response = client.get("/api/cases", params=params)
    
    # Should return validation error for invalid dates
    assert response.status_code == 422, f"Expected 422 for invalid date, got {response.status_code}"
    
    error_data = response.json()
    assert "detail" in error_data, "Error response should contain 'detail' field"


@given(
    sort_by=st.text().filter(lambda x: x not in ["created_at", "updated_at", "severity", "status", "case_number", "category", "business_unit"]),
    sort_order=st.text().filter(lambda x: x not in ["asc", "desc"])
)
@settings(max_examples=50, deadline=None)
def test_sorting_validation_consistency(sort_by, sort_order):
    """
    Property: Sorting parameter validation should be consistent.
    
    For any invalid sorting parameters, endpoints should return
    consistent validation errors.
    """
    params = {
        "sort_by": sort_by,
        "sort_order": sort_order
    }
    
    response = client.get("/api/cases", params=params)
    
    # Should return validation error for invalid sorting
    assert response.status_code == 422, f"Expected 422 for invalid sorting, got {response.status_code}"
    
    error_data = response.json()
    assert "detail" in error_data, "Error response should contain 'detail' field"


@given(st.dictionaries(st.text(), st.one_of(st.none(), st.text(), st.integers(), st.floats(), st.lists(st.text()))))
@settings(max_examples=50, deadline=None)
def test_json_payload_validation_consistency(invalid_payload):
    """
    Property: JSON payload validation should be consistent across endpoints.
    
    For any malformed or invalid JSON payload, endpoints should return
    consistent validation errors.
    """
    # Test with various endpoints
    endpoints = ["/api/cases", "/api/alerts"]
    
    for endpoint in endpoints:
        response = client.post(endpoint, json=invalid_payload)
        
        # Should return either 422 (validation error) or 400 (bad request)
        assert response.status_code in [400, 422], f"Expected 400 or 422 for {endpoint}, got {response.status_code}"
        
        if response.status_code == 422:
            error_data = response.json()
            assert "detail" in error_data, f"Error response for {endpoint} should contain 'detail' field"


@given(
    field_name=st.sampled_from(["business_unit", "category", "summary", "customer_name"]),
    field_value=st.one_of(
        st.text(min_size=1001),  # Too long
        st.just(""),  # Empty
        st.none(),  # None
        st.integers(),  # Wrong type
    )
)
@settings(max_examples=50, deadline=None)
def test_field_length_validation_consistency(field_name, field_value):
    """
    Property: Field length validation should be consistent.
    
    For any field with length constraints, validation errors should be
    consistent when those constraints are violated.
    """
    base_case = {
        "case_number": "CS-2024-001",
        "channel": "phone",
        "status": "open",
        "category": "Technical Issues",
        "sentiment": "neutral",
        "severity": "medium",
        "business_unit": "Business Unit A",
        "summary": "Valid summary"
    }
    
    # Set the invalid field value
    base_case[field_name] = field_value
    
    response = client.post("/api/cases", json=base_case)
    
    # Should return validation error for invalid field
    if field_value is None and field_name in ["category", "business_unit", "summary"]:
        # Required fields
        assert response.status_code == 422, f"Expected 422 for missing required field {field_name}"
    elif isinstance(field_value, str) and len(field_value) > 1000 and field_name == "summary":
        # Summary too long
        assert response.status_code == 422, f"Expected 422 for too long {field_name}"
    elif isinstance(field_value, str) and len(field_value.strip()) == 0 and field_name in ["category", "business_unit", "summary"]:
        # Empty required fields
        assert response.status_code == 422, f"Expected 422 for empty required field {field_name}"
    elif not isinstance(field_value, str) and field_value is not None:
        # Wrong type
        assert response.status_code == 422, f"Expected 422 for wrong type in field {field_name}"


def test_error_response_format_consistency():
    """
    Property: Error response format should be consistent across all validation failures.
    
    All validation errors should follow the same response structure.
    """
    # Test various invalid requests
    test_cases = [
        ("/api/cases", {"invalid": "data"}),
        ("/api/alerts", {"invalid": "data"}),
        ("/api/cases", {"case_number": ""}),
        ("/api/alerts", {"type": "invalid_type"}),
    ]
    
    for endpoint, payload in test_cases:
        response = client.post(endpoint, json=payload)
        
        if response.status_code == 422:
            error_data = response.json()
            
            # Validate consistent error structure
            assert "detail" in error_data, f"Error response for {endpoint} should have 'detail'"
            assert isinstance(error_data["detail"], list), f"Detail should be list for {endpoint}"
            
            for error in error_data["detail"]:
                # Each error should have consistent structure
                required_fields = ["type", "msg", "loc"]
                for field in required_fields:
                    assert field in error, f"Error should have '{field}' field for {endpoint}"
                
                # Location should be meaningful
                assert isinstance(error["loc"], list), f"Location should be list for {endpoint}"
                assert len(error["loc"]) > 0, f"Location should not be empty for {endpoint}"
                
                # Message should be descriptive
                assert isinstance(error["msg"], str), f"Message should be string for {endpoint}"
                assert len(error["msg"]) > 0, f"Message should not be empty for {endpoint}"


if __name__ == "__main__":
    # Run the property tests
    pytest.main([__file__, "-v"])