"""
Cases API Routes

Handles customer service case management using incident data.
Maps incidents to case format for frontend compatibility.
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
from app.models.incident import Incident
from app.models.base import Channel, CaseStatus, Sentiment, Severity
from app.schemas.case import (
    CaseListParams,
    CaseListResponse,
    CaseResponse,
    CaseCreate,
    CaseUpdate,
    CaseStatsResponse,
    CaseCountByStatus,
    CaseCountBySeverity,
    CaseCountByChannel,
    CaseAssignmentRequest,
    CaseStatusUpdateRequest,
)
from app.schemas.serializers import EnhancedPaginationInfo
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


def get_timestamp() -> str:
    """Get current timestamp in ISO format."""
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def map_incident_status_to_case_status(status: Optional[str]) -> str:
    """Map incident status to case status enum."""
    if not status:
        return "open"
    
    status_lower = status.lower()
    
    # Map to case status
    if 'closed' in status_lower or 'ปิด' in status_lower:
        return "closed"
    elif 'resolved' in status_lower or 'เสร็จสิ้น' in status_lower:
        return "resolved"
    elif 'progress' in status_lower or 'กำลังดำเนินการ' in status_lower:
        return "in_progress"
    else:
        return "open"


def map_incident_to_severity(status: Optional[str]) -> str:
    """Map incident status to severity level."""
    if not status:
        return "medium"
    
    status_lower = status.lower()
    
    if 'urgent' in status_lower or 'critical' in status_lower or 'ด่วน' in status_lower:
        return "critical"
    elif 'high' in status_lower or 'สูง' in status_lower:
        return "high"
    elif 'low' in status_lower or 'ต่ำ' in status_lower:
        return "low"
    else:
        return "medium"


def map_incident_to_channel(contact_channel: Optional[str]) -> str:
    """Map incident contact channel to case channel."""
    if not contact_channel:
        return "phone"
    
    channel_lower = contact_channel.lower()
    
    if 'email' in channel_lower:
        return "email"
    elif 'line' in channel_lower:
        return "line"
    elif 'web' in channel_lower or 'online' in channel_lower:
        return "web"
    else:
        return "phone"


def incident_to_case_response(incident: Incident) -> Dict[str, Any]:
    """Convert incident to case response format."""
    timestamp = incident.received_date or incident.created_at
    if timestamp and timestamp.tzinfo is None:
        timestamp = timestamp.replace(tzinfo=timezone.utc)
    
    created_at = timestamp.isoformat().replace("+00:00", "Z") if timestamp else get_timestamp()
    
    # Map closed_date to resolved_at
    resolved_at = None
    if incident.closed_date:
        if incident.closed_date.tzinfo is None:
            resolved_at = incident.closed_date.replace(tzinfo=timezone.utc).isoformat().replace("+00:00", "Z")
        else:
            resolved_at = incident.closed_date.isoformat().replace("+00:00", "Z")
    
    return {
        "id": str(incident.id),
        "case_number": incident.incident_number,
        "channel": map_incident_to_channel(incident.contact_channel),
        "status": map_incident_status_to_case_status(incident.status),
        "category": incident.issue_type or "General",
        "subcategory": incident.issue_subtype_1,
        "sentiment": "neutral",  # Default sentiment
        "severity": map_incident_to_severity(incident.status),
        "risk_flag": False,  # Default
        "needs_review_flag": False,  # Default
        "business_unit": incident.product_group or "General",
        "summary": incident.subject or incident.details or "No summary",
        "customer_name": incident.customer_name,
        "agent_id": incident.receiver,
        "assigned_to": incident.receiver,
        "created_at": created_at,
        "updated_at": created_at,
        "resolved_at": resolved_at,
        "upload_id": incident.upload_id,
    }


async def apply_case_filters(
    query, params: CaseListParams, user_business_units: List[str]
) -> Any:
    """Apply filtering to incident query based on case parameters."""

    # Apply status filter (map case status to incident status)
    if params.status:
        if params.status == "closed":
            query = query.where(
                or_(
                    func.lower(Incident.status).contains('closed'),
                    func.lower(Incident.status).contains('ปิด')
                )
            )
        elif params.status == "resolved":
            query = query.where(
                or_(
                    func.lower(Incident.status).contains('resolved'),
                    func.lower(Incident.status).contains('เสร็จสิ้น')
                )
            )
        elif params.status == "in_progress":
            query = query.where(
                or_(
                    func.lower(Incident.status).contains('progress'),
                    func.lower(Incident.status).contains('กำลังดำเนินการ')
                )
            )
        elif params.status == "open":
            query = query.where(
                or_(
                    func.lower(Incident.status).contains('open'),
                    func.lower(Incident.status).contains('pending'),
                    func.lower(Incident.status).contains('เปิด'),
                    func.lower(Incident.status).contains('รอ')
                )
            )

    # Apply severity filter (map to incident status)
    if params.severity:
        if params.severity == "critical":
            query = query.where(
                or_(
                    func.lower(Incident.status).contains('urgent'),
                    func.lower(Incident.status).contains('critical'),
                    func.lower(Incident.status).contains('ด่วน')
                )
            )

    # Apply category filter (map to issue_type)
    if params.category:
        query = query.where(
            func.lower(Incident.issue_type).contains(params.category.lower())
        )

    # Apply business unit filter (map to product_group)
    if params.bu:
        query = query.where(
            func.lower(Incident.product_group).contains(params.bu.lower())
        )

    # Search in incident fields
    if params.search:
        search_term = f"%{params.search}%"
        query = query.where(
            or_(
                Incident.subject.ilike(search_term),
                Incident.details.ilike(search_term),
                Incident.incident_number.ilike(search_term),
                Incident.customer_name.ilike(search_term),
            )
        )

    # Date range filtering
    if params.start_date:
        query = query.where(
            or_(
                Incident.received_date >= params.start_date,
                and_(
                    Incident.received_date.is_(None),
                    Incident.created_at >= params.start_date
                )
            )
        )

    if params.end_date:
        query = query.where(
            or_(
                Incident.received_date <= params.end_date,
                and_(
                    Incident.received_date.is_(None),
                    Incident.created_at <= params.end_date
                )
            )
        )

    return query


@router.get("/", response_model=CaseListResponse)
async def get_cases(
    params: CaseListParams = Depends(),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user),
):
    """
    Get cases with filtering and pagination.

    Supports filtering by:
    - Business unit (restricted by user permissions)
    - Channel (phone, email, line, web)
    - Status (open, in_progress, resolved, closed)
    - Severity level (low, medium, high, critical)
    - Category and subcategory
    - Assignment status
    - Risk and review flags
    - Upload batch
    - Date range
    - Text search in summary, case number, and customer name

    Returns paginated results with enhanced pagination info.
    """
    try:
        # Get user business units for filtering
        user_business_units = ["all"]  # Default to all if no user
        if current_user:
            user_business_units = await get_user_business_units(current_user)

        # Build base query
        query = select(Case)

        # Apply filters
        query = await apply_case_filters(query, params, user_business_units)

        # Apply sorting
        sort_column = getattr(Case, params.sort_by, Case.created_at)
        if params.sort_order == "desc":
            query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(asc(sort_column))

        # Get total count for pagination
        count_query = select(func.count()).select_from(
            (
                await apply_case_filters(select(Case), params, user_business_units)
            ).subquery()
        )
        total_result = await db.execute(count_query)
        total = total_result.scalar()

        # Apply pagination
        offset = (params.page - 1) * params.limit
        query = query.offset(offset).limit(params.limit)

        # Execute query
        result = await db.execute(query)
        cases = result.scalars().all()

        # Calculate pagination info
        total_pages = (total + params.limit - 1) // params.limit

        pagination = EnhancedPaginationInfo(
            page=params.page, limit=params.limit, total=total, total_pages=total_pages
        )

        logger.info(f"Retrieved cases Count: {len(cases)} Total: {total} Page: {params.page} User_Id: {current_user.get('id') if current_user else None}")

        return CaseListResponse(
            cases=[CaseResponse.model_validate(case) for case in cases],
            pagination=pagination,
        )

    except Exception as e:
        logger.error(f"Error retrieving cases Error: {str(e)}")
        raise DatabaseError(f"Failed to retrieve cases: {str(e)}")


@router.get("/stats", response_model=CaseStatsResponse)
async def get_cases_stats(
    business_unit: Optional[str] = Query(None, description="Filter by business unit"),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user),
):
    """
    Get case statistics by status, severity, channel, and flags.

    Returns comprehensive case statistics for dashboard display.
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
            base_conditions.append(Case.business_unit.in_(user_business_units))

        # Apply additional business unit filter if specified
        if business_unit:
            base_conditions.append(Case.business_unit == business_unit)

        # Combine conditions
        where_clause = and_(*base_conditions) if base_conditions else True

        # Get total count
        total_query = select(func.count()).where(where_clause)
        total_result = await db.execute(total_query)
        total = total_result.scalar()

        # Get count by status
        status_query = (
            select(Case.status, func.count().label("count"))
            .where(where_clause)
            .group_by(Case.status)
        )

        status_result = await db.execute(status_query)
        status_counts = {row.status.value: row.count for row in status_result}

        # Get count by severity
        severity_query = (
            select(Case.severity, func.count().label("count"))
            .where(where_clause)
            .group_by(Case.severity)
        )

        severity_result = await db.execute(severity_query)
        severity_counts = {row.severity.value: row.count for row in severity_result}

        # Get count by channel
        channel_query = (
            select(Case.channel, func.count().label("count"))
            .where(where_clause)
            .group_by(Case.channel)
        )

        channel_result = await db.execute(channel_query)
        channel_counts = {row.channel.value: row.count for row in channel_result}

        # Get count by flags
        risk_flag_query = select(func.count()).where(
            and_(where_clause, Case.risk_flag == True)
        )
        risk_flag_result = await db.execute(risk_flag_query)
        risk_flag_count = risk_flag_result.scalar()

        needs_review_flag_query = select(func.count()).where(
            and_(where_clause, Case.needs_review_flag == True)
        )
        needs_review_flag_result = await db.execute(needs_review_flag_query)
        needs_review_flag_count = needs_review_flag_result.scalar()

        # Build response with defaults for missing values
        by_status = CaseCountByStatus(
            open=status_counts.get("open", 0),
            in_progress=status_counts.get("in_progress", 0),
            resolved=status_counts.get("resolved", 0),
            closed=status_counts.get("closed", 0),
        )

        by_severity = CaseCountBySeverity(
            low=severity_counts.get("low", 0),
            medium=severity_counts.get("medium", 0),
            high=severity_counts.get("high", 0),
            critical=severity_counts.get("critical", 0),
        )

        by_channel = CaseCountByChannel(
            phone=channel_counts.get("phone", 0),
            email=channel_counts.get("email", 0),
            line=channel_counts.get("line", 0),
            web=channel_counts.get("web", 0),
        )

        flags = {
            "risk_flag": risk_flag_count,
            "needs_review_flag": needs_review_flag_count,
        }

        logger.info(f"Retrieved case statistics Total: {total} Business_Unit: {business_unit} User_Id: {current_user.get('id') if current_user else None}")

        return CaseStatsResponse(
            total=total,
            by_status=by_status,
            by_severity=by_severity,
            by_channel=by_channel,
            flags=flags,
        )

    except Exception as e:
        logger.error(f"Error retrieving case statistics Error: {str(e)}")
        raise DatabaseError(f"Failed to retrieve case statistics: {str(e)}")


@router.get("/{case_id}", response_model=CaseResponse)
async def get_case(
    case_id: str = Path(..., description="Case ID"),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user),
):
    """
    Get specific case by ID.

    Returns detailed case information including all fields and metadata.
    Access is restricted by user business unit permissions.
    """
    try:
        # Get user business units for access control
        user_business_units = ["all"]  # Default to all if no user
        if current_user:
            user_business_units = await get_user_business_units(current_user)

        # Query case with business unit access control
        query = select(Case).where(Case.id == case_id)

        if "all" not in user_business_units:
            query = query.where(Case.business_unit.in_(user_business_units))

        result = await db.execute(query)
        case = result.scalar_one_or_none()

        if not case:
            raise NotFoundError(f"Case {case_id} not found or access denied")

        logger.info(f"Retrieved case details Case_Id: {case_id} Case_Number: {case.case_number} User_Id: {current_user.get('id') if current_user else None}")

        return CaseResponse.model_validate(case)

    except NotFoundError:
        raise
    except Exception as e:
        logger.error(f"Error retrieving case details Case_Id: {case_id} Error: {str(e)}")
        raise DatabaseError(f"Failed to retrieve case details: {str(e)}")


@router.post("/", response_model=CaseResponse)
async def create_case(
    case_data: CaseCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(require_authentication),
):
    """
    Create a new case.

    Requires authentication. The case will be created with the current timestamp
    and a unique case number will be generated.
    """
    try:
        # Generate unique ID and case number
        case_id = f"case-{uuid.uuid4().hex[:8]}"

        # Generate case number in format CS-YYYY-NNNN
        current_year = datetime.now().year

        # Get the highest case number for this year to generate next sequential number
        case_number_query = select(func.max(Case.case_number)).where(
            Case.case_number.like(f"CS-{current_year}-%")
        )
        result = await db.execute(case_number_query)
        max_case_number = result.scalar()

        if max_case_number:
            # Extract the number part and increment
            number_part = int(max_case_number.split("-")[-1])
            next_number = number_part + 1
        else:
            # First case of the year
            next_number = 1

        case_number = f"CS-{current_year}-{next_number:04d}"

        # Get current timestamp
        timestamp = get_timestamp()

        # Create case instance
        case = Case(
            id=case_id,
            case_number=case_number,
            channel=case_data.channel,
            status=CaseStatus.open,  # New cases are always open
            category=case_data.category,
            subcategory=case_data.subcategory,
            sentiment=case_data.sentiment,
            severity=case_data.severity,
            risk_flag=case_data.risk_flag,
            needs_review_flag=case_data.needs_review_flag,
            business_unit=case_data.business_unit,
            summary=case_data.summary,
            customer_name=case_data.customer_name,
            agent_id=case_data.agent_id,
            assigned_to=case_data.assigned_to,
            created_at=timestamp,
            updated_at=timestamp,
        )

        # Add to database
        db.add(case)
        await db.commit()
        await db.refresh(case)

        logger.info(f"Created new case Case_Id: {case_id} Case_Number: {case_number} Channel: {case_data.channel.value} Severity: {case_data.severity.value} Business_Unit: {case_data.business_unit} User_Id: {current_user.get('id')}")

        return CaseResponse.model_validate(case)

    except Exception as e:
        await db.rollback()
        logger.error(f"Error creating case Error: {str(e)}")
        raise DatabaseError(f"Failed to create case: {str(e)}")


@router.put("/{case_id}", response_model=CaseResponse)
async def update_case(
    case_id: str = Path(..., description="Case ID"),
    case_update: CaseUpdate = ...,
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(require_authentication),
):
    """
    Update an existing case.

    Supports updating case status, assignment, categorization, and other fields.
    Requires authentication and appropriate business unit access.
    """
    try:
        # Get user business units for access control
        user_business_units = await get_user_business_units(current_user)

        # Query case with business unit access control
        query = select(Case).where(Case.id == case_id)

        if "all" not in user_business_units:
            query = query.where(Case.business_unit.in_(user_business_units))

        result = await db.execute(query)
        case = result.scalar_one_or_none()

        if not case:
            raise NotFoundError(f"Case {case_id} not found or access denied")

        # Update case fields (only update fields that are provided)
        update_data = case_update.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            if hasattr(case, field):
                setattr(case, field, value)

        # Always update the timestamp
        case.updated_at = get_timestamp()

        # Handle resolved_at timestamp for resolved status
        if case_update.status == CaseStatus.resolved and not case.resolved_at:
            case.resolved_at = get_timestamp()
        elif case_update.status and case_update.status != CaseStatus.resolved:
            # Clear resolved_at if status is changed from resolved
            case.resolved_at = None

        await db.commit()
        await db.refresh(case)

        logger.info(f"Updated case Case_Id: {case_id} Case_Number: {case.case_number} Updated_Fields: {list(update_data.keys())} User_Id: {current_user.get('id')}")

        return CaseResponse.model_validate(case)

    except NotFoundError:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error updating case Case_Id: {case_id} Error: {str(e)}")
        raise DatabaseError(f"Failed to update case: {str(e)}")


@router.delete("/{case_id}")
async def delete_case(
    case_id: str = Path(..., description="Case ID"),
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(require_authentication),
):
    """
    Delete a case.

    Requires authentication and appropriate business unit access.
    Returns success message upon deletion.
    """
    try:
        # Get user business units for access control
        user_business_units = await get_user_business_units(current_user)

        # Query case with business unit access control
        query = select(Case).where(Case.id == case_id)

        if "all" not in user_business_units:
            query = query.where(Case.business_unit.in_(user_business_units))

        result = await db.execute(query)
        case = result.scalar_one_or_none()

        if not case:
            raise NotFoundError(f"Case {case_id} not found or access denied")

        # Store case info for logging before deletion
        case_number = case.case_number

        # Delete the case
        await db.delete(case)
        await db.commit()

        logger.info(f"Deleted case Case_Id: {case_id} Case_Number: {case_number} User_Id: {current_user.get('id')}")

        return {"message": f"Case {case_id} deleted successfully"}

    except NotFoundError:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error deleting case Case_Id: {case_id} Error: {str(e)}")
        raise DatabaseError(f"Failed to delete case: {str(e)}")


@router.put("/{case_id}/assign", response_model=CaseResponse)
async def assign_case(
    case_id: str = Path(..., description="Case ID"),
    assignment_data: CaseAssignmentRequest = ...,
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(require_authentication),
):
    """
    Assign a case to a user.

    Updates the assigned_to and optionally agent_id fields.
    Requires authentication and appropriate business unit access.
    """
    try:
        # Get user business units for access control
        user_business_units = await get_user_business_units(current_user)

        # Query case with business unit access control
        query = select(Case).where(Case.id == case_id)

        if "all" not in user_business_units:
            query = query.where(Case.business_unit.in_(user_business_units))

        result = await db.execute(query)
        case = result.scalar_one_or_none()

        if not case:
            raise NotFoundError(f"Case {case_id} not found or access denied")

        # Update assignment
        case.assigned_to = assignment_data.assigned_to
        if assignment_data.agent_id:
            case.agent_id = assignment_data.agent_id
        case.updated_at = get_timestamp()

        await db.commit()
        await db.refresh(case)

        logger.info(f"Assigned case Case_Id: {case_id} Case_Number: {case.case_number} Assigned_To: {assignment_data.assigned_to} Agent_Id: {assignment_data.agent_id} User_Id: {current_user.get('id')}")

        return CaseResponse.model_validate(case)

    except NotFoundError:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error assigning case Case_Id: {case_id} Error: {str(e)}")
        raise DatabaseError(f"Failed to assign case: {str(e)}")


@router.put("/{case_id}/status", response_model=CaseResponse)
async def update_case_status(
    case_id: str = Path(..., description="Case ID"),
    status_update: CaseStatusUpdateRequest = ...,
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(require_authentication),
):
    """
    Update case status.

    Updates the case status and handles resolved_at timestamp for resolved cases.
    Requires authentication and appropriate business unit access.
    """
    try:
        # Get user business units for access control
        user_business_units = await get_user_business_units(current_user)

        # Query case with business unit access control
        query = select(Case).where(Case.id == case_id)

        if "all" not in user_business_units:
            query = query.where(Case.business_unit.in_(user_business_units))

        result = await db.execute(query)
        case = result.scalar_one_or_none()

        if not case:
            raise NotFoundError(f"Case {case_id} not found or access denied")

        # Update status
        case.status = status_update.status
        case.updated_at = get_timestamp()

        # Handle resolved_at timestamp
        if status_update.status == CaseStatus.resolved:
            case.resolved_at = status_update.resolved_at or get_timestamp()
        elif status_update.status != CaseStatus.resolved:
            # Clear resolved_at if status is changed from resolved
            case.resolved_at = None

        await db.commit()
        await db.refresh(case)

        logger.info(f"Updated case status Case_Id: {case_id} Case_Number: {case.case_number} New_Status: {status_update.status.value} Resolved_At: {case.resolved_at} User_Id: {current_user.get('id')}")

        return CaseResponse.model_validate(case)

    except NotFoundError:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error updating case status Case_Id: {case_id} Error: {str(e)}")
        raise DatabaseError(f"Failed to update case status: {str(e)}")
