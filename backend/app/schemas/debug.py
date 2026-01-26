"""
Debug and utility-related Pydantic schemas.

This module defines request and response schemas for debug and utility endpoints:
- GET /api/debug-db (database debugging)
- GET /api/demo-mode (demo mode status)
- POST /api/demo-mode (toggle demo mode)
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


# ═══════════════════════════════════════════════════════════════════════════════
# Database Debug Schemas
# ═══════════════════════════════════════════════════════════════════════════════

class TableInfo(BaseModel):
    """Database table information."""
    name: str = Field(..., description="Table name")
    row_count: int = Field(..., description="Number of rows")
    columns: List[str] = Field(..., description="Column names")
    indexes: List[str] = Field(..., description="Index names")
    size_kb: Optional[float] = Field(None, description="Table size in KB")


class DatabaseStats(BaseModel):
    """Database statistics."""
    total_tables: int = Field(..., description="Total number of tables")
    total_rows: int = Field(..., description="Total rows across all tables")
    database_size_mb: Optional[float] = Field(None, description="Database size in MB")
    last_vacuum: Optional[str] = Field(None, description="Last VACUUM timestamp")
    integrity_check: bool = Field(..., description="Database integrity status")


class DebugDbResponse(BaseModel):
    """Response schema for database debug endpoint."""
    tables: List[TableInfo] = Field(..., description="Table information")
    stats: DatabaseStats = Field(..., description="Database statistics")
    connection_info: Dict[str, Any] = Field(..., description="Connection information")
    performance_metrics: Dict[str, Any] = Field(..., description="Performance metrics")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "tables": [
                    {
                        "name": "cases",
                        "row_count": 1250,
                        "columns": ["id", "case_number", "channel", "status"],
                        "indexes": ["idx_cases_case_number", "idx_cases_business_unit"],
                        "size_kb": 245.6
                    },
                    {
                        "name": "alerts",
                        "row_count": 45,
                        "columns": ["id", "type", "severity", "status"],
                        "indexes": ["idx_alerts_status", "idx_alerts_created_at"],
                        "size_kb": 12.3
                    }
                ],
                "stats": {
                    "total_tables": 8,
                    "total_rows": 1456,
                    "database_size_mb": 2.8,
                    "last_vacuum": "2024-01-15T08:00:00Z",
                    "integrity_check": True
                },
                "connection_info": {
                    "database_path": "/app/data/call-center.db",
                    "sqlite_version": "3.40.1",
                    "journal_mode": "WAL",
                    "synchronous": "NORMAL"
                },
                "performance_metrics": {
                    "avg_query_time_ms": 15.2,
                    "cache_hit_ratio": 0.95,
                    "active_connections": 3
                }
            }
        }
    )


# ═══════════════════════════════════════════════════════════════════════════════
# Demo Mode Schemas
# ═══════════════════════════════════════════════════════════════════════════════

class DemoModeStatus(BaseModel):
    """Demo mode status information."""
    enabled: bool = Field(..., description="Whether demo mode is enabled")
    features: Dict[str, bool] = Field(..., description="Demo feature flags")
    sample_data_loaded: bool = Field(..., description="Whether sample data is loaded")
    restrictions: List[str] = Field(..., description="Active restrictions in demo mode")
    expires_at: Optional[str] = Field(None, description="Demo mode expiration")


class DemoModeResponse(BaseModel):
    """Response schema for demo mode status."""
    demo_mode: DemoModeStatus = Field(..., description="Demo mode information")
    environment: str = Field(..., description="Current environment")
    version: str = Field(..., description="Application version")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "demo_mode": {
                    "enabled": True,
                    "features": {
                        "sample_data": True,
                        "limited_uploads": True,
                        "read_only_mode": False
                    },
                    "sample_data_loaded": True,
                    "restrictions": ["max_10_uploads", "no_external_integrations"],
                    "expires_at": "2024-01-16T10:30:00Z"
                },
                "environment": "development",
                "version": "1.0.0"
            }
        }
    )


class DemoModeToggleRequest(BaseModel):
    """Request schema for toggling demo mode."""
    enabled: bool = Field(..., description="Enable or disable demo mode")
    load_sample_data: bool = Field(True, description="Load sample data when enabling")
    duration_hours: Optional[int] = Field(24, description="Demo mode duration in hours")


class DemoModeToggleResponse(BaseModel):
    """Response schema for demo mode toggle."""
    success: bool = Field(..., description="Toggle operation success")
    message: str = Field(..., description="Status message")
    demo_mode: DemoModeStatus = Field(..., description="Updated demo mode status")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "success": True,
                "message": "Demo mode enabled successfully",
                "demo_mode": {
                    "enabled": True,
                    "features": {
                        "sample_data": True,
                        "limited_uploads": True,
                        "read_only_mode": False
                    },
                    "sample_data_loaded": True,
                    "restrictions": ["max_10_uploads"],
                    "expires_at": "2024-01-16T10:30:00Z"
                }
            }
        }
    )


# ═══════════════════════════════════════════════════════════════════════════════
# System Health Schemas
# ═══════════════════════════════════════════════════════════════════════════════

class HealthCheck(BaseModel):
    """System health check information."""
    service: str = Field(..., description="Service name")
    status: str = Field(..., description="Service status (healthy, degraded, unhealthy)")
    response_time_ms: Optional[float] = Field(None, description="Response time in milliseconds")
    last_check: str = Field(..., description="Last health check timestamp")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional health details")


class SystemHealthResponse(BaseModel):
    """Response schema for system health."""
    overall_status: str = Field(..., description="Overall system status")
    services: List[HealthCheck] = Field(..., description="Individual service health")
    uptime_seconds: int = Field(..., description="System uptime in seconds")
    version: str = Field(..., description="Application version")
    environment: str = Field(..., description="Environment name")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "overall_status": "healthy",
                "services": [
                    {
                        "service": "database",
                        "status": "healthy",
                        "response_time_ms": 5.2,
                        "last_check": "2024-01-15T10:30:00Z",
                        "details": {"connection_pool": "active", "queries_per_second": 15}
                    },
                    {
                        "service": "websocket",
                        "status": "healthy",
                        "response_time_ms": 2.1,
                        "last_check": "2024-01-15T10:30:00Z",
                        "details": {"active_connections": 12}
                    }
                ],
                "uptime_seconds": 86400,
                "version": "1.0.0",
                "environment": "production"
            }
        }
    )