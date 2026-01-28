"""
Case-related Pydantic schemas.

This module defines request and response schemas for case endpoints:
- GET /api/cases (list cases with filtering)
- POST /api/cases (create new case)
- GET /api/cases/{id} (get single case)
- PUT /api/cases/{id} (update case)
"""

from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict, field_validator

from app.models.base import Channel, CaseStatus, Sentiment, Severity
from app.schemas.base import (
    PaginationInfo,
    PaginationParams,
    SortParams,
    DateRangeParams,
    BusinessUnitFilter,
    ChannelFilter,
    SeverityFilter,
    StatusFilter,
    validate_case_number,
    validate_business_unit,
    validate_summary,
)
from app.schemas.serializers import (
    TimestampSerializerMixin,
    NumberSerializerMixin,
    JSONFieldSerializerMixin,
    EnumSerializerMixin,
    EnhancedPaginationInfo,
)


# ═══════════════════════════════════════════════════════════════════════════════
# Case Base Schemas
# ═══════════════════════════════════════════════════════════════════════════════

class CaseBase(BaseModel):
    """Base case schema with common fields."""
    case_number: str = Field(..., description="Unique case number")
    channel: Channel = Field(..., description="Communication channel")
    status: CaseStatus = Field(..., description="Case status")
    category: str = Field(..., min_length=1, description="Case category")
    subcategory: Optional[str] = Field(None, description="Case subcategory")
    sentiment: Sentiment = Field(..., description="Customer sentiment")
    severity: Severity = Field(..., description="Case severity")
    business_unit: str = Field(..., description="Business unit")
    summary: str = Field(..., description="Case summary")
    customer_name: Optional[str] = Field(None, description="Customer name")
    agent_id: Optional[str] = Field(None, description="Assigned agent ID")
    assigned_to: Optional[str] = Field(None, description="Assigned user ID")

    @field_validator('case_number')
    @classmethod
    def validate_case_number_field(cls, v):
        return validate_case_number(v)

    @field_validator('business_unit')
    @classmethod
    def validate_business_unit_field(cls, v):
        return validate_business_unit(v)

    @field_validator('summary')
    @classmethod
    def validate_summary_field(cls, v):
        return validate_summary(v)


class CaseCreate(CaseBase):
    """Schema for creating new cases."""
    risk_flag: bool = Field(False, description="Risk flag indicator")
    needs_review_flag: bool = Field(False, description="Needs review flag")


class CaseUpdate(BaseModel):
    """Schema for updating existing cases."""
    status: Optional[CaseStatus] = Field(None, description="Case status")
    category: Optional[str] = Field(None, description="Case category")
    subcategory: Optional[str] = Field(None, description="Case subcategory")
    sentiment: Optional[Sentiment] = Field(None, description="Customer sentiment")
    severity: Optional[Severity] = Field(None, description="Case severity")
    summary: Optional[str] = Field(None, description="Case summary")
    customer_name: Optional[str] = Field(None, description="Customer name")
    agent_id: Optional[str] = Field(None, description="Assigned agent ID")
    assigned_to: Optional[str] = Field(None, description="Assigned user ID")
    risk_flag: Optional[bool] = Field(None, description="Risk flag indicator")
    needs_review_flag: Optional[bool] = Field(None, description="Needs review flag")
    resolved_at: Optional[str] = Field(None, description="Resolution timestamp")

    @field_validator('summary')
    @classmethod
    def validate_summary_field(cls, v):
        if v is not None:
            return validate_summary(v)
        return v


class CaseResponse(CaseBase, TimestampSerializerMixin, NumberSerializerMixin, 
                  JSONFieldSerializerMixin, EnumSerializerMixin):
    """Complete case response schema with enhanced serialization."""
    id: str = Field(..., description="Case ID")
    risk_flag: bool = Field(..., description="Risk flag indicator")
    needs_review_flag: bool = Field(..., description="Needs review flag")
    created_at: str = Field(..., description="Creation timestamp")
    updated_at: str = Field(..., description="Last update timestamp")
    resolved_at: Optional[str] = Field(None, description="Resolution timestamp")
    upload_id: Optional[str] = Field(None, description="Upload batch ID")

    model_config = ConfigDict(
        from_attributes=True,
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
                "upload_id": None
            }
        }
    )


# ═══════════════════════════════════════════════════════════════════════════════
# Case List Query Parameters
# ═══════════════════════════════════════════════════════════════════════════════

class CaseListParams(
    PaginationParams,
    SortParams,
    DateRangeParams,
    BusinessUnitFilter,
    ChannelFilter,
    SeverityFilter,
    StatusFilter
):
    """Query parameters for listing cases."""
    category: Optional[str] = Field(None, description="Filter by category")
    search: Optional[str] = Field(None, description="Search in case summary")
    upload_batch: Optional[str] = Field(None, description="Filter by upload batch ID")
    risk_flag: Optional[bool] = Field(None, description="Filter by risk flag")
    needs_review_flag: Optional[bool] = Field(None, description="Filter by needs review flag")
    assigned_to: Optional[str] = Field(None, description="Filter by assigned user")

    @field_validator('sort_by')
    @classmethod
    def validate_sort_by(cls, v):
        allowed_fields = [
            'created_at', 'updated_at', 'severity', 'status', 
            'case_number', 'category', 'business_unit'
        ]
        if v not in allowed_fields:
            raise ValueError(f'sort_by must be one of: {", ".join(allowed_fields)}')
        return v

    @field_validator('search')
    @classmethod
    def validate_search(cls, v):
        if v is not None and len(v.strip()) == 0:
            return None
        return v


# ═══════════════════════════════════════════════════════════════════════════════
# Case List Response
# ═══════════════════════════════════════════════════════════════════════════════

class CaseListResponse(BaseModel):
    """Response schema for case list endpoint with enhanced pagination."""
    cases: List[CaseResponse] = Field(..., description="List of cases")
    pagination: EnhancedPaginationInfo = Field(..., description="Enhanced pagination information")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "cases": [
                    {
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
                        "upload_id": None
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
# Case Statistics and Aggregations
# ═══════════════════════════════════════════════════════════════════════════════

class CaseCountByStatus(BaseModel):
    """Case count by status."""
    open: int = Field(0, description="Number of open cases")
    in_progress: int = Field(0, description="Number of in-progress cases")
    resolved: int = Field(0, description="Number of resolved cases")
    closed: int = Field(0, description="Number of closed cases")


class CaseCountBySeverity(BaseModel):
    """Case count by severity."""
    low: int = Field(0, description="Number of low severity cases")
    medium: int = Field(0, description="Number of medium severity cases")
    high: int = Field(0, description="Number of high severity cases")
    critical: int = Field(0, description="Number of critical cases")


class CaseCountByChannel(BaseModel):
    """Case count by channel."""
    phone: int = Field(0, description="Number of phone cases")
    email: int = Field(0, description="Number of email cases")
    line: int = Field(0, description="Number of LINE cases")
    web: int = Field(0, description="Number of web cases")


class CaseStatsResponse(BaseModel):
    """Response schema for case statistics."""
    total: int = Field(..., description="Total number of cases")
    by_status: CaseCountByStatus = Field(..., description="Count by status")
    by_severity: CaseCountBySeverity = Field(..., description="Count by severity")
    by_channel: CaseCountByChannel = Field(..., description="Count by channel")
    flags: dict = Field(..., description="Count by flags")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "total": 150,
                "by_status": {
                    "open": 45,
                    "in_progress": 32,
                    "resolved": 58,
                    "closed": 15
                },
                "by_severity": {
                    "low": 25,
                    "medium": 78,
                    "high": 35,
                    "critical": 12
                },
                "by_channel": {
                    "phone": 65,
                    "email": 45,
                    "line": 25,
                    "web": 15
                },
                "flags": {
                    "risk_flag": 8,
                    "needs_review_flag": 23
                }
            }
        }
    )


# ═══════════════════════════════════════════════════════════════════════════════
# Case Assignment and Actions
# ═══════════════════════════════════════════════════════════════════════════════

class CaseAssignmentRequest(BaseModel):
    """Request schema for assigning cases."""
    assigned_to: str = Field(..., description="User ID to assign case to")
    agent_id: Optional[str] = Field(None, description="Agent ID for the assignment")


class CaseStatusUpdateRequest(BaseModel):
    """Request schema for updating case status."""
    status: CaseStatus = Field(..., description="New case status")
    resolved_at: Optional[str] = Field(None, description="Resolution timestamp")

    @field_validator('resolved_at')
    @classmethod
    def validate_resolved_at(cls, v, info):
        if info.data.get('status') == CaseStatus.resolved and v is None:
            raise ValueError('resolved_at is required when status is resolved')
        return v