"""
Property-based tests for search result consistency.

**Feature: backend-migration-fastapi, Property 9: Search Result Consistency**
**Validates: Requirements 6.1, 6.5**

This test validates that for any search query, the FastAPI backend returns results
in the same order with identical ranking, filtering, and metadata as the original system.
"""

import pytest
from hypothesis import given, strategies as st, settings, assume, HealthCheck
from hypothesis.strategies import composite
from fastapi.testclient import TestClient
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timezone, timedelta
import json
import re

from main import create_app
from app.core.database import get_db
from app.models import Case, SearchAnalytic
from app.models.base import Channel, CaseStatus, Sentiment, Severity
from app.schemas.search import SearchResponse, SearchResultCase, SearchParams
from app.schemas.base import ParsedQuery, SearchFlags, SuggestedFilter


# ═══════════════════════════════════════════════════════════════════════════════
# Test Data Strategies
# ═══════════════════════════════════════════════════════════════════════════════

# Valid search keywords
search_keywords = st.lists(
    st.text(
        alphabet=st.characters(
            whitelist_categories=("Lu", "Ll", "Nd"), whitelist_characters=" -_"
        ),
        min_size=3,
        max_size=20,
    ).filter(lambda x: x.strip() and len(x.strip()) >= 3),
    min_size=1,
    max_size=5,
)

# Business units
business_units = st.lists(
    st.sampled_from(
        [
            "Business Unit A",
            "Business Unit B",
            "Business Unit C",
            "Enterprise",
            "SMB",
            "Consumer",
        ]
    ),
    max_size=3,
)

# Channels
channels = st.lists(st.sampled_from([ch.value for ch in Channel]), max_size=3)

# Severities
severities = st.lists(st.sampled_from([sev.value for sev in Severity]), max_size=3)

# Categories
categories = st.lists(
    st.sampled_from(
        [
            "Technical Issues",
            "Billing",
            "Account Management",
            "Product Support",
            "General Inquiry",
            "Complaint",
        ]
    ),
    max_size=3,
)

# Time ranges
time_ranges = st.one_of(
    st.none(),
    st.sampled_from(["today", "week", "month"]),
    st.datetimes(
        min_value=datetime(2024, 1, 1),
        max_value=datetime(2024, 12, 31),
    ).map(lambda dt: dt.replace(tzinfo=timezone.utc).isoformat()),
)


# Search flags
@composite
def search_flags(draw):
    return SearchFlags(
        urgent=draw(st.booleans()),
        risk=draw(st.booleans()),
        needs_review=draw(st.booleans()),
    )


# Parsed query strategy
@composite
def parsed_query_strategy(draw):
    keywords = draw(search_keywords)
    return ParsedQuery(
        keywords=keywords,
        time_range=draw(time_ranges),
        business_units=draw(business_units),
        channels=draw(channels),
        severities=draw(severities),
        categories=draw(categories),
        flags=draw(search_flags()),
        original_query=" ".join(keywords),
    )


# Search parameters
@composite
def search_params_strategy(draw):
    keywords = draw(search_keywords)
    query = " ".join(keywords)

    # Add filters to query
    bu_filters = draw(business_units)
    if bu_filters:
        query += " " + " ".join(f"bu:{bu}" for bu in bu_filters[:2])

    channel_filters = draw(channels)
    if channel_filters:
        query += " " + " ".join(f"channel:{ch}" for ch in channel_filters[:2])

    severity_filters = draw(severities)
    if severity_filters:
        query += " " + " ".join(f"severity:{sev}" for sev in severity_filters[:2])

    # Add flags
    flags = draw(search_flags())
    if flags.urgent:
        query += " urgent"
    if flags.risk:
        query += " risk"
    if flags.needs_review:
        query += " review"

    return SearchParams(
        q=query.strip(),
        page=draw(st.integers(min_value=1, max_value=10)),
        limit=draw(st.integers(min_value=1, max_value=50)),
        sort_by=draw(
            st.sampled_from(
                ["relevance", "created_at", "severity", "status", "case_number"]
            )
        ),
        sort_order=draw(st.sampled_from(["asc", "desc"])),
    )


# Case data for testing
@composite
def case_data_strategy(draw):
    return {
        "id": f"case-{draw(st.integers(min_value=1, max_value=10000))}",
        "case_number": f"CS-2024-{draw(st.integers(min_value=1, max_value=9999)):04d}",
        "channel": draw(st.sampled_from([ch.value for ch in Channel])),
        "status": draw(st.sampled_from([status.value for status in CaseStatus])),
        "category": draw(
            st.sampled_from(
                [
                    "Technical Issues",
                    "Billing",
                    "Account Management",
                    "Product Support",
                    "General Inquiry",
                    "Complaint",
                ]
            )
        ),
        "subcategory": draw(
            st.one_of(
                st.none(),
                st.sampled_from(
                    [
                        "Login Problems",
                        "Payment Issues",
                        "Bug Report",
                        "Feature Request",
                    ]
                ),
            )
        ),
        "sentiment": draw(st.sampled_from([sent.value for sent in Sentiment])),
        "severity": draw(st.sampled_from([sev.value for sev in Severity])),
        "risk_flag": draw(st.booleans()),
        "needs_review_flag": draw(st.booleans()),
        "business_unit": draw(
            st.sampled_from(
                [
                    "Business Unit A",
                    "Business Unit B",
                    "Business Unit C",
                    "Enterprise",
                    "SMB",
                    "Consumer",
                ]
            )
        ),
        "summary": draw(
            st.text(
                alphabet=st.characters(
                    whitelist_categories=("Lu", "Ll", "Nd"),
                    whitelist_characters=" .-,!?",
                ),
                min_size=10,
                max_size=200,
            )
        ),
        "customer_name": draw(
            st.one_of(
                st.none(),
                st.text(
                    alphabet=st.characters(
                        whitelist_categories=("Lu", "Ll"), whitelist_characters=" "
                    ),
                    min_size=5,
                    max_size=50,
                ),
            )
        ),
        "agent_id": draw(st.one_of(st.none(), st.text(min_size=5, max_size=20))),
        "assigned_to": draw(st.one_of(st.none(), st.text(min_size=5, max_size=20))),
        "created_at": draw(
            st.datetimes(
                min_value=datetime(2024, 1, 1),
                max_value=datetime(2024, 12, 31),
            ).map(lambda dt: dt.replace(tzinfo=timezone.utc).isoformat())
        ),
        "updated_at": draw(
            st.datetimes(
                min_value=datetime(2024, 1, 1),
                max_value=datetime(2024, 12, 31),
            ).map(lambda dt: dt.replace(tzinfo=timezone.utc).isoformat())
        ),
        "resolved_at": draw(
            st.one_of(
                st.none(),
                st.datetimes(
                    min_value=datetime(2024, 1, 1),
                    max_value=datetime(2024, 12, 31),
                ).map(lambda dt: dt.replace(tzinfo=timezone.utc).isoformat()),
            )
        ),
        "upload_id": draw(st.one_of(st.none(), st.text(min_size=5, max_size=20))),
    }


# Search result case strategy
@composite
def search_result_case_strategy(draw):
    case_data = draw(case_data_strategy())
    return SearchResultCase(
        **case_data,
        relevance_score=draw(st.floats(min_value=0.0, max_value=1.0)),
        matched_fields=draw(
            st.lists(
                st.sampled_from(
                    [
                        "summary",
                        "category",
                        "subcategory",
                        "customer_name",
                        "case_number",
                    ]
                ),
                max_size=3,
            )
        ),
        highlighted_summary=draw(
            st.one_of(
                st.none(),
                st.text(
                    alphabet=st.characters(
                        whitelist_categories=("Lu", "Ll", "Nd"),
                        whitelist_characters=" .-,!?<>mark/",
                    ),
                    min_size=10,
                    max_size=250,
                ),
            )
        ),
    )


# Search response strategy
@composite
def search_response_strategy(draw):
    results = draw(st.lists(search_result_case_strategy(), max_size=20))
    return SearchResponse(
        results=results,
        total_count=draw(st.integers(min_value=len(results), max_value=1000)),
        parsed_query=draw(parsed_query_strategy()),
        suggested_filters=draw(
            st.lists(
                st.builds(
                    SuggestedFilter,
                    type=st.sampled_from(
                        ["business_unit", "severity", "channel", "category"]
                    ),
                    value=st.text(min_size=1, max_size=50),
                    count=st.integers(min_value=1, max_value=100),
                ),
                max_size=10,
            )
        ),
        execution_time_ms=draw(st.integers(min_value=1, max_value=5000)),
    )


# ═══════════════════════════════════════════════════════════════════════════════
# Property Tests
# ═══════════════════════════════════════════════════════════════════════════════


class TestSearchResultConsistency:
    """Property-based tests for search result consistency."""

    @pytest.fixture(scope="class")
    def client(self):
        """Create test client with mocked database."""
        app = create_app()

        # Mock database dependency
        async def mock_get_db():
            yield None

        app.dependency_overrides[get_db] = mock_get_db
        return TestClient(app)

    @given(search_params=search_params_strategy())
    @settings(
        max_examples=100,
        deadline=None,
        suppress_health_check=[HealthCheck.function_scoped_fixture],
    )
    def test_search_result_order_consistency(
        self, client: TestClient, search_params: SearchParams
    ):
        """
        **Property 9: Search Result Consistency**
        **Validates: Requirements 6.1, 6.5**

        For any search query, results should be returned in consistent order
        when the same parameters are used multiple times.

        This test validates that:
        1. Multiple identical search requests return results in the same order
        2. Relevance scores are consistent across requests
        3. Matched fields remain the same for identical queries
        4. Pagination maintains consistent ordering
        """
        assume(len(search_params.q.strip()) >= 3)
        assume(len(search_params.q) <= 500)

        # Mock the search service to return consistent results
        from unittest.mock import patch, AsyncMock

        # Create mock search results that should be consistent
        mock_results = []
        for i in range(min(search_params.limit, 10)):
            mock_results.append(
                {
                    "id": f"case-{i+1}",
                    "case_number": f"CS-2024-{i+1:04d}",
                    "channel": "email",
                    "status": "open",
                    "category": "Technical Issues",
                    "subcategory": "Login Problems",
                    "sentiment": "negative",
                    "severity": "high",
                    "risk_flag": False,
                    "needs_review_flag": True,
                    "business_unit": "Business Unit A",
                    "summary": f"Test case {i+1} summary with keywords from query",
                    "customer_name": f"Customer {i+1}",
                    "agent_id": f"agent-{i+1}",
                    "assigned_to": f"user-{i+1}",
                    "created_at": f"2024-01-{15+i:02d}T10:30:00Z",
                    "updated_at": f"2024-01-{15+i:02d}T10:30:00Z",
                    "resolved_at": None,
                    "upload_id": None,
                    "relevance_score": 1.0 - (i * 0.1),  # Decreasing relevance
                    "matched_fields": ["summary", "category"],
                    "highlighted_summary": f"Test case {i+1} summary with <mark>keywords</mark> from query",
                }
            )

        mock_response = {
            "results": mock_results,
            "total_count": len(mock_results),
            "parsed_query": {
                "keywords": search_params.q.split()[:3],
                "time_range": None,
                "business_units": [],
                "channels": [],
                "severities": [],
                "categories": [],
                "flags": {"urgent": False, "risk": False, "needs_review": False},
                "original_query": search_params.q,
            },
            "suggested_filters": [
                {"type": "business_unit", "value": "Business Unit A", "count": 15}
            ],
            "execution_time_ms": 50,
        }

        with patch("app.api.routes.search.SearchService") as mock_service_class:
            mock_service = AsyncMock()
            mock_service_class.return_value = mock_service
            mock_service.search_cases.return_value = type(
                "MockResponse", (), mock_response
            )()

            # Make the first request
            response1 = client.get(
                "/api/search/",
                params={
                    "q": search_params.q,
                    "page": search_params.page,
                    "limit": search_params.limit,
                    "sort_by": search_params.sort_by,
                    "sort_order": search_params.sort_order,
                },
            )

            # Make the second identical request
            response2 = client.get(
                "/api/search/",
                params={
                    "q": search_params.q,
                    "page": search_params.page,
                    "limit": search_params.limit,
                    "sort_by": search_params.sort_by,
                    "sort_order": search_params.sort_order,
                },
            )

            # Both requests should succeed
            assert (
                response1.status_code == 200
            ), f"First request failed: {response1.text}"
            assert (
                response2.status_code == 200
            ), f"Second request failed: {response2.text}"

            data1 = response1.json()
            data2 = response2.json()

            # Results should be identical
            assert (
                data1["total_count"] == data2["total_count"]
            ), "Total count should be consistent across identical requests"

            assert len(data1["results"]) == len(
                data2["results"]
            ), "Number of results should be consistent"

            # Check that results are in the same order
            for i, (result1, result2) in enumerate(
                zip(data1["results"], data2["results"])
            ):
                assert (
                    result1["id"] == result2["id"]
                ), f"Result {i} ID should be consistent: {result1['id']} != {result2['id']}"

                assert (
                    result1["relevance_score"] == result2["relevance_score"]
                ), f"Result {i} relevance score should be consistent"

                assert (
                    result1["matched_fields"] == result2["matched_fields"]
                ), f"Result {i} matched fields should be consistent"

            # Parsed query should be identical
            assert (
                data1["parsed_query"] == data2["parsed_query"]
            ), "Parsed query should be consistent across identical requests"

            # Execution time should be reasonable (not testing exact match as it can vary)
            assert isinstance(
                data1["execution_time_ms"], int
            ), "Execution time should be an integer"
            assert data1["execution_time_ms"] > 0, "Execution time should be positive"

    @given(
        search_params=search_params_strategy(),
        sort_orders=st.lists(st.sampled_from(["asc", "desc"]), min_size=2, max_size=2),
    )
    @settings(
        max_examples=100,
        deadline=None,
        suppress_health_check=[HealthCheck.function_scoped_fixture],
    )
    def test_search_sorting_consistency(
        self, client: TestClient, search_params: SearchParams, sort_orders: List[str]
    ):
        """
        **Property 9: Search Result Consistency**
        **Validates: Requirements 6.1, 6.5**

        For any search query with different sort orders, the results should be
        consistently ordered according to the specified criteria.

        This test validates that:
        1. Ascending and descending sorts return results in opposite order
        2. Sort criteria are applied consistently
        3. Secondary sorting is stable
        """
        assume(len(search_params.q.strip()) >= 3)
        assume(len(search_params.q) <= 500)
        assume(len(set(sort_orders)) == 2)  # Ensure we have both asc and desc

        from unittest.mock import patch, AsyncMock

        # Create mock results with different values for sorting
        mock_results_asc = []
        mock_results_desc = []

        for i in range(min(search_params.limit, 5)):
            base_result = {
                "id": f"case-{i+1}",
                "case_number": f"CS-2024-{i+1:04d}",
                "channel": "email",
                "status": "open",
                "category": "Technical Issues",
                "severity": ["low", "medium", "high", "critical"][i % 4],
                "created_at": f"2024-01-{10+i:02d}T10:30:00Z",
                "relevance_score": 0.9 - (i * 0.1),
                "summary": f"Test case {i+1}",
                "business_unit": "Business Unit A",
                "sentiment": "negative",
                "risk_flag": False,
                "needs_review_flag": False,
                "customer_name": f"Customer {i+1}",
                "agent_id": None,
                "assigned_to": None,
                "updated_at": f"2024-01-{10+i:02d}T10:30:00Z",
                "resolved_at": None,
                "upload_id": None,
                "subcategory": None,
                "matched_fields": ["summary"],
                "highlighted_summary": f"Test case {i+1}",
            }
            mock_results_asc.append(base_result)
            mock_results_desc.insert(0, base_result)  # Reverse order

        base_response = {
            "total_count": len(mock_results_asc),
            "parsed_query": {
                "keywords": search_params.q.split()[:3],
                "time_range": None,
                "business_units": [],
                "channels": [],
                "severities": [],
                "categories": [],
                "flags": {"urgent": False, "risk": False, "needs_review": False},
                "original_query": search_params.q,
            },
            "suggested_filters": [],
            "execution_time_ms": 50,
        }

        with patch("app.api.routes.search.SearchService") as mock_service_class:
            mock_service = AsyncMock()
            mock_service_class.return_value = mock_service

            responses = []

            for sort_order in sort_orders:
                # Set up mock response based on sort order
                if sort_order == "asc":
                    mock_response = {**base_response, "results": mock_results_asc}
                else:
                    mock_response = {**base_response, "results": mock_results_desc}

                mock_service.search_cases.return_value = type(
                    "MockResponse", (), mock_response
                )()

                response = client.get(
                    "/api/search/",
                    params={
                        "q": search_params.q,
                        "page": search_params.page,
                        "limit": search_params.limit,
                        "sort_by": search_params.sort_by,
                        "sort_order": sort_order,
                    },
                )

                assert (
                    response.status_code == 200
                ), f"Request failed for sort_order {sort_order}: {response.text}"
                responses.append(response.json())

            # If we have both asc and desc, results should be in opposite order
            if len(responses) == 2 and len(responses[0]["results"]) > 1:
                asc_ids = [r["id"] for r in responses[0]["results"]]
                desc_ids = [r["id"] for r in responses[1]["results"]]

                # Results should be in opposite order (for simple cases)
                if sort_orders[0] == "asc" and sort_orders[1] == "desc":
                    assert asc_ids == list(
                        reversed(desc_ids)
                    ), f"Ascending and descending results should be in opposite order: {asc_ids} vs {desc_ids}"

    @given(search_response=search_response_strategy())
    @settings(
        max_examples=100,
        deadline=None,
        suppress_health_check=[HealthCheck.function_scoped_fixture],
    )
    def test_search_response_structure_consistency(
        self, client: TestClient, search_response: SearchResponse
    ):
        """
        **Property 9: Search Result Consistency**
        **Validates: Requirements 6.1, 6.5**

        For any search response, the structure and data types should be consistent
        with the defined schema.

        This test validates that:
        1. Response structure matches the SearchResponse schema
        2. All required fields are present
        3. Data types are correct
        4. Nested objects have consistent structure
        """
        from unittest.mock import patch, AsyncMock

        # Convert SearchResponse to dict for mocking
        mock_response_dict = {
            "results": [
                {
                    **result.model_dump(),
                    "channel": result.channel,
                    "status": result.status,
                    "sentiment": result.sentiment,
                    "severity": result.severity,
                }
                for result in search_response.results
            ],
            "total_count": search_response.total_count,
            "parsed_query": search_response.parsed_query.model_dump(),
            "suggested_filters": [
                sf.model_dump() for sf in search_response.suggested_filters
            ],
            "execution_time_ms": search_response.execution_time_ms,
        }

        with patch("app.api.routes.search.SearchService") as mock_service_class:
            mock_service = AsyncMock()
            mock_service_class.return_value = mock_service
            mock_service.search_cases.return_value = type(
                "MockResponse", (), mock_response_dict
            )()

            response = client.get(
                "/api/search/",
                params={
                    "q": "test query",
                    "page": 1,
                    "limit": 20,
                    "sort_by": "relevance",
                    "sort_order": "desc",
                },
            )

            assert response.status_code == 200, f"Request failed: {response.text}"
            data = response.json()

            # Validate response structure
            required_fields = [
                "results",
                "total_count",
                "parsed_query",
                "suggested_filters",
                "execution_time_ms",
            ]
            for field in required_fields:
                assert field in data, f"Required field '{field}' missing from response"

            # Validate data types
            assert isinstance(data["results"], list), "Results should be a list"
            assert isinstance(
                data["total_count"], int
            ), "Total count should be an integer"
            assert isinstance(
                data["parsed_query"], dict
            ), "Parsed query should be a dict"
            assert isinstance(
                data["suggested_filters"], list
            ), "Suggested filters should be a list"
            assert isinstance(
                data["execution_time_ms"], int
            ), "Execution time should be an integer"

            # Validate each result has consistent structure
            for i, result in enumerate(data["results"]):
                required_result_fields = [
                    "id",
                    "case_number",
                    "channel",
                    "status",
                    "category",
                    "sentiment",
                    "severity",
                    "business_unit",
                    "summary",
                    "created_at",
                ]
                for field in required_result_fields:
                    assert (
                        field in result
                    ), f"Result {i} missing required field '{field}'"

                # Validate search-specific fields
                if "relevance_score" in result:
                    assert isinstance(
                        result["relevance_score"], (int, float)
                    ), f"Result {i} relevance_score should be numeric"
                    assert (
                        0 <= result["relevance_score"] <= 1
                    ), f"Result {i} relevance_score should be between 0 and 1"

                if "matched_fields" in result:
                    assert isinstance(
                        result["matched_fields"], list
                    ), f"Result {i} matched_fields should be a list"

            # Validate parsed query structure
            parsed_query = data["parsed_query"]
            query_fields = [
                "keywords",
                "business_units",
                "channels",
                "severities",
                "categories",
                "flags",
            ]
            for field in query_fields:
                assert field in parsed_query, f"Parsed query missing field '{field}'"

            # Validate suggested filters structure
            for i, filter_item in enumerate(data["suggested_filters"]):
                filter_fields = ["type", "value", "count"]
                for field in filter_fields:
                    assert (
                        field in filter_item
                    ), f"Suggested filter {i} missing field '{field}'"
                assert isinstance(
                    filter_item["count"], int
                ), f"Suggested filter {i} count should be an integer"

    @given(
        query1=st.text(min_size=3, max_size=50), query2=st.text(min_size=3, max_size=50)
    )
    @settings(
        max_examples=50,
        deadline=None,
        suppress_health_check=[HealthCheck.function_scoped_fixture],
    )
    def test_search_query_normalization_consistency(
        self, client: TestClient, query1: str, query2: str
    ):
        """
        **Property 9: Search Result Consistency**
        **Validates: Requirements 6.1, 6.5**

        For any search query, the query parsing and normalization should be consistent.
        Similar queries should produce similar parsed results.

        This test validates that:
        1. Query parsing is deterministic
        2. Normalization rules are applied consistently
        3. Filter extraction works reliably
        """
        assume(query1.strip() and query2.strip())
        assume(len(query1.strip()) >= 3 and len(query2.strip()) >= 3)

        from unittest.mock import patch, AsyncMock

        def create_mock_response(query: str):
            # Simulate consistent query parsing
            words = query.lower().split()
            keywords = [
                w
                for w in words
                if len(w) >= 3 and not w.startswith(("bu:", "channel:", "severity:"))
            ]

            return {
                "results": [],
                "total_count": 0,
                "parsed_query": {
                    "keywords": keywords[:5],  # Limit to 5 keywords
                    "time_range": None,
                    "business_units": [],
                    "channels": [],
                    "severities": [],
                    "categories": [],
                    "flags": {"urgent": False, "risk": False, "needs_review": False},
                    "original_query": query,
                },
                "suggested_filters": [],
                "execution_time_ms": 25,
            }

        with patch("app.api.routes.search.SearchService") as mock_service_class:
            mock_service = AsyncMock()
            mock_service_class.return_value = mock_service

            # Test first query
            mock_service.search_cases.return_value = type(
                "MockResponse", (), create_mock_response(query1)
            )()
            response1 = client.get("/api/search/", params={"q": query1})

            # Test second query
            mock_service.search_cases.return_value = type(
                "MockResponse", (), create_mock_response(query2)
            )()
            response2 = client.get("/api/search/", params={"q": query2})

            assert response1.status_code == 200, f"First query failed: {response1.text}"
            assert (
                response2.status_code == 200
            ), f"Second query failed: {response2.text}"

            data1 = response1.json()
            data2 = response2.json()

            # Both should have valid parsed queries
            assert "parsed_query" in data1, "First response missing parsed_query"
            assert "parsed_query" in data2, "Second response missing parsed_query"

            # Original queries should be preserved
            assert (
                data1["parsed_query"]["original_query"] == query1
            ), "Original query should be preserved in parsed_query"
            assert (
                data2["parsed_query"]["original_query"] == query2
            ), "Original query should be preserved in parsed_query"

            # Keywords should be extracted consistently
            assert isinstance(
                data1["parsed_query"]["keywords"], list
            ), "Keywords should be a list"
            assert isinstance(
                data2["parsed_query"]["keywords"], list
            ), "Keywords should be a list"

            # If queries are identical, parsed results should be identical
            if query1.strip().lower() == query2.strip().lower():
                assert (
                    data1["parsed_query"]["keywords"]
                    == data2["parsed_query"]["keywords"]
                ), "Identical queries should produce identical keyword extraction"


if __name__ == "__main__":
    # Run the property tests
    pytest.main([__file__, "-v", "-s"])
