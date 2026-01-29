"""
Unit tests for authentication and authorization system.

Tests JWT token handling, session validation, role-based access control,
and business unit access control.
"""

import pytest
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials
from unittest.mock import Mock, AsyncMock

from app.core.auth import (
    create_access_token,
    verify_token,
    AuthenticationMiddleware,
    require_role,
    require_admin,
    require_manager_or_admin,
    require_supervisor_or_above,
    get_user_business_units,
    check_business_unit_access,
    require_business_unit_access,
)
from app.core.exceptions import AuthenticationError, AuthorizationError
from app.models.base import UserRole


class TestJWTTokens:
    """Test JWT token creation and verification."""

    def test_create_and_verify_token(self):
        """Test creating and verifying a JWT token."""
        user_data = {
            "sub": "user123",
            "email": "test@example.com",
            "name": "Test User",
            "role": UserRole.admin.value,
            "business_unit": "IT",
        }

        token = create_access_token(user_data)
        assert isinstance(token, str)
        assert len(token) > 0

        decoded = verify_token(token)
        assert decoded["sub"] == user_data["sub"]
        assert decoded["email"] == user_data["email"]
        assert decoded["name"] == user_data["name"]
        assert decoded["role"] == user_data["role"]
        assert decoded["business_unit"] == user_data["business_unit"]

    def test_create_token_with_expiration(self):
        """Test creating a token with custom expiration."""
        user_data = {"sub": "user123", "email": "test@example.com"}
        expires_delta = timedelta(minutes=15)

        token = create_access_token(user_data, expires_delta)
        decoded = verify_token(token)

        # Check that expiration is set
        assert "exp" in decoded
        exp_time = datetime.fromtimestamp(decoded["exp"], tz=timezone.utc)
        now = datetime.now(timezone.utc)

        # Should expire in approximately 15 minutes (allow 1 minute tolerance)
        time_diff = exp_time - now
        assert 14 * 60 <= time_diff.total_seconds() <= 16 * 60

    def test_verify_invalid_token(self):
        """Test verifying an invalid token."""
        with pytest.raises(AuthenticationError):
            verify_token("invalid.token.here")

    def test_verify_expired_token(self):
        """Test verifying an expired token."""
        user_data = {"sub": "user123"}
        # Create token that expires immediately
        expires_delta = timedelta(seconds=-1)

        token = create_access_token(user_data, expires_delta)

        with pytest.raises(AuthenticationError):
            verify_token(token)


class TestAuthenticationMiddleware:
    """Test authentication middleware functionality."""

    @pytest.fixture
    def auth_middleware(self):
        """Create authentication middleware instance."""
        return AuthenticationMiddleware()

    @pytest.fixture
    def mock_request(self):
        """Create mock request object."""
        request = Mock(spec=Request)
        request.cookies = {}
        return request

    @pytest.fixture
    def valid_token_credentials(self):
        """Create valid token credentials."""
        user_data = {
            "sub": "user123",
            "email": "test@example.com",
            "name": "Test User",
            "role": UserRole.admin.value,
            "business_unit": "IT",
        }
        token = create_access_token(user_data)
        return HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

    @pytest.mark.asyncio
    async def test_get_current_user_from_token_valid(
        self, auth_middleware, valid_token_credentials
    ):
        """Test getting user from valid token."""
        user = await auth_middleware.get_current_user_from_token(
            valid_token_credentials
        )

        assert user is not None
        assert user["id"] == "user123"
        assert user["email"] == "test@example.com"
        assert user["name"] == "Test User"
        assert user["role"] == UserRole.admin.value
        assert user["business_unit"] == "IT"

    @pytest.mark.asyncio
    async def test_get_current_user_from_token_none(self, auth_middleware):
        """Test getting user when no credentials provided."""
        user = await auth_middleware.get_current_user_from_token(None)
        assert user is None

    @pytest.mark.asyncio
    async def test_get_current_user_from_token_invalid(self, auth_middleware):
        """Test getting user from invalid token."""
        invalid_credentials = HTTPAuthorizationCredentials(
            scheme="Bearer", credentials="invalid.token.here"
        )
        user = await auth_middleware.get_current_user_from_token(invalid_credentials)
        assert user is None

    @pytest.mark.asyncio
    async def test_get_current_user_from_session_no_cookie(
        self, auth_middleware, mock_request
    ):
        """Test getting user from session when no cookie present."""
        user = await auth_middleware.get_current_user_from_session(mock_request)
        assert user is None

    @pytest.mark.asyncio
    async def test_get_current_user_from_session_valid_cookie(
        self, auth_middleware, mock_request
    ):
        """Test getting user from valid session cookie."""
        user_data = {
            "sub": "user123",
            "email": "test@example.com",
            "name": "Test User",
            "role": UserRole.admin.value,
            "business_unit": "IT",
        }
        token = create_access_token(user_data)
        mock_request.cookies["next-auth.session-token"] = token

        user = await auth_middleware.get_current_user_from_session(mock_request)

        assert user is not None
        assert user["id"] == "user123"
        assert user["email"] == "test@example.com"

    @pytest.mark.asyncio
    async def test_get_current_user_token_priority(
        self, auth_middleware, mock_request, valid_token_credentials
    ):
        """Test that token authentication takes priority over session."""
        # Set up both token and session cookie
        session_user_data = {"sub": "session_user", "email": "session@example.com"}
        session_token = create_access_token(session_user_data)
        mock_request.cookies["next-auth.session-token"] = session_token

        user = await auth_middleware.get_current_user(
            mock_request, valid_token_credentials
        )

        # Should return token user, not session user
        assert user is not None
        assert user["id"] == "user123"  # From token, not session


class TestRoleBasedAccessControl:
    """Test role-based access control functionality."""

    @pytest.fixture
    def admin_user(self):
        """Create admin user data."""
        return {
            "id": "admin123",
            "email": "admin@example.com",
            "name": "Admin User",
            "role": UserRole.admin.value,
            "business_unit": "IT",
        }

    @pytest.fixture
    def manager_user(self):
        """Create manager user data."""
        return {
            "id": "manager123",
            "email": "manager@example.com",
            "name": "Manager User",
            "role": UserRole.bu_manager.value,
            "business_unit": "Sales",
        }

    @pytest.fixture
    def supervisor_user(self):
        """Create supervisor user data."""
        return {
            "id": "supervisor123",
            "email": "supervisor@example.com",
            "name": "Supervisor User",
            "role": UserRole.supervisor.value,
            "business_unit": "Support",
        }

    @pytest.mark.asyncio
    async def test_require_admin_with_admin_user(self, admin_user):
        """Test admin requirement with admin user."""
        role_checker = require_admin()

        # This should not raise an exception
        result = await role_checker(admin_user)
        assert result == admin_user

    @pytest.mark.asyncio
    async def test_require_admin_with_non_admin_user(self, manager_user):
        """Test admin requirement with non-admin user."""
        role_checker = require_admin()

        with pytest.raises(AuthorizationError) as exc_info:
            await role_checker(manager_user)

        assert "Access denied" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_require_manager_or_admin_with_manager(self, manager_user):
        """Test manager/admin requirement with manager user."""
        role_checker = require_manager_or_admin()

        result = await role_checker(manager_user)
        assert result == manager_user

    @pytest.mark.asyncio
    async def test_require_manager_or_admin_with_admin(self, admin_user):
        """Test manager/admin requirement with admin user."""
        role_checker = require_manager_or_admin()

        result = await role_checker(admin_user)
        assert result == admin_user

    @pytest.mark.asyncio
    async def test_require_supervisor_or_above_with_supervisor(self, supervisor_user):
        """Test supervisor+ requirement with supervisor user."""
        role_checker = require_supervisor_or_above()

        result = await role_checker(supervisor_user)
        assert result == supervisor_user

    @pytest.mark.asyncio
    async def test_get_user_business_units_admin(self, admin_user):
        """Test getting business units for admin user."""
        business_units = await get_user_business_units(admin_user)
        assert business_units == ["all"]

    @pytest.mark.asyncio
    async def test_get_user_business_units_manager(self, manager_user):
        """Test getting business units for manager user."""
        business_units = await get_user_business_units(manager_user)
        assert business_units == ["Sales"]

    @pytest.mark.asyncio
    async def test_get_user_business_units_supervisor(self, supervisor_user):
        """Test getting business units for supervisor user."""
        business_units = await get_user_business_units(supervisor_user)
        assert business_units == ["Support"]

    def test_check_business_unit_access_admin(self, admin_user):
        """Test business unit access check for admin."""
        assert check_business_unit_access(admin_user, "Any_BU") is True
        assert check_business_unit_access(admin_user, "IT") is True

    def test_check_business_unit_access_manager_same_bu(self, manager_user):
        """Test business unit access check for manager with same BU."""
        assert check_business_unit_access(manager_user, "Sales") is True

    def test_check_business_unit_access_manager_different_bu(self, manager_user):
        """Test business unit access check for manager with different BU."""
        assert check_business_unit_access(manager_user, "IT") is False

    @pytest.mark.asyncio
    async def test_require_business_unit_access_allowed(self, manager_user):
        """Test business unit access requirement when allowed."""
        result = await require_business_unit_access("Sales", manager_user)
        assert result == manager_user

    @pytest.mark.asyncio
    async def test_require_business_unit_access_denied(self, manager_user):
        """Test business unit access requirement when denied."""
        with pytest.raises(AuthorizationError) as exc_info:
            await require_business_unit_access("IT", manager_user)

        assert "Access denied to business unit: IT" in str(exc_info.value)


class TestAuthenticationIntegration:
    """Test authentication system integration."""

    @pytest.mark.asyncio
    async def test_full_authentication_flow(self):
        """Test complete authentication flow from token to user."""
        # Create user data
        user_data = {
            "sub": "integration_user",
            "email": "integration@example.com",
            "name": "Integration User",
            "role": UserRole.bu_manager.value,
            "business_unit": "Marketing",
        }

        # Create token
        token = create_access_token(user_data)

        # Create credentials
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

        # Create mock request
        request = Mock(spec=Request)
        request.cookies = {}

        # Test authentication middleware
        auth_middleware = AuthenticationMiddleware()
        user = await auth_middleware.get_current_user(request, credentials)

        # Verify user data
        assert user is not None
        assert user["id"] == "integration_user"
        assert user["role"] == UserRole.bu_manager.value
        assert user["business_unit"] == "Marketing"

        # Test role-based access
        manager_checker = require_manager_or_admin()
        result = await manager_checker(user)
        assert result == user

        # Test business unit access
        assert check_business_unit_access(user, "Marketing") is True
        assert check_business_unit_access(user, "Sales") is False

        # Test business unit requirement
        result = await require_business_unit_access("Marketing", user)
        assert result == user
