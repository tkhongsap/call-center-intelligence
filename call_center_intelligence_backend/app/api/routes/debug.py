"""
Debug API Routes

Handles debug and development utilities.
"""

from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def debug_database():
    """Debug database information."""
    return {"message": "Debug database endpoint - to be implemented"}