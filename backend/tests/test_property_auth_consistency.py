"""
Property-based tests for authentication and authorization consistency.

**Feature: backend-migration-fastapi, Property 5: Authentication and Authorization Consistency**
**Validates: Requirements 3.3, 7.1, 7.2, 7.5**

Tests that the FastAPI backend makes identical access control decisions as the original system,
accepting valid credentials and rejecting invalid ones with the same error responses.
"""

import pytest
from hypothesis import given, strategies as st, settings, assume
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from unittest.mock import Mock, AsyncMock

from app.core.auth import (
    create_access_token,
    verify_token,
    AuthenticationMiddleware,
    require_authentication,
    require_admin,
    require_manager_or_admin,
    require_supervisor_or_above,
    check_business_unit_access,
    get_user_business_units,
)
from app.core.exceptions import AuthenticationError, AuthorizationError
from app.models.base import UserRole


# Strategy for generating valid user data
valid_user_data = st.fixed_dictionaries(
    {
        "sub": st.text(
            min_size=1,
            max_size=50,
            alphabet=st.characters(whitelist_categories=("Lu", "Ll", "Nd", "Pc")),
        ),
        "email": st.emails(),
        "name": st.text(min_size=1, max_size=100),
        "role": st.sampled_from(
            [UserRole.admin.value, UserRole.bu_manager.value, UserRole.supervisor.value]
        ),
        "business_unit": st.one_of(st.none(), st.text(min_size=1, max_size=50)),
    }
)

# Strategy for generating business unit names
business_unit_names = st.text(
    min_size=1,
    max_size=50,
    alphabet=st.characters(whitelist_categories=("Lu", "Ll", "Nd", "Pc")),
)

# Strategy for generating token expiration times
token_expiration = st.one_of(
    st.none(),
    st.integers(min_value=1, max_value=3600).map(lambda x: timedelta(seconds=x)),
)


class TestAuthenticationConsistency:
    """Property-based tests for authentication consistency."""

    @given(user_data=valid_user_data, expires_delta=token_expiration)
    @settings(max_examples=100, deadline=5000)
    def test_token_creation_and_verification_consistency(
        self, user_data, expires_delta
    ):
        """
        **Property 5: Authentication and Authorization Consistency**
        **Validates: Requirements 3.3, 7.1, 7.2, 7.5**

        For any valid user data, token creation followed by verification should
        return the same user information consistently.
        """
        # Create token
        token = create_access_token(user_data, expires_delta)
        assert isinstance(token, str)
        assert len(token) > 0

        # Verify token
        decoded = verify_token(token)

        # Verify consistency
        assert decoded["sub"] == user_data["sub"]
        assert decoded["email"] == user_data["email"]
        assert decoded["name"] == user_data["name"]
        assert decoded["role"] == user_data["role"]
        assert decoded["business_unit"] == user_data["business_unit"]

        # Verify expiration is set
        assert "exp" in decoded
        exp_time = datetime.fromtimestamp(decoded["exp"], tz=timezone.utc)
        now = datetime.now(timezone.utc)
        assert exp_time > now  # Token should not be expired immediately

    @given(user_data=valid_user_data)
    @settings(max_examples=100, deadline=5000)
    @pytest.mark.asyncio
    async def test_authentication_middleware_consistency(self, user_data):
        """
        **Property 5: Authentication and Authorization Consistency**
        **Validates: Requirements 3.3, 7.1, 7.2, 7.5**

        For any valid user data, the authentication middleware should consistently
        extract the same user information from valid tokens.
        """
        # Create token and credentials
        token = create_access_token(user_data)
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

        # Test authentication middleware
        auth_middleware = AuthenticationMiddleware()
        user = await auth_middleware.get_current_user_from_token(credentials)

        # Verify consistency
        assert user is not None
        assert user["id"] == user_data["sub"]
        assert user["email"] == user_data["email"]
        assert user["name"] == user_data["name"]
        assert user["role"] == user_data["role"]
        assert user["business_unit"] == user_data["business_unit"]

    @given(user_data=valid_user_data)
    @settings(max_examples=100, deadline=5000)
    @pytest.mark.asyncio
    async def test_role_based_access_consistency(self, user_data):
        """
        **Property 5: Authentication and Authorization Consistency**
        **Validates: Requirements 3.3, 7.1, 7.2, 7.5**

        For any user with a specific role, role-based access control should
        consistently grant or deny access based on the role hierarchy.
        """
        user_role = user_data["role"]

        # Test admin access
        admin_checker = require_admin()
        if user_role == UserRole.admin.value:
            # Admin should have access
            result = await admin_checker(user_data)
            assert result == user_data
        else:
            # Non-admin should be denied
            with pytest.raises(AuthorizationError):
                await admin_checker(user_data)

        # Test manager or admin access
        manager_admin_checker = require_manager_or_admin()
        if user_role in [UserRole.admin.value, UserRole.bu_manager.value]:
            # Admin or manager should have access
            result = await manager_admin_checker(user_data)
            assert result == user_data
        else:
            # Others should be denied
            with pytest.raises(AuthorizationError):
                await manager_admin_checker(user_data)

        # Test supervisor or above access
        supervisor_plus_checker = require_supervisor_or_above()
        if user_role in [
            UserRole.admin.value,
            UserRole.bu_manager.value,
            UserRole.supervisor.value,
        ]:
            # All defined roles should have access
            result = await supervisor_plus_checker(user_data)
            assert result == user_data

    @given(user_data=valid_user_data)
    @settings(max_examples=100, deadline=5000)
    @pytest.mark.asyncio
    async def test_business_unit_access_consistency(self, user_data):
        """
        **Property 5: Authentication and Authorization Consistency**
        **Validates: Requirements 3.3, 7.1, 7.2, 7.5**

        For any user, business unit access should be consistently determined
        based on their role and assigned business unit.
        """
        user_role = user_data["role"]
        user_bu = user_data["business_unit"]

        # Get user business units
        business_units = await get_user_business_units(user_data)

        # Verify consistency based on role
        if user_role == UserRole.admin.value:
            assert business_units == ["all"]
        elif user_role in [UserRole.bu_manager.value, UserRole.supervisor.value]:
            if user_bu:
                assert business_units == [user_bu]
            else:
                assert business_units == []
        else:
            if user_bu:
                assert business_units == [user_bu]
            else:
                assert business_units == []

    @given(user_data=valid_user_data, bu_name=business_unit_names)
    @settings(max_examples=100, deadline=5000)
    def test_business_unit_access_check_consistency(self, user_data, bu_name):
        """
        **Property 5: Authentication and Authorization Consistency**
        **Validates: Requirements 3.3, 7.1, 7.2, 7.5**

        For any user and business unit combination, access checks should
        consistently return the same result based on role and business unit.
        """
        user_role = user_data["role"]
        user_bu = user_data["business_unit"]

        access_granted = check_business_unit_access(user_data, bu_name)

        # Verify consistency
        if user_role == UserRole.admin.value:
            # Admins should always have access
            assert access_granted is True
        else:
            # Other roles should only have access to their own business unit
            assert access_granted == (user_bu == bu_name)

    @given(invalid_token=st.text(min_size=1, max_size=100))
    @settings(max_examples=50, deadline=5000)
    def test_invalid_token_rejection_consistency(self, invalid_token):
        """
        **Property 5: Authentication and Authorization Consistency**
        **Validates: Requirements 3.3, 7.1, 7.2, 7.5**

        For any invalid token, the system should consistently reject it
        with an AuthenticationError.
        """
        assume(
            not invalid_token.startswith("eyJ")
        )  # Avoid accidentally valid JWT format

        with pytest.raises(AuthenticationError):
            verify_token(invalid_token)

    @given(user_data=valid_user_data)
    @settings(max_examples=50, deadline=5000)
    @pytest.mark.asyncio
    async def test_expired_token_rejection_consistency(self, user_data):
        """
        **Property 5: Authentication and Authorization Consistency**
        **Validates: Requirements 3.3, 7.1, 7.2, 7.5**

        For any user data, tokens that are created with past expiration
        should be consistently rejected.
        """
        # Create expired token
        expired_delta = timedelta(seconds=-1)
        expired_token = create_access_token(user_data, expired_delta)

        # Should be rejected
        with pytest.raises(AuthenticationError):
            verify_token(expired_token)

    @given(user_data=valid_user_data)
    @settings(max_examples=50, deadline=5000)
    @pytest.mark.asyncio
    async def test_session_cookie_authentication_consistency(self, user_data):
        """
        **Property 5: Authentication and Authorization Consistency**
        **Validates: Requirements 3.3, 7.1, 7.2, 7.5**

        For any valid user data, session cookie authentication should
        work consistently with the same results as token authentication.
        """
        # Create token for session cookie
        token = create_access_token(user_data)

        # Create mock request with session cookie
        mock_request = Mock()
        mock_request.cookies = {"next-auth.session-token": token}

        # Test session authentication
        auth_middleware = AuthenticationMiddleware()
        user = await auth_middleware.get_current_user_from_session(mock_request)

        # Should return same user data as token authentication
        assert user is not None
        assert user["id"] == user_data["sub"]
        assert user["email"] == user_data["email"]
        assert user["name"] == user_data["name"]
        assert user["role"] == user_data["role"]
        assert user["business_unit"] == user_data["business_unit"]

    @given(user_data=valid_user_data)
    @settings(max_examples=50, deadline=5000)
    @pytest.mark.asyncio
    async def test_authentication_priority_consistency(self, user_data):
        """
        **Property 5: Authentication and Authorization Consistency**
        **Validates: Requirements 3.3, 7.1, 7.2, 7.5**

        For any user data, when both token and session authentication are present,
        token authentication should consistently take priority.
        """
        # Create tokens for different users
        token_user = user_data
        session_user = {**user_data, "sub": f"session_{user_data['sub']}"}

        token = create_access_token(token_user)
        session_token = create_access_token(session_user)

        # Create credentials and request
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
        mock_request = Mock()
        mock_request.cookies = {"next-auth.session-token": session_token}

        # Test authentication middleware
        auth_middleware = AuthenticationMiddleware()
        user = await auth_middleware.get_current_user(mock_request, credentials)

        # Should return token user, not session user
        assert user is not None
        assert user["id"] == token_user["sub"]  # Token user, not session user

    @given(user_data=valid_user_data)
    @settings(max_examples=50, deadline=5000)
    @pytest.mark.asyncio
    async def test_require_authentication_consistency(self, user_data):
        """
        **Property 5: Authentication and Authorization Consistency**
        **Validates: Requirements 3.3, 7.1, 7.2, 7.5**

        For any valid user data, the require_authentication dependency should
        consistently return the user data when valid authentication is provided.
        """
        # Create token and credentials
        token = create_access_token(user_data)
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

        # Create mock request
        mock_request = Mock()
        mock_request.cookies = {}
        mock_request.url.path = "/test"

        # Mock the get_current_user function to return our user
        async def mock_get_current_user(request, creds):
            if creds and creds.credentials == token:
                return {
                    "id": user_data["sub"],
                    "email": user_data["email"],
                    "name": user_data["name"],
                    "role": user_data["role"],
                    "business_unit": user_data["business_unit"],
                }
            return None

        # Test require_authentication with mocked dependency
        import app.core.auth

        original_get_current_user = app.core.auth.get_current_user
        app.core.auth.get_current_user = mock_get_current_user

        try:
            result = await require_authentication(mock_request, credentials)
            assert result["id"] == user_data["sub"]
            assert result["role"] == user_data["role"]
        finally:
            app.core.auth.get_current_user = original_get_current_user


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
