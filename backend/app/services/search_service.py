"""
Search Service

Handles search functionality including full-text search, ranking, filtering,
and analytics tracking.
"""

import re
import time
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text, and_, or_, desc, asc
from sqlalchemy.orm import selectinload

from app.models import Case, SearchAnalytic
from app.models.base import Channel, CaseStatus, Sentiment, Severity
from app.schemas.search import (
    SearchParams,
    SearchResultCase,
    SearchResponse,
    SearchAnalyticsParams,
    SearchAnalyticsResponse,
    PopularQuery,
    SearchAnalyticCreate,
    AdvancedSearchParams,
)
from app.schemas.base import ParsedQuery, SuggestedFilter, SearchFlags
from app.core.exceptions import ValidationError
import structlog

logger = structlog.get_logger(__name__)


class SearchService:
    """Service for handling search operations and analytics."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def search_cases(
        self, params: SearchParams, user_id: Optional[str] = None
    ) -> SearchResponse:
        """
        Perform full-text search on cases with ranking and filtering.

        Args:
            params: Search parameters including query and pagination
            user_id: Optional user ID for analytics tracking

        Returns:
            SearchResponse with results and metadata
        """
        start_time = time.time()

        try:
            # Parse the search query
            parsed_query = self._parse_query(params.q)

            # Build the search query
            query = self._build_search_query(parsed_query, params)

            # Execute search with pagination
            total_count = await self._get_search_count(query)

            # Apply pagination and sorting
            offset = (params.page - 1) * params.limit
            query = query.offset(offset).limit(params.limit)

            # Apply sorting
            query = self._apply_sorting(query, params.sort_by, params.sort_order)

            # Execute the query
            result = await self.db.execute(query)
            cases = result.scalars().all()

            # Convert to search result format with ranking
            search_results = []
            for case in cases:
                relevance_score = self._calculate_relevance_score(case, parsed_query)
                matched_fields = self._get_matched_fields(case, parsed_query)
                highlighted_summary = self._highlight_text(
                    case.summary, parsed_query.keywords
                )

                search_result = SearchResultCase(
                    **case.__dict__,
                    relevance_score=relevance_score,
                    matched_fields=matched_fields,
                    highlighted_summary=highlighted_summary,
                )
                search_results.append(search_result)

            # Generate suggested filters
            suggested_filters = await self._generate_suggested_filters(parsed_query)

            execution_time = int((time.time() - start_time) * 1000)

            # Track search analytics
            await self._track_search_analytics(
                query=params.q,
                result_count=total_count,
                execution_time_ms=execution_time,
                user_id=user_id,
            )

            return SearchResponse(
                results=search_results,
                total_count=total_count,
                parsed_query=parsed_query,
                suggested_filters=suggested_filters,
                execution_time_ms=execution_time,
            )

        except Exception as e:
            logger.error("Search operation failed", error=str(e), query=params.q)
            raise ValidationError(f"Search failed: {str(e)}")

    async def advanced_search_cases(
        self, params: AdvancedSearchParams, user_id: Optional[str] = None
    ) -> SearchResponse:
        """
        Perform advanced search with additional filtering options.

        Args:
            params: Advanced search parameters with filters
            user_id: Optional user ID for analytics tracking

        Returns:
            SearchResponse with filtered results
        """
        start_time = time.time()

        try:
            # Parse the search query
            parsed_query = self._parse_query(params.q)

            # Apply advanced filters to parsed query
            if params.filters:
                parsed_query = self._apply_advanced_filters(
                    parsed_query, params.filters
                )

            # Build the search query with advanced filters
            query = self._build_search_query(parsed_query, params)

            # Execute search with pagination
            total_count = await self._get_search_count(query)

            # Apply pagination and sorting
            offset = (params.page - 1) * params.limit
            query = query.offset(offset).limit(params.limit)

            # Apply sorting
            query = self._apply_sorting(query, params.sort_by, params.sort_order)

            # Execute the query
            result = await self.db.execute(query)
            cases = result.scalars().all()

            # Convert to search result format
            search_results = []
            for case in cases:
                relevance_score = self._calculate_relevance_score(case, parsed_query)
                matched_fields = self._get_matched_fields(case, parsed_query)

                highlighted_summary = None
                if params.include_highlights:
                    highlighted_summary = self._highlight_text(
                        case.summary, parsed_query.keywords
                    )

                search_result = SearchResultCase(
                    **case.__dict__,
                    relevance_score=relevance_score,
                    matched_fields=matched_fields,
                    highlighted_summary=highlighted_summary,
                )
                search_results.append(search_result)

            # Generate suggested filters if requested
            suggested_filters = []
            if params.include_suggestions:
                suggested_filters = await self._generate_suggested_filters(parsed_query)

            execution_time = int((time.time() - start_time) * 1000)

            # Track search analytics
            await self._track_search_analytics(
                query=params.q,
                result_count=total_count,
                execution_time_ms=execution_time,
                user_id=user_id,
            )

            return SearchResponse(
                results=search_results,
                total_count=total_count,
                parsed_query=parsed_query,
                suggested_filters=suggested_filters,
                execution_time_ms=execution_time,
            )

        except Exception as e:
            logger.error(
                "Advanced search operation failed", error=str(e), query=params.q
            )
            raise ValidationError(f"Advanced search failed: {str(e)}")

    async def get_search_analytics(
        self, params: SearchAnalyticsParams
    ) -> SearchAnalyticsResponse:
        """
        Get search analytics including popular queries and trends.

        Args:
            params: Analytics parameters

        Returns:
            SearchAnalyticsResponse with analytics data
        """
        try:
            # Calculate date range
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=params.days)

            # Get popular queries
            popular_queries = await self._get_popular_queries(
                start_date, end_date, params.limit
            )

            # Get total search statistics
            stats_query = select(
                func.count(SearchAnalytic.id).label("total_searches"),
                func.count(func.distinct(SearchAnalytic.normalized_query)).label(
                    "unique_queries"
                ),
                func.avg(SearchAnalytic.execution_time_ms).label("avg_execution_time"),
            ).where(SearchAnalytic.created_at >= start_date.isoformat())

            stats_result = await self.db.execute(stats_query)
            stats = stats_result.first()

            # Get search trends by day
            trends_query = (
                select(
                    func.date(SearchAnalytic.created_at).label("date"),
                    func.count(SearchAnalytic.id).label("count"),
                )
                .where(SearchAnalytic.created_at >= start_date.isoformat())
                .group_by(func.date(SearchAnalytic.created_at))
                .order_by("date")
            )

            trends_result = await self.db.execute(trends_query)
            trends_data = trends_result.all()

            # Format trends data
            search_trends = {}
            for trend in trends_data:
                search_trends[trend.date.isoformat()] = trend.count

            return SearchAnalyticsResponse(
                popular_queries=popular_queries,
                total_searches=stats.total_searches or 0,
                unique_queries=stats.unique_queries or 0,
                avg_execution_time_ms=float(stats.avg_execution_time or 0),
                search_trends=search_trends,
            )

        except Exception as e:
            logger.error("Failed to get search analytics", error=str(e))
            raise ValidationError(f"Analytics retrieval failed: {str(e)}")

    def _parse_query(self, query: str) -> ParsedQuery:
        """
        Parse search query to extract keywords, filters, and flags.

        Args:
            query: Raw search query string

        Returns:
            ParsedQuery with extracted components
        """
        # Initialize parsed query
        parsed = ParsedQuery(original_query=query)

        # Extract business unit filters (bu:value)
        bu_pattern = r"bu:([^\s]+)"
        bu_matches = re.findall(bu_pattern, query, re.IGNORECASE)
        parsed.business_units = bu_matches
        query = re.sub(bu_pattern, "", query, flags=re.IGNORECASE)

        # Extract channel filters (channel:value)
        channel_pattern = r"channel:([^\s]+)"
        channel_matches = re.findall(channel_pattern, query, re.IGNORECASE)
        parsed.channels = channel_matches
        query = re.sub(channel_pattern, "", query, flags=re.IGNORECASE)

        # Extract severity filters (severity:value)
        severity_pattern = r"severity:([^\s]+)"
        severity_matches = re.findall(severity_pattern, query, re.IGNORECASE)
        parsed.severities = severity_matches
        query = re.sub(severity_pattern, "", query, flags=re.IGNORECASE)

        # Extract category filters (category:"value" or category:value)
        category_pattern = r'category:(?:"([^"]+)"|([^\s]+))'
        category_matches = re.findall(category_pattern, query, re.IGNORECASE)
        parsed.categories = [match[0] or match[1] for match in category_matches]
        query = re.sub(category_pattern, "", query, flags=re.IGNORECASE)

        # Extract time range filters (date:value, after:value, before:value)
        time_patterns = [r"date:([^\s]+)", r"after:([^\s]+)", r"before:([^\s]+)"]
        for pattern in time_patterns:
            matches = re.findall(pattern, query, re.IGNORECASE)
            if matches:
                parsed.time_range = matches[0]
                query = re.sub(pattern, "", query, flags=re.IGNORECASE)
                break

        # Extract flags
        if re.search(r"\burgent\b", query, re.IGNORECASE):
            parsed.flags.urgent = True
            query = re.sub(r"\burgent\b", "", query, flags=re.IGNORECASE)

        if re.search(r"\brisk\b", query, re.IGNORECASE):
            parsed.flags.risk = True
            query = re.sub(r"\brisk\b", "", query, flags=re.IGNORECASE)

        if re.search(r"\breview\b", query, re.IGNORECASE):
            parsed.flags.needs_review = True
            query = re.sub(r"\breview\b", "", query, flags=re.IGNORECASE)

        # Extract remaining keywords
        keywords = re.findall(r"\b\w+\b", query)
        parsed.keywords = [kw.lower() for kw in keywords if len(kw) > 2]

        return parsed

    def _build_search_query(self, parsed_query: ParsedQuery, params: SearchParams):
        """
        Build SQLAlchemy query from parsed search parameters.

        Args:
            parsed_query: Parsed query components
            params: Search parameters

        Returns:
            SQLAlchemy query object
        """
        query = select(Case)
        conditions = []

        # Full-text search on relevant fields
        if parsed_query.keywords:
            text_conditions = []
            for keyword in parsed_query.keywords:
                keyword_pattern = f"%{keyword}%"
                text_conditions.append(
                    or_(
                        Case.summary.ilike(keyword_pattern),
                        Case.category.ilike(keyword_pattern),
                        Case.subcategory.ilike(keyword_pattern),
                        Case.customer_name.ilike(keyword_pattern),
                        Case.case_number.ilike(keyword_pattern),
                    )
                )

            if text_conditions:
                conditions.append(and_(*text_conditions))

        # Apply business unit filters
        if parsed_query.business_units:
            conditions.append(Case.business_unit.in_(parsed_query.business_units))

        # Apply channel filters
        if parsed_query.channels:
            valid_channels = []
            for channel in parsed_query.channels:
                try:
                    valid_channels.append(Channel(channel.lower()))
                except ValueError:
                    continue
            if valid_channels:
                conditions.append(Case.channel.in_(valid_channels))

        # Apply severity filters
        if parsed_query.severities:
            valid_severities = []
            for severity in parsed_query.severities:
                try:
                    valid_severities.append(Severity(severity.lower()))
                except ValueError:
                    continue
            if valid_severities:
                conditions.append(Case.severity.in_(valid_severities))

        # Apply category filters
        if parsed_query.categories:
            conditions.append(Case.category.in_(parsed_query.categories))

        # Apply flag filters
        if parsed_query.flags.risk:
            conditions.append(Case.risk_flag == True)

        if parsed_query.flags.needs_review:
            conditions.append(Case.needs_review_flag == True)

        if parsed_query.flags.urgent:
            conditions.append(Case.severity == Severity.critical)

        # Apply time range filters
        if parsed_query.time_range:
            try:
                # Parse different time formats
                if parsed_query.time_range.lower() == "today":
                    start_date = datetime.utcnow().replace(
                        hour=0, minute=0, second=0, microsecond=0
                    )
                    conditions.append(Case.created_at >= start_date.isoformat())
                elif parsed_query.time_range.lower() == "week":
                    start_date = datetime.utcnow() - timedelta(days=7)
                    conditions.append(Case.created_at >= start_date.isoformat())
                elif parsed_query.time_range.lower() == "month":
                    start_date = datetime.utcnow() - timedelta(days=30)
                    conditions.append(Case.created_at >= start_date.isoformat())
                else:
                    # Try to parse as ISO date
                    date_obj = datetime.fromisoformat(
                        parsed_query.time_range.replace("Z", "+00:00")
                    )
                    conditions.append(Case.created_at >= date_obj.isoformat())
            except ValueError:
                logger.warning(
                    "Invalid time range format", time_range=parsed_query.time_range
                )

        # Apply all conditions
        if conditions:
            query = query.where(and_(*conditions))

        return query

    async def _get_search_count(self, query) -> int:
        """Get total count for search query."""
        count_query = select(func.count()).select_from(query.subquery())
        result = await self.db.execute(count_query)
        return result.scalar() or 0

    def _apply_sorting(self, query, sort_by: str, sort_order: str):
        """Apply sorting to search query."""
        sort_column = None

        if sort_by == "relevance":
            # For relevance, we'll use created_at as a proxy since we calculate relevance in Python
            sort_column = Case.created_at
        elif sort_by == "created_at":
            sort_column = Case.created_at
        elif sort_by == "severity":
            sort_column = Case.severity
        elif sort_by == "status":
            sort_column = Case.status
        elif sort_by == "case_number":
            sort_column = Case.case_number
        else:
            sort_column = Case.created_at

        if sort_order == "desc":
            query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(asc(sort_column))

        return query

    def _calculate_relevance_score(
        self, case: Case, parsed_query: ParsedQuery
    ) -> float:
        """
        Calculate relevance score for a case based on search query.

        Args:
            case: Case object
            parsed_query: Parsed search query

        Returns:
            Relevance score between 0 and 1
        """
        score = 0.0
        max_score = 0.0

        # Score based on keyword matches
        for keyword in parsed_query.keywords:
            keyword_lower = keyword.lower()

            # Summary matches (highest weight)
            if keyword_lower in case.summary.lower():
                score += 0.4
            max_score += 0.4

            # Category matches
            if keyword_lower in case.category.lower():
                score += 0.3
            max_score += 0.3

            # Subcategory matches
            if case.subcategory and keyword_lower in case.subcategory.lower():
                score += 0.2
            max_score += 0.2

            # Customer name matches
            if case.customer_name and keyword_lower in case.customer_name.lower():
                score += 0.1
            max_score += 0.1

        # Boost score for exact filter matches
        if (
            parsed_query.business_units
            and case.business_unit in parsed_query.business_units
        ):
            score += 0.1

        if parsed_query.channels and case.channel.value in parsed_query.channels:
            score += 0.1

        if parsed_query.severities and case.severity.value in parsed_query.severities:
            score += 0.1

        # Normalize score
        if max_score > 0:
            return min(score / max_score, 1.0)
        else:
            return 0.5  # Default score when no keywords

    def _get_matched_fields(self, case: Case, parsed_query: ParsedQuery) -> List[str]:
        """Get list of fields that matched the search query."""
        matched_fields = []

        for keyword in parsed_query.keywords:
            keyword_lower = keyword.lower()

            if keyword_lower in case.summary.lower():
                matched_fields.append("summary")

            if keyword_lower in case.category.lower():
                matched_fields.append("category")

            if case.subcategory and keyword_lower in case.subcategory.lower():
                matched_fields.append("subcategory")

            if case.customer_name and keyword_lower in case.customer_name.lower():
                matched_fields.append("customer_name")

            if keyword_lower in case.case_number.lower():
                matched_fields.append("case_number")

        return list(set(matched_fields))  # Remove duplicates

    def _highlight_text(self, text: str, keywords: List[str]) -> str:
        """
        Add HTML highlighting to text for matched keywords.

        Args:
            text: Text to highlight
            keywords: Keywords to highlight

        Returns:
            Text with <mark> tags around keywords
        """
        if not keywords:
            return text

        highlighted = text
        for keyword in keywords:
            pattern = re.compile(re.escape(keyword), re.IGNORECASE)
            highlighted = pattern.sub(f"<mark>{keyword}</mark>", highlighted)

        return highlighted

    async def _generate_suggested_filters(
        self, parsed_query: ParsedQuery
    ) -> List[SuggestedFilter]:
        """Generate suggested filters based on search results."""
        suggestions = []

        try:
            # Get top business units
            bu_query = (
                select(Case.business_unit, func.count(Case.id).label("count"))
                .group_by(Case.business_unit)
                .order_by(desc("count"))
                .limit(5)
            )

            bu_result = await self.db.execute(bu_query)
            for row in bu_result:
                suggestions.append(
                    SuggestedFilter(
                        type="business_unit", value=row.business_unit, count=row.count
                    )
                )

            # Get top severities
            severity_query = (
                select(Case.severity, func.count(Case.id).label("count"))
                .group_by(Case.severity)
                .order_by(desc("count"))
                .limit(3)
            )

            severity_result = await self.db.execute(severity_query)
            for row in severity_result:
                suggestions.append(
                    SuggestedFilter(
                        type="severity", value=row.severity.value, count=row.count
                    )
                )

            # Get top channels
            channel_query = (
                select(Case.channel, func.count(Case.id).label("count"))
                .group_by(Case.channel)
                .order_by(desc("count"))
                .limit(3)
            )

            channel_result = await self.db.execute(channel_query)
            for row in channel_result:
                suggestions.append(
                    SuggestedFilter(
                        type="channel", value=row.channel.value, count=row.count
                    )
                )

        except Exception as e:
            logger.warning("Failed to generate suggested filters", error=str(e))

        return suggestions

    async def _get_popular_queries(
        self, start_date: datetime, end_date: datetime, limit: int
    ) -> List[PopularQuery]:
        """Get popular search queries within date range."""
        query = (
            select(
                SearchAnalytic.normalized_query,
                func.count(SearchAnalytic.id).label("count"),
                func.avg(SearchAnalytic.result_count).label("avg_results"),
                func.max(SearchAnalytic.created_at).label("last_searched"),
            )
            .where(SearchAnalytic.created_at >= start_date.isoformat())
            .group_by(SearchAnalytic.normalized_query)
            .order_by(desc("count"))
            .limit(limit)
        )

        result = await self.db.execute(query)
        popular_queries = []

        for row in result:
            popular_queries.append(
                PopularQuery(
                    query=row.normalized_query,
                    count=row.count,
                    avg_results=float(row.avg_results or 0),
                    last_searched=row.last_searched,
                )
            )

        return popular_queries

    async def _track_search_analytics(
        self,
        query: str,
        result_count: int,
        execution_time_ms: int,
        user_id: Optional[str] = None,
    ):
        """Track search analytics in database."""
        try:
            # Normalize query for grouping
            normalized_query = self._normalize_query(query)

            # Create analytics record
            analytics_data = SearchAnalyticCreate(
                query=query,
                normalized_query=normalized_query,
                result_count=result_count,
                execution_time_ms=execution_time_ms,
                user_id=user_id,
            )

            # Generate ID
            import uuid

            analytics_id = str(uuid.uuid4())

            # Create database record
            search_analytic = SearchAnalytic(
                id=analytics_id,
                query=analytics_data.query,
                normalized_query=analytics_data.normalized_query,
                result_count=analytics_data.result_count,
                execution_time_ms=analytics_data.execution_time_ms,
                user_id=analytics_data.user_id,
                created_at=datetime.utcnow().isoformat(),
            )

            self.db.add(search_analytic)
            await self.db.commit()

        except Exception as e:
            logger.warning("Failed to track search analytics", error=str(e))
            # Don't fail the search if analytics tracking fails
            await self.db.rollback()

    def _normalize_query(self, query: str) -> str:
        """Normalize query for analytics grouping."""
        # Convert to lowercase
        normalized = query.lower()

        # Remove special characters and extra spaces
        normalized = re.sub(r"[^\w\s]", " ", normalized)
        normalized = re.sub(r"\s+", " ", normalized).strip()

        # Sort words for consistent grouping
        words = normalized.split()
        words.sort()

        return " ".join(words)

    def _apply_advanced_filters(
        self, parsed_query: ParsedQuery, filters
    ) -> ParsedQuery:
        """Apply advanced filters to parsed query."""
        if filters.business_units:
            parsed_query.business_units.extend(filters.business_units)

        if filters.channels:
            parsed_query.channels.extend(filters.channels)

        if filters.severities:
            parsed_query.severities.extend(filters.severities)

        if filters.categories:
            parsed_query.categories.extend(filters.categories)

        if filters.risk_flag is not None:
            parsed_query.flags.risk = filters.risk_flag

        if filters.needs_review_flag is not None:
            parsed_query.flags.needs_review = filters.needs_review_flag

        # Handle date filters
        if filters.date_from or filters.date_to:
            if filters.date_from:
                parsed_query.time_range = filters.date_from

        return parsed_query
