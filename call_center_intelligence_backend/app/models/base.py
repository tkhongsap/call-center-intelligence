"""
Base model definitions and enums for the call center backend.

This module defines the base SQLAlchemy models that match the existing Drizzle schema
to ensure compatibility with the existing SQLite database.
"""

import enum
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, Boolean, Float, Text, Enum as SQLEnum, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


# ═══════════════════════════════════════════════════════════════════════════════
# Enum Definitions (matching Drizzle schema)
# ═══════════════════════════════════════════════════════════════════════════════

class UserRole(str, enum.Enum):
    """User role enumeration."""
    admin = "admin"
    bu_manager = "bu_manager"
    supervisor = "supervisor"


class Channel(str, enum.Enum):
    """Communication channel enumeration."""
    phone = "phone"
    email = "email"
    line = "line"
    web = "web"


class CaseStatus(str, enum.Enum):
    """Case status enumeration."""
    open = "open"
    in_progress = "in_progress"
    resolved = "resolved"
    closed = "closed"


class Sentiment(str, enum.Enum):
    """Sentiment enumeration."""
    positive = "positive"
    neutral = "neutral"
    negative = "negative"


class Severity(str, enum.Enum):
    """Severity level enumeration."""
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class AlertType(str, enum.Enum):
    """Alert type enumeration."""
    spike = "spike"
    threshold = "threshold"
    urgency = "urgency"
    misclassification = "misclassification"


class AlertStatus(str, enum.Enum):
    """Alert status enumeration."""
    active = "active"
    acknowledged = "acknowledged"
    resolved = "resolved"
    dismissed = "dismissed"


class Trend(str, enum.Enum):
    """Trend direction enumeration."""
    rising = "rising"
    stable = "stable"
    declining = "declining"


class FeedItemType(str, enum.Enum):
    """Feed item type enumeration."""
    alert = "alert"
    trending = "trending"
    highlight = "highlight"
    upload = "upload"


class ShareType(str, enum.Enum):
    """Share type enumeration."""
    share = "share"
    escalation = "escalation"


class ShareSourceType(str, enum.Enum):
    """Share source type enumeration."""
    alert = "alert"
    case = "case"


class ShareChannel(str, enum.Enum):
    """Share channel enumeration."""
    internal = "internal"
    email = "email"
    line = "line"


class ShareStatus(str, enum.Enum):
    """Share status enumeration."""
    pending = "pending"
    read = "read"
    actioned = "actioned"


class UploadStatus(str, enum.Enum):
    """Upload status enumeration."""
    processing = "processing"
    completed = "completed"
    failed = "failed"
    partial = "partial"


class RecomputeStatus(str, enum.Enum):
    """Recompute status enumeration."""
    pending = "pending"
    processing = "processing"
    completed = "completed"
    failed = "failed"


# ═══════════════════════════════════════════════════════════════════════════════
# Base Model Mixins
# ═══════════════════════════════════════════════════════════════════════════════

class TimestampMixin:
    """Mixin for models with timestamp fields using PostgreSQL timestamp with timezone."""
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        nullable=False,
        server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        nullable=False,
        server_default=func.now(),
        onupdate=func.now()
    )


class CreatedAtMixin:
    """Mixin for models with only created_at timestamp."""
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        nullable=False,
        server_default=func.now()
    )