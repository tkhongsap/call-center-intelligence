#!/usr/bin/env python3
"""
Setup Validation Script

Validates that the FastAPI backend is properly configured and can start.
"""

import sys
import traceback
from pathlib import Path

def test_imports():
    """Test that all required modules can be imported."""
    print("Testing imports...")
    
    try:
        import fastapi
        print("✓ FastAPI imported successfully")
    except ImportError as e:
        print(f"✗ Failed to import FastAPI: {e}")
        return False
    
    try:
        import uvicorn
        print("✓ Uvicorn imported successfully")
    except ImportError as e:
        print(f"✗ Failed to import Uvicorn: {e}")
        return False
    
    try:
        import sqlalchemy
        print("✓ SQLAlchemy imported successfully")
    except ImportError as e:
        print(f"✗ Failed to import SQLAlchemy: {e}")
        return False
    
    try:
        import aiosqlite
        print("✓ aiosqlite imported successfully")
    except ImportError as e:
        print(f"✗ Failed to import aiosqlite: {e}")
        return False
    
    try:
        import pydantic
        print("✓ Pydantic imported successfully")
    except ImportError as e:
        print(f"✗ Failed to import Pydantic: {e}")
        return False
    
    return True


def test_app_creation():
    """Test that the FastAPI app can be created."""
    print("\nTesting app creation...")
    
    try:
        from main import create_app
        app = create_app()
        print("✓ FastAPI app created successfully")
        return True
    except Exception as e:
        print(f"✗ Failed to create FastAPI app: {e}")
        traceback.print_exc()
        return False


def test_config():
    """Test configuration loading."""
    print("\nTesting configuration...")
    
    try:
        from app.core.config import get_settings
        settings = get_settings()
        print(f"✓ Configuration loaded successfully")
        print(f"  - Database URL: {settings.DATABASE_URL}")
        print(f"  - Debug mode: {settings.DEBUG}")
        print(f"  - CORS origins: {settings.cors_origins_list}")
        return True
    except Exception as e:
        print(f"✗ Failed to load configuration: {e}")
        traceback.print_exc()
        return False


def test_database_setup():
    """Test database configuration."""
    print("\nTesting database setup...")
    
    try:
        from app.core.database import Base
        print("✓ Database base class imported successfully")
        return True
    except Exception as e:
        print(f"✗ Failed to import database base: {e}")
        traceback.print_exc()
        return False


def test_routes():
    """Test that routes can be imported."""
    print("\nTesting routes...")
    
    try:
        from app.api import api_router
        print("✓ API router imported successfully")
        
        # Check that routes are registered
        routes = [route.path for route in api_router.routes]
        print(f"  - Registered routes: {len(routes)}")
        for route in routes[:5]:  # Show first 5 routes
            print(f"    - {route}")
        if len(routes) > 5:
            print(f"    - ... and {len(routes) - 5} more")
        
        return True
    except Exception as e:
        print(f"✗ Failed to import API router: {e}")
        traceback.print_exc()
        return False


def main():
    """Run all validation tests."""
    print("FastAPI Backend Setup Validation")
    print("=" * 40)
    
    tests = [
        test_imports,
        test_config,
        test_database_setup,
        test_routes,
        test_app_creation,
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        try:
            if test():
                passed += 1
        except Exception as e:
            print(f"✗ Test {test.__name__} failed with exception: {e}")
    
    print("\n" + "=" * 40)
    print(f"Validation Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! FastAPI backend is ready for development.")
        print("\nNext steps:")
        print("1. Start the development server:")
        print("   python -m uvicorn main:app --reload")
        print("2. Open http://localhost:8000/docs to view API documentation")
        print("3. Begin implementing the database models and API endpoints")
        return True
    else:
        print("❌ Some tests failed. Please check the errors above.")
        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)