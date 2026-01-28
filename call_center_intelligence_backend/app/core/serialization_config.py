"""
Serialization configuration for consistent API responses.

This module defines global serialization settings and custom encoders
to ensure all API responses match the original Next.js API format.
"""

from typing import Any, Dict, Union
from datetime import datetime, date
from decimal import Decimal
from enum import Enum
import json
from pydantic import ConfigDict


# ═══════════════════════════════════════════════════════════════════════════════
# Global Serialization Configuration
# ═══════════════════════════════════════════════════════════════════════════════

# Standard model configuration for all response schemas
STANDARD_MODEL_CONFIG = ConfigDict(
    # Enable conversion from SQLAlchemy models
    from_attributes=True,
    
    # Use enum values instead of enum names
    use_enum_values=True,
    
    # Validate assignment to ensure data integrity
    validate_assignment=True,
    
    # Allow population by field name or alias
    populate_by_name=True,
    
    # Custom JSON encoders for consistent formatting
    json_encoders={
        datetime: lambda v: v.strftime('%Y-%m-%dT%H:%M:%SZ') if v else None,
        date: lambda v: v.strftime('%Y-%m-%d') if v else None,
        Decimal: lambda v: float(v) if v is not None else None,
        Enum: lambda v: v.value if v is not None else None,
    },
    
    # JSON schema configuration
    json_schema_extra={
        "additionalProperties": False
    }
)


# ═══════════════════════════════════════════════════════════════════════════════
# Custom JSON Encoder
# ═══════════════════════════════════════════════════════════════════════════════

class APIJSONEncoder(json.JSONEncoder):
    """Custom JSON encoder for API responses."""
    
    def default(self, obj: Any) -> Any:
        """Convert objects to JSON-serializable format."""
        
        # Handle datetime objects
        if isinstance(obj, datetime):
            return obj.strftime('%Y-%m-%dT%H:%M:%SZ')
        
        # Handle date objects
        if isinstance(obj, date):
            return obj.strftime('%Y-%m-%d')
        
        # Handle Decimal objects
        if isinstance(obj, Decimal):
            return float(obj)
        
        # Handle Enum objects
        if isinstance(obj, Enum):
            return obj.value
        
        # Handle sets (convert to lists)
        if isinstance(obj, set):
            return list(obj)
        
        # Let the base class handle other types
        return super().default(obj)


# ═══════════════════════════════════════════════════════════════════════════════
# Field Formatting Functions
# ═══════════════════════════════════════════════════════════════════════════════

def format_timestamp(timestamp: Union[str, datetime, None]) -> str:
    """Format timestamp to ISO string with Z suffix."""
    if timestamp is None:
        return None
    
    if isinstance(timestamp, str):
        # If already formatted correctly, return as-is
        if timestamp.endswith('Z'):
            return timestamp
        
        # Parse and reformat
        try:
            dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
            return dt.strftime('%Y-%m-%dT%H:%M:%SZ')
        except ValueError:
            return timestamp
    
    if isinstance(timestamp, datetime):
        return timestamp.strftime('%Y-%m-%dT%H:%M:%SZ')
    
    return str(timestamp)


def format_number(value: Union[int, float, Decimal, None], precision: int = 2) -> float:
    """Format numeric values with consistent precision."""
    if value is None:
        return None
    
    try:
        return round(float(value), precision)
    except (ValueError, TypeError):
        return None


def format_percentage(value: Union[int, float, Decimal, None]) -> float:
    """Format percentage values (rounded to 1 decimal place)."""
    return format_number(value, precision=1)


def format_currency(value: Union[int, float, Decimal, None]) -> float:
    """Format currency values (rounded to 2 decimal places)."""
    return format_number(value, precision=2)


def format_file_size(size_bytes: int) -> Dict[str, Any]:
    """Format file size in both bytes and human-readable format."""
    if size_bytes is None or size_bytes < 0:
        return {"bytes": 0, "human": "0 B"}
    
    size = float(size_bytes)
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size < 1024.0:
            if unit == 'B':
                human = f"{int(size)} {unit}"
            else:
                human = f"{size:.1f} {unit}"
            break
        size /= 1024.0
    else:
        human = f"{size:.1f} TB"
    
    return {
        "bytes": size_bytes,
        "human": human
    }


def format_duration(milliseconds: int) -> Dict[str, Any]:
    """Format duration in multiple units."""
    if milliseconds is None or milliseconds < 0:
        return {"milliseconds": 0, "human": "0ms"}
    
    if milliseconds < 1000:
        human = f"{milliseconds}ms"
    elif milliseconds < 60000:
        seconds = milliseconds / 1000
        human = f"{seconds:.1f}s"
    else:
        minutes = milliseconds // 60000
        seconds = (milliseconds % 60000) // 1000
        human = f"{minutes}m {seconds}s"
    
    return {
        "milliseconds": milliseconds,
        "seconds": round(milliseconds / 1000, 3),
        "human": human
    }


def sanitize_json_metadata(metadata: Any) -> Any:
    """Sanitize metadata fields to ensure JSON compatibility."""
    if metadata is None:
        return None
    
    # If it's already a dict or list, return as-is
    if isinstance(metadata, (dict, list)):
        return metadata
    
    # If it's a string, try to parse as JSON
    if isinstance(metadata, str):
        try:
            return json.loads(metadata)
        except (json.JSONDecodeError, ValueError):
            # If parsing fails, return as a simple object
            return {"raw": metadata}
    
    # For other types, try to make them JSON-serializable
    try:
        json.dumps(metadata, cls=APIJSONEncoder)
        return metadata
    except (TypeError, ValueError):
        return {"raw": str(metadata)}


# ═══════════════════════════════════════════════════════════════════════════════
# Response Formatting Utilities
# ═══════════════════════════════════════════════════════════════════════════════

def format_pagination_response(page: int, limit: int, total: int) -> Dict[str, Any]:
    """Format pagination information with navigation metadata."""
    total_pages = (total + limit - 1) // limit if total > 0 else 0
    has_prev = page > 1
    has_next = page < total_pages
    
    return {
        "page": page,
        "limit": limit,
        "total": total,
        "total_pages": total_pages,
        "has_previous": has_prev,
        "has_next": has_next,
        "previous_page": page - 1 if has_prev else None,
        "next_page": page + 1 if has_next else None,
        "start_index": (page - 1) * limit + 1 if total > 0 else 0,
        "end_index": min(page * limit, total)
    }


def format_error_response(
    code: str,
    message: str,
    details: Dict[str, Any] = None,
    field: str = None,
    request_id: str = None
) -> Dict[str, Any]:
    """Format error responses consistently."""
    error = {
        "code": code,
        "message": message,
        "timestamp": datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')
    }
    
    if details:
        error["details"] = details
    
    if field:
        error["field"] = field
    
    if request_id:
        error["request_id"] = request_id
    
    return {"error": error}


def format_success_response(
    message: str,
    data: Dict[str, Any] = None
) -> Dict[str, Any]:
    """Format success responses consistently."""
    response = {
        "success": True,
        "message": message,
        "timestamp": datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')
    }
    
    if data:
        response["data"] = data
    
    return response


# ═══════════════════════════════════════════════════════════════════════════════
# Validation Helpers
# ═══════════════════════════════════════════════════════════════════════════════

def validate_and_format_enum(value: Any, enum_class: type) -> str:
    """Validate and format enum values."""
    if value is None:
        return None
    
    # If it's already an enum instance, get its value
    if isinstance(value, enum_class):
        return value.value
    
    # If it's a string, validate it's a valid enum value
    if isinstance(value, str):
        try:
            enum_instance = enum_class(value)
            return enum_instance.value
        except ValueError:
            raise ValueError(f"Invalid {enum_class.__name__} value: {value}")
    
    raise ValueError(f"Invalid type for {enum_class.__name__}: {type(value)}")


def validate_and_format_timestamp(value: Any) -> str:
    """Validate and format timestamp values."""
    if value is None:
        return None
    
    if isinstance(value, str):
        try:
            # Parse to validate format
            dt = datetime.fromisoformat(value.replace('Z', '+00:00'))
            return dt.strftime('%Y-%m-%dT%H:%M:%SZ')
        except ValueError:
            raise ValueError(f"Invalid timestamp format: {value}")
    
    if isinstance(value, datetime):
        return value.strftime('%Y-%m-%dT%H:%M:%SZ')
    
    raise ValueError(f"Invalid timestamp type: {type(value)}")