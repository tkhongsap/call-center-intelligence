"""
Pydantic Schemas

This module exports all Pydantic schemas for request/response validation
across all API endpoints. The schemas provide proper validation, serialization,
and documentation for the FastAPI backend.
"""

# Base schemas and common types
from app.schemas.base import (
    PaginationInfo,
    PaginationParams,
    SortParams,
    DateRangeParams,
    BusinessUnitFilter,
    ChannelFilter,
    SeverityFilter,
    StatusFilter,
    ErrorResponse,
    SuccessResponse,
    FeedItemMetadata,
    UploadError,
    SearchFlags,
    ParsedQuery,
    SuggestedFilter,
    TimeWindowMetadata,
    TrendingMetadata,
)

# Alert schemas
from app.schemas.alert import (
    AlertBase,
    AlertCreate,
    AlertUpdate,
    AlertResponse,
    AlertListParams,
    AlertListResponse,
    AlertCountResponse,
    AlertCountByStatus,
    AlertCountBySeverity,
    AlertDetailResponse,
    AlertSampleCase,
    AlertEscalationRequest,
    AlertEscalationResponse,
)

# Case schemas
from app.schemas.case import (
    CaseBase,
    CaseCreate,
    CaseUpdate,
    CaseResponse,
    CaseListParams,
    CaseListResponse,
    CaseStatsResponse,
    CaseCountByStatus,
    CaseCountBySeverity,
    CaseCountByChannel,
    CaseAssignmentRequest,
    CaseStatusUpdateRequest,
)

# Feed schemas
from app.schemas.feed import (
    FeedItemBase,
    FeedItemCreate,
    FeedItemResponse,
    FeedListParams,
    FeedListResponse,
    FeedStatsResponse,
    AlertFeedMetadata,
    TrendingFeedMetadata,
    UploadFeedMetadata,
    HighlightFeedMetadata,
)

# Search schemas
from app.schemas.search import (
    SearchParams,
    SearchResultCase,
    SearchResponse,
    PopularQuery,
    SearchAnalyticsParams,
    SearchAnalyticsResponse,
    SearchAnalyticCreate,
    SearchAnalyticResponse,
    AdvancedSearchFilters,
    AdvancedSearchParams,
)

# Upload schemas
from app.schemas.upload import (
    UploadBase,
    UploadResponse,
    UploadFileResponse,
    UploadListParams,
    UploadListResponse,
    UploadStatsResponse,
    RecomputeRequest,
    RecomputeResponse,
    CSVTemplateResponse,
)

# Trending schemas
from app.schemas.trending import (
    TrendingTopicBase,
    TrendingTopicResponse,
    TrendingListParams,
    TrendingListResponse,
    TrendingTopicDetailResponse,
    TrendingComputeRequest,
    TrendingComputeResponse,
    TrendingStatsResponse,
)

# Share schemas
from app.schemas.share import (
    ShareBase,
    ShareCreate,
    ShareResponse,
    ShareListParams,
    ShareListResponse,
    ShareUpdateRequest,
    ShareCreateResponse,
)

# User schemas
from app.schemas.user import (
    UserBase,
    UserCreate,
    UserUpdate,
    UserResponse,
    LoginRequest,
    LoginResponse,
    CurrentUserResponse,
)

# Analytics schemas
from app.schemas.analytics import (
    MetricValue,
    PulseMetrics,
    PulseResponse,
    SparklineDataPoint,
    SparklineParams,
    SparklineResponse,
    WordCloudItem,
    WordCloudParams,
    WordCloudResponse,
    PredictionItem,
    PredictionsResponse,
    SystemEvent,
    EventsParams,
    EventsResponse,
    ExportParams,
    ExportResponse,
    InboxItem,
    InboxParams,
    InboxResponse,
    InboxCountResponse,
)

# Chat schemas
from app.schemas.chat import (
    ChatMessageBase,
    ChatMessageCreate,
    ChatMessageResponse,
    ChatSession,
    ChatHistoryParams,
    ChatResponse,
    ChatHistoryResponse,
)

# Debug schemas
from app.schemas.debug import (
    TableInfo,
    DatabaseStats,
    DebugDbResponse,
    DemoModeStatus,
    DemoModeResponse,
    DemoModeToggleRequest,
    DemoModeToggleResponse,
    HealthCheck,
    SystemHealthResponse,
)

# Export all schemas for easy importing
__all__ = [
    # Base schemas
    "PaginationInfo",
    "PaginationParams",
    "SortParams",
    "DateRangeParams",
    "BusinessUnitFilter",
    "ChannelFilter",
    "SeverityFilter",
    "StatusFilter",
    "ErrorResponse",
    "SuccessResponse",
    "FeedItemMetadata",
    "UploadError",
    "SearchFlags",
    "ParsedQuery",
    "SuggestedFilter",
    "TimeWindowMetadata",
    "TrendingMetadata",
    
    # Alert schemas
    "AlertBase",
    "AlertCreate",
    "AlertUpdate",
    "AlertResponse",
    "AlertListParams",
    "AlertListResponse",
    "AlertCountResponse",
    "AlertCountByStatus",
    "AlertCountBySeverity",
    "AlertDetailResponse",
    "AlertSampleCase",
    "AlertEscalationRequest",
    "AlertEscalationResponse",
    
    # Case schemas
    "CaseBase",
    "CaseCreate",
    "CaseUpdate",
    "CaseResponse",
    "CaseListParams",
    "CaseListResponse",
    "CaseStatsResponse",
    "CaseCountByStatus",
    "CaseCountBySeverity",
    "CaseCountByChannel",
    "CaseAssignmentRequest",
    "CaseStatusUpdateRequest",
    
    # Feed schemas
    "FeedItemBase",
    "FeedItemCreate",
    "FeedItemResponse",
    "FeedListParams",
    "FeedListResponse",
    "FeedStatsResponse",
    "AlertFeedMetadata",
    "TrendingFeedMetadata",
    "UploadFeedMetadata",
    "HighlightFeedMetadata",
    
    # Search schemas
    "SearchParams",
    "SearchResultCase",
    "SearchResponse",
    "PopularQuery",
    "SearchAnalyticsParams",
    "SearchAnalyticsResponse",
    "SearchAnalyticCreate",
    "SearchAnalyticResponse",
    "AdvancedSearchFilters",
    "AdvancedSearchParams",
    
    # Upload schemas
    "UploadBase",
    "UploadResponse",
    "UploadFileResponse",
    "UploadListParams",
    "UploadListResponse",
    "UploadStatsResponse",
    "RecomputeRequest",
    "RecomputeResponse",
    "CSVTemplateResponse",
    
    # Trending schemas
    "TrendingTopicBase",
    "TrendingTopicResponse",
    "TrendingListParams",
    "TrendingListResponse",
    "TrendingTopicDetailResponse",
    "TrendingComputeRequest",
    "TrendingComputeResponse",
    "TrendingStatsResponse",
    
    # Share schemas
    "ShareBase",
    "ShareCreate",
    "ShareResponse",
    "ShareListParams",
    "ShareListResponse",
    "ShareUpdateRequest",
    "ShareCreateResponse",
    
    # User schemas
    "UserBase",
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    "LoginRequest",
    "LoginResponse",
    "CurrentUserResponse",
    
    # Analytics schemas
    "MetricValue",
    "PulseMetrics",
    "PulseResponse",
    "SparklineDataPoint",
    "SparklineParams",
    "SparklineResponse",
    "WordCloudItem",
    "WordCloudParams",
    "WordCloudResponse",
    "PredictionItem",
    "PredictionsResponse",
    "SystemEvent",
    "EventsParams",
    "EventsResponse",
    "ExportParams",
    "ExportResponse",
    "InboxItem",
    "InboxParams",
    "InboxResponse",
    "InboxCountResponse",
    
    # Chat schemas
    "ChatMessageBase",
    "ChatMessageCreate",
    "ChatMessageResponse",
    "ChatSession",
    "ChatHistoryParams",
    "ChatResponse",
    "ChatHistoryResponse",
    
    # Debug schemas
    "TableInfo",
    "DatabaseStats",
    "DebugDbResponse",
    "DemoModeStatus",
    "DemoModeResponse",
    "DemoModeToggleRequest",
    "DemoModeToggleResponse",
    "HealthCheck",
    "SystemHealthResponse",
]