"""
Search-related Pydantic schemas.

This module defines request and response schemas for search endpoints:
- GET /api/search (search cases with advanced filtering)
- GET /api/search/analytics (search analytics and popular queries)
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict, field_validator

from app.schemas.base import (
    PaginationParams,
    SortParams,
    ParsedQuery,
    SuggestedFilter,
)
from app.schemas.case import CaseResponse


# ═══════════════════════════════════════════════════════════════════════════════
# Search Query Parameters
# ═══════════════════════════════════════════════════════════════════════════════

class SearchParams(PaginationParams, SortParams):
    """Query parameters for search endpoint."""
    q: str = Field(..., min_length=1, description="Search query")

    @field_validator('sort_by')
    @classmethod
    def validate_sort_by(cls, v):
        allowed_fields = ['relevance', 'created_at', 'severity', 'status', 'case_number']
        if v not in allowed_fields:
            raise ValueError(f'sort_by must be one of: {", ".join(allowed_fields)}')
        return v

    @field_validator('q')
    @classmethod
    def validate_query(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('Search query cannot be empty')
        if len(v) > 500:
            raise ValueError('Search query too long (max 500 characters)')
        return v.strip()


# ═══════════════════════════════════════════════════════════════════════════════
# Search Result Schemas
# ═══════════════════════════════════════════════════════════════════════════════

class SearchResultCase(CaseResponse):
    """Search result case with additional search metadata."""
    relevance_score: Optional[float] = Field(None, description="Search relevance score")
    matched_fields: List[str] = Field(default_factory=list, description="Fields that matched the query")
    highlighted_summary: Optional[str] = Field(None, description="Summary with search highlights")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id": "case-123",
                "case_number": "CS-2024-001",
                "channel": "phone",
                "status": "open",
                "category": "Technical Issues",
                "subcategory": "Login Problems",
                "sentiment": "negative",
                "severity": "high",
                "risk_flag": False,
                "needs_review_flag": True,
                "business_unit": "Business Unit A",
                "summary": "Customer unable to login to the system",
                "customer_name": "John Doe",
                "agent_id": "agent-456",
                "assigned_to": "user-789",
                "created_at": "2024-01-15T10:30:00Z",
                "updated_at": "2024-01-15T10:30:00Z",
                "resolved_at": None,
                "upload_id": None,
                "relevance_score": 0.85,
                "matched_fields": ["summary", "category"],
                "highlighted_summary": "Customer unable to <mark>login</mark> to the system"
            }
        }
    )


# ═══════════════════════════════════════════════════════════════════════════════
# Search Response
# ═══════════════════════════════════════════════════════════════════════════════

class SearchResponse(BaseModel):
    """Response schema for search endpoint."""
    results: List[SearchResultCase] = Field(..., description="Search results")
    total_count: int = Field(..., description="Total number of matching cases")
    parsed_query: ParsedQuery = Field(..., description="Parsed query information")
    suggested_filters: List[SuggestedFilter] = Field(..., description="Suggested filters")
    execution_time_ms: int = Field(..., description="Search execution time in milliseconds")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "results": [
                    {
                        "id": "case-123",
                        "case_number": "CS-2024-001",
                        "channel": "phone",
                        "status": "open",
                        "category": "Technical Issues",
                        "summary": "Customer unable to login to the system",
                        "business_unit": "Business Unit A",
                        "severity": "high",
                        "created_at": "2024-01-15T10:30:00Z",
                        "relevance_score": 0.85,
                        "matched_fields": ["summary", "category"],
                        "highlighted_summary": "Customer unable to <mark>login</mark> to the system"
                    }
                ],
                "total_count": 1,
                "parsed_query": {
                    "keywords": ["login", "system"],
                    "time_range": None,
                    "business_units": [],
                    "channels": [],
                    "severities": [],
                    "categories": ["Technical Issues"],
                    "flags": {
                        "urgent": False,
                        "risk": False,
                        "needs_review": False
                    },
                    "original_query": "login system issues"
                },
                "suggested_filters": [
                    {
                        "type": "business_unit",
                        "value": "Business Unit A",
                        "count": 15
                    },
                    {
                        "type": "severity",
                        "value": "high",
                        "count": 8
                    }
                ],
                "execution_time_ms": 45
            }
        }
    )


# ═══════════════════════════════════════════════════════════════════════════════
# Search Analytics Schemas
# ═══════════════════════════════════════════════════════════════════════════════

class PopularQuery(BaseModel):
    """Popular search query information."""
    query: str = Field(..., description="Search query text")
    count: int = Field(..., description="Number of times searched")
    avg_results: float = Field(..., description="Average number of results")
    last_searched: str = Field(..., description="Last search timestamp")


class SearchAnalyticsParams(BaseModel):
    """Query parameters for search analytics."""
    limit: int = Field(10, ge=1, le=50, description="Number of popular queries to return")
    days: int = Field(7, ge=1, le=90, description="Number of days to analyze")


class SearchAnalyticsResponse(BaseModel):
    """Response schema for search analytics endpoint."""
    popular_queries: List[PopularQuery] = Field(..., description="Most popular search queries")
    total_searches: int = Field(..., description="Total number of searches in period")
    unique_queries: int = Field(..., description="Number of unique queries")
    avg_execution_time_ms: float = Field(..., description="Average search execution time")
    search_trends: Dict[str, int] = Field(..., description="Search volume by day")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "popular_queries": [
                    {
                        "query": "login issues",
                        "count": 45,
                        "avg_results": 12.3,
                        "last_searched": "2024-01-15T14:30:00Z"
                    },
                    {
                        "query": "payment problems",
                        "count": 32,
                        "avg_results": 8.7,
                        "last_searched": "2024-01-15T13:45:00Z"
                    }
                ],
                "total_searches": 234,
                "unique_queries": 156,
                "avg_execution_time_ms": 67.5,
                "search_trends": {
                    "2024-01-09": 28,
                    "2024-01-10": 35,
                    "2024-01-11": 42,
                    "2024-01-12": 31,
                    "2024-01-13": 29,
                    "2024-01-14": 38,
                    "2024-01-15": 31
                }
            }
        }
    )


# ═══════════════════════════════════════════════════════════════════════════════
# Search Analytics Record
# ═══════════════════════════════════════════════════════════════════════════════

class SearchAnalyticCreate(BaseModel):
    """Schema for creating search analytics records."""
    query: str = Field(..., description="Original search query")
    normalized_query: str = Field(..., description="Normalized query for grouping")
    result_count: int = Field(..., ge=0, description="Number of results returned")
    execution_time_ms: Optional[int] = Field(None, description="Execution time in milliseconds")
    user_id: Optional[str] = Field(None, description="User who performed the search")


class SearchAnalyticResponse(BaseModel):
    """Response schema for search analytic record."""
    id: str = Field(..., description="Analytics record ID")
    query: str = Field(..., description="Original search query")
    normalized_query: str = Field(..., description="Normalized query")
    result_count: int = Field(..., description="Number of results")
    execution_time_ms: Optional[int] = Field(None, description="Execution time")
    user_id: Optional[str] = Field(None, description="User ID")
    created_at: str = Field(..., description="Creation timestamp")

    model_config = ConfigDict(from_attributes=True)


# ═══════════════════════════════════════════════════════════════════════════════
# Advanced Search Filters
# ═══════════════════════════════════════════════════════════════════════════════

class AdvancedSearchFilters(BaseModel):
    """Advanced search filter options."""
    business_units: List[str] = Field(default_factory=list, description="Business unit filters")
    channels: List[str] = Field(default_factory=list, description="Channel filters")
    severities: List[str] = Field(default_factory=list, description="Severity filters")
    categories: List[str] = Field(default_factory=list, description="Category filters")
    statuses: List[str] = Field(default_factory=list, description="Status filters")
    date_from: Optional[str] = Field(None, description="Start date filter")
    date_to: Optional[str] = Field(None, description="End date filter")
    risk_flag: Optional[bool] = Field(None, description="Risk flag filter")
    needs_review_flag: Optional[bool] = Field(None, description="Needs review flag filter")


class AdvancedSearchParams(SearchParams):
    """Advanced search parameters with filters."""
    filters: Optional[AdvancedSearchFilters] = Field(None, description="Advanced filter options")
    include_highlights: bool = Field(True, description="Include search result highlights")
    include_suggestions: bool = Field(True, description="Include filter suggestions")