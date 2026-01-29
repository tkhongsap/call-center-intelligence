"""
Property Test: CORS Configuration

**Feature: backend-migration-fastapi, Property 19: CORS Configuration Consistency**

Tests that the FastAPI backend properly handles CORS requests from the Next.js frontend
with identical behavior to the original system.

**Validates: Requirements 3.1**
"""

import pytest
from hypothesis import given, strategies as st, settings
from fastapi.testclient import TestClient

from main import create_app
from app.core.config import get_settings


class TestCORSConfiguration:
    """Property-based tests for CORS configuration."""

    @pytest.fixture(scope="class")
    def app(self):
        """Create FastAPI application for testing."""
        return create_app()

    @pytest.fixture(scope="class")
    def client(self, app):
        """Create test client."""
        return TestClient(app)

    @given(
        origin=st.sampled_from(
            [
                "http://localhost:3000",
                "http://127.0.0.1:3000",
            ]
        ),
        method=st.sampled_from(["GET", "POST", "PUT", "DELETE", "OPTIONS"]),
        endpoint=st.sampled_from(
            [
                "/health",
                "/api/alerts",
                "/api/cases",
                "/api/feed",
                "/api/search",
                "/api/uploads",
            ]
        ),
    )
    @settings(max_examples=100, deadline=5000)
    def test_cors_headers_for_allowed_origins(self, client, origin, method, endpoint):
        """
        Property: For any allowed origin and HTTP method, CORS headers should be properly set.

        This test validates that:
        1. Allowed origins receive proper CORS headers
        2. All supported HTTP methods are handled correctly
        3. Preflight OPTIONS requests are handled properly
        """
        # Test preflight request (OPTIONS)
        preflight_response = client.options(
            endpoint,
            headers={
                "Origin": origin,
                "Access-Control-Request-Method": method,
                "Access-Control-Request-Headers": "Content-Type, Authorization",
            },
        )

        # Preflight should succeed for allowed origins
        assert preflight_response.status_code == 200

        # Check required CORS headers in preflight response
        headers = {k.lower(): v for k, v in preflight_response.headers.items()}

        # Access-Control-Allow-Origin should be set
        assert "access-control-allow-origin" in headers
        allowed_origin = headers["access-control-allow-origin"]
        assert allowed_origin == origin or allowed_origin == "*"

        # Access-Control-Allow-Methods should include the requested method
        if "access-control-allow-methods" in headers:
            allowed_methods = headers["access-control-allow-methods"].upper()
            assert method in allowed_methods or "*" in allowed_methods

        # Access-Control-Allow-Credentials should be set to true
        if "access-control-allow-credentials" in headers:
            assert headers["access-control-allow-credentials"].lower() == "true"

    @given(
        origin=st.sampled_from(
            [
                "http://malicious-site.com",
                "https://evil.example.com",
                "http://localhost:4000",  # Different port
                "https://different-domain.com",
                "https://localhost:3000",  # HTTPS not allowed
                "https://127.0.0.1:3000",  # HTTPS not allowed
            ]
        ),
        method=st.sampled_from(["GET", "POST", "PUT", "DELETE"]),
        endpoint=st.sampled_from(
            [
                "/health",
                "/api/alerts",
                "/api/cases",
            ]
        ),
    )
    @settings(max_examples=50, deadline=5000)
    def test_cors_rejection_for_disallowed_origins(
        self, client, origin, method, endpoint
    ):
        """
        Property: For any disallowed origin, CORS should either reject or not set origin header.

        This test validates that:
        1. Disallowed origins don't receive permissive CORS headers
        2. Security is maintained by not allowing arbitrary origins
        """
        settings = get_settings()
        allowed_origins = settings.cors_origins_list

        # Skip if the origin is actually allowed (edge case)
        if origin in allowed_origins:
            return

        # Test preflight request
        preflight_response = client.options(
            endpoint,
            headers={
                "Origin": origin,
                "Access-Control-Request-Method": method,
            },
        )

        # Check CORS headers
        headers = {k.lower(): v for k, v in preflight_response.headers.items()}

        # Either no Access-Control-Allow-Origin header, or it doesn't match the disallowed origin
        if "access-control-allow-origin" in headers:
            allowed_origin = headers["access-control-allow-origin"]
            # Should not explicitly allow the disallowed origin
            assert allowed_origin != origin or allowed_origin == "*"

    @given(
        custom_header=st.text(
            alphabet=st.characters(whitelist_categories=("Lu", "Ll", "Nd", "Pd")),
            min_size=1,
            max_size=50,
        ).filter(lambda x: x.isascii() and not x.startswith("access-control")),
        header_value=st.text(min_size=1, max_size=100).filter(lambda x: x.isascii()),
    )
    @settings(max_examples=50, deadline=5000)
    def test_cors_custom_headers_handling(self, client, custom_header, header_value):
        """
        Property: Custom headers in CORS requests should be handled consistently.

        This test validates that:
        1. Custom headers are properly handled in preflight requests
        2. The CORS configuration allows necessary headers
        """
        origin = "http://localhost:3000"  # Use allowed origin

        # Test preflight with custom header
        preflight_response = client.options(
            "/health",
            headers={
                "Origin": origin,
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": f"Content-Type, {custom_header}",
            },
        )

        # Should handle preflight request
        assert preflight_response.status_code == 200

        headers = {k.lower(): v for k, v in preflight_response.headers.items()}

        # Should have CORS headers
        assert "access-control-allow-origin" in headers

        # If Access-Control-Allow-Headers is present, it should handle the request
        # (FastAPI's CORS middleware allows all headers by default with allow_headers=["*"])
        if "access-control-allow-headers" in headers:
            allowed_headers = headers["access-control-allow-headers"].lower()
            # Either allows all headers or specifically includes our custom header
            assert "*" in allowed_headers or custom_header.lower() in allowed_headers

    @given(
        endpoint=st.sampled_from(
            [
                "/health",
                "/api/alerts",
                "/api/cases",
                "/api/feed",
                "/api/search",
                "/api/uploads",
                "/api/trending",
                "/api/chat",
            ]
        )
    )
    @settings(max_examples=30, deadline=5000)
    def test_cors_actual_request_after_preflight(self, client, endpoint):
        """
        Property: Actual requests after successful preflight should include CORS headers.

        This test validates that:
        1. Actual requests (not just preflight) include CORS headers
        2. The CORS configuration works for the complete request cycle
        """
        origin = "http://localhost:3000"

        # First, do preflight
        preflight_response = client.options(
            endpoint,
            headers={
                "Origin": origin,
                "Access-Control-Request-Method": "GET",
            },
        )

        # Preflight should succeed
        assert preflight_response.status_code == 200

        # Now do actual request
        actual_response = client.get(endpoint, headers={"Origin": origin})

        # Actual request should include CORS headers
        headers = {k.lower(): v for k, v in actual_response.headers.items()}

        # Should have Access-Control-Allow-Origin header
        assert "access-control-allow-origin" in headers
        allowed_origin = headers["access-control-allow-origin"]
        assert allowed_origin == origin or allowed_origin == "*"

    def test_cors_configuration_matches_settings(self, client):
        """
        Property: CORS configuration should match the application settings.

        This test validates that:
        1. The CORS middleware is configured with the correct origins from settings
        2. Configuration is consistent across the application
        """
        settings = get_settings()
        expected_origins = settings.cors_origins_list

        # Test each configured origin
        for origin in expected_origins:
            response = client.options(
                "/health",
                headers={
                    "Origin": origin,
                    "Access-Control-Request-Method": "GET",
                },
            )

            assert response.status_code == 200
            headers = {k.lower(): v for k, v in response.headers.items()}
            assert "access-control-allow-origin" in headers

            # Should allow the configured origin
            allowed_origin = headers["access-control-allow-origin"]
            assert allowed_origin == origin or allowed_origin == "*"

    @given(method=st.sampled_from(["GET", "POST", "PUT", "DELETE", "OPTIONS"]))
    @settings(max_examples=20, deadline=5000)
    def test_cors_supported_methods(self, client, method):
        """
        Property: CORS should support all HTTP methods used by the API.

        This test validates that:
        1. All HTTP methods used by the API are allowed in CORS
        2. Method restrictions are properly configured
        """
        origin = "http://localhost:3000"

        response = client.options(
            "/health",
            headers={
                "Origin": origin,
                "Access-Control-Request-Method": method,
            },
        )

        assert response.status_code == 200
        headers = {k.lower(): v for k, v in response.headers.items()}

        # Check if method is allowed
        if "access-control-allow-methods" in headers:
            allowed_methods = headers["access-control-allow-methods"].upper()
            # Should allow the method if it's one of the supported ones
            if method in ["GET", "POST", "PUT", "DELETE", "OPTIONS"]:
                assert method in allowed_methods or "*" in allowed_methods
