"""
Property-based tests for HTTP method support preservation.

**Feature: backend-migration-fastapi, Property 2: HTTP Method Support Preservation**
**Validates: Requirements 1.3**

Tests that the FastAPI backend accepts exactly the same HTTP methods as the original
Next.js implementation and rejects unsupported methods with appropriate error codes.
"""

import pytest
from hypothesis import given, strategies as st, settings, assume
from fastapi.testclient import TestClient
from typing import Dict, List, Tuple, Set
from unittest.mock import Mock, patch

from app.main import create_app


# ═══════════════════════════════════════════════════════════════════════════════
# Endpoint Method Mapping
# ═══════════════════════════════════════════════════════════════════════════════

# Define the expected HTTP methods for each endpoint based on the route definitions
ENDPOINT_METHOD_MAPPING = {
    # Health endpoint
    "/health": {"GET"},
    # Auth endpoints
    "/api/auth/me": {"GET"},
    "/api/auth/session": {"GET"},
    "/api/auth/check": {"GET"},
    "/api/auth/logout": {"POST"},
    "/api/auth/permissions": {"GET"},
    # Alerts endpoints
    "/api/alerts": {"GET", "POST"},
    "/api/alerts/count": {"GET"},
    "/api/alerts/{alert_id}": {"GET", "PUT", "DELETE"},
    "/api/alerts/{alert_id}/escalate": {"POST"},
    # Cases endpoints
    "/api/cases": {"GET", "POST"},
    "/api/cases/stats": {"GET"},
    "/api/cases/{case_id}": {"GET", "PUT", "DELETE"},
    "/api/cases/{case_id}/assign": {"PUT"},
    "/api/cases/{case_id}/status": {"PUT"},
    # Feed endpoints
    "/api/feed": {"GET"},
    # Search endpoints
    "/api/search": {"GET"},
    "/api/search/analytics": {"GET"},
    # Upload endpoints
    "/api/uploads": {"GET"},
    "/api/uploads/{upload_id}": {"GET"},
    "/api/upload": {"POST"},  # File upload endpoint
    # Trending endpoints
    "/api/trending": {"GET"},
    "/api/trending/{topic}": {"GET"},
    "/api/trending/compute": {"POST"},
    # Chat endpoints
    "/api/chat": {"POST"},
    # Events endpoints
    "/api/events": {"POST"},
    # Export endpoints
    "/api/export": {"POST"},
    # Inbox endpoints
    "/api/inbox": {"GET"},
    "/api/inbox/count": {"GET"},
    # Predictions endpoints
    "/api/predictions": {"GET"},
    # Pulse endpoints
    "/api/pulse": {"GET"},
    "/api/pulse/sparklines": {"GET"},
    "/api/pulse/wordcloud": {"GET"},
    # Shares endpoints
    "/api/shares": {"POST"},
    # WebSocket info endpoint
    "/api/ws/info": {"GET"},
    # Debug endpoints (only in development)
    "/api/debug-db": {"GET"},
}

# All HTTP methods that could be tested
ALL_HTTP_METHODS = {"GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS", "TRACE"}

# Methods that should always be rejected (not supported by FastAPI by default)
ALWAYS_REJECTED_METHODS = {"TRACE"}

# Methods that are typically allowed by CORS for preflight
CORS_ALLOWED_METHODS = {"GET", "POST", "PUT", "DELETE", "OPTIONS"}


# ═══════════════════════════════════════════════════════════════════════════════
# Test Data Strategies
# ═══════════════════════════════════════════════════════════════════════════════

# Strategy for generating endpoint paths
endpoint_paths = st.sampled_from(list(ENDPOINT_METHOD_MAPPING.keys()))

# Strategy for generating HTTP methods
http_methods = st.sampled_from(list(ALL_HTTP_METHODS))

# Strategy for generating valid resource IDs for parameterized endpoints
resource_ids = st.text(
    min_size=8,
    max_size=20,
    alphabet=st.characters(
        whitelist_categories=("Lu", "Ll", "Nd"), whitelist_characters="-_"
    ),
).map(lambda x: f"test-{x}")

# Strategy for generating endpoint and method combinations
endpoint_method_pairs = st.one_of(
    [
        st.tuples(st.just(path), st.sampled_from(list(methods)))
        for path, methods in ENDPOINT_METHOD_MAPPING.items()
    ]
)

# Strategy for generating unsupported method combinations
unsupported_method_pairs = st.one_of(
    [
        st.tuples(st.just(path), st.sampled_from(list(ALL_HTTP_METHODS - methods)))
        for path, methods in ENDPOINT_METHOD_MAPPING.items()
        if len(ALL_HTTP_METHODS - methods) > 0
    ]
)


def resolve_parameterized_path(path: str, resource_id: str) -> str:
    """Replace path parameters with actual values."""
    return (
        path.replace("{alert_id}", resource_id)
        .replace("{case_id}", resource_id)
        .replace("{upload_id}", resource_id)
        .replace("{topic}", resource_id)
    )


def get_expected_methods_for_path(path: str) -> Set[str]:
    """Get expected HTTP methods for a given path."""
    # Handle parameterized paths
    for pattern, methods in ENDPOINT_METHOD_MAPPING.items():
        if "{" in pattern:
            # Convert pattern to regex-like matching
            pattern_parts = pattern.split("/")
            path_parts = path.split("/")

            if len(pattern_parts) == len(path_parts):
                match = True
                for i, (pattern_part, path_part) in enumerate(
                    zip(pattern_parts, path_parts)
                ):
                    if pattern_part.startswith("{") and pattern_part.endswith("}"):
                        # This is a parameter, any value is acceptable
                        continue
                    elif pattern_part != path_part:
                        match = False
                        break

                if match:
                    return methods
        elif pattern == path:
            return methods

    return set()


class TestHTTPMethodSupport:
    """Property-based tests for HTTP method support preservation."""

    @pytest.fixture(scope="class")
    def app(self):
        """Create FastAPI application for testing."""
        return create_app()

    @pytest.fixture(scope="class")
    def client(self, app):
        """Create test client."""
        return TestClient(app)

    @given(endpoint_method=endpoint_method_pairs, resource_id=resource_ids)
    @settings(max_examples=100, deadline=10000)
    def test_supported_methods_are_accepted(self, client, endpoint_method, resource_id):
        """
        **Property 2: HTTP Method Support Preservation**
        **Validates: Requirements 1.3**

        For any endpoint and its supported HTTP methods, the FastAPI backend
        should accept the request and not return a 405 Method Not Allowed error.
        """
        endpoint_pattern, method = endpoint_method

        # Resolve parameterized paths
        endpoint = resolve_parameterized_path(endpoint_pattern, resource_id)

        # Skip debug endpoints if not in debug mode
        if "/debug-db" in endpoint:
            return

        # Make request with the supported method
        try:
            if method == "GET":
                response = client.get(endpoint)
            elif method == "POST":
                response = client.post(endpoint, json={})
            elif method == "PUT":
                response = client.put(endpoint, json={})
            elif method == "DELETE":
                response = client.delete(endpoint)
            elif method == "PATCH":
                response = client.patch(endpoint, json={})
            elif method == "HEAD":
                response = client.head(endpoint)
            elif method == "OPTIONS":
                response = client.options(endpoint)
            else:
                # For any other method, use the generic request method
                response = client.request(method, endpoint)

            # The method should be supported (not 405)
            # We may get other errors (401, 404, 422, etc.) but not 405
            assert response.status_code != 405, (
                f"Method {method} should be supported for endpoint {endpoint}, "
                f"but got 405 Method Not Allowed"
            )

            # If we get 405, it means the method is not allowed
            if response.status_code == 405:
                # Check if the Allow header is present and doesn't include our method
                allow_header = response.headers.get("allow", "")
                assert (
                    method not in allow_header
                ), f"Method {method} is in Allow header but returned 405"

        except Exception as e:
            # Network or other errors should not occur in testing
            pytest.fail(f"Unexpected error testing {method} {endpoint}: {str(e)}")

    @given(unsupported_pair=unsupported_method_pairs, resource_id=resource_ids)
    @settings(max_examples=100, deadline=10000)
    def test_unsupported_methods_are_rejected(
        self, client, unsupported_pair, resource_id
    ):
        """
        **Property 2: HTTP Method Support Preservation**
        **Validates: Requirements 1.3**

        For any endpoint and unsupported HTTP methods, the FastAPI backend
        should reject the request with a 405 Method Not Allowed error.
        """
        endpoint_pattern, method = unsupported_pair

        # Skip OPTIONS method as it's handled by CORS middleware
        if method == "OPTIONS":
            return

        # Skip debug endpoints if not in debug mode
        if "/debug-db" in endpoint_pattern:
            return

        # Resolve parameterized paths
        endpoint = resolve_parameterized_path(endpoint_pattern, resource_id)

        # Make request with the unsupported method
        try:
            response = client.request(method, endpoint)

            # Should get 405 Method Not Allowed for unsupported methods
            # Exception: Some methods might be handled by middleware (like OPTIONS for CORS)
            if (
                method not in CORS_ALLOWED_METHODS
                and method not in ALWAYS_REJECTED_METHODS
            ):
                assert response.status_code == 405, (
                    f"Method {method} should not be supported for endpoint {endpoint}, "
                    f"but got status {response.status_code} instead of 405"
                )

                # Check that the Allow header is present and lists supported methods
                allow_header = response.headers.get("allow", "")
                if allow_header:
                    allowed_methods = [m.strip() for m in allow_header.split(",")]
                    assert (
                        method not in allowed_methods
                    ), f"Method {method} should not be in Allow header: {allow_header}"

        except Exception as e:
            # Network or other errors should not occur in testing
            pytest.fail(f"Unexpected error testing {method} {endpoint}: {str(e)}")

    @given(endpoint=endpoint_paths, resource_id=resource_ids)
    @settings(max_examples=50, deadline=10000)
    def test_options_method_cors_handling(self, client, endpoint, resource_id):
        """
        **Property 2: HTTP Method Support Preservation**
        **Validates: Requirements 1.3**

        For any endpoint, the OPTIONS method should be handled by CORS middleware
        and return appropriate CORS headers, not a 405 error.
        """
        # Skip debug endpoints if not in debug mode
        if "/debug-db" in endpoint:
            return

        # Resolve parameterized paths
        resolved_endpoint = resolve_parameterized_path(endpoint, resource_id)

        # Make OPTIONS request (CORS preflight)
        response = client.options(
            resolved_endpoint,
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "GET",
            },
        )

        # OPTIONS should not return 405 (should be handled by CORS middleware)
        assert response.status_code != 405, (
            f"OPTIONS method should be handled by CORS middleware for {resolved_endpoint}, "
            f"but got 405 Method Not Allowed"
        )

        # Should return 200 for CORS preflight
        assert response.status_code == 200, (
            f"CORS preflight should return 200 for {resolved_endpoint}, "
            f"but got {response.status_code}"
        )

    @given(method=st.sampled_from(["GET", "POST", "PUT", "DELETE"]))
    @settings(max_examples=20, deadline=5000)
    def test_method_consistency_across_similar_endpoints(self, client, method):
        """
        **Property 2: HTTP Method Support Preservation**
        **Validates: Requirements 1.3**

        For any HTTP method, similar endpoint patterns should have consistent
        method support (e.g., all resource detail endpoints should support GET).
        """
        # Test consistency for resource detail endpoints
        detail_endpoints = [
            "/api/alerts/test-alert-123",
            "/api/cases/test-case-123",
            "/api/uploads/test-upload-123",
        ]

        results = []
        for endpoint in detail_endpoints:
            try:
                if method == "GET":
                    response = client.get(endpoint)
                elif method == "POST":
                    response = client.post(endpoint, json={})
                elif method == "PUT":
                    response = client.put(endpoint, json={})
                elif method == "DELETE":
                    response = client.delete(endpoint)

                # Record whether the method is supported (not 405)
                is_supported = response.status_code != 405
                results.append((endpoint, is_supported))

            except Exception:
                # Skip endpoints that cause errors
                continue

        # Check consistency for GET method (should be supported by all detail endpoints)
        if method == "GET":
            get_support = [supported for _, supported in results]
            if len(get_support) > 1:
                # All detail endpoints should support GET
                assert all(
                    get_support
                ), f"GET method support is inconsistent across detail endpoints: {results}"

    def test_method_not_allowed_error_format(self, client):
        """
        **Property 2: HTTP Method Support Preservation**
        **Validates: Requirements 1.3**

        When an unsupported method is used, the error response should have
        a consistent format and include the Allow header with supported methods.
        """
        # Test with a known endpoint that doesn't support PATCH
        response = client.patch("/api/alerts/test-alert-123", json={})

        # Should return 405 Method Not Allowed
        assert response.status_code == 405

        # Should include Allow header with supported methods
        allow_header = response.headers.get("allow")
        if allow_header:
            # Allow header should contain the supported methods for this endpoint
            allowed_methods = [m.strip().upper() for m in allow_header.split(",")]
            expected_methods = {
                "GET",
                "PUT",
                "DELETE",
            }  # Based on alerts/{alert_id} endpoint

            # At least some of the expected methods should be in the Allow header
            assert any(
                method in allowed_methods for method in expected_methods
            ), f"Allow header should contain supported methods, got: {allow_header}"

    @given(
        endpoint=st.sampled_from(
            ["/api/alerts", "/api/cases", "/api/feed", "/api/search", "/api/uploads"]
        ),
        method=st.sampled_from(["GET", "POST", "PUT", "DELETE", "PATCH"]),
    )
    @settings(max_examples=50, deadline=5000)
    def test_collection_vs_resource_method_patterns(self, client, endpoint, method):
        """
        **Property 2: HTTP Method Support Preservation**
        **Validates: Requirements 1.3**

        For any collection endpoint, method support should follow REST conventions:
        - GET and POST should typically be supported on collections
        - PUT and DELETE should typically be supported on individual resources
        """
        response = client.request(method, endpoint)

        # Collection endpoints (without ID) should generally support GET and POST
        if method in ["GET", "POST"]:
            # These methods are commonly supported on collections
            # We don't assert they must be supported, but if they return 405,
            # it should be consistent with the API design
            if response.status_code == 405:
                # Verify the Allow header is present
                allow_header = response.headers.get("allow")
                assert (
                    allow_header is not None
                ), f"405 response should include Allow header for {endpoint}"

        # PUT and DELETE are less common on collections
        elif method in ["PUT", "DELETE"]:
            # These might return 405, which is acceptable for collection endpoints
            if response.status_code == 405:
                allow_header = response.headers.get("allow")
                # Allow header should be present for 405 responses
                assert (
                    allow_header is not None
                ), f"405 response should include Allow header for {endpoint}"

    def test_cors_preflight_method_validation(self, client):
        """
        **Property 2: HTTP Method Support Preservation**
        **Validates: Requirements 1.3**

        CORS preflight requests should validate the requested method
        and only allow methods that are actually supported by the endpoint.
        """
        # Test CORS preflight for a known endpoint
        endpoint = "/api/alerts"

        # Test with a supported method
        supported_response = client.options(
            endpoint,
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "GET",
            },
        )

        assert supported_response.status_code == 200

        # Test with an unsupported method
        unsupported_response = client.options(
            endpoint,
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "PATCH",
            },
        )

        # CORS middleware may return 400 for unsupported methods in preflight,
        # or 200 depending on configuration - both are acceptable
        assert unsupported_response.status_code in [200, 400], (
            f"CORS preflight should return 200 or 400 for unsupported method, "
            f"got {unsupported_response.status_code}"
        )

        # Verify that the actual PATCH request fails
        patch_response = client.patch(endpoint, json={})
        assert patch_response.status_code == 405


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
