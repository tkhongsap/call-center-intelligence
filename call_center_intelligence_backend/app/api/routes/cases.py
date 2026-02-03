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
    """Convert incident to case response format with all incident fields."""
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
    
    # Format received_date
    received_date = None
    if incident.received_date:
        if incident.received_date.tzinfo is None:
            received_date = incident.received_date.replace(tzinfo=timezone.utc).isoformat().replace("+00:00", "Z")
        else:
            received_date = incident.received_date.isoformat().replace("+00:00", "Z")
    
    # Format closed_date
    closed_date = None
    if incident.closed_date:
        if incident.closed_date.tzinfo is None:
            closed_date = incident.closed_date.replace(tzinfo=timezone.utc).isoformat().replace("+00:00", "Z")
        else:
            closed_date = incident.closed_date.isoformat().replace("+00:00", "Z")
    
    return {
        # Case-mapped fields (for compatibility)
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
        
        # All incident fields (raw data)
        "incident_data": {
            "incident_number": incident.incident_number,
            "reference_number": incident.reference_number,
            "received_date": received_date,
            "closed_date": closed_date,
            "contact_channel": incident.contact_channel,
            "customer_name": incident.customer_name,
            "phone": incident.phone,
            "issue_type": incident.issue_type,
            "issue_subtype_1": incident.issue_subtype_1,
            "issue_subtype_2": incident.issue_subtype_2,
            "product": incident.product,
            "product_group": incident.product_group,
            "factory": incident.factory,
            "production_code": incident.production_code,
            "details": incident.details,
            "solution": incident.solution,
            "solution_from_thaibev": incident.solution_from_thaibev,
            "subject": incident.subject,
            "district": incident.district,
            "province": incident.province,
            "order_channel": incident.order_channel,
            "status": incident.status,
            "receiver": incident.receiver,
            "closer": incident.closer,
            "sla": incident.sla,
            "upload_id": incident.upload_id,
        }
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
    Get cases (from incidents) with filtering and pagination.

    Supports filtering by:
    - Business unit (mapped from product_group)
    - Channel (mapped from contact_channel)
    - Status (mapped from incident status)
    - Severity level (mapped from incident status)
    - Category (mapped from issue_type)
    - Date range
    - Text search in summary, incident number, and customer name

    Returns paginated results with enhanced pagination info.
    """
    try:
        # Get user business units for filtering
        user_business_units = ["all"]  # Default to all if no user
        if current_user:
            user_business_units = await get_user_business_units(current_user)

        # Build base query for incidents
        query = select(Incident)

        # Apply filters
        query = await apply_case_filters(query, params, user_business_units)

        # Apply sorting (map case fields to incident fields)
        sort_field_map = {
            "created_at": Incident.received_date,
            "case_number": Incident.incident_number,
            "customer_name": Incident.customer_name,
            "status": Incident.status,
        }
        
        sort_column = sort_field_map.get(params.sort_by, Incident.received_date)
        
        if params.sort_order == "desc":
            query = query.order_by(desc(func.coalesce(sort_column, Incident.created_at)))
        else:
            query = query.order_by(asc(func.coalesce(sort_column, Incident.created_at)))

        # Get total count for pagination
        count_query = select(func.count(Incident.id))
        count_query = await apply_case_filters(count_query, params, user_business_units)
        total_result = await db.execute(count_query)
        total = total_result.scalar()

        # Apply pagination
        offset = (params.page - 1) * params.limit
        query = query.offset(offset).limit(params.limit)

        # Execute query
        result = await db.execute(query)
        incidents = result.scalars().all()

        # Convert incidents to case format
        cases = [incident_to_case_response(incident) for incident in incidents]

        # Calculate pagination info
        total_pages = (total + params.limit - 1) // params.limit

        pagination = EnhancedPaginationInfo(
            page=params.page, limit=params.limit, total=total, total_pages=total_pages
        )

        logger.info(f"Retrieved cases from incidents Count: {len(cases)} Total: {total} Page: {params.page} User_Id: {current_user.get('id') if current_user else None}")

        return CaseListResponse(
            cases=cases,
            pagination=pagination,
        )

    except Exception as e:
        logger.error(f"Error retrieving cases from incidents Error: {str(e)}")
        raise DatabaseError(f"Failed to retrieve cases: {str(e)}")


@router.get("/stats", response_model=CaseStatsResponse)
async def get_cases_stats(
    business_unit: Optional[str] = Query(None, description="Filter by business unit (product group)"),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user),
):
    """
    Get case statistics from incident data.

    Returns comprehensive case statistics mapped from incidents.
    """
    try:
        # Build base query
        base_conditions = []

        # Apply business unit filter (map to product_group)
        if business_unit:
            base_conditions.append(
                func.lower(Incident.product_group).contains(business_unit.lower())
            )

        # Combine conditions
        where_clause = and_(*base_conditions) if base_conditions else True

        # Get total count
        total_query = select(func.count(Incident.id)).where(where_clause)
        total_result = await db.execute(total_query)
        total = total_result.scalar() or 0

        # Count by status (map incident status to case status)
        # Open
        open_query = select(func.count(Incident.id)).where(
            and_(
                where_clause,
                or_(
                    func.lower(Incident.status).contains('open'),
                    func.lower(Incident.status).contains('pending'),
                    func.lower(Incident.status).contains('เปิด'),
                    func.lower(Incident.status).contains('รอ')
                )
            )
        )
        open_result = await db.execute(open_query)
        open_count = open_result.scalar() or 0

        # In Progress
        in_progress_query = select(func.count(Incident.id)).where(
            and_(
                where_clause,
                or_(
                    func.lower(Incident.status).contains('progress'),
                    func.lower(Incident.status).contains('กำลังดำเนินการ')
                )
            )
        )
        in_progress_result = await db.execute(in_progress_query)
        in_progress_count = in_progress_result.scalar() or 0

        # Resolved
        resolved_query = select(func.count(Incident.id)).where(
            and_(
                where_clause,
                or_(
                    func.lower(Incident.status).contains('resolved'),
                    func.lower(Incident.status).contains('เสร็จสิ้น')
                )
            )
        )
        resolved_result = await db.execute(resolved_query)
        resolved_count = resolved_result.scalar() or 0

        # Closed
        closed_query = select(func.count(Incident.id)).where(
            and_(
                where_clause,
                or_(
                    func.lower(Incident.status).contains('closed'),
                    func.lower(Incident.status).contains('ปิด')
                )
            )
        )
        closed_result = await db.execute(closed_query)
        closed_count = closed_result.scalar() or 0

        # Count by severity (map from incident status)
        # Critical
        critical_query = select(func.count(Incident.id)).where(
            and_(
                where_clause,
                or_(
                    func.lower(Incident.status).contains('urgent'),
                    func.lower(Incident.status).contains('critical'),
                    func.lower(Incident.status).contains('ด่วน')
                )
            )
        )
        critical_result = await db.execute(critical_query)
        critical_count = critical_result.scalar() or 0

        # For other severity levels, distribute remaining incidents
        remaining = total - critical_count
        high_count = int(remaining * 0.2)  # 20% high
        medium_count = int(remaining * 0.5)  # 50% medium
        low_count = remaining - high_count - medium_count  # Rest are low

        # Count by channel (map from contact_channel)
        # Phone
        phone_query = select(func.count(Incident.id)).where(
            and_(
                where_clause,
                or_(
                    func.lower(Incident.contact_channel).contains('phone'),
                    func.lower(Incident.contact_channel).contains('โทร'),
                    Incident.contact_channel.is_(None)  # Default to phone
                )
            )
        )
        phone_result = await db.execute(phone_query)
        phone_count = phone_result.scalar() or 0

        # Email
        email_query = select(func.count(Incident.id)).where(
            and_(
                where_clause,
                func.lower(Incident.contact_channel).contains('email')
            )
        )
        email_result = await db.execute(email_query)
        email_count = email_result.scalar() or 0

        # LINE
        line_query = select(func.count(Incident.id)).where(
            and_(
                where_clause,
                func.lower(Incident.contact_channel).contains('line')
            )
        )
        line_result = await db.execute(line_query)
        line_count = line_result.scalar() or 0

        # Web
        web_query = select(func.count(Incident.id)).where(
            and_(
                where_clause,
                or_(
                    func.lower(Incident.contact_channel).contains('web'),
                    func.lower(Incident.contact_channel).contains('online')
                )
            )
        )
        web_result = await db.execute(web_query)
        web_count = web_result.scalar() or 0

        # Build response
        by_status = CaseCountByStatus(
            open=open_count,
            in_progress=in_progress_count,
            resolved=resolved_count,
            closed=closed_count,
        )

        by_severity = CaseCountBySeverity(
            low=low_count,
            medium=medium_count,
            high=high_count,
            critical=critical_count,
        )

        by_channel = CaseCountByChannel(
            phone=phone_count,
            email=email_count,
            line=line_count,
            web=web_count,
        )

        flags = {
            "risk_flag": 0,  # Not available in incident data
            "needs_review_flag": 0,  # Not available in incident data
        }

        logger.info(f"Retrieved case statistics from incidents Total: {total} Business_Unit: {business_unit} User_Id: {current_user.get('id') if current_user else None}")

        return CaseStatsResponse(
            total=total,
            by_status=by_status,
            by_severity=by_severity,
            by_channel=by_channel,
            flags=flags,
        )

    except Exception as e:
        logger.error(f"Error retrieving case statistics from incidents Error: {str(e)}")
        raise DatabaseError(f"Failed to retrieve case statistics: {str(e)}")


@router.get("/{case_id}", response_model=CaseResponse)
async def get_case(
    case_id: str = Path(..., description="Case ID (incident ID or incident number)"),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user),
):
    """
    Get specific case by ID (from incident data).

    Returns detailed case information mapped from incident fields.
    Accepts either incident ID (integer) or incident number (string).
    """
    try:
        # Try to parse as integer ID first
        try:
            incident_id = int(case_id)
            query = select(Incident).where(Incident.id == incident_id)
        except ValueError:
            # If not an integer, search by incident_number
            query = select(Incident).where(Incident.incident_number == case_id)

        result = await db.execute(query)
        incident = result.scalar_one_or_none()

        if not incident:
            raise NotFoundError(f"Case {case_id} not found")

        # Convert incident to case format
        case_data = incident_to_case_response(incident)

        logger.info(f"Retrieved case details from incident Case_Id: {case_id} Incident_Number: {incident.incident_number} User_Id: {current_user.get('id') if current_user else None}")

        return case_data

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
