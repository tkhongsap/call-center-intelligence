"""
Metrics API Routes

Provides real-time metrics for today's incidents.
"""

from datetime import datetime, timezone, timedelta
from typing import Dict, Any
from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import APIRouter, Depends

from app.core.database import get_db
from app.models.incident import Incident
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/today")
async def get_today_metrics(
    db: AsyncSession = Depends(get_db),
):
    """
    Get today's incident metrics with real-time updates.
    
    Returns:
    - total_today: Total incidents received today
    - open_cases: Incidents with open/pending status
    - critical_urgent: Incidents with urgent/critical status
    - resolution_rate: Percentage of closed incidents today
    """
    try:
        # Get start of today (UTC)
        now = datetime.now(timezone.utc)
        start_of_today = now.replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Total incidents today
        total_query = select(func.count(Incident.id)).where(
            or_(
                Incident.received_date >= start_of_today,
                and_(
                    Incident.received_date.is_(None),
                    Incident.created_at >= start_of_today
                )
            )
        )
        total_result = await db.execute(total_query)
        total_today = total_result.scalar() or 0
        
        # Open cases (status contains 'open' or 'pending' or Thai equivalents)
        open_query = select(func.count(Incident.id)).where(
            and_(
                or_(
                    Incident.received_date >= start_of_today,
                    and_(
                        Incident.received_date.is_(None),
                        Incident.created_at >= start_of_today
                    )
                ),
                or_(
                    func.lower(Incident.status).contains('open'),
                    func.lower(Incident.status).contains('pending'),
                    func.lower(Incident.status).contains('เปิด'),
                    func.lower(Incident.status).contains('รอ')
                )
            )
        )
        open_result = await db.execute(open_query)
        open_cases = open_result.scalar() or 0
        
        # Critical/Urgent cases
        critical_query = select(func.count(Incident.id)).where(
            and_(
                or_(
                    Incident.received_date >= start_of_today,
                    and_(
                        Incident.received_date.is_(None),
                        Incident.created_at >= start_of_today
                    )
                ),
                or_(
                    func.lower(Incident.status).contains('urgent'),
                    func.lower(Incident.status).contains('critical'),
                    func.lower(Incident.status).contains('ด่วน')
                )
            )
        )
        critical_result = await db.execute(critical_query)
        critical_urgent = critical_result.scalar() or 0
        
        # Closed/Resolved cases today
        closed_query = select(func.count(Incident.id)).where(
            and_(
                or_(
                    Incident.received_date >= start_of_today,
                    and_(
                        Incident.received_date.is_(None),
                        Incident.created_at >= start_of_today
                    )
                ),
                or_(
                    func.lower(Incident.status).contains('closed'),
                    func.lower(Incident.status).contains('resolved'),
                    func.lower(Incident.status).contains('ปิด'),
                    func.lower(Incident.status).contains('เสร็จสิ้น')
                )
            )
        )
        closed_result = await db.execute(closed_query)
        closed_cases = closed_result.scalar() or 0
        
        # Calculate resolution rate
        resolution_rate = round((closed_cases / total_today * 100), 1) if total_today > 0 else 0.0
        
        logger.info(f"Retrieved today's metrics Total: {total_today} Open: {open_cases} Critical: {critical_urgent} Resolution: {resolution_rate}%")
        
        return {
            "total_today": total_today,
            "open_cases": open_cases,
            "critical_urgent": critical_urgent,
            "closed_cases": closed_cases,
            "resolution_rate": resolution_rate,
            "timestamp": now.isoformat().replace("+00:00", "Z")
        }
        
    except Exception as e:
        logger.error(f"Error retrieving today's metrics Error: {str(e)}")
        # Return zeros on error rather than failing
        return {
            "total_today": 0,
            "open_cases": 0,
            "critical_urgent": 0,
            "closed_cases": 0,
            "resolution_rate": 0.0,
            "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        }


@router.get("/status-counts")
async def get_status_counts(
    db: AsyncSession = Depends(get_db),
):
    """
    Get count of incidents by status for filter options.
    
    Returns a list of statuses with their counts.
    """
    try:
        # Get all unique statuses with counts
        status_query = select(
            Incident.status,
            func.count(Incident.id).label('count')
        ).where(
            Incident.status.is_not(None)
        ).group_by(Incident.status).order_by(func.count(Incident.id).desc())
        
        result = await db.execute(status_query)
        status_counts = [
            {"status": row.status, "count": row.count}
            for row in result
        ]
        
        logger.info(f"Retrieved status counts Total_Statuses: {len(status_counts)}")
        
        return {
            "statuses": status_counts,
            "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        }
        
    except Exception as e:
        logger.error(f"Error retrieving status counts Error: {str(e)}")
        return {
            "statuses": [],
            "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        }
