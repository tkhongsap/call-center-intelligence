"""
Upload-related Pydantic schemas.

This module defines request and response schemas for upload endpoints:
- POST /api/upload (upload CSV file)
- GET /api/uploads (list uploads)
- GET /api/uploads/{id} (get upload details)
- POST /api/uploads/{id}/recompute (recompute upload)
- GET /api/upload/template (download CSV template)
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict, field_validator, field_serializer

from app.models.base import UploadStatus, RecomputeStatus
from app.schemas.base import (
    PaginationInfo,
    PaginationParams,
    SortParams,
    DateRangeParams,
    StatusFilter,
    UploadError,
)
from app.schemas.serializers import (
    TimestampSerializerMixin,
    NumberSerializerMixin,
    JSONFieldSerializerMixin,
    EnumSerializerMixin,
    EnhancedPaginationInfo,
)


# ═══════════════════════════════════════════════════════════════════════════════
# Upload Base Schemas
# ═══════════════════════════════════════════════════════════════════════════════

class UploadBase(BaseModel):
    """Base upload schema."""
    file_name: str = Field(..., description="Original file name")
    file_size: int = Field(..., ge=0, description="File size in bytes")
    total_rows: int = Field(..., ge=0, description="Total number of rows in file")


class UploadResponse(UploadBase, TimestampSerializerMixin, NumberSerializerMixin, 
                    JSONFieldSerializerMixin, EnumSerializerMixin):
    """Complete upload response schema with enhanced serialization."""
    id: str = Field(..., description="Upload ID")
    status: UploadStatus = Field(..., description="Upload processing status")
    success_count: int = Field(..., ge=0, description="Number of successfully processed rows")
    error_count: int = Field(..., ge=0, description="Number of rows with errors")
    errors: Optional[List[UploadError]] = Field(None, description="List of processing errors")
    uploaded_by: Optional[str] = Field(None, description="User who uploaded the file")
    created_at: str = Field(..., description="Upload creation timestamp")
    completed_at: Optional[str] = Field(None, description="Upload completion timestamp")
    
    # Recomputation fields
    recompute_status: Optional[RecomputeStatus] = Field(None, description="Recomputation status")
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

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "upload-123",
                "file_name": "cases_batch_2024.csv",
                "file_size": 1048576,
                "status": "completed",
                "total_rows": 100,
                "success_count": 95,
                "error_count": 5,
                "errors": [
                    {
                        "row": 15,
                        "column": "case_number",
                        "value": "CS-DUPLICATE",
                        "reason": "Case number already exists",
                        "suggested_fix": "Use a unique case number"
                    }
                ],
                "uploaded_by": "user-456",
                "created_at": "2024-01-15T10:30:00Z",
                "completed_at": "2024-01-15T10:32:15Z",
                "recompute_status": "completed",
                "recompute_started_at": "2024-01-15T10:32:20Z",
                "recompute_completed_at": "2024-01-15T10:33:45Z",
                "alerts_generated": 3,
                "trending_updated": True
            }
        }
    )


# ═══════════════════════════════════════════════════════════════════════════════
# Upload Request/Response for File Upload
# ═══════════════════════════════════════════════════════════════════════════════

class UploadFileResponse(BaseModel):
    """Response schema for file upload endpoint."""
    success: bool = Field(..., description="Upload success status")
    upload_id: str = Field(..., description="Upload batch ID")
    message: str = Field(..., description="Upload status message")
    total_rows: int = Field(..., description="Total rows processed")
    success_count: int = Field(..., description="Successfully processed rows")
    error_count: int = Field(..., description="Rows with errors")
    errors: Optional[List[UploadError]] = Field(None, description="Processing errors")
    inserted_case_ids: Optional[List[str]] = Field(None, description="IDs of created cases")
    recompute_status: Optional[str] = Field(None, description="Recomputation status")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "success": True,
                "upload_id": "upload-123",
                "message": "Upload completed successfully",
                "total_rows": 100,
                "success_count": 95,
                "error_count": 5,
                "errors": [
                    {
                        "row": 15,
                        "column": "case_number",
                        "value": "CS-DUPLICATE",
                        "reason": "Case number already exists",
                        "suggested_fix": "Use a unique case number"
                    }
                ],
                "inserted_case_ids": ["case-001", "case-002", "case-003"],
                "recompute_status": "pending"
            }
        }
    )


# ═══════════════════════════════════════════════════════════════════════════════
# Upload List Query Parameters
# ═══════════════════════════════════════════════════════════════════════════════

class UploadListParams(
    PaginationParams,
    SortParams,
    DateRangeParams,
    StatusFilter
):
    """Query parameters for listing uploads."""
    uploaded_by: Optional[str] = Field(None, description="Filter by uploader user ID")
    recompute_status: Optional[RecomputeStatus] = Field(None, description="Filter by recompute status")

    @field_validator('sort_by')
    @classmethod
    def validate_sort_by(cls, v):
        allowed_fields = [
            'created_at', 'completed_at', 'file_name', 'status', 
            'total_rows', 'success_count', 'error_count'
        ]
        if v not in allowed_fields:
            raise ValueError(f'sort_by must be one of: {", ".join(allowed_fields)}')
        return v


# ═══════════════════════════════════════════════════════════════════════════════
# Upload List Response
# ═══════════════════════════════════════════════════════════════════════════════

class UploadListResponse(BaseModel):
    """Response schema for upload list endpoint with enhanced pagination."""
    uploads: List[UploadResponse] = Field(..., description="List of uploads")
    pagination: EnhancedPaginationInfo = Field(..., description="Enhanced pagination information")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "uploads": [
                    {
                        "id": "upload-123",
                        "file_name": "cases_batch_2024.csv",
                        "file_size": 1048576,
                        "status": "completed",
                        "total_rows": 100,
                        "success_count": 95,
                        "error_count": 5,
                        "uploaded_by": "user-456",
                        "created_at": "2024-01-15T10:30:00Z",
                        "completed_at": "2024-01-15T10:32:15Z",
                        "recompute_status": "completed"
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
# Upload Statistics
# ═══════════════════════════════════════════════════════════════════════════════

class UploadStatsResponse(BaseModel):
    """Response schema for upload statistics."""
    total_uploads: int = Field(..., description="Total number of uploads")
    by_status: Dict[str, int] = Field(..., description="Count by upload status")
    by_recompute_status: Dict[str, int] = Field(..., description="Count by recompute status")
    total_cases_imported: int = Field(..., description="Total cases imported across all uploads")
    total_errors: int = Field(..., description="Total processing errors")
    avg_success_rate: float = Field(..., description="Average success rate percentage")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "total_uploads": 25,
                "by_status": {
                    "processing": 1,
                    "completed": 18,
                    "failed": 2,
                    "partial": 4
                },
                "by_recompute_status": {
                    "pending": 2,
                    "processing": 1,
                    "completed": 20,
                    "failed": 2
                },
                "total_cases_imported": 2450,
                "total_errors": 125,
                "avg_success_rate": 94.8
            }
        }
    )


# ═══════════════════════════════════════════════════════════════════════════════
# Recompute Request/Response
# ═══════════════════════════════════════════════════════════════════════════════

class RecomputeRequest(BaseModel):
    """Request schema for triggering recomputation."""
    force: bool = Field(False, description="Force recomputation even if already completed")


class RecomputeResponse(BaseModel):
    """Response schema for recomputation trigger."""
    success: bool = Field(..., description="Recomputation trigger success")
    message: str = Field(..., description="Status message")
    recompute_status: RecomputeStatus = Field(..., description="New recomputation status")
    started_at: str = Field(..., description="Recomputation start timestamp")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "success": True,
                "message": "Recomputation started successfully",
                "recompute_status": "processing",
                "started_at": "2024-01-15T11:00:00Z"
            }
        }
    )


# ═══════════════════════════════════════════════════════════════════════════════
# CSV Template Schema
# ═══════════════════════════════════════════════════════════════════════════════

class CSVTemplateResponse(BaseModel):
    """Response schema for CSV template download."""
    headers: List[str] = Field(..., description="CSV column headers")
    sample_data: List[Dict[str, str]] = Field(..., description="Sample data rows")
    field_descriptions: Dict[str, str] = Field(..., description="Field descriptions")
    validation_rules: Dict[str, str] = Field(..., description="Validation rules per field")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "headers": [
                    "case_number", "channel", "status", "category", "sentiment",
                    "severity", "business_unit", "summary", "customer_name", "created_at"
                ],
                "sample_data": [
                    {
                        "case_number": "CS-2024-001",
                        "channel": "phone",
                        "status": "open",
                        "category": "Technical Issues",
                        "sentiment": "negative",
                        "severity": "high",
                        "business_unit": "Business Unit A",
                        "summary": "Customer unable to login",
                        "customer_name": "John Doe",
                        "created_at": "2024-01-15T10:30:00Z"
                    }
                ],
                "field_descriptions": {
                    "case_number": "Unique identifier for the case",
                    "channel": "Communication channel (phone, email, line, web)",
                    "status": "Case status (open, in_progress, resolved, closed)",
                    "category": "Case category",
                    "sentiment": "Customer sentiment (positive, neutral, negative)",
                    "severity": "Case severity (low, medium, high, critical)",
                    "business_unit": "Business unit handling the case",
                    "summary": "Brief description of the case",
                    "customer_name": "Name of the customer (optional)",
                    "created_at": "Case creation timestamp (ISO format)"
                },
                "validation_rules": {
                    "case_number": "Required, must be unique, max 50 characters",
                    "channel": "Required, must be one of: phone, email, line, web",
                    "status": "Required, must be one of: open, in_progress, resolved, closed",
                    "business_unit": "Required, cannot be empty",
                    "summary": "Required, max 1000 characters",
                    "created_at": "Required, must be valid ISO timestamp"
                }
            }
        }
    )