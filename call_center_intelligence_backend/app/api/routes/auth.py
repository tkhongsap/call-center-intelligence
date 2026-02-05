"""
Authentication API Routes

Provides authentication-related endpoints including session validation,
user information, and authentication status checks.
"""

from fastapi import APIRouter, Depends, Request, HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import logging

from app.core.database import get_db
from app.core.auth import (
    get_current_user,
    require_authentication,
    validate_session,
    security,
    create_access_token,
)
from app.models.user import User
from app.schemas.user import LoginRequest, LoginResponse, UserResponse

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/login", response_model=LoginResponse)
async def login(
    login_data: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Login endpoint with proper password verification.
    
    Use these credentials for development:
    - admin@thaibev.com / admin123
    - agent1@thaibev.com / agent123  
    - manager@thaibev.com / manager123
    """
    try:
        # Query user by email
        query = select(User).where(User.email == login_data.email)
        result = await db.execute(query)
        user = result.scalar_one_or_none()
        
        if not user:
            logger.warning(f"Login attempt with non-existent email: {login_data.email}")
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )
        
        # Verify password hash
        if not user.password_hash:
            logger.error(f"User {user.id} has no password hash set")
            raise HTTPException(
                status_code=401,
                detail="Account not properly configured"
            )
            
        # Import verify_password function
        from app.core.auth import verify_password
        
        if not verify_password(login_data.password, user.password_hash):
            logger.warning(f"Invalid password attempt for user: {user.email}")
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )
        
        # Create JWT token
        token_data = {
            "sub": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role.value,
            "business_unit": user.business_unit,
        }
        
        access_token = create_access_token(data=token_data)
        
        logger.info(f"User logged in successfully User_Id: {user.id} Email: {user.email} Role: {user.role.value}")
        
        return LoginResponse(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse(
                id=user.id,
                name=user.name,
                email=user.email,
                role=user.role,
                business_unit=user.business_unit,
                avatar_url=user.avatar_url,
                created_at=user.created_at,
            )
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error during login"
        )


@router.get("/dev/users")
async def get_development_users(db: AsyncSession = Depends(get_db)):
    """
    Development endpoint to list available users for login testing.
    
    This endpoint should be removed in production.
    """
    try:
        query = select(User)
        result = await db.execute(query)
        users = result.scalars().all()
        
        # Predefined passwords for development
        dev_passwords = {
            "admin@thaibev.com": "admin123",
            "agent1@thaibev.com": "agent123", 
            "manager@thaibev.com": "manager123"
        }
        
        return {
            "message": "Available users for development login",
            "users": [
                {
                    "id": user.id,
                    "name": user.name,
                    "email": user.email,
                    "password": dev_passwords.get(user.email, "password123"),
                    "role": user.role.value,
                    "business_unit": user.business_unit,
                }
                for user in users
            ]
        }
    except Exception as e:
        logger.error(f"Error fetching development users: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error fetching users"
        )


@router.get("/me")
async def get_current_user_info(user=Depends(require_authentication)):
    """Get current authenticated user information."""
    logger.info(f"User info requested User_Id: {user['id']}")

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
        logger.info(f"Session validated User_Id: {session_info['user']['id']} Auth_Method: {session_info['auth_method']}")
        return session_info
    except Exception as e:
        logger.warning(f"Session validation failed Error: {str(e)}")
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
        logger.debug(f"Authentication check - user authenticated User_Id: {user['id']}")
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
    logger.info(f"User logout User_Id: {user['id']}")

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

    logger.info(f"User permissions requested User_Id: {user['id']} Role: {role} Business_Units: {business_units}")

    return {
        "user_id": user["id"],
        "role": role,
        "permissions": permissions,
    }
