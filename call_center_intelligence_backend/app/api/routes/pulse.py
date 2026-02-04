"""
Pulse API Routes

Handles pulse analytics including sparklines, word clouds, and business unit stats.
"""

from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.core.database import get_db
from app.models.incident import Incident

router = APIRouter()


class BusinessUnitStats(BaseModel):
    """Business unit statistics."""
    name: str
    case_count: int
    trend: str  # 'up', 'down', 'stable'


class BusinessUnitsResponse(BaseModel):
    """Response for business units endpoint."""
    business_units: List[BusinessUnitStats]


@router.get("/")
async def get_pulse():
    """Get pulse analytics."""
    return {"message": "Pulse endpoint - to be implemented"}

@router.get("/sparklines")
async def get_sparklines():
    """Get sparkline data."""
    return {"message": "Sparklines endpoint - to be implemented"}

@router.get("/wordcloud")
async def get_wordcloud():
    """Get word cloud data."""
    return {"message": "Word cloud endpoint - to be implemented"}


@router.get("/business-units", response_model=BusinessUnitsResponse)
async def get_business_units(
    limit: int = Query(10, description="Maximum number of business units to return"),
    db: AsyncSession = Depends(get_db),
):
    """
    Get business units (product groups) with case counts.
    
    Returns the top business units by case count from the incidents table.
    Uses the product_group column to identify business units.
    """
    try:
        # Query for case counts by business unit (product_group)
        query = (
            select(
                Incident.product_group,
                func.count(Incident.id).label('count')
            )
            .where(
                Incident.product_group.isnot(None),
                Incident.product_group != '',
            )
            .group_by(Incident.product_group)
            .order_by(desc('count'))
            .limit(limit)
        )
        
        result = await db.execute(query)
        counts = {row.product_group: row.count for row in result}
        
        # Build response - set all trends to stable for now
        business_units = []
        for bu_name, count in counts.items():
            business_units.append(
                BusinessUnitStats(
                    name=bu_name,
                    case_count=count,
                    trend='stable'
                )
            )
        
        return BusinessUnitsResponse(business_units=business_units)
        
    except Exception as e:
        # Log the error and return empty list
        print(f"Error fetching business units: {e}")
        import traceback
        traceback.print_exc()
        return BusinessUnitsResponse(business_units=[])
