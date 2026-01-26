"""
Base Pydantic schemas and common types.

This module defines base schemas, common response patterns, and reusable components
that are used across multiple API endpoints.
"""

from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict, field_validator
from enum import Enum

from app.models.base import (
    UserRole,
    Channel,
    CaseStatus,
    Sentiment,
    Severity,
    AlertType,
    AlertStatus,
    Trend,
    FeedItemType,
    ShareType,
    ShareSourceType,
    ShareChannel,
    ShareStatus,
    UploadStatus,
    RecomputeStatus,
)


# ═══════════════════════════════════════════════════════════════════════════════
# Base Response Models
# ═══════════════════════════════════════════════════════════════════════════════

class PaginationInfo(BaseModel):
    """Pagination information for list responses."""
    page: int = Field(..., ge=1, description="Current page number")
    limit: int = Field(..., ge=1, le=100, description="Items per page")
    total: int = Field(..., ge=0, description="Total number of items")
    total_pages: int = Field(..., ge=0, description="Total number of pages")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "page": 1,
                "limit": 20,
                "total": 150,
                "total_pages": 8
            }
        }
    )


class ErrorDetail(BaseModel):
    """Error detail information."""
    field: Optional[str] = Field(None, description="Field that caused the error")
    issue: str = Field(..., description="Description of the issue")
    code: Optional[str] = Field(None, description="Error code")


class ErrorResponse(BaseModel):
    """Standard error response format."""
    error: Dict[str, Any] = Field(..., description="Error information")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Invalid input data",
                    "details": {
                        "field": "email",
                        "issue": "Invalid email format"
                    },
                    "timestamp": "2024-01-15T10:30:00Z"
                }
            }
        }
    )


class SuccessResponse(BaseModel):
    """Standard success response format."""
    success: bool = Field(True, description="Operation success status")
    message: str = Field(..., description="Success message")
    data: Optional[Dict[str, Any]] = Field(None, description="Additional response data")


# ═══════════════════════════════════════════════════════════════════════════════
# Common Query Parameters
# ═══════════════════════════════════════════════════════════════════════════════

class PaginationParams(BaseModel):
    """Common pagination parameters."""
    page: int = Field(1, ge=1, description="Page number")
    limit: int = Field(20, ge=1, le=100, description="Items per page")


class SortParams(BaseModel):
    """Common sorting parameters."""
    sort_by: str = Field("created_at", description="Field to sort by")
    sort_order: str = Field("desc", pattern="^(asc|desc)$", description="Sort order")

    @field_validator('sort_order')
    @classmethod
    def validate_sort_order(cls, v):
        if v not in ['asc', 'desc']:
            raise ValueError('sort_order must be either "asc" or "desc"')
        return v


class DateRangeParams(BaseModel):
    """Common date range parameters."""
    start_date: Optional[str] = Field(None, description="Start date (ISO format)")
    end_date: Optional[str] = Field(None, description="End date (ISO format)")

    @field_validator('start_date', 'end_date')
    @classmethod
    def validate_date_format(cls, v):
        if v is not None:
            try:
                datetime.fromisoformat(v.replace('Z', '+00:00'))
            except ValueError:
                raise ValueError('Date must be in ISO format')
        return v


# ═══════════════════════════════════════════════════════════════════════════════
# Business Unit and Filter Parameters
# ═══════════════════════════════════════════════════════════════════════════════

class BusinessUnitFilter(BaseModel):
    """Business unit filtering."""
    bu: Optional[str] = Field(None, description="Business unit filter")


class ChannelFilter(BaseModel):
    """Channel filtering."""
    channel: Optional[Channel] = Field(None, description="Channel filter")


class SeverityFilter(BaseModel):
    """Severity filtering."""
    severity: Optional[Severity] = Field(None, description="Severity filter")


class StatusFilter(BaseModel):
    """Generic status filtering."""
    status: Optional[str] = Field(None, description="Status filter")


# ═══════════════════════════════════════════════════════════════════════════════
# Metadata and JSON Field Schemas
# ═══════════════════════════════════════════════════════════════════════════════

class FeedItemMetadata(BaseModel):
    """Metadata structure for feed items."""
    business_unit: Optional[str] = Field(None, alias="businessUnit")
    channel: Optional[str] = None
    batch_id: Optional[str] = Field(None, alias="batchId")
    file_name: Optional[str] = Field(None, alias="fileName")
    case_count: Optional[int] = Field(None, alias="caseCount")
    alert_id: Optional[str] = Field(None, alias="alertId")
    topic: Optional[str] = None
    
    model_config = ConfigDict(populate_by_name=True)


class UploadError(BaseModel):
    """Upload error structure."""
    row: int = Field(..., description="Row number with error")
    column: str = Field(..., description="Column with error")
    value: str = Field(..., description="Invalid value")
    reason: str = Field(..., description="Error reason")
    suggested_fix: str = Field(..., description="Suggested fix")


# ═══════════════════════════════════════════════════════════════════════════════
# Search Related Schemas
# ═══════════════════════════════════════════════════════════════════════════════

class SearchFlags(BaseModel):
    """Search query flags."""
    urgent: bool = Field(False, description="Urgent cases flag")
    risk: bool = Field(False, description="Risk cases flag")
    needs_review: bool = Field(False, description="Needs review flag")


class ParsedQuery(BaseModel):
    """Parsed search query structure."""
    keywords: List[str] = Field(default_factory=list, description="Extracted keywords")
    time_range: Optional[str] = Field(None, description="Time range filter")
    business_units: List[str] = Field(default_factory=list, description="Business unit filters")
    channels: List[str] = Field(default_factory=list, description="Channel filters")
    severities: List[str] = Field(default_factory=list, description="Severity filters")
    categories: List[str] = Field(default_factory=list, description="Category filters")
    flags: SearchFlags = Field(default_factory=SearchFlags, description="Query flags")
    original_query: str = Field("", description="Original query string")


class SuggestedFilter(BaseModel):
    """Suggested search filter."""
    type: str = Field(..., description="Filter type")
    value: str = Field(..., description="Filter value")
    count: int = Field(..., description="Number of results with this filter")


# ═══════════════════════════════════════════════════════════════════════════════
# Time Window and Analytics
# ═══════════════════════════════════════════════════════════════════════════════

class TimeWindowMetadata(BaseModel):
    """Time window metadata for analytics."""
    start: str = Field(..., description="Start time (ISO format)")
    end: str = Field(..., description="End time (ISO format)")
    case_count: int = Field(..., description="Number of cases in period")


class TrendingMetadata(BaseModel):
    """Metadata for trending analysis."""
    window: str = Field(..., description="Time window (e.g., '24h', '7d')")
    current_period: TimeWindowMetadata = Field(..., description="Current period data")
    baseline_period: TimeWindowMetadata = Field(..., description="Baseline period data")


# ═══════════════════════════════════════════════════════════════════════════════
# Validation Helpers
# ═══════════════════════════════════════════════════════════════════════════════

def validate_case_number(v: str) -> str:
    """Validate case number format."""
    if not v or len(v.strip()) == 0:
        raise ValueError('Case number cannot be empty')
    if len(v) > 50:
        raise ValueError('Case number too long (max 50 characters)')
    return v.strip()


def validate_business_unit(v: str) -> str:
    """Validate business unit format."""
    if not v or len(v.strip()) == 0:
        raise ValueError('Business unit cannot be empty')
    return v.strip()


def validate_summary(v: str) -> str:
    """Validate case summary."""
    if not v or len(v.strip()) == 0:
        raise ValueError('Summary cannot be empty')
    if len(v) > 1000:
        raise ValueError('Summary too long (max 1000 characters)')
    return v.strip()