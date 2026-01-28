"""
Trending-related Pydantic schemas.

This module defines request and response schemas for trending endpoints:
- GET /api/trending (get trending topics)
- GET /api/trending/{topic} (get trending topic details)
- POST /api/trending/compute (trigger trending computation)
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict, field_validator

from app.models.base import Trend
from app.schemas.base import TrendingMetadata
from app.schemas.case import CaseResponse


# ═══════════════════════════════════════════════════════════════════════════════
# Trending Topic Schemas
# ═══════════════════════════════════════════════════════════════════════════════

class TrendingTopicBase(BaseModel):
    """Base trending topic schema."""
    topic: str = Field(..., min_length=1, description="Trending topic name")
    description: Optional[str] = Field(None, description="Topic description")
    business_unit: Optional[str] = Field(None, description="Business unit filter")
    category: Optional[str] = Field(None, description="Category filter")


class TrendingTopicResponse(TrendingTopicBase):
    """Complete trending topic response schema."""
    id: str = Field(..., description="Trending topic ID")
    case_count: int = Field(..., ge=0, description="Current period case count")
    baseline_count: int = Field(..., ge=0, description="Baseline period case count")
    trend: Trend = Field(..., description="Trend direction")
    percentage_change: Optional[float] = Field(None, description="Percentage change from baseline")
    trend_score: float = Field(..., description="Calculated trend score")
    sample_case_ids: Optional[List[str]] = Field(None, description="Sample case IDs")
    created_at: str = Field(..., description="Creation timestamp")
    updated_at: str = Field(..., description="Last update timestamp")

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "trending-123",
                "topic": "Login Issues",
                "description": "Cases related to user authentication problems",
                "case_count": 45,
                "baseline_count": 28,
                "trend": "rising",
                "percentage_change": 60.7,
                "trend_score": 8.5,
                "business_unit": "Business Unit A",
                "category": "Technical Issues",
                "sample_case_ids": ["case-001", "case-002", "case-003"],
                "created_at": "2024-01-15T10:30:00Z",
                "updated_at": "2024-01-15T10:30:00Z"
            }
        }
    )


# ═══════════════════════════════════════════════════════════════════════════════
# Trending Query Parameters
# ═══════════════════════════════════════════════════════════════════════════════

class TrendingListParams(BaseModel):
    """Query parameters for listing trending topics."""
    window: str = Field("24h", description="Time window for analysis")
    limit: int = Field(5, ge=1, le=50, description="Number of topics to return")
    business_unit: Optional[str] = Field(None, description="Filter by business unit")
    category: Optional[str] = Field(None, description="Filter by category")
    min_trend_score: Optional[float] = Field(None, description="Minimum trend score filter")

    @field_validator('window')
    @classmethod
    def validate_window(cls, v):
        allowed_windows = ['4h', '24h', '7d', '30d']
        if v not in allowed_windows:
            raise ValueError(f'window must be one of: {", ".join(allowed_windows)}')
        return v


# ═══════════════════════════════════════════════════════════════════════════════
# Trending List Response
# ═══════════════════════════════════════════════════════════════════════════════

class TrendingListResponse(BaseModel):
    """Response schema for trending topics list."""
    topics: List[TrendingTopicResponse] = Field(..., description="List of trending topics")
    metadata: TrendingMetadata = Field(..., description="Analysis metadata")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "topics": [
                    {
                        "id": "trending-123",
                        "topic": "Login Issues",
                        "description": "Cases related to user authentication problems",
                        "case_count": 45,
                        "baseline_count": 28,
                        "trend": "rising",
                        "percentage_change": 60.7,
                        "trend_score": 8.5,
                        "business_unit": None,
                        "category": "Technical Issues",
                        "sample_case_ids": ["case-001", "case-002"],
                        "created_at": "2024-01-15T10:30:00Z",
                        "updated_at": "2024-01-15T10:30:00Z"
                    }
                ],
                "metadata": {
                    "window": "24h",
                    "current_period": {
                        "start": "2024-01-14T10:30:00Z",
                        "end": "2024-01-15T10:30:00Z",
                        "case_count": 150
                    },
                    "baseline_period": {
                        "start": "2024-01-13T10:30:00Z",
                        "end": "2024-01-14T10:30:00Z",
                        "case_count": 120
                    }
                }
            }
        }
    )


# ═══════════════════════════════════════════════════════════════════════════════
# Trending Topic Detail Response
# ═══════════════════════════════════════════════════════════════════════════════

class TrendingTopicDetailResponse(BaseModel):
    """Detailed trending topic response with sample cases."""
    topic: TrendingTopicResponse = Field(..., description="Trending topic information")
    sample_cases: List[CaseResponse] = Field(..., description="Sample cases for this topic")
    related_keywords: List[str] = Field(..., description="Related keywords and phrases")
    time_series_data: List[Dict[str, Any]] = Field(..., description="Time series case counts")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "topic": {
                    "id": "trending-123",
                    "topic": "Login Issues",
                    "description": "Cases related to user authentication problems",
                    "case_count": 45,
                    "baseline_count": 28,
                    "trend": "rising",
                    "percentage_change": 60.7,
                    "trend_score": 8.5,
                    "business_unit": None,
                    "category": "Technical Issues",
                    "created_at": "2024-01-15T10:30:00Z",
                    "updated_at": "2024-01-15T10:30:00Z"
                },
                "sample_cases": [
                    {
                        "id": "case-001",
                        "case_number": "CS-2024-001",
                        "summary": "Customer unable to login to system",
                        "severity": "high",
                        "status": "open",
                        "business_unit": "Business Unit A",
                        "category": "Technical Issues",
                        "created_at": "2024-01-15T09:30:00Z"
                    }
                ],
                "related_keywords": ["login", "authentication", "password", "access"],
                "time_series_data": [
                    {"hour": "2024-01-15T08:00:00Z", "count": 5},
                    {"hour": "2024-01-15T09:00:00Z", "count": 8},
                    {"hour": "2024-01-15T10:00:00Z", "count": 12}
                ]
            }
        }
    )


# ═══════════════════════════════════════════════════════════════════════════════
# Trending Computation
# ═══════════════════════════════════════════════════════════════════════════════

class TrendingComputeRequest(BaseModel):
    """Request schema for triggering trending computation."""
    window: str = Field("24h", description="Time window for analysis")
    force: bool = Field(False, description="Force recomputation even if recent")
    business_unit: Optional[str] = Field(None, description="Limit computation to specific BU")

    @field_validator('window')
    @classmethod
    def validate_window(cls, v):
        allowed_windows = ['4h', '24h', '7d', '30d']
        if v not in allowed_windows:
            raise ValueError(f'window must be one of: {", ".join(allowed_windows)}')
        return v


class TrendingComputeResponse(BaseModel):
    """Response schema for trending computation trigger."""
    success: bool = Field(..., description="Computation trigger success")
    message: str = Field(..., description="Status message")
    topics_computed: int = Field(..., description="Number of topics computed")
    computation_time_ms: int = Field(..., description="Computation time in milliseconds")
    window: str = Field(..., description="Time window used")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "success": True,
                "message": "Trending computation completed successfully",
                "topics_computed": 15,
                "computation_time_ms": 2340,
                "window": "24h"
            }
        }
    )


# ═══════════════════════════════════════════════════════════════════════════════
# Trending Statistics
# ═══════════════════════════════════════════════════════════════════════════════

class TrendingStatsResponse(BaseModel):
    """Response schema for trending statistics."""
    total_topics: int = Field(..., description="Total number of trending topics")
    by_trend: Dict[str, int] = Field(..., description="Count by trend direction")
    by_business_unit: Dict[str, int] = Field(..., description="Count by business unit")
    by_category: Dict[str, int] = Field(..., description="Count by category")
    avg_trend_score: float = Field(..., description="Average trend score")
    last_computed: Optional[str] = Field(None, description="Last computation timestamp")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "total_topics": 25,
                "by_trend": {
                    "rising": 12,
                    "stable": 8,
                    "declining": 5
                },
                "by_business_unit": {
                    "Business Unit A": 10,
                    "Business Unit B": 8,
                    "Business Unit C": 7
                },
                "by_category": {
                    "Technical Issues": 12,
                    "Billing": 6,
                    "General": 4,
                    "Account": 3
                },
                "avg_trend_score": 6.8,
                "last_computed": "2024-01-15T10:30:00Z"
            }
        }
    )