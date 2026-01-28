"""
Share-related Pydantic schemas.

This module defines request and response schemas for share endpoints:
- POST /api/shares (create share/escalation)
- GET /api/shares (list shares for user)
"""

from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict, field_validator

from app.models.base import ShareType, ShareSourceType, ShareChannel, ShareStatus
from app.schemas.base import PaginationInfo, PaginationParams, SortParams, StatusFilter


# ═══════════════════════════════════════════════════════════════════════════════
# Share Base Schemas
# ═══════════════════════════════════════════════════════════════════════════════

class ShareBase(BaseModel):
    """Base share schema."""
    type: ShareType = Field(..., description="Share type (share or escalation)")
    source_type: ShareSourceType = Field(..., description="Source entity type")
    source_id: str = Field(..., description="Source entity ID")
    sender_id: str = Field(..., description="Sender user ID")
    recipient_id: str = Field(..., description="Recipient user ID")
    channel: ShareChannel = Field(ShareChannel.internal, description="Share channel")
    message: Optional[str] = Field(None, description="Optional message")


class ShareCreate(ShareBase):
    """Schema for creating shares/escalations."""
    pass


class ShareResponse(ShareBase):
    """Complete share response schema."""
    id: str = Field(..., description="Share ID")
    status: ShareStatus = Field(..., description="Share status")
    created_at: str = Field(..., description="Creation timestamp")
    read_at: Optional[str] = Field(None, description="Read timestamp")
    actioned_at: Optional[str] = Field(None, description="Action timestamp")

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "share-123",
                "type": "escalation",
                "source_type": "case",
                "source_id": "case-456",
                "sender_id": "user-789",
                "recipient_id": "user-012",
                "channel": "internal",
                "message": "This case requires immediate attention",
                "status": "pending",
                "created_at": "2024-01-15T10:30:00Z",
                "read_at": None,
                "actioned_at": None
            }
        }
    )


# ═══════════════════════════════════════════════════════════════════════════════
# Share List Query Parameters
# ═══════════════════════════════════════════════════════════════════════════════

class ShareListParams(PaginationParams, SortParams, StatusFilter):
    """Query parameters for listing shares."""
    type: Optional[ShareType] = Field(None, description="Filter by share type")
    source_type: Optional[ShareSourceType] = Field(None, description="Filter by source type")
    sender_id: Optional[str] = Field(None, description="Filter by sender")
    recipient_id: Optional[str] = Field(None, description="Filter by recipient")
    channel: Optional[ShareChannel] = Field(None, description="Filter by channel")

    @field_validator('sort_by')
    @classmethod
    def validate_sort_by(cls, v):
        allowed_fields = ['created_at', 'read_at', 'actioned_at', 'status', 'type']
        if v not in allowed_fields:
            raise ValueError(f'sort_by must be one of: {", ".join(allowed_fields)}')
        return v


# ═══════════════════════════════════════════════════════════════════════════════
# Share List Response
# ═══════════════════════════════════════════════════════════════════════════════

class ShareListResponse(BaseModel):
    """Response schema for share list endpoint."""
    shares: List[ShareResponse] = Field(..., description="List of shares")
    pagination: PaginationInfo = Field(..., description="Pagination information")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "shares": [
                    {
                        "id": "share-123",
                        "type": "escalation",
                        "source_type": "case",
                        "source_id": "case-456",
                        "sender_id": "user-789",
                        "recipient_id": "user-012",
                        "channel": "internal",
                        "message": "This case requires immediate attention",
                        "status": "pending",
                        "created_at": "2024-01-15T10:30:00Z",
                        "read_at": None,
                        "actioned_at": None
                    }
                ],
                "pagination": {
                    "page": 1,
                    "limit": 20,
                    "total": 1,
                    "total_pages": 1
                }
            }
        }
    )


# ═══════════════════════════════════════════════════════════════════════════════
# Share Actions
# ═══════════════════════════════════════════════════════════════════════════════

class ShareUpdateRequest(BaseModel):
    """Request schema for updating share status."""
    status: ShareStatus = Field(..., description="New share status")


class ShareCreateResponse(BaseModel):
    """Response schema for share creation."""
    id: str = Field(..., description="Created share ID")
    message: str = Field(..., description="Success message")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id": "share-123",
                "message": "Successfully escalated"
            }
        }
    )