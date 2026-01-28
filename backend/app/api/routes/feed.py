"""
Feed API Routes

Handles feed item management for the home dashboard.
"""

import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy import select, func, and_, or_, desc, asc
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import APIRouter, Depends, HTTPException, Query, Path

from app.core.database import get_db
from app.core.auth import (
    require_authentication,
    get_current_user,
    get_user_business_units,
)
from app.core.exceptions import NotFoundError, ValidationError, DatabaseError
from app.models.feed_item import FeedItem
from app.models.base import FeedItemType
from app.schemas.feed import (
    FeedListParams,
    FeedListResponse,
    FeedItemResponse,
    FeedItemCreate,
    FeedStatsResponse,
)
from app.schemas.serializers import EnhancedPaginationInfo
import structlog

logger = structlog.get_logger(__name__)

router = APIRouter()


def get_timestamp() -> str:
    """Get current timestamp in ISO format."""
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def get_date_range_filter(date_range: str) -> Optional[str]:
    """Convert date range string to timestamp filter."""
    now = datetime.now(timezone.utc)

    if date_range == "today":
        start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
        return start_of_day.isoformat().replace("+00:00", "Z")
    elif date_range == "7d":
        seven_days_ago = now - timedelta(days=7)
        return seven_days_ago.isoformat().replace("+00:00", "Z")
    elif date_range == "30d":
        thirty_days_ago = now - timedelta(days=30)
        return thirty_days_ago.isoformat().replace("+00:00", "Z")

    return None


async def apply_feed_filters(
    query, params: FeedListParams, user_business_units: List[str]
) -> Any:
    """Apply filtering to feed query based on parameters and user permissions."""

    # Filter out expired items
    current_time = get_timestamp()
    query = query.where(
        or_(FeedItem.expires_at.is_(None), FeedItem.expires_at > current_time)
    )

    # Apply feed item type filter
    if params.type:
        query = query.where(FeedItem.type == params.type)

    # Apply date range filtering
    date_filter = get_date_range_filter(params.date_range)
    if date_filter:
        query = query.where(FeedItem.created_at >= date_filter)

    # Business unit filtering (if metadata contains businessUnit)
    if params.bu and params.bu != "all":
        # For feed items, business unit filtering is done via metadata
        # This is a simplified approach - in a real system you might have
        # a more sophisticated JSON query
        query = query.where(
            FeedItem.item_metadata.op("->>")("businessUnit") == params.bu
        )

    return query


@router.get("/", response_model=FeedListResponse)
async def get_feed(
    params: FeedListParams = Depends(),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user),
):
    """
    Get feed items with filtering and pagination.

    Supports filtering by:
    - Feed item type (alert, trending, highlight, upload)
    - Date range (today, 7d, 30d)
    - Business unit (via metadata)

    Returns paginated results ordered by priority (descending) and creation time (descending).
    Automatically filters out expired items.
    """
    try:
        # Get user business units for filtering (if needed)
        user_business_units = ["all"]  # Default to all if no user
        if current_user:
            user_business_units = await get_user_business_units(current_user)

        # Build base query
        query = select(FeedItem)

        # Apply filters
        query = await apply_feed_filters(query, params, user_business_units)

        # Apply sorting - priority descending, then created_at descending
        query = query.order_by(desc(FeedItem.priority), desc(FeedItem.created_at))

        # Get total count for pagination
        count_query = select(func.count(FeedItem.id))
        count_query = await apply_feed_filters(count_query, params, user_business_units)
        total_result = await db.execute(count_query)
        total = total_result.scalar()

        # Apply pagination
        offset = (params.page - 1) * params.limit
        query = query.offset(offset).limit(params.limit)

        # Execute query
        result = await db.execute(query)
        feed_items = result.scalars().all()

        # Calculate pagination info
        total_pages = (total + params.limit - 1) // params.limit

        pagination = EnhancedPaginationInfo(
            page=params.page, limit=params.limit, total=total, total_pages=total_pages
        )

        logger.info(
            "Retrieved feed items",
            count=len(feed_items),
            total=total,
            page=params.page,
            type_filter=params.type.value if params.type else None,
            date_range=params.date_range,
            user_id=current_user.get("id") if current_user else None,
        )

        return FeedListResponse(
            items=[FeedItemResponse.model_validate(item) for item in feed_items],
            pagination=pagination,
        )

    except Exception as e:
        logger.error("Error retrieving feed items", error=str(e))
        raise DatabaseError(f"Failed to retrieve feed items: {str(e)}")


@router.post("/", response_model=FeedItemResponse)
async def create_feed_item(
    feed_data: FeedItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(require_authentication),
):
    """
    Create a new feed item.

    Requires authentication. The feed item will be created with the current timestamp.
    Priority management ensures important items appear first in the feed.
    """
    try:
        # Generate unique ID
        feed_id = f"feed-{uuid.uuid4().hex[:8]}"

        # Get current timestamp
        timestamp = get_timestamp()

        # Create feed item instance
        feed_item = FeedItem(
            id=feed_id,
            type=feed_data.type,
            title=feed_data.title,
            content=feed_data.content,
            priority=feed_data.priority,
            reference_id=feed_data.reference_id,
            reference_type=feed_data.reference_type,
            item_metadata=feed_data.metadata,
            expires_at=feed_data.expires_at,
            created_at=timestamp,
        )

        # Add to database
        db.add(feed_item)
        await db.commit()
        await db.refresh(feed_item)

        logger.info(
            "Created new feed item",
            feed_id=feed_id,
            type=feed_data.type.value,
            priority=feed_data.priority,
            user_id=current_user.get("id"),
        )

        return FeedItemResponse.model_validate(feed_item)

    except Exception as e:
        await db.rollback()
        logger.error("Error creating feed item", error=str(e))
        raise DatabaseError(f"Failed to create feed item: {str(e)}")


@router.get("/stats", response_model=FeedStatsResponse)
async def get_feed_stats(
    db: AsyncSession = Depends(get_db),
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user),
):
    """
    Get feed statistics including counts by type and priority.

    Returns comprehensive feed statistics for dashboard display.
    Automatically excludes expired items from statistics.
    """
    try:
        # Filter out expired items
        current_time = get_timestamp()
        base_condition = or_(
            FeedItem.expires_at.is_(None), FeedItem.expires_at > current_time
        )

        # Get total count
        total_query = select(func.count()).where(base_condition)
        total_result = await db.execute(total_query)
        total = total_result.scalar()

        # Get count by type
        type_query = (
            select(FeedItem.type, func.count().label("count"))
            .where(base_condition)
            .group_by(FeedItem.type)
        )
        type_result = await db.execute(type_query)
        type_counts = {row.type.value: row.count for row in type_result}

        # Get count by priority level (categorized)
        priority_query = (
            select(FeedItem.priority, func.count().label("count"))
            .where(base_condition)
            .group_by(FeedItem.priority)
        )
        priority_result = await db.execute(priority_query)
        priority_data = {row.priority: row.count for row in priority_result}

        # Categorize priorities
        priority_counts = {
            "high": sum(
                count for priority, count in priority_data.items() if priority >= 7
            ),
            "medium": sum(
                count for priority, count in priority_data.items() if 3 <= priority < 7
            ),
            "low": sum(
                count for priority, count in priority_data.items() if priority < 3
            ),
        }

        # Count active (non-expired) items
        active_items = total  # Since we already filtered out expired items

        logger.info(
            "Retrieved feed statistics",
            total=total,
            active_items=active_items,
            user_id=current_user.get("id") if current_user else None,
        )

        return FeedStatsResponse(
            total_items=total,
            by_type=type_counts,
            by_priority=priority_counts,
            active_items=active_items,
        )

    except Exception as e:
        logger.error("Error retrieving feed statistics", error=str(e))
        raise DatabaseError(f"Failed to retrieve feed statistics: {str(e)}")


@router.delete("/cleanup")
async def cleanup_expired_feed_items(
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(require_authentication),
):
    """
    Clean up expired feed items.

    Removes feed items that have passed their expiration time.
    Requires authentication. Returns count of deleted items.
    """
    try:
        current_time = get_timestamp()

        # Find expired items
        expired_query = select(FeedItem).where(
            and_(FeedItem.expires_at.is_not(None), FeedItem.expires_at <= current_time)
        )

        result = await db.execute(expired_query)
        expired_items = result.scalars().all()

        # Delete expired items
        for item in expired_items:
            await db.delete(item)

        await db.commit()

        deleted_count = len(expired_items)

        logger.info(
            "Cleaned up expired feed items",
            deleted_count=deleted_count,
            user_id=current_user.get("id"),
        )

        return {
            "message": f"Successfully cleaned up {deleted_count} expired feed items",
            "deleted_count": deleted_count,
        }

    except Exception as e:
        await db.rollback()
        logger.error("Error cleaning up expired feed items", error=str(e))
        raise DatabaseError(f"Failed to cleanup expired feed items: {str(e)}")
