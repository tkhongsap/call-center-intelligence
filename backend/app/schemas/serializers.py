"""
Enhanced serialization schemas with proper formatting.

This module provides custom serializers and formatters to ensure consistent
data formatting across all API responses, matching the original Next.js API.
"""

from typing import Any, Dict, Optional, List, Union
from datetime import datetime
from decimal import Decimal
import json
from pydantic import BaseModel, Field, ConfigDict, field_serializer, model_serializer


# ═══════════════════════════════════════════════════════════════════════════════
# Custom Serialization Mixins
# ═══════════════════════════════════════════════════════════════════════════════

class TimestampSerializerMixin(BaseModel):
    """Mixin for consistent timestamp serialization."""
    
    model_config = ConfigDict(
        # Allow field serializers to work with inherited fields
        extra='forbid',
        validate_assignment=True
    )
    
    def serialize_timestamp_field(self, value: Optional[str]) -> Optional[str]:
        """Ensure timestamps are in ISO format with Z suffix."""
        if value is None:
            return None
        
        # If already in correct format, return as-is
        if isinstance(value, str) and value.endswith('Z'):
            return value
        
        # Parse and reformat if needed
        try:
            if isinstance(value, str):
                # Handle various timestamp formats
                if 'T' in value:
                    dt = datetime.fromisoformat(value.replace('Z', '+00:00'))
                else:
                    dt = datetime.fromisoformat(value)
                return dt.strftime('%Y-%m-%dT%H:%M:%SZ')
            elif isinstance(value, datetime):
                return value.strftime('%Y-%m-%dT%H:%M:%SZ')
        except (ValueError, AttributeError):
            pass
        
        return str(value) if value else None


class NumberSerializerMixin(BaseModel):
    """Mixin for consistent number serialization."""
    
    def serialize_float_field(self, value: Optional[Union[float, int, Decimal]], precision: int = 2) -> Optional[float]:
        """Format float values with consistent precision."""
        if value is None:
            return None
        
        try:
            float_val = float(value)
            return round(float_val, precision)
        except (ValueError, TypeError):
            return None
    
    def serialize_metric_field(self, value: Optional[Union[float, int, Decimal]]) -> Optional[float]:
        """Format metric values with appropriate precision."""
        return self.serialize_float_field(value, precision=1)


class JSONFieldSerializerMixin(BaseModel):
    """Mixin for consistent JSON field serialization."""
    
    def serialize_json_field(self, value: Optional[Union[Dict, List, str]]) -> Optional[Union[Dict, List]]:
        """Ensure JSON fields are properly serialized."""
        if value is None:
            return None
        
        # If it's already a dict or list, return as-is
        if isinstance(value, (dict, list)):
            return value
        
        # If it's a string, try to parse as JSON
        if isinstance(value, str):
            try:
                return json.loads(value)
            except (json.JSONDecodeError, ValueError):
                # If parsing fails, return as string wrapped in dict
                return {"raw": value}
        
        return value


class EnumSerializerMixin(BaseModel):
    """Mixin for consistent enum serialization."""
    
    def serialize_enum_field(self, value: Any) -> Optional[str]:
        """Ensure enums are serialized as string values."""
        if value is None:
            return None
        
        # If it's an enum, get its value
        if hasattr(value, 'value'):
            return str(value.value)
        
        return str(value)


# ═══════════════════════════════════════════════════════════════════════════════
# Enhanced Pagination Response
# ═══════════════════════════════════════════════════════════════════════════════

class EnhancedPaginationInfo(BaseModel):
    """Enhanced pagination information with additional metadata."""
    
    page: int = Field(..., description="Current page number")
    limit: int = Field(..., description="Items per page")
    total: int = Field(..., description="Total number of items")
    total_pages: int = Field(..., description="Total number of pages")
    
    @model_serializer
    def serialize_pagination(self) -> Dict[str, Any]:
        """Serialize pagination with additional navigation info."""
        has_prev = self.page > 1
        has_next = self.page < self.total_pages
        
        return {
            "page": self.page,
            "limit": self.limit,
            "total": self.total,
            "total_pages": self.total_pages,
            "has_previous": has_prev,
            "has_next": has_next,
            "previous_page": self.page - 1 if has_prev else None,
            "next_page": self.page + 1 if has_next else None,
            "start_index": (self.page - 1) * self.limit + 1 if self.total > 0 else 0,
            "end_index": min(self.page * self.limit, self.total)
        }


# ═══════════════════════════════════════════════════════════════════════════════
# Enhanced Response Models with Proper Serialization
# ═══════════════════════════════════════════════════════════════════════════════

class EnhancedCaseResponse(TimestampSerializerMixin, NumberSerializerMixin, 
                          JSONFieldSerializerMixin, EnumSerializerMixin):
    """Enhanced case response with proper serialization."""
    
    # Core fields
    id: str = Field(..., description="Case ID")
    case_number: str = Field(..., description="Unique case number")
    channel: str = Field(..., description="Communication channel")
    status: str = Field(..., description="Case status")
    category: str = Field(..., description="Case category")
    subcategory: Optional[str] = Field(None, description="Case subcategory")
    sentiment: str = Field(..., description="Customer sentiment")
    severity: str = Field(..., description="Case severity")
    risk_flag: bool = Field(..., description="Risk flag indicator")
    needs_review_flag: bool = Field(..., description="Needs review flag")
    business_unit: str = Field(..., description="Business unit")
    summary: str = Field(..., description="Case summary")
    customer_name: Optional[str] = Field(None, description="Customer name")
    agent_id: Optional[str] = Field(None, description="Assigned agent ID")
    assigned_to: Optional[str] = Field(None, description="Assigned user ID")
    
    # Timestamps
    created_at: str = Field(..., description="Creation timestamp")
    updated_at: str = Field(..., description="Last update timestamp")
    resolved_at: Optional[str] = Field(None, description="Resolution timestamp")
    
    # Optional fields
    upload_id: Optional[str] = Field(None, description="Upload batch ID")
    
    @field_serializer('created_at', 'updated_at', 'resolved_at', when_used='json')
    def serialize_timestamps(self, value: Optional[str]) -> Optional[str]:
        """Serialize timestamp fields."""
        return self.serialize_timestamp_field(value)
    
    @field_serializer('channel', 'status', 'sentiment', 'severity', when_used='json')
    def serialize_enums(self, value: Any) -> Optional[str]:
        """Serialize enum fields."""
        return self.serialize_enum_field(value)
    
    model_config = ConfigDict(
        from_attributes=True,
        json_encoders={
            datetime: lambda v: v.strftime('%Y-%m-%dT%H:%M:%SZ') if v else None
        }
    )


class EnhancedAlertResponse(TimestampSerializerMixin, NumberSerializerMixin, 
                           JSONFieldSerializerMixin, EnumSerializerMixin):
    """Enhanced alert response with proper serialization."""
    
    # Core fields
    id: str = Field(..., description="Alert ID")
    type: str = Field(..., description="Alert type")
    severity: str = Field(..., description="Alert severity level")
    title: str = Field(..., description="Alert title")
    description: str = Field(..., description="Alert description")
    status: str = Field(..., description="Alert status")
    business_unit: Optional[str] = Field(None, description="Business unit")
    category: Optional[str] = Field(None, description="Alert category")
    channel: Optional[str] = Field(None, description="Related channel")
    
    # Metric values
    baseline_value: Optional[float] = Field(None, description="Baseline metric value")
    current_value: Optional[float] = Field(None, description="Current metric value")
    percentage_change: Optional[float] = Field(None, description="Percentage change")
    
    # Acknowledgment fields
    acknowledged_by: Optional[str] = Field(None, description="User who acknowledged")
    acknowledged_at: Optional[str] = Field(None, description="Acknowledgment timestamp")
    
    # Timestamps
    created_at: str = Field(..., description="Creation timestamp")
    updated_at: str = Field(..., description="Last update timestamp")
    
    @field_serializer('created_at', 'updated_at', 'acknowledged_at', when_used='json')
    def serialize_timestamps(self, value: Optional[str]) -> Optional[str]:
        """Serialize timestamp fields."""
        return self.serialize_timestamp_field(value)
    
    @field_serializer('type', 'severity', 'status', when_used='json')
    def serialize_enums(self, value: Any) -> Optional[str]:
        """Serialize enum fields."""
        return self.serialize_enum_field(value)
    
    @field_serializer('baseline_value', 'current_value', when_used='json')
    def serialize_metrics(self, value: Optional[Union[float, int, Decimal]]) -> Optional[float]:
        """Serialize metric values."""
        return self.serialize_metric_field(value)
    
    @field_serializer('percentage_change', when_used='json')
    def serialize_percentage(self, value: Optional[Union[float, int, Decimal]]) -> Optional[float]:
        """Serialize percentage values."""
        return self.serialize_float_field(value, precision=2)
    
    model_config = ConfigDict(from_attributes=True)


class EnhancedUploadResponse(TimestampSerializerMixin, NumberSerializerMixin, 
                            JSONFieldSerializerMixin, EnumSerializerMixin):
    """Enhanced upload response with proper serialization."""
    
    # Core fields
    id: str = Field(..., description="Upload ID")
    file_name: str = Field(..., description="Original file name")
    file_size: int = Field(..., description="File size in bytes")
    status: str = Field(..., description="Upload processing status")
    total_rows: int = Field(..., description="Total number of rows in file")
    success_count: int = Field(..., description="Number of successfully processed rows")
    error_count: int = Field(..., description="Number of rows with errors")
    
    # JSON fields
    errors: Optional[List[Dict[str, Any]]] = Field(None, description="List of processing errors")
    
    # User and timestamps
    uploaded_by: Optional[str] = Field(None, description="User who uploaded the file")
    created_at: str = Field(..., description="Upload creation timestamp")
    completed_at: Optional[str] = Field(None, description="Upload completion timestamp")
    
    # Recomputation fields
    recompute_status: Optional[str] = Field(None, description="Recomputation status")
    recompute_started_at: Optional[str] = Field(None, description="Recomputation start time")
    recompute_completed_at: Optional[str] = Field(None, description="Recomputation completion time")
    alerts_generated: Optional[int] = Field(None, description="Number of alerts generated")
    trending_updated: Optional[bool] = Field(None, description="Whether trending was updated")
    
    @field_serializer('file_size', when_used='json')
    def serialize_file_size_human_readable(self, value: int) -> Dict[str, Any]:
        """Format file size in both bytes and human-readable format."""
        if value is None:
            return {"bytes": 0, "human": "0 B"}
        
        human_size = value
        for unit in ['B', 'KB', 'MB', 'GB']:
            if human_size < 1024.0:
                human_readable = f"{human_size:.1f} {unit}" if unit != 'B' else f"{int(human_size)} {unit}"
                break
            human_size /= 1024.0
        else:
            human_readable = f"{human_size:.1f} TB"
        
        return {
            "bytes": value,
            "human": human_readable
        }
    
    @field_serializer('created_at', 'completed_at', 'recompute_started_at', 'recompute_completed_at', when_used='json')
    def serialize_timestamps(self, value: Optional[str]) -> Optional[str]:
        """Serialize timestamp fields."""
        return self.serialize_timestamp_field(value)
    
    @field_serializer('status', 'recompute_status', when_used='json')
    def serialize_enums(self, value: Any) -> Optional[str]:
        """Serialize enum fields."""
        return self.serialize_enum_field(value)
    
    @field_serializer('errors', when_used='json')
    def serialize_errors(self, value: Optional[Union[Dict, List, str]]) -> Optional[Union[Dict, List]]:
        """Serialize errors field."""
        return self.serialize_json_field(value)
    
    model_config = ConfigDict(from_attributes=True)


# ═══════════════════════════════════════════════════════════════════════════════
# Error Response Serializer
# ═══════════════════════════════════════════════════════════════════════════════

class EnhancedErrorResponse(TimestampSerializerMixin):
    """Enhanced error response with consistent formatting."""
    
    error: Dict[str, Any] = Field(..., description="Error information")
    
    @field_serializer('error', when_used='json')
    def serialize_error(self, value: Dict[str, Any]) -> Dict[str, Any]:
        """Ensure error response has consistent structure."""
        base_error = {
            "code": value.get("code", "UNKNOWN_ERROR"),
            "message": value.get("message", "An error occurred"),
            "timestamp": datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')
        }
        
        # Add details if present
        if "details" in value:
            base_error["details"] = value["details"]
        
        # Add field-specific information for validation errors
        if "field" in value:
            base_error["field"] = value["field"]
        
        # Add request ID if available
        if "request_id" in value:
            base_error["request_id"] = value["request_id"]
        
        return base_error


# ═══════════════════════════════════════════════════════════════════════════════
# Utility Functions for Serialization
# ═══════════════════════════════════════════════════════════════════════════════

def format_currency(amount: Optional[float], currency: str = "USD") -> Optional[str]:
    """Format currency values consistently."""
    if amount is None:
        return None
    return f"{currency} {amount:,.2f}"


def format_percentage(value: Optional[float]) -> Optional[str]:
    """Format percentage values consistently."""
    if value is None:
        return None
    return f"{value:.1f}%"


def format_duration(milliseconds: Optional[int]) -> Optional[str]:
    """Format duration in human-readable format."""
    if milliseconds is None:
        return None
    
    if milliseconds < 1000:
        return f"{milliseconds}ms"
    elif milliseconds < 60000:
        return f"{milliseconds/1000:.1f}s"
    else:
        minutes = milliseconds // 60000
        seconds = (milliseconds % 60000) // 1000
        return f"{minutes}m {seconds}s"


def sanitize_json_field(value: Any) -> Any:
    """Sanitize JSON fields to ensure they're serializable."""
    if value is None:
        return None
    
    if isinstance(value, (dict, list, str, int, float, bool)):
        return value
    
    # Try to convert to string if not serializable
    try:
        json.dumps(value)
        return value
    except (TypeError, ValueError):
        return str(value)