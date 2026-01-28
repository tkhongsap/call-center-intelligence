"""
Authentication and Authorization Module

Provides session validation, JWT token handling, and role-based access control
compatible with the existing Next.js frontend authentication system.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any
import logging

try:
    from fastapi import HTTPException, Request, Depends
    from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
    from jose import JWTError, jwt
    from passlib.context import CryptContext
except ImportError as e:
    print(f"Import error: {e}")
    raise

from app.core.config import get_settings
from app.core.exceptions import AuthenticationError, AuthorizationError
from app.models.user import UserRole

logger = logging.getLogger(__name__)

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# HTTP Bearer token scheme
security = HTTPBearer(auto_error=False)

settings = get_settings()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Generate password hash."""
    return pwd_context.hash(password)


def create_access_token(
    data: Dict[str, Any], expires_delta: Optional[timedelta] = None
) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def verify_token(token: str) -> Dict[str, Any]:
    """Verify and decode a JWT token."""
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError as e:
        logger.warning("JWT token verification failed", error=str(e))
        raise AuthenticationError("Invalid token")


class AuthenticationMiddleware:
    """Authentication middleware for validating user sessions and tokens."""

    def __init__(self):
        self.settings = get_settings()

    async def get_current_user_from_token(
        self, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
    ) -> Optional[Dict[str, Any]]:
        """Extract user information from JWT token."""
        if not credentials:
            return None

        try:
            payload = verify_token(credentials.credentials)
            user_id = payload.get("sub")
            if user_id is None:
                logger.warning("Token missing required 'sub' claim")
                return None

            return {
                "id": user_id,
                "email": payload.get("email"),
                "name": payload.get("name"),
                "role": payload.get("role"),
                "business_unit": payload.get("business_unit"),
            }
        except AuthenticationError:
            logger.debug("Invalid authentication token")
            return None

    async def get_current_user_from_session(
        self, request: Request
    ) -> Optional[Dict[str, Any]]:
        """Extract user information from session cookie (Next.js compatibility)."""
        # Check for session cookie (NextAuth.js format)
        session_token = request.cookies.get(
            "next-auth.session-token"
        ) or request.cookies.get("__Secure-next-auth.session-token")

        if not session_token:
            return None

        try:
            # For Next.js compatibility, we might need to decode the session token
            # This would typically involve validating against the same secret used by NextAuth.js
            payload = verify_token(session_token)

            # Validate required claims
            user_id = payload.get("sub")
            if not user_id:
                logger.warning("Session token missing required 'sub' claim")
                return None

            return {
                "id": user_id,
                "email": payload.get("email"),
                "name": payload.get("name"),
                "role": payload.get("role"),
                "business_unit": payload.get("business_unit"),
            }
        except AuthenticationError:
            logger.debug("Invalid session token")
            return None

    async def get_current_user(
        self,
        request: Request,
        credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    ) -> Optional[Dict[str, Any]]:
        """Get current user from either token or session."""
        # Try token-based authentication first
        user = await self.get_current_user_from_token(credentials)
        if user:
            return user

        # Fall back to session-based authentication
        user = await self.get_current_user_from_session(request)
        if user:
            return user

        return None


# Global authentication middleware instance
auth_middleware = AuthenticationMiddleware()


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> Optional[Dict[str, Any]]:
    """Dependency to get the current authenticated user."""
    return await auth_middleware.get_current_user(request, credentials)


async def require_authentication(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> Dict[str, Any]:
    """Dependency that requires user authentication."""
    user = await get_current_user(request, credentials)
    if not user:
        logger.warning(
            "Authentication required but no valid user found", path=request.url.path
        )
        raise AuthenticationError("Authentication required")

    user_id = user.get("id") or user.get("sub")  # Handle both id and sub fields
    logger.info("User authenticated", user_id=user_id, path=request.url.path)
    return user


def require_role(allowed_roles: List[UserRole]):
    """Dependency factory for role-based access control."""

    async def role_checker(
        user: Dict[str, Any] = Depends(require_authentication),
    ) -> Dict[str, Any]:
        user_role = user.get("role")
        if not user_role or user_role not in [role.value for role in allowed_roles]:
            user_id = user.get("id") or user.get("sub")  # Handle both id and sub fields
            logger.warning(
                "Access denied - insufficient role",
                user_id=user_id,
                user_role=user_role,
                required_roles=[role.value for role in allowed_roles],
            )
            raise AuthorizationError(
                f"Access denied. Required roles: {[role.value for role in allowed_roles]}"
            )

        return user

    return role_checker


def require_admin():
    """Dependency that requires admin role."""
    return require_role([UserRole.admin])


def require_manager_or_admin():
    """Dependency that requires manager or admin role."""
    return require_role([UserRole.admin, UserRole.bu_manager])


def require_supervisor_or_above():
    """Dependency that requires supervisor, manager, or admin role."""
    return require_role([UserRole.admin, UserRole.bu_manager, UserRole.supervisor])


async def get_user_business_units(user: Dict[str, Any]) -> List[str]:
    """Get the business units a user has access to."""
    user_role = user.get("role")
    user_bu = user.get("business_unit")

    if user_role == UserRole.admin.value:
        # Admins have access to all business units
        return ["all"]
    elif user_role in [UserRole.bu_manager.value, UserRole.supervisor.value]:
        # Managers and supervisors have access to their business unit
        return [user_bu] if user_bu else []
    else:
        # Regular users have access to their business unit
        return [user_bu] if user_bu else []


def check_business_unit_access(user: Dict[str, Any], required_bu: str) -> bool:
    """Check if user has access to a specific business unit."""
    user_role = user.get("role")
    user_bu = user.get("business_unit")

    # Admins have access to everything
    if user_role == UserRole.admin.value:
        return True

    # Other roles need matching business unit
    return user_bu == required_bu


async def require_business_unit_access(
    business_unit: str, user: Dict[str, Any] = Depends(require_authentication)
) -> Dict[str, Any]:
    """Dependency that requires access to a specific business unit."""
    if not check_business_unit_access(user, business_unit):
        user_id = user.get("id") or user.get("sub")  # Handle both id and sub fields
        logger.warning(
            "Access denied - business unit mismatch",
            user_id=user_id,
            user_bu=user.get("business_unit"),
            required_bu=business_unit,
        )
        raise AuthorizationError(f"Access denied to business unit: {business_unit}")

    return user


async def validate_session(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> Dict[str, Any]:
    """Validate current session and return session info."""
    user = await get_current_user(request, credentials)
    if not user:
        raise AuthenticationError("No valid session found")

    # Get authentication method used
    auth_method = "token" if credentials else "session"

    # Get user business units
    business_units = await get_user_business_units(user)

    return {
        "user": user,
        "auth_method": auth_method,
        "business_units": business_units,
        "session_valid": True,
    }
