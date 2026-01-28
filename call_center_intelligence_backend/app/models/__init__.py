"""
SQLAlchemy Models

This module exports all SQLAlchemy models that match the existing Drizzle schema.
The models are designed to work with the existing SQLite database without requiring
data migration.
"""

from app.models.base import (
    # Enums
    UserRole,
    Channel,
    CaseStatus,
    Sentiment,
    Severity,
    AlertType,
    AlertStatus,
    Trend,
    FeedItemType,
    ShareType,
    ShareSourceType,
    ShareChannel,
    ShareStatus,
    UploadStatus,
    RecomputeStatus,
    # Mixins
    TimestampMixin,
    CreatedAtMixin,
)

from app.models.json_type import JSONType
from app.models.user import User
from app.models.case import Case
from app.models.alert import Alert
from app.models.trending_topic import TrendingTopic
from app.models.feed_item import FeedItem
from app.models.share import Share
from app.models.search_analytic import SearchAnalytic
from app.models.upload import Upload
from app.models.embedding import Embedding

# Export all models for easy importing
__all__ = [
    # Enums
    "UserRole",
    "Channel", 
    "CaseStatus",
    "Sentiment",
    "Severity",
    "AlertType",
    "AlertStatus",
    "Trend",
    "FeedItemType",
    "ShareType",
    "ShareSourceType",
    "ShareChannel",
    "ShareStatus",
    "UploadStatus",
    "RecomputeStatus",
    # Mixins
    "TimestampMixin",
    "CreatedAtMixin",
    # Custom Types
    "JSONType",
    # Models
    "User",
    "Case",
    "Alert",
    "TrendingTopic",
    "FeedItem",
    "Share",
    "SearchAnalytic",
    "Upload",
    "Embedding",
]