"""
Feed-related Pydantic schemas.

This module defines request and response schemas for feed endpoints:
- GET /api/feed (get feed items with filtering)
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict, field_validator

from app.models.base import FeedItemType
from app.schemas.base import (
    PaginationInfo,
    PaginationParams,
    BusinessUnitFilter,
    ChannelFilter,
    FeedItemMetadata,
)
from app.schemas.serializers import (
    TimestampSerializerMixin,
    NumberSerializerMixin,
    JSONFieldSerializerMixin,
    EnumSerializerMixin,
    EnhancedPaginationInfo,
)


# ═══════════════════════════════════════════════════════════════════════════════
# Feed Item Schemas
# ═══════════════════════════════════════════════════════════════════════════════


class FeedItemBase(BaseModel):
    """Base feed item schema."""

    type: FeedItemType = Field(..., description="Feed item type")
    title: str = Field(..., min_length=1, max_length=200, description="Feed item title")
    content: str = Field(..., min_length=1, description="Feed item content")
    priority: int = Field(..., ge=0, le=10, description="Priority level (0-10)")
    reference_id: Optional[str] = Field(None, description="Reference to related entity")
    reference_type: Optional[str] = Field(None, description="Type of referenced entity")


class FeedItemCreate(FeedItemBase):
    """Schema for creating feed items."""

    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")
    expires_at: Optional[str] = Field(None, description="Expiration timestamp")


class FeedItemResponse(
    FeedItemBase,
    TimestampSerializerMixin,
    NumberSerializerMixin,
    JSONFieldSerializerMixin,
    EnumSerializerMixin,
):
    """Complete feed item response schema with enhanced serialization."""

    id: str = Field(..., description="Feed item ID")
    item_metadata: Optional[Dict[str, Any]] = Field(
        None, alias="metadata", description="Additional metadata"
    )
    created_at: str = Field(..., description="Creation timestamp")
    expires_at: Optional[str] = Field(None, description="Expiration timestamp")

    model_config = ConfigDict(
        from_attributes=True,
        # Fix field mapping to use the correct SQLAlchemy attribute name
        populate_by_name=True,
        # Use alias for serialization
        by_alias=True,
        json_schema_extra={
            "example": {
                "id": "feed-123",
                "type": "alert",
                "title": "High Priority Alert",
                "content": "Case volume spike detected in Business Unit A",
                "priority": 8,
                "reference_id": "alert-456",
                "reference_type": "alert",
                "metadata": {
                    "businessUnit": "Business Unit A",
                    "alertId": "alert-456",
                    "severity": "high",
                },
                "created_at": "2024-01-15T10:30:00Z",
                "expires_at": None,
            }
        },
    )

    @classmethod
    def model_validate(cls, obj, **kwargs):
        """
        Custom validation to handle SQLAlchemy object field mapping.

        This fixes the issue where Pydantic looks for 'metadata' attribute
        due to the alias, but finds SQLAlchemy's Base.metadata instead of
        the intended item_metadata field.
        """
        if hasattr(obj, "item_metadata") and hasattr(obj, "metadata"):
            # If this is a SQLAlchemy object with both attributes,
            # create a dict with the correct mapping
            obj_dict = {}
            for field_name, field_info in cls.model_fields.items():
                if field_name == "item_metadata":
                    # Use the SQLAlchemy attribute name
                    obj_dict["item_metadata"] = getattr(obj, "item_metadata", None)
                else:
                    # Use the regular attribute name
                    obj_dict[field_name] = getattr(obj, field_name, None)
            return super().model_validate(obj_dict, **kwargs)
        else:
            # For regular objects or dicts, use default validation
            return super().model_validate(obj, **kwargs)


# ═══════════════════════════════════════════════════════════════════════════════
# Feed Query Parameters
# ═══════════════════════════════════════════════════════════════════════════════


class FeedListParams(PaginationParams, BusinessUnitFilter, ChannelFilter):
    """Query parameters for listing feed items."""

    type: Optional[FeedItemType] = Field(None, description="Filter by feed item type")
    date_range: str = Field("7d", description="Date range filter")
    status: Optional[str] = Field(None, description="Filter by incident status")

    @field_validator("date_range")
    @classmethod
    def validate_date_range(cls, v):
        allowed_ranges = ["today", "7d", "30d"]
        if v not in allowed_ranges:
            raise ValueError(f'date_range must be one of: {", ".join(allowed_ranges)}')
        return v


# ═══════════════════════════════════════════════════════════════════════════════
# Feed List Response
# ═══════════════════════════════════════════════════════════════════════════════


class FeedListResponse(BaseModel):
    """Response schema for feed list endpoint with enhanced pagination."""

    items: List[FeedItemResponse] = Field(..., description="List of feed items")
    pagination: EnhancedPaginationInfo = Field(
        ..., description="Enhanced pagination information"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "items": [
                    {
                        "id": "feed-123",
                        "type": "alert",
                        "title": "High Priority Alert",
                        "content": "Case volume spike detected in Business Unit A",
                        "priority": 8,
                        "reference_id": "alert-456",
                        "reference_type": "alert",
                        "metadata": {
                            "businessUnit": "Business Unit A",
                            "alertId": "alert-456",
                            "severity": "high",
                        },
                        "created_at": "2024-01-15T10:30:00Z",
                        "expires_at": None,
                    },
                    {
                        "id": "feed-124",
                        "type": "upload",
                        "title": "New batch uploaded",
                        "content": "25 new cases added from cases_batch_2024.csv",
                        "priority": 5,
                        "reference_id": "upload-789",
                        "reference_type": "upload",
                        "metadata": {
                            "batchId": "upload-789",
                            "fileName": "cases_batch_2024.csv",
                            "caseCount": 25,
                            "status": "completed",
                        },
                        "created_at": "2024-01-15T09:15:00Z",
                        "expires_at": None,
                    },
                ],
                "pagination": {"page": 1, "limit": 10, "total": 2, "total_pages": 1},
            }
        }
    )


# ═══════════════════════════════════════════════════════════════════════════════
# Feed Item Types and Metadata Schemas
# ═══════════════════════════════════════════════════════════════════════════════


class AlertFeedMetadata(BaseModel):
    """Metadata for alert feed items."""

    business_unit: Optional[str] = Field(None, alias="businessUnit")
    alert_id: str = Field(..., alias="alertId")
    severity: str = Field(..., description="Alert severity")
    alert_type: str = Field(..., alias="alertType")


class TrendingFeedMetadata(BaseModel):
    """Metadata for trending feed items."""

    business_unit: Optional[str] = Field(None, alias="businessUnit")
    topic: str = Field(..., description="Trending topic")
    case_count: int = Field(..., alias="caseCount")
    trend_score: float = Field(..., alias="trendScore")
    percentage_change: Optional[float] = Field(None, alias="percentageChange")


class UploadFeedMetadata(BaseModel):
    """Metadata for upload feed items."""

    batch_id: str = Field(..., alias="batchId")
    file_name: str = Field(..., alias="fileName")
    case_count: int = Field(..., alias="caseCount")
    status: str = Field(..., description="Upload status")
    error_count: Optional[int] = Field(None, alias="errorCount")


class HighlightFeedMetadata(BaseModel):
    """Metadata for highlight feed items."""

    business_unit: Optional[str] = Field(None, alias="businessUnit")
    category: Optional[str] = Field(None, description="Highlight category")
    metric_name: Optional[str] = Field(None, alias="metricName")
    metric_value: Optional[float] = Field(None, alias="metricValue")


# ═══════════════════════════════════════════════════════════════════════════════
# Feed Statistics
# ═══════════════════════════════════════════════════════════════════════════════


class FeedStatsResponse(BaseModel):
    """Response schema for feed statistics."""

    total_items: int = Field(..., description="Total number of feed items")
    by_type: Dict[str, int] = Field(..., description="Count by feed item type")
    by_priority: Dict[str, int] = Field(..., description="Count by priority level")
    active_items: int = Field(..., description="Number of non-expired items")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "total_items": 45,
                "by_type": {"alert": 12, "trending": 8, "highlight": 15, "upload": 10},
                "by_priority": {"high": 8, "medium": 25, "low": 12},
                "active_items": 42,
            }
        }
    )
