"""
Alert-related Pydantic schemas.

This module defines request and response schemas for alert endpoints:
- GET /api/alerts (list alerts with filtering)
- GET /api/alerts/count (get alert counts)
- GET /api/alerts/{id} (get single alert with details)
- PUT /api/alerts/{id} (update alert status)
- POST /api/alerts/{id}/escalate (escalate alert)
"""

from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict, field_validator, field_serializer

from app.models.base import AlertType, AlertStatus, Severity
from app.schemas.base import (
    PaginationInfo,
    PaginationParams,
    SortParams,
    DateRangeParams,
    BusinessUnitFilter,
    SeverityFilter,
    StatusFilter,
)
from app.schemas.serializers import (
    TimestampSerializerMixin,
    NumberSerializerMixin,
    JSONFieldSerializerMixin,
    EnumSerializerMixin,
    EnhancedPaginationInfo,
)


# ═══════════════════════════════════════════════════════════════════════════════
# Alert Base Schemas
# ═══════════════════════════════════════════════════════════════════════════════

class AlertBase(BaseModel):
    """Base alert schema with common fields."""
    type: AlertType = Field(..., description="Alert type")
    severity: Severity = Field(..., description="Alert severity level")
    title: str = Field(..., min_length=1, max_length=200, description="Alert title")
    description: str = Field(..., min_length=1, description="Alert description")
    business_unit: Optional[str] = Field(None, description="Business unit")
    category: Optional[str] = Field(None, description="Alert category")
    channel: Optional[str] = Field(None, description="Related channel")


class AlertCreate(AlertBase):
    """Schema for creating new alerts."""
    baseline_value: Optional[float] = Field(None, description="Baseline metric value")
    current_value: Optional[float] = Field(None, description="Current metric value")
    percentage_change: Optional[float] = Field(None, description="Percentage change")


class AlertUpdate(BaseModel):
    """Schema for updating alert status."""
    status: AlertStatus = Field(..., description="New alert status")
    acknowledged_by: Optional[str] = Field(None, description="User acknowledging the alert")


class AlertResponse(AlertBase, TimestampSerializerMixin, NumberSerializerMixin, 
                   JSONFieldSerializerMixin, EnumSerializerMixin):
    """Complete alert response schema with enhanced serialization."""
    id: str = Field(..., description="Alert ID")
    status: AlertStatus = Field(..., description="Alert status")
    baseline_value: Optional[float] = Field(None, description="Baseline metric value")
    current_value: Optional[float] = Field(None, description="Current metric value")
    percentage_change: Optional[float] = Field(None, description="Percentage change")
    acknowledged_by: Optional[str] = Field(None, description="User who acknowledged")
    acknowledged_at: Optional[Union[str, datetime]] = Field(None, description="Acknowledgment timestamp")
    created_at: Union[str, datetime] = Field(..., description="Creation timestamp")
    updated_at: Union[str, datetime] = Field(..., description="Last update timestamp")

    @field_serializer('created_at', 'updated_at', 'acknowledged_at')
    def serialize_datetime(self, value: Optional[Union[str, datetime]]) -> Optional[str]:
        """Serialize datetime fields to ISO format strings."""
        if value is None:
            return None
        if isinstance(value, datetime):
            return value.strftime('%Y-%m-%dT%H:%M:%SZ')
        if isinstance(value, str):
            return value
        return str(value)

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "alert-123",
                "type": "spike",
                "severity": "high",
                "title": "Case Volume Spike Detected",
                "description": "Unusual increase in case volume for Business Unit A",
                "status": "active",
                "business_unit": "Business Unit A",
                "category": "Technical Issues",
                "channel": "phone",
                "baseline_value": 45.0,
                "current_value": 78.0,
                "percentage_change": 73.3,
                "acknowledged_by": None,
                "acknowledged_at": None,
                "created_at": "2024-01-15T10:30:00Z",
                "updated_at": "2024-01-15T10:30:00Z"
            }
        }
    )


# ═══════════════════════════════════════════════════════════════════════════════
# Alert List Query Parameters
# ═══════════════════════════════════════════════════════════════════════════════

class AlertListParams(
    PaginationParams,
    SortParams,
    DateRangeParams,
    BusinessUnitFilter,
    SeverityFilter,
    StatusFilter
):
    """Query parameters for listing alerts."""
    type: Optional[AlertType] = Field(None, description="Filter by alert type")

    @field_validator('sort_by')
    @classmethod
    def validate_sort_by(cls, v):
        allowed_fields = ['created_at', 'severity', 'status', 'type', 'updated_at']
        if v not in allowed_fields:
            raise ValueError(f'sort_by must be one of: {", ".join(allowed_fields)}')
        return v


# ═══════════════════════════════════════════════════════════════════════════════
# Alert List Response
# ═══════════════════════════════════════════════════════════════════════════════

class AlertListResponse(BaseModel):
    """Response schema for alert list endpoint with enhanced pagination."""
    alerts: List[AlertResponse] = Field(..., description="List of alerts")
    pagination: EnhancedPaginationInfo = Field(..., description="Enhanced pagination information")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "alerts": [
                    {
                        "id": "alert-123",
                        "type": "spike",
                        "severity": "high",
                        "title": "Case Volume Spike Detected",
                        "description": "Unusual increase in case volume",
                        "status": "active",
                        "business_unit": "Business Unit A",
                        "category": "Technical Issues",
                        "channel": "phone",
                        "baseline_value": 45.0,
                        "current_value": 78.0,
                        "percentage_change": 73.3,
                        "acknowledged_by": None,
                        "acknowledged_at": None,
                        "created_at": "2024-01-15T10:30:00Z",
                        "updated_at": "2024-01-15T10:30:00Z"
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
# Alert Count Response
# ═══════════════════════════════════════════════════════════════════════════════

class AlertCountByStatus(BaseModel):
    """Alert count by status."""
    active: int = Field(0, description="Number of active alerts")
    acknowledged: int = Field(0, description="Number of acknowledged alerts")
    resolved: int = Field(0, description="Number of resolved alerts")
    dismissed: int = Field(0, description="Number of dismissed alerts")


class AlertCountBySeverity(BaseModel):
    """Alert count by severity."""
    low: int = Field(0, description="Number of low severity alerts")
    medium: int = Field(0, description="Number of medium severity alerts")
    high: int = Field(0, description="Number of high severity alerts")
    critical: int = Field(0, description="Number of critical alerts")


class AlertCountResponse(BaseModel):
    """Response schema for alert count endpoint."""
    total: int = Field(..., description="Total number of alerts")
    by_status: AlertCountByStatus = Field(..., description="Count by status")
    by_severity: AlertCountBySeverity = Field(..., description="Count by severity")
    by_type: Dict[str, int] = Field(..., description="Count by alert type")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "total": 15,
                "by_status": {
                    "active": 8,
                    "acknowledged": 3,
                    "resolved": 3,
                    "dismissed": 1
                },
                "by_severity": {
                    "low": 2,
                    "medium": 6,
                    "high": 5,
                    "critical": 2
                },
                "by_type": {
                    "spike": 4,
                    "threshold": 3,
                    "urgency": 5,
                    "misclassification": 3
                }
            }
        }
    )


# ═══════════════════════════════════════════════════════════════════════════════
# Alert Detail Response (with sample cases)
# ═══════════════════════════════════════════════════════════════════════════════

class AlertSampleCase(BaseModel):
    """Sample case information for alert details."""
    id: str = Field(..., description="Case ID")
    case_number: str = Field(..., description="Case number")
    summary: str = Field(..., description="Case summary")
    severity: Severity = Field(..., description="Case severity")
    status: str = Field(..., description="Case status")
    business_unit: str = Field(..., description="Business unit")
    category: str = Field(..., description="Case category")
    created_at: Union[str, datetime] = Field(..., description="Case creation timestamp")

    @field_serializer('created_at')
    def serialize_datetime(self, value: Optional[Union[str, datetime]]) -> Optional[str]:
        """Serialize datetime fields to ISO format strings."""
        if value is None:
            return None
        if isinstance(value, datetime):
            return value.strftime('%Y-%m-%dT%H:%M:%SZ')
        if isinstance(value, str):
            return value
        return str(value)

    model_config = ConfigDict(from_attributes=True)


class AlertDetailResponse(BaseModel):
    """Detailed alert response with sample cases and analysis."""
    alert: AlertResponse = Field(..., description="Alert information")
    sample_cases: List[AlertSampleCase] = Field(..., description="Related sample cases")
    contributing_phrases: List[str] = Field(..., description="Contributing keywords/phrases")
    time_window: Optional[str] = Field(None, description="Analysis time window")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "alert": {
                    "id": "alert-123",
                    "type": "urgency",
                    "severity": "high",
                    "title": "High Urgency Cases Detected",
                    "description": "Increased number of urgent cases requiring immediate attention",
                    "status": "active",
                    "business_unit": "Business Unit A",
                    "category": "Technical Issues",
                    "created_at": "2024-01-15T10:30:00Z",
                    "updated_at": "2024-01-15T10:30:00Z"
                },
                "sample_cases": [
                    {
                        "id": "case-456",
                        "case_number": "CS-2024-001",
                        "summary": "Critical system outage affecting multiple users",
                        "severity": "critical",
                        "status": "open",
                        "business_unit": "Business Unit A",
                        "category": "Technical Issues",
                        "created_at": "2024-01-15T09:45:00Z"
                    }
                ],
                "contributing_phrases": ["urgent", "critical", "outage", "emergency"],
                "time_window": "Last 24 hours"
            }
        }
    )


# ═══════════════════════════════════════════════════════════════════════════════
# Alert Escalation
# ═══════════════════════════════════════════════════════════════════════════════

class AlertEscalationRequest(BaseModel):
    """Request schema for escalating an alert."""
    recipient_id: str = Field(..., description="ID of user to escalate to")
    message: Optional[str] = Field(None, description="Escalation message")
    channel: str = Field("internal", description="Escalation channel")

    @field_validator('channel')
    @classmethod
    def validate_channel(cls, v):
        allowed_channels = ['internal', 'email', 'line']
        if v not in allowed_channels:
            raise ValueError(f'channel must be one of: {", ".join(allowed_channels)}')
        return v


class AlertEscalationResponse(BaseModel):
    """Response schema for alert escalation."""
    id: str = Field(..., description="Escalation record ID")
    message: str = Field(..., description="Success message")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id": "escalation-789",
                "message": "Alert successfully escalated"
            }
        }
    )