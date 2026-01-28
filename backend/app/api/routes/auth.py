"""
Authentication API Routes

Provides authentication-related endpoints including session validation,
user information, and authentication status checks.
"""

from fastapi import APIRouter, Depends, Request
from fastapi.security import HTTPAuthorizationCredentials
import structlog

from app.core.auth import (
    get_current_user,
    require_authentication,
    validate_session,
    security,
)

logger = structlog.get_logger(__name__)

router = APIRouter()


@router.get("/me")
async def get_current_user_info(user=Depends(require_authentication)):
    """Get current authenticated user information."""
    logger.info("User info requested", user_id=user["id"])

    return {
        "id": user["id"],
        "email": user.get("email"),
        "name": user.get("name"),
        "role": user.get("role"),
        "business_unit": user.get("business_unit"),
    }


@router.get("/session")
async def get_session_info(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """Get current session information and validation status."""
    try:
        session_info = await validate_session(request, credentials)
        logger.info(
            "Session validated",
            user_id=session_info["user"]["id"],
            auth_method=session_info["auth_method"],
        )
        return session_info
    except Exception as e:
        logger.warning("Session validation failed", error=str(e))
        return {
            "session_valid": False,
            "error": str(e),
        }


@router.get("/check")
async def check_authentication_status(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """Check if user is authenticated without requiring authentication."""
    user = await get_current_user(request, credentials)

    if user:
        logger.debug("Authentication check - user authenticated", user_id=user["id"])
        return {
            "authenticated": True,
            "user_id": user["id"],
            "role": user.get("role"),
        }
    else:
        logger.debug("Authentication check - no valid authentication")
        return {
            "authenticated": False,
        }


@router.post("/logout")
async def logout(user=Depends(require_authentication)):
    """Logout endpoint (mainly for logging purposes)."""
    logger.info("User logout", user_id=user["id"])

    return {
        "message": "Logout successful",
        "user_id": user["id"],
    }


@router.get("/permissions")
async def get_user_permissions(user=Depends(require_authentication)):
    """Get user permissions and access levels."""
    from app.core.auth import get_user_business_units

    business_units = await get_user_business_units(user)

    # Determine permissions based on role
    role = user.get("role")
    permissions = {
        "can_view_all_business_units": role == "admin",
        "can_manage_users": role in ["admin", "bu_manager"],
        "can_create_alerts": role in ["admin", "bu_manager", "supervisor"],
        "can_export_data": role in ["admin", "bu_manager"],
        "can_access_debug": role == "admin",
        "business_units": business_units,
    }

    logger.info(
        "User permissions requested",
        user_id=user["id"],
        role=role,
        business_units=business_units,
    )

    return {
        "user_id": user["id"],
        "role": role,
        "permissions": permissions,
    }
