"""
Tests for search endpoints.

Tests the search functionality including full-text search, analytics,
and advanced filtering capabilities.
"""

import pytest
from httpx import AsyncClient
from unittest.mock import AsyncMock, patch

from main import create_app
from app.core.database import get_db
from app.schemas.search import SearchResponse, SearchAnalyticsResponse


class TestSearchEndpoints:
    """Test cases for search endpoints."""

    @pytest.mark.asyncio
    async def test_basic_search_endpoint(self, test_db):
        """Test basic search endpoint functionality."""
        app = create_app()

        # Override database dependency
        async def override_get_db():
            yield test_db

        app.dependency_overrides[get_db] = override_get_db

        async with AsyncClient(app=app, base_url="http://test") as client:
            # Mock the search service
            with patch("app.api.routes.search.SearchService") as mock_service_class:
                mock_service = AsyncMock()
                mock_service_class.return_value = mock_service

                # Mock search results
                mock_results = SearchResponse(
                    results=[],
                    total_count=0,
                    parsed_query={
                        "keywords": ["test"],
                        "time_range": None,
                        "business_units": [],
                        "channels": [],
                        "severities": [],
                        "categories": [],
                        "flags": {
                            "urgent": False,
                            "risk": False,
                            "needs_review": False,
                        },
                        "original_query": "test query",
                    },
                    suggested_filters=[],
                    execution_time_ms=50,
                )
                mock_service.search_cases.return_value = mock_results

                # Test the endpoint
                response = await client.get("/api/search/?q=test%20query")

                assert response.status_code == 200
                data = response.json()
                assert "results" in data
                assert "total_count" in data
                assert "parsed_query" in data
                assert "execution_time_ms" in data
                assert data["total_count"] == 0

    @pytest.mark.asyncio
    async def test_search_validation_errors(self, test_db):
        """Test search endpoint validation."""
        app = create_app()

        # Override database dependency
        async def override_get_db():
            yield test_db

        app.dependency_overrides[get_db] = override_get_db

        async with AsyncClient(app=app, base_url="http://test") as client:
            # Test empty query
            response = await client.get("/api/search/?q=")
            assert response.status_code == 422

            # Test invalid page
            response = await client.get("/api/search/?q=test&page=0")
            assert response.status_code == 422

            # Test invalid limit
            response = await client.get("/api/search/?q=test&limit=101")
            assert response.status_code == 422

            # Test invalid sort order
            response = await client.get("/api/search/?q=test&sort_order=invalid")
            assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_search_suggestions_endpoint(self, test_db):
        """Test search suggestions endpoint."""
        app = create_app()

        # Override database dependency
        async def override_get_db():
            yield test_db

        app.dependency_overrides[get_db] = override_get_db

        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get("/api/search/suggestions?q=login")

            assert response.status_code == 200
            data = response.json()
            assert "suggestions" in data
            assert "query" in data
            assert data["query"] == "login"
            assert isinstance(data["suggestions"], list)
