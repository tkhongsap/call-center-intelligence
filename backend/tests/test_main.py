"""
Test Main Application

Tests for the main FastAPI application setup and configuration.
"""

import pytest


def test_health_check(client):
    """Test the health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "call-center-backend"


def test_cors_headers(client):
    """Test CORS headers are properly set."""
    response = client.options("/health", headers={
        "Origin": "http://localhost:3000",
        "Access-Control-Request-Method": "GET",
    })
    assert response.status_code == 200
    assert "access-control-allow-origin" in response.headers


def test_api_docs_available_in_debug(client):
    """Test that API documentation is available in debug mode."""
    response = client.get("/docs")
    assert response.status_code == 200


def test_404_error_handling(client):
    """Test 404 error handling."""
    response = client.get("/nonexistent-endpoint")
    assert response.status_code == 404