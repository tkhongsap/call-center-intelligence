"""
Search API Routes

Handles search functionality and analytics tracking.
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.auth import get_current_user
from app.services.search_service import SearchService
from app.schemas.search import (
    SearchParams,
    SearchResponse,
    SearchAnalyticsParams,
    SearchAnalyticsResponse,
    AdvancedSearchParams,
    AdvancedSearchFilters,
)
from app.schemas.user import CurrentUserResponse
import structlog

logger = structlog.get_logger(__name__)

router = APIRouter()


@router.get("/", response_model=SearchResponse)
async def search_cases(
    q: str = Query(..., min_length=1, max_length=500, description="Search query"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    sort_by: str = Query("relevance", description="Sort field"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$", description="Sort order"),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[CurrentUserResponse] = Depends(get_current_user),
):
    """
    Perform full-text search on cases with ranking and filtering.

    Supports advanced query syntax:
    - Keywords: `login issues`
    - Business unit filter: `bu:BusinessUnitA`
    - Channel filter: `channel:phone`
    - Severity filter: `severity:high`
    - Category filter: `category:"Technical Issues"`
    - Time filters: `date:today`, `date:week`, `date:month`
    - Flags: `urgent`, `risk`, `review`

    Example queries:
    - `login issues bu:BusinessUnitA severity:high`
    - `payment problems channel:email urgent`
    - `category:"Technical Issues" date:week`
    """
    try:
        # Create search parameters
        search_params = SearchParams(
            q=q, page=page, limit=limit, sort_by=sort_by, sort_order=sort_order
        )

        # Get user ID for analytics
        user_id = current_user.id if current_user else None

        # Perform search
        search_service = SearchService(db)
        results = await search_service.search_cases(search_params, user_id)

        logger.info(
            "Search completed",
            query=q,
            result_count=results.total_count,
            execution_time_ms=results.execution_time_ms,
            user_id=user_id,
        )

        return results

    except Exception as e:
        logger.error("Search failed", error=str(e), query=q)
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


@router.post("/advanced", response_model=SearchResponse)
async def advanced_search_cases(
    search_params: AdvancedSearchParams,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[CurrentUserResponse] = Depends(get_current_user),
):
    """
    Perform advanced search with detailed filtering options.

    Supports all basic search features plus:
    - Multiple business unit filters
    - Multiple channel filters
    - Multiple severity filters
    - Multiple category filters
    - Multiple status filters
    - Date range filtering
    - Boolean flag filtering
    - Optional highlighting and suggestions
    """
    try:
        # Get user ID for analytics
        user_id = current_user.id if current_user else None

        # Perform advanced search
        search_service = SearchService(db)
        results = await search_service.advanced_search_cases(search_params, user_id)

        logger.info(
            "Advanced search completed",
            query=search_params.q,
            result_count=results.total_count,
            execution_time_ms=results.execution_time_ms,
            user_id=user_id,
            filters_applied=search_params.filters is not None,
        )

        return results

    except Exception as e:
        logger.error("Advanced search failed", error=str(e), query=search_params.q)
        raise HTTPException(status_code=500, detail=f"Advanced search failed: {str(e)}")


@router.get("/analytics", response_model=SearchAnalyticsResponse)
async def get_search_analytics(
    limit: int = Query(10, ge=1, le=50, description="Number of popular queries"),
    days: int = Query(7, ge=1, le=90, description="Number of days to analyze"),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[CurrentUserResponse] = Depends(get_current_user),
):
    """
    Get search analytics including popular queries and trends.

    Returns:
    - Most popular search queries in the specified time period
    - Total number of searches performed
    - Number of unique queries
    - Average search execution time
    - Daily search volume trends
    """
    try:
        # Create analytics parameters
        analytics_params = SearchAnalyticsParams(limit=limit, days=days)

        # Get analytics data
        search_service = SearchService(db)
        analytics = await search_service.get_search_analytics(analytics_params)

        logger.info(
            "Search analytics retrieved",
            days=days,
            popular_queries_count=len(analytics.popular_queries),
            total_searches=analytics.total_searches,
            user_id=current_user.id if current_user else None,
        )

        return analytics

    except Exception as e:
        logger.error("Failed to get search analytics", error=str(e))
        raise HTTPException(
            status_code=500, detail=f"Analytics retrieval failed: {str(e)}"
        )


@router.get("/suggestions")
async def get_search_suggestions(
    q: str = Query(..., min_length=1, description="Partial search query"),
    limit: int = Query(5, ge=1, le=20, description="Number of suggestions"),
    db: AsyncSession = Depends(get_db),
):
    """
    Get search query suggestions based on popular searches.

    Returns suggestions for autocomplete functionality based on:
    - Popular historical queries
    - Common categories and keywords
    - Business unit names
    """
    try:
        search_service = SearchService(db)

        # For now, return basic suggestions based on the query
        # This could be enhanced with a dedicated suggestions service
        suggestions = []

        # Add some common search patterns
        common_patterns = [
            f"{q} urgent",
            f"{q} high severity",
            f"{q} needs review",
            f"{q} bu:BusinessUnitA",
            f"{q} channel:phone",
        ]

        # Filter and limit suggestions
        for pattern in common_patterns[:limit]:
            if pattern.lower().startswith(q.lower()):
                suggestions.append(pattern)

        return {"suggestions": suggestions, "query": q}

    except Exception as e:
        logger.error("Failed to get search suggestions", error=str(e), query=q)
        raise HTTPException(status_code=500, detail=f"Suggestions failed: {str(e)}")
