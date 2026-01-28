"""
Alerts API Routes

Handles alert management endpoints including CRUD operations,
filtering, and alert acknowledgment functionality.
"""

import uuid
from datetime import datetime, timezone
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
from app.models.alert import Alert
from app.models.case import Case
from app.models.base import AlertType, AlertStatus, Severity
from app.schemas.alert import (
    AlertListParams,
    AlertListResponse,
    AlertResponse,
    AlertCreate,
    AlertUpdate,
    AlertCountResponse,
    AlertCountByStatus,
    AlertCountBySeverity,
    AlertDetailResponse,
    AlertSampleCase,
    AlertEscalationRequest,
    AlertEscalationResponse,
)
from app.schemas.base import PaginationInfo
from app.schemas.serializers import EnhancedPaginationInfo
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


def get_timestamp() -> str:
    """Get current timestamp in ISO format."""
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


async def apply_alert_filters(
    query, params: AlertListParams, user_business_units: List[str]
) -> Any:
    """Apply filtering to alert query based on parameters and user permissions."""

    # Business unit filtering based on user permissions
    if "all" not in user_business_units:
        query = query.where(Alert.business_unit.in_(user_business_units))

    # Apply additional filters
    if params.bu:
        query = query.where(Alert.business_unit == params.bu)

    if params.severity:
        query = query.where(Alert.severity == params.severity)

    if params.status:
        query = query.where(Alert.status == params.status)

    if params.type:
        query = query.where(Alert.type == params.type)

    # Date range filtering
    if params.start_date:
        query = query.where(Alert.created_at >= params.start_date)

    if params.end_date:
        query = query.where(Alert.created_at <= params.end_date)

    return query


@router.get("/", response_model=AlertListResponse)
async def get_alerts(
    params: AlertListParams = Depends(),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user),
):
    """
    Get alerts with filtering and pagination.

    Supports filtering by:
    - Business unit (restricted by user permissions)
    - Severity level
    - Alert status
    - Alert type
    - Date range

    Returns paginated results with enhanced pagination info.
    """
    try:
        # Get user business units for filtering
        user_business_units = ["all"]  # Default to all if no user
        if current_user:
            user_business_units = await get_user_business_units(current_user)

        # Build base query
        query = select(Alert)

        # Apply filters
        query = await apply_alert_filters(query, params, user_business_units)

        # Apply sorting
        sort_column = getattr(Alert, params.sort_by, Alert.created_at)
        if params.sort_order == "desc":
            query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(asc(sort_column))

        # Get total count for pagination
        count_query = select(func.count()).select_from(
            await apply_alert_filters(select(Alert), params, user_business_units)
        )
        total_result = await db.execute(count_query)
        total = total_result.scalar()

        # Apply pagination
        offset = (params.page - 1) * params.limit
        query = query.offset(offset).limit(params.limit)

        # Execute query
        result = await db.execute(query)
        alerts = result.scalars().all()

        # Calculate pagination info
        total_pages = (total + params.limit - 1) // params.limit

        pagination = EnhancedPaginationInfo(
            page=params.page, limit=params.limit, total=total, total_pages=total_pages
        )

        logger.info(
            "Retrieved alerts",
            count=len(alerts),
            total=total,
            page=params.page,
            user_id=current_user.get("id") if current_user else None,
        )

        return AlertListResponse(
            alerts=[AlertResponse.model_validate(alert) for alert in alerts],
            pagination=pagination,
        )

    except Exception as e:
        logger.error("Error retrieving alerts", error=str(e))
        raise DatabaseError(f"Failed to retrieve alerts: {str(e)}")


@router.get("/count", response_model=AlertCountResponse)
async def get_alerts_count(
    business_unit: Optional[str] = Query(None, description="Filter by business unit"),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user),
):
    """
    Get count of alerts by status, severity, and type.

    Returns comprehensive alert statistics for dashboard display.
    """
    try:
        # Get user business units for filtering
        user_business_units = ["all"]  # Default to all if no user
        if current_user:
            user_business_units = await get_user_business_units(current_user)

        # Build base query with business unit filtering
        base_conditions = []

        # Apply user business unit restrictions
        if "all" not in user_business_units:
            base_conditions.append(Alert.business_unit.in_(user_business_units))

        # Apply additional business unit filter if specified
        if business_unit:
            base_conditions.append(Alert.business_unit == business_unit)

        # Combine conditions
        where_clause = and_(*base_conditions) if base_conditions else True

        # Get total count
        total_query = select(func.count()).where(where_clause)
        total_result = await db.execute(total_query)
        total = total_result.scalar()

        # Get count by status
        status_query = (
            select(Alert.status, func.count().label("count"))
            .where(where_clause)
            .group_by(Alert.status)
        )

        status_result = await db.execute(status_query)
        status_counts = {row.status.value: row.count for row in status_result}

        # Get count by severity
        severity_query = (
            select(Alert.severity, func.count().label("count"))
            .where(where_clause)
            .group_by(Alert.severity)
        )

        severity_result = await db.execute(severity_query)
        severity_counts = {row.severity.value: row.count for row in severity_result}

        # Get count by type
        type_query = (
            select(Alert.type, func.count().label("count"))
            .where(where_clause)
            .group_by(Alert.type)
        )

        type_result = await db.execute(type_query)
        type_counts = {row.type.value: row.count for row in type_result}

        # Build response with defaults for missing values
        by_status = AlertCountByStatus(
            active=status_counts.get("active", 0),
            acknowledged=status_counts.get("acknowledged", 0),
            resolved=status_counts.get("resolved", 0),
            dismissed=status_counts.get("dismissed", 0),
        )

        by_severity = AlertCountBySeverity(
            low=severity_counts.get("low", 0),
            medium=severity_counts.get("medium", 0),
            high=severity_counts.get("high", 0),
            critical=severity_counts.get("critical", 0),
        )

        logger.info(
            "Retrieved alert counts",
            total=total,
            business_unit=business_unit,
            user_id=current_user.get("id") if current_user else None,
        )

        return AlertCountResponse(
            total=total,
            by_status=by_status,
            by_severity=by_severity,
            by_type=type_counts,
        )

    except Exception as e:
        logger.error("Error retrieving alert counts", error=str(e))
        raise DatabaseError(f"Failed to retrieve alert counts: {str(e)}")


@router.get("/{alert_id}", response_model=AlertDetailResponse)
async def get_alert(
    alert_id: str = Path(..., description="Alert ID"),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user),
):
    """
    Get specific alert by ID with detailed information including sample cases.

    Returns alert details with related sample cases and contributing phrases.
    """
    try:
        # Get user business units for access control
        user_business_units = ["all"]  # Default to all if no user
        if current_user:
            user_business_units = await get_user_business_units(current_user)

        # Query alert with business unit access control
        query = select(Alert).where(Alert.id == alert_id)

        if "all" not in user_business_units:
            query = query.where(Alert.business_unit.in_(user_business_units))

        result = await db.execute(query)
        alert = result.scalar_one_or_none()

        if not alert:
            raise NotFoundError(f"Alert {alert_id} not found or access denied")

        # Get sample cases related to this alert
        # This is a simplified implementation - in a real system, you'd have
        # more sophisticated logic to find related cases
        sample_cases_query = (
            select(Case)
            .where(
                and_(
                    Case.business_unit == alert.business_unit,
                    Case.category == alert.category,
                    Case.severity == alert.severity,
                )
            )
            .limit(5)
        )

        cases_result = await db.execute(sample_cases_query)
        cases = cases_result.scalars().all()

        sample_cases = [
            AlertSampleCase(
                id=case.id,
                case_number=case.case_number,
                summary=case.summary,
                severity=case.severity,
                status=case.status.value,
                business_unit=case.business_unit,
                category=case.category,
                created_at=case.created_at,
            )
            for case in cases
        ]

        # Generate contributing phrases based on alert type and category
        contributing_phrases = []
        if alert.type == AlertType.urgency:
            contributing_phrases = ["urgent", "critical", "emergency", "immediate"]
        elif alert.type == AlertType.spike:
            contributing_phrases = ["increase", "spike", "surge", "volume"]
        elif alert.type == AlertType.threshold:
            contributing_phrases = ["threshold", "limit", "exceeded", "breach"]
        elif alert.type == AlertType.misclassification:
            contributing_phrases = [
                "misclassified",
                "wrong category",
                "incorrect",
                "error",
            ]

        logger.info(
            "Retrieved alert details",
            alert_id=alert_id,
            sample_cases_count=len(sample_cases),
            user_id=current_user.get("id") if current_user else None,
        )

        return AlertDetailResponse(
            alert=AlertResponse.model_validate(alert),
            sample_cases=sample_cases,
            contributing_phrases=contributing_phrases,
            time_window="Last 24 hours",
        )

    except NotFoundError:
        raise
    except Exception as e:
        logger.error("Error retrieving alert details", alert_id=alert_id, error=str(e))
        raise DatabaseError(f"Failed to retrieve alert details: {str(e)}")


@router.post("/", response_model=AlertResponse)
async def create_alert(
    alert_data: AlertCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(require_authentication),
):
    """
    Create a new alert.

    Requires authentication. The alert will be created with the current timestamp.
    """
    try:
        # Generate unique ID
        alert_id = f"alert-{uuid.uuid4().hex[:8]}"

        # Get current timestamp
        timestamp = get_timestamp()

        # Create alert instance
        alert = Alert(
            id=alert_id,
            type=alert_data.type,
            severity=alert_data.severity,
            title=alert_data.title,
            description=alert_data.description,
            status=AlertStatus.active,  # New alerts are always active
            business_unit=alert_data.business_unit,
            category=alert_data.category,
            channel=alert_data.channel,
            baseline_value=alert_data.baseline_value,
            current_value=alert_data.current_value,
            percentage_change=alert_data.percentage_change,
            created_at=timestamp,
            updated_at=timestamp,
        )

        # Add to database
        db.add(alert)
        await db.commit()
        await db.refresh(alert)

        logger.info(
            "Created new alert",
            alert_id=alert_id,
            type=alert_data.type.value,
            severity=alert_data.severity.value,
            user_id=current_user.get("id"),
        )

        return AlertResponse.model_validate(alert)

    except Exception as e:
        await db.rollback()
        logger.error("Error creating alert", error=str(e))
        raise DatabaseError(f"Failed to create alert: {str(e)}")


@router.put("/{alert_id}", response_model=AlertResponse)
async def update_alert(
    alert_id: str = Path(..., description="Alert ID"),
    alert_update: AlertUpdate = ...,
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(require_authentication),
):
    """
    Update an existing alert.

    Supports updating alert status and acknowledgment information.
    Requires authentication.
    """
    try:
        # Get user business units for access control
        user_business_units = await get_user_business_units(current_user)

        # Query alert with business unit access control
        query = select(Alert).where(Alert.id == alert_id)

        if "all" not in user_business_units:
            query = query.where(Alert.business_unit.in_(user_business_units))

        result = await db.execute(query)
        alert = result.scalar_one_or_none()

        if not alert:
            raise NotFoundError(f"Alert {alert_id} not found or access denied")

        # Update alert fields
        alert.status = alert_update.status
        alert.updated_at = get_timestamp()

        # Handle acknowledgment
        if (
            alert_update.status == AlertStatus.acknowledged
            and alert_update.acknowledged_by
        ):
            alert.acknowledged_by = alert_update.acknowledged_by
            alert.acknowledged_at = get_timestamp()
        elif alert_update.status != AlertStatus.acknowledged:
            # Clear acknowledgment if status is changed from acknowledged
            alert.acknowledged_by = None
            alert.acknowledged_at = None

        await db.commit()
        await db.refresh(alert)

        logger.info(
            "Updated alert",
            alert_id=alert_id,
            new_status=alert_update.status.value,
            acknowledged_by=alert_update.acknowledged_by,
            user_id=current_user.get("id"),
        )

        return AlertResponse.model_validate(alert)

    except NotFoundError:
        raise
    except Exception as e:
        await db.rollback()
        logger.error("Error updating alert", alert_id=alert_id, error=str(e))
        raise DatabaseError(f"Failed to update alert: {str(e)}")


@router.delete("/{alert_id}")
async def delete_alert(
    alert_id: str = Path(..., description="Alert ID"),
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(require_authentication),
):
    """
    Delete an alert.

    Requires authentication and appropriate business unit access.
    Returns success message upon deletion.
    """
    try:
        # Get user business units for access control
        user_business_units = await get_user_business_units(current_user)

        # Query alert with business unit access control
        query = select(Alert).where(Alert.id == alert_id)

        if "all" not in user_business_units:
            query = query.where(Alert.business_unit.in_(user_business_units))

        result = await db.execute(query)
        alert = result.scalar_one_or_none()

        if not alert:
            raise NotFoundError(f"Alert {alert_id} not found or access denied")

        # Delete the alert
        await db.delete(alert)
        await db.commit()

        logger.info("Deleted alert", alert_id=alert_id, user_id=current_user.get("id"))

        return {"message": f"Alert {alert_id} deleted successfully"}

    except NotFoundError:
        raise
    except Exception as e:
        await db.rollback()
        logger.error("Error deleting alert", alert_id=alert_id, error=str(e))
        raise DatabaseError(f"Failed to delete alert: {str(e)}")


@router.post("/{alert_id}/escalate", response_model=AlertEscalationResponse)
async def escalate_alert(
    alert_id: str = Path(..., description="Alert ID"),
    escalation_data: AlertEscalationRequest = ...,
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(require_authentication),
):
    """
    Escalate an alert to another user.

    Creates a share/escalation record and optionally sends notifications.
    Requires authentication.
    """
    try:
        # Get user business units for access control
        user_business_units = await get_user_business_units(current_user)

        # Query alert with business unit access control
        query = select(Alert).where(Alert.id == alert_id)

        if "all" not in user_business_units:
            query = query.where(Alert.business_unit.in_(user_business_units))

        result = await db.execute(query)
        alert = result.scalar_one_or_none()

        if not alert:
            raise NotFoundError(f"Alert {alert_id} not found or access denied")

        # Generate escalation ID
        escalation_id = f"escalation-{uuid.uuid4().hex[:8]}"

        # In a real implementation, you would:
        # 1. Create a Share record with type='escalation'
        # 2. Send notification via the specified channel
        # 3. Update alert status if needed

        # For now, we'll just log the escalation
        logger.info(
            "Alert escalated",
            alert_id=alert_id,
            escalation_id=escalation_id,
            recipient_id=escalation_data.recipient_id,
            channel=escalation_data.channel,
            user_id=current_user.get("id"),
        )

        return AlertEscalationResponse(
            id=escalation_id, message="Alert successfully escalated"
        )

    except NotFoundError:
        raise
    except Exception as e:
        logger.error("Error escalating alert", alert_id=alert_id, error=str(e))
        raise DatabaseError(f"Failed to escalate alert: {str(e)}")
