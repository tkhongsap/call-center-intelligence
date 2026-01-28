"""
Analytics-related Pydantic schemas.

This module defines request and response schemas for analytics endpoints:
- GET /api/pulse (dashboard metrics)
- GET /api/pulse/sparklines (time series data)
- GET /api/pulse/wordcloud (word frequency data)
- GET /api/predictions (predictive analytics)
- GET /api/events (system events)
- GET /api/export (data export)
- GET /api/inbox (user notifications)
- GET /api/inbox/count (notification counts)
"""

from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, Field, ConfigDict, field_validator
from datetime import datetime

from app.schemas.base import PaginationInfo, PaginationParams, DateRangeParams


# ═══════════════════════════════════════════════════════════════════════════════
# Pulse/Dashboard Metrics
# ═══════════════════════════════════════════════════════════════════════════════

class MetricValue(BaseModel):
    """Individual metric value with trend information."""
    current: Union[int, float] = Field(..., description="Current metric value")
    previous: Union[int, float] = Field(..., description="Previous period value")
    change: float = Field(..., description="Percentage change")
    trend: str = Field(..., description="Trend direction (up, down, stable)")


class PulseMetrics(BaseModel):
    """Dashboard pulse metrics."""
    total_cases: MetricValue = Field(..., description="Total cases metric")
    open_cases: MetricValue = Field(..., description="Open cases metric")
    critical_cases: MetricValue = Field(..., description="Critical cases metric")
    avg_resolution_time: MetricValue = Field(..., description="Average resolution time")
    customer_satisfaction: MetricValue = Field(..., description="Customer satisfaction score")
    active_alerts: MetricValue = Field(..., description="Active alerts count")


class PulseResponse(BaseModel):
    """Response schema for pulse endpoint."""
    metrics: PulseMetrics = Field(..., description="Key performance metrics")
    period: str = Field(..., description="Analysis period")
    last_updated: str = Field(..., description="Last update timestamp")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "metrics": {
                    "total_cases": {
                        "current": 1250,
                        "previous": 1180,
                        "change": 5.9,
                        "trend": "up"
                    },
                    "open_cases": {
                        "current": 245,
                        "previous": 220,
                        "change": 11.4,
                        "trend": "up"
                    },
                    "critical_cases": {
                        "current": 15,
                        "previous": 12,
                        "change": 25.0,
                        "trend": "up"
                    },
                    "avg_resolution_time": {
                        "current": 4.2,
                        "previous": 4.8,
                        "change": -12.5,
                        "trend": "down"
                    },
                    "customer_satisfaction": {
                        "current": 4.3,
                        "previous": 4.1,
                        "change": 4.9,
                        "trend": "up"
                    },
                    "active_alerts": {
                        "current": 8,
                        "previous": 12,
                        "change": -33.3,
                        "trend": "down"
                    }
                },
                "period": "24h",
                "last_updated": "2024-01-15T10:30:00Z"
            }
        }
    )


# ═══════════════════════════════════════════════════════════════════════════════
# Sparklines (Time Series Data)
# ═══════════════════════════════════════════════════════════════════════════════

class SparklineDataPoint(BaseModel):
    """Individual data point in sparkline."""
    timestamp: str = Field(..., description="Data point timestamp")
    value: Union[int, float] = Field(..., description="Data point value")


class SparklineParams(BaseModel):
    """Query parameters for sparklines."""
    metric: str = Field(..., description="Metric name")
    period: str = Field("24h", description="Time period")
    business_unit: Optional[str] = Field(None, description="Business unit filter")

    @field_validator('metric')
    @classmethod
    def validate_metric(cls, v):
        allowed_metrics = [
            'cases', 'alerts', 'resolution_time', 'satisfaction',
            'volume_by_channel', 'severity_distribution'
        ]
        if v not in allowed_metrics:
            raise ValueError(f'metric must be one of: {", ".join(allowed_metrics)}')
        return v

    @field_validator('period')
    @classmethod
    def validate_period(cls, v):
        allowed_periods = ['1h', '4h', '24h', '7d', '30d']
        if v not in allowed_periods:
            raise ValueError(f'period must be one of: {", ".join(allowed_periods)}')
        return v


class SparklineResponse(BaseModel):
    """Response schema for sparklines endpoint."""
    metric: str = Field(..., description="Metric name")
    period: str = Field(..., description="Time period")
    data_points: List[SparklineDataPoint] = Field(..., description="Time series data")
    summary: Dict[str, Union[int, float]] = Field(..., description="Summary statistics")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "metric": "cases",
                "period": "24h",
                "data_points": [
                    {"timestamp": "2024-01-15T00:00:00Z", "value": 45},
                    {"timestamp": "2024-01-15T01:00:00Z", "value": 52},
                    {"timestamp": "2024-01-15T02:00:00Z", "value": 38}
                ],
                "summary": {
                    "min": 38,
                    "max": 52,
                    "avg": 45.0,
                    "total": 1080
                }
            }
        }
    )


# ═══════════════════════════════════════════════════════════════════════════════
# Word Cloud Data
# ═══════════════════════════════════════════════════════════════════════════════

class WordCloudItem(BaseModel):
    """Individual word cloud item."""
    text: str = Field(..., description="Word or phrase")
    weight: int = Field(..., description="Word frequency/weight")
    category: Optional[str] = Field(None, description="Word category")


class WordCloudParams(BaseModel):
    """Query parameters for word cloud."""
    source: str = Field("cases", description="Data source")
    period: str = Field("7d", description="Time period")
    business_unit: Optional[str] = Field(None, description="Business unit filter")
    max_words: int = Field(50, ge=10, le=200, description="Maximum number of words")

    @field_validator('source')
    @classmethod
    def validate_source(cls, v):
        allowed_sources = ['cases', 'alerts', 'trending']
        if v not in allowed_sources:
            raise ValueError(f'source must be one of: {", ".join(allowed_sources)}')
        return v


class WordCloudResponse(BaseModel):
    """Response schema for word cloud endpoint."""
    words: List[WordCloudItem] = Field(..., description="Word cloud data")
    source: str = Field(..., description="Data source")
    period: str = Field(..., description="Time period")
    total_words: int = Field(..., description="Total unique words")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "words": [
                    {"text": "login", "weight": 45, "category": "technical"},
                    {"text": "payment", "weight": 32, "category": "billing"},
                    {"text": "error", "weight": 28, "category": "technical"}
                ],
                "source": "cases",
                "period": "7d",
                "total_words": 150
            }
        }
    )


# ═══════════════════════════════════════════════════════════════════════════════
# Predictions
# ═══════════════════════════════════════════════════════════════════════════════

class PredictionItem(BaseModel):
    """Individual prediction item."""
    metric: str = Field(..., description="Predicted metric")
    current_value: Union[int, float] = Field(..., description="Current value")
    predicted_value: Union[int, float] = Field(..., description="Predicted value")
    confidence: float = Field(..., ge=0, le=1, description="Prediction confidence")
    time_horizon: str = Field(..., description="Prediction time horizon")
    factors: List[str] = Field(..., description="Contributing factors")


class PredictionsResponse(BaseModel):
    """Response schema for predictions endpoint."""
    predictions: List[PredictionItem] = Field(..., description="Prediction items")
    model_version: str = Field(..., description="Prediction model version")
    generated_at: str = Field(..., description="Prediction generation timestamp")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "predictions": [
                    {
                        "metric": "case_volume",
                        "current_value": 150,
                        "predicted_value": 180,
                        "confidence": 0.85,
                        "time_horizon": "next_24h",
                        "factors": ["seasonal_trend", "recent_spike", "business_unit_growth"]
                    }
                ],
                "model_version": "v1.2.3",
                "generated_at": "2024-01-15T10:30:00Z"
            }
        }
    )


# ═══════════════════════════════════════════════════════════════════════════════
# System Events
# ═══════════════════════════════════════════════════════════════════════════════

class SystemEvent(BaseModel):
    """System event record."""
    id: str = Field(..., description="Event ID")
    event_type: str = Field(..., description="Event type")
    description: str = Field(..., description="Event description")
    severity: str = Field(..., description="Event severity")
    user_id: Optional[str] = Field(None, description="Associated user ID")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Event metadata")
    created_at: str = Field(..., description="Event timestamp")


class EventsParams(PaginationParams, DateRangeParams):
    """Query parameters for events."""
    event_type: Optional[str] = Field(None, description="Filter by event type")
    severity: Optional[str] = Field(None, description="Filter by severity")
    user_id: Optional[str] = Field(None, description="Filter by user")


class EventsResponse(BaseModel):
    """Response schema for events endpoint."""
    events: List[SystemEvent] = Field(..., description="System events")
    pagination: PaginationInfo = Field(..., description="Pagination information")


# ═══════════════════════════════════════════════════════════════════════════════
# Data Export
# ═══════════════════════════════════════════════════════════════════════════════

class ExportParams(BaseModel):
    """Query parameters for data export."""
    entity_type: str = Field(..., description="Entity type to export")
    format: str = Field("csv", description="Export format")
    filters: Optional[Dict[str, Any]] = Field(None, description="Export filters")
    include_headers: bool = Field(True, description="Include column headers")

    @field_validator('entity_type')
    @classmethod
    def validate_entity_type(cls, v):
        allowed_types = ['cases', 'alerts', 'uploads', 'trending', 'analytics']
        if v not in allowed_types:
            raise ValueError(f'entity_type must be one of: {", ".join(allowed_types)}')
        return v

    @field_validator('format')
    @classmethod
    def validate_format(cls, v):
        allowed_formats = ['csv', 'json', 'xlsx']
        if v not in allowed_formats:
            raise ValueError(f'format must be one of: {", ".join(allowed_formats)}')
        return v


class ExportResponse(BaseModel):
    """Response schema for export endpoint."""
    download_url: str = Field(..., description="Download URL for exported file")
    file_name: str = Field(..., description="Generated file name")
    file_size: int = Field(..., description="File size in bytes")
    record_count: int = Field(..., description="Number of exported records")
    expires_at: str = Field(..., description="Download URL expiration")


# ═══════════════════════════════════════════════════════════════════════════════
# Inbox/Notifications
# ═══════════════════════════════════════════════════════════════════════════════

class InboxItem(BaseModel):
    """Inbox notification item."""
    id: str = Field(..., description="Notification ID")
    type: str = Field(..., description="Notification type")
    title: str = Field(..., description="Notification title")
    message: str = Field(..., description="Notification message")
    priority: int = Field(..., description="Notification priority")
    read: bool = Field(..., description="Read status")
    source_id: Optional[str] = Field(None, description="Source entity ID")
    source_type: Optional[str] = Field(None, description="Source entity type")
    created_at: str = Field(..., description="Creation timestamp")
    read_at: Optional[str] = Field(None, description="Read timestamp")


class InboxParams(PaginationParams):
    """Query parameters for inbox."""
    unread_only: bool = Field(False, description="Show only unread notifications")
    type: Optional[str] = Field(None, description="Filter by notification type")


class InboxResponse(BaseModel):
    """Response schema for inbox endpoint."""
    items: List[InboxItem] = Field(..., description="Inbox items")
    pagination: PaginationInfo = Field(..., description="Pagination information")
    unread_count: int = Field(..., description="Total unread count")


class InboxCountResponse(BaseModel):
    """Response schema for inbox count endpoint."""
    total: int = Field(..., description="Total notifications")
    unread: int = Field(..., description="Unread notifications")
    by_type: Dict[str, int] = Field(..., description="Count by notification type")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "total": 25,
                "unread": 8,
                "by_type": {
                    "alert": 5,
                    "escalation": 2,
                    "system": 1
                }
            }
        }
    )