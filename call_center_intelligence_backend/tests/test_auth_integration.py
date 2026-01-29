"""
Integration tests for authentication middleware with FastAPI.

Tests authentication middleware integration with FastAPI endpoints,
including protected routes and role-based access control.
"""

import pytest
from fastapi import FastAPI, Depends
from fastapi.testclient import TestClient
from unittest.mock import patch

from app.core.auth import (
    create_access_token,
    require_authentication,
    require_admin,
    require_manager_or_admin,
    require_supervisor_or_above,
    require_business_unit_access,
)
from app.models.base import UserRole


@pytest.fixture
def test_app():
    """Create test FastAPI application with authentication endpoints."""
    app = FastAPI()

    @app.get("/public")
    async def public_endpoint():
        """Public endpoint that doesn't require authentication."""
        return {"message": "public"}

    @app.get("/protected")
    async def protected_endpoint(user=Depends(require_authentication)):
        """Protected endpoint that requires authentication."""
        return {"message": "protected", "user_id": user["id"]}

    @app.get("/admin-only")
    async def admin_only_endpoint(user=Depends(require_admin())):
        """Admin-only endpoint."""
        return {"message": "admin-only", "user_id": user["id"]}

    @app.get("/manager-or-admin")
    async def manager_or_admin_endpoint(user=Depends(require_manager_or_admin())):
        """Manager or admin endpoint."""
        return {"message": "manager-or-admin", "user_id": user["id"]}

    @app.get("/supervisor-plus")
    async def supervisor_plus_endpoint(user=Depends(require_supervisor_or_above())):
        """Supervisor or above endpoint."""
        return {"message": "supervisor-plus", "user_id": user["id"]}

    @app.get("/business-unit/{bu_name}")
    async def business_unit_endpoint(
        bu_name: str,
        user=Depends(require_authentication),
    ):
        """Business unit specific endpoint."""
        # Check business unit access manually in the endpoint
        from app.core.auth import check_business_unit_access
        from app.core.exceptions import AuthorizationError

        if not check_business_unit_access(user, bu_name):
            raise AuthorizationError(f"Access denied to business unit: {bu_name}")
        return {"message": f"business-unit-{bu_name}", "user_id": user["id"]}

    return app


@pytest.fixture
def client(test_app):
    """Create test client."""
    return TestClient(test_app)


@pytest.fixture
def admin_token():
    """Create admin user token."""
    user_data = {
        "sub": "admin123",
        "email": "admin@example.com",
        "name": "Admin User",
        "role": UserRole.admin.value,
        "business_unit": "IT",
    }
    return create_access_token(user_data)


@pytest.fixture
def manager_token():
    """Create manager user token."""
    user_data = {
        "sub": "manager123",
        "email": "manager@example.com",
        "name": "Manager User",
        "role": UserRole.bu_manager.value,
        "business_unit": "Sales",
    }
    return create_access_token(user_data)


@pytest.fixture
def supervisor_token():
    """Create supervisor user token."""
    user_data = {
        "sub": "supervisor123",
        "email": "supervisor@example.com",
        "name": "Supervisor User",
        "role": UserRole.supervisor.value,
        "business_unit": "Support",
    }
    return create_access_token(user_data)


class TestPublicEndpoints:
    """Test public endpoints that don't require authentication."""

    def test_public_endpoint_no_auth(self, client):
        """Test accessing public endpoint without authentication."""
        response = client.get("/public")
        assert response.status_code == 200
        assert response.json() == {"message": "public"}

    def test_public_endpoint_with_auth(self, client, admin_token):
        """Test accessing public endpoint with authentication."""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = client.get("/public", headers=headers)
        assert response.status_code == 200
        assert response.json() == {"message": "public"}


class TestProtectedEndpoints:
    """Test protected endpoints that require authentication."""

    def test_protected_endpoint_no_auth(self, client):
        """Test accessing protected endpoint without authentication."""
        response = client.get("/protected")
        assert response.status_code == 401
        assert "AUTHENTICATION_ERROR" in response.json()["error"]["code"]

    def test_protected_endpoint_invalid_token(self, client):
        """Test accessing protected endpoint with invalid token."""
        headers = {"Authorization": "Bearer invalid.token.here"}
        response = client.get("/protected")
        assert response.status_code == 401

    def test_protected_endpoint_valid_token(self, client, admin_token):
        """Test accessing protected endpoint with valid token."""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = client.get("/protected", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "protected"
        assert data["user_id"] == "admin123"


class TestRoleBasedEndpoints:
    """Test role-based access control endpoints."""

    def test_admin_only_with_admin(self, client, admin_token):
        """Test admin-only endpoint with admin user."""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = client.get("/admin-only", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "admin-only"
        assert data["user_id"] == "admin123"

    def test_admin_only_with_manager(self, client, manager_token):
        """Test admin-only endpoint with manager user."""
        headers = {"Authorization": f"Bearer {manager_token}"}
        response = client.get("/admin-only", headers=headers)
        assert response.status_code == 403
        assert "Access denied" in response.json()["error"]["message"]

    def test_admin_only_with_supervisor(self, client, supervisor_token):
        """Test admin-only endpoint with supervisor user."""
        headers = {"Authorization": f"Bearer {supervisor_token}"}
        response = client.get("/admin-only", headers=headers)
        assert response.status_code == 403

    def test_manager_or_admin_with_admin(self, client, admin_token):
        """Test manager/admin endpoint with admin user."""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = client.get("/manager-or-admin", headers=headers)
        assert response.status_code == 200
        assert response.json()["user_id"] == "admin123"

    def test_manager_or_admin_with_manager(self, client, manager_token):
        """Test manager/admin endpoint with manager user."""
        headers = {"Authorization": f"Bearer {manager_token}"}
        response = client.get("/manager-or-admin", headers=headers)
        assert response.status_code == 200
        assert response.json()["user_id"] == "manager123"

    def test_manager_or_admin_with_supervisor(self, client, supervisor_token):
        """Test manager/admin endpoint with supervisor user."""
        headers = {"Authorization": f"Bearer {supervisor_token}"}
        response = client.get("/manager-or-admin", headers=headers)
        assert response.status_code == 403

    def test_supervisor_plus_with_all_roles(
        self, client, admin_token, manager_token, supervisor_token
    ):
        """Test supervisor+ endpoint with all role types."""
        # Admin should have access
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = client.get("/supervisor-plus", headers=headers)
        assert response.status_code == 200

        # Manager should have access
        headers = {"Authorization": f"Bearer {manager_token}"}
        response = client.get("/supervisor-plus", headers=headers)
        assert response.status_code == 200

        # Supervisor should have access
        headers = {"Authorization": f"Bearer {supervisor_token}"}
        response = client.get("/supervisor-plus", headers=headers)
        assert response.status_code == 200


class TestBusinessUnitAccess:
    """Test business unit access control."""

    def test_business_unit_access_admin_any_bu(self, client, admin_token):
        """Test admin access to any business unit."""
        headers = {"Authorization": f"Bearer {admin_token}"}

        # Admin should access any business unit
        response = client.get("/business-unit/Sales", headers=headers)
        assert response.status_code == 200

        response = client.get("/business-unit/Marketing", headers=headers)
        assert response.status_code == 200

    def test_business_unit_access_manager_own_bu(self, client, manager_token):
        """Test manager access to own business unit."""
        headers = {"Authorization": f"Bearer {manager_token}"}

        # Manager should access own business unit
        response = client.get("/business-unit/Sales", headers=headers)
        assert response.status_code == 200
        assert response.json()["user_id"] == "manager123"

    def test_business_unit_access_manager_other_bu(self, client, manager_token):
        """Test manager access to other business unit."""
        headers = {"Authorization": f"Bearer {manager_token}"}

        # Manager should NOT access other business units
        response = client.get("/business-unit/Marketing", headers=headers)
        assert response.status_code == 403
        assert "Access denied to business unit" in response.json()["error"]["message"]

    def test_business_unit_access_supervisor_own_bu(self, client, supervisor_token):
        """Test supervisor access to own business unit."""
        headers = {"Authorization": f"Bearer {supervisor_token}"}

        # Supervisor should access own business unit
        response = client.get("/business-unit/Support", headers=headers)
        assert response.status_code == 200
        assert response.json()["user_id"] == "supervisor123"

    def test_business_unit_access_supervisor_other_bu(self, client, supervisor_token):
        """Test supervisor access to other business unit."""
        headers = {"Authorization": f"Bearer {supervisor_token}"}

        # Supervisor should NOT access other business units
        response = client.get("/business-unit/Sales", headers=headers)
        assert response.status_code == 403


class TestSessionCookieAuthentication:
    """Test session cookie authentication (Next.js compatibility)."""

    def test_session_cookie_authentication(self, client):
        """Test authentication using session cookie."""
        user_data = {
            "sub": "session_user",
            "email": "session@example.com",
            "name": "Session User",
            "role": UserRole.admin.value,
            "business_unit": "IT",
        }
        token = create_access_token(user_data)

        # Set session cookie
        client.cookies.set("next-auth.session-token", token)

        response = client.get("/protected")
        assert response.status_code == 200
        data = response.json()
        assert data["user_id"] == "session_user"

    def test_secure_session_cookie_authentication(self, client):
        """Test authentication using secure session cookie."""
        user_data = {
            "sub": "secure_session_user",
            "email": "secure@example.com",
            "name": "Secure Session User",
            "role": UserRole.admin.value,
            "business_unit": "IT",
        }
        token = create_access_token(user_data)

        # Set secure session cookie
        client.cookies.set("__Secure-next-auth.session-token", token)

        response = client.get("/protected")
        assert response.status_code == 200
        data = response.json()
        assert data["user_id"] == "secure_session_user"

    def test_token_priority_over_session(self, client, admin_token):
        """Test that Bearer token takes priority over session cookie."""
        # Set session cookie with different user
        session_user_data = {
            "sub": "session_user",
            "email": "session@example.com",
            "role": UserRole.supervisor.value,
        }
        session_token = create_access_token(session_user_data)
        client.cookies.set("next-auth.session-token", session_token)

        # Use Bearer token in header
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = client.get("/protected", headers=headers)

        assert response.status_code == 200
        data = response.json()
        # Should return admin user from Bearer token, not session user
        assert data["user_id"] == "admin123"


class TestErrorHandling:
    """Test authentication error handling."""

    def test_malformed_authorization_header(self, client):
        """Test malformed authorization header."""
        headers = {"Authorization": "InvalidFormat"}
        response = client.get("/protected", headers=headers)
        assert response.status_code == 401

    def test_expired_token(self, client):
        """Test expired token handling."""
        from datetime import timedelta

        user_data = {"sub": "expired_user"}
        # Create token that expires immediately
        expired_token = create_access_token(user_data, timedelta(seconds=-1))

        headers = {"Authorization": f"Bearer {expired_token}"}
        response = client.get("/protected", headers=headers)
        assert response.status_code == 401

    def test_token_without_required_claims(self, client):
        """Test token without required claims."""
        # Create token without 'sub' claim
        incomplete_data = {"email": "incomplete@example.com"}
        incomplete_token = create_access_token(incomplete_data)

        headers = {"Authorization": f"Bearer {incomplete_token}"}
        response = client.get("/protected", headers=headers)
        assert response.status_code == 401
