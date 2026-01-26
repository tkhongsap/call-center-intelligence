"""
Inbox API Routes

Handles inbox management and notifications.
"""

from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def get_inbox():
    """Get inbox items."""
    return {"message": "Inbox endpoint - to be implemented"}

@router.get("/count")
async def get_inbox_count():
    """Get inbox item count."""
    return {"message": "Inbox count endpoint - to be implemented"}