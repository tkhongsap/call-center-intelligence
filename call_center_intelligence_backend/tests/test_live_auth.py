"""
Test script for live authentication system testing.
"""

import requests
import json
from app.core.auth import create_access_token
from app.models.base import UserRole


def test_live_authentication():
    """Test authentication with live server."""
    base_url = "http://localhost:8000"

    print("🔐 Testing Live Authentication System")
    print("=" * 50)

    # Test 1: Health check
    print("\n1. Testing health check...")
    try:
        response = requests.get(f"{base_url}/health")
        print(f"   Status: {response.status_code}")
        print(f"   Health: {response.json()['status']}")
    except Exception as e:
        print(f"   Error: {e}")
        return False

    # Test 2: Unauthenticated check
    print("\n2. Testing unauthenticated check...")
    try:
        response = requests.get(f"{base_url}/api/auth/check")
        result = response.json()
        print(f"   Status: {response.status_code}")
        print(f"   Authenticated: {result['authenticated']}")
    except Exception as e:
        print(f"   Error: {e}")
        return False

    # Test 3: Create test token
    print("\n3. Creating test token...")
    try:
        user_data = {
            "sub": "test_user_123",
            "email": "test@example.com",
            "name": "Test User",
            "role": UserRole.admin.value,
            "business_unit": "IT",
        }
        token = create_access_token(user_data)
        print(f"   Token created: {token[:50]}...")
    except Exception as e:
        print(f"   Error: {e}")
        return False

    # Test 4: Authenticated check with token
    print("\n4. Testing authenticated check with token...")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{base_url}/api/auth/check", headers=headers)
        result = response.json()
        print(f"   Status: {response.status_code}")
        print(f"   Authenticated: {result['authenticated']}")
        print(f"   User ID: {result.get('user_id')}")
        print(f"   Role: {result.get('role')}")
    except Exception as e:
        print(f"   Error: {e}")
        return False

    # Test 5: Get user info
    print("\n5. Testing user info endpoint...")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{base_url}/api/auth/me", headers=headers)
        result = response.json()
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print(f"   User ID: {result['id']}")
            print(f"   Name: {result['name']}")
            print(f"   Email: {result['email']}")
            print(f"   Role: {result['role']}")
            print(f"   Business Unit: {result['business_unit']}")
        else:
            print(f"   Error: {result}")
    except Exception as e:
        print(f"   Error: {e}")
        return False

    # Test 6: Get session info
    print("\n6. Testing session info endpoint...")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{base_url}/api/auth/session", headers=headers)
        result = response.json()
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print(f"   Session Valid: {result['session_valid']}")
            print(f"   Auth Method: {result['auth_method']}")
            print(f"   Business Units: {result['business_units']}")
        else:
            print(f"   Error: {result}")
    except Exception as e:
        print(f"   Error: {e}")
        return False

    # Test 7: Get permissions
    print("\n7. Testing permissions endpoint...")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{base_url}/api/auth/permissions", headers=headers)
        result = response.json()
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print(f"   User ID: {result['user_id']}")
            print(f"   Role: {result['role']}")
            permissions = result["permissions"]
            print(f"   Can view all BUs: {permissions['can_view_all_business_units']}")
            print(f"   Can manage users: {permissions['can_manage_users']}")
            print(f"   Can create alerts: {permissions['can_create_alerts']}")
            print(f"   Can export data: {permissions['can_export_data']}")
            print(f"   Can access debug: {permissions['can_access_debug']}")
        else:
            print(f"   Error: {result}")
    except Exception as e:
        print(f"   Error: {e}")
        return False

    # Test 8: Test protected endpoint without auth
    print("\n8. Testing protected endpoint without auth...")
    try:
        response = requests.get(f"{base_url}/api/alerts")
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"   Response: {result}")
        else:
            print(f"   Expected non-200 status for unprotected placeholder endpoint")
    except Exception as e:
        print(f"   Error: {e}")

    print("\n🎉 Authentication system testing completed!")
    return True


if __name__ == "__main__":
    test_live_authentication()
