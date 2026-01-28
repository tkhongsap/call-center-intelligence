"""
Upload model definition.

Matches the existing Drizzle schema for the uploads table.
"""

from typing import Optional, List, Dict, Any
from sqlalchemy import String, Integer, Boolean, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import UploadStatus, RecomputeStatus, CreatedAtMixin
from app.models.json_type import JSONType


class Upload(Base, CreatedAtMixin):
    """
    Upload model matching the existing Drizzle schema.
    
    Tracks batch uploads with processing status and recomputation information.
    """
    __tablename__ = "uploads"
    
    # Primary key
    id: Mapped[str] = mapped_column(String, primary_key=True)
    
    # Required fields
    file_name: Mapped[str] = mapped_column(String, nullable=False, name="file_name")
    file_size: Mapped[int] = mapped_column(Integer, nullable=False, name="file_size")
    status: Mapped[UploadStatus] = mapped_column(SQLEnum(UploadStatus), nullable=False, default=UploadStatus.processing)
    total_rows: Mapped[int] = mapped_column(Integer, nullable=False, default=0, name="total_rows")
    success_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0, name="success_count")
    error_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0, name="error_count")
    
    # Optional fields
    errors: Mapped[Optional[List[Dict[str, Any]]]] = mapped_column(JSONType)  # JSON array of error objects
    uploaded_by: Mapped[Optional[str]] = mapped_column(String, name="uploaded_by")
    completed_at: Mapped[Optional[str]] = mapped_column(String, name="completed_at")
    
    # Recomputation status fields
    recompute_status: Mapped[Optional[RecomputeStatus]] = mapped_column(SQLEnum(RecomputeStatus), name="recompute_status")
    recompute_started_at: Mapped[Optional[str]] = mapped_column(String, name="recompute_started_at")
    recompute_completed_at: Mapped[Optional[str]] = mapped_column(String, name="recompute_completed_at")
    alerts_generated: Mapped[Optional[int]] = mapped_column(Integer, default=0, name="alerts_generated")
    trending_updated: Mapped[Optional[bool]] = mapped_column(Boolean, default=False, name="trending_updated")
    
    def __repr__(self) -> str:
        return f"<Upload(id='{self.id}', file_name='{self.file_name}', status='{self.status}', success_count={self.success_count})>"