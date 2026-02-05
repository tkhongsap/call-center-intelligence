"""
Shares API Routes

Handles sharing and escalation functionality.
"""

from fastapi import APIRouter

router = APIRouter()

@router.post("/")
async def create_share():
    """Create share or escalation."""
    return {"message": "Shares endpoint - to be implemented"}