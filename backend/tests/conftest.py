"""
Pytest Configuration and Fixtures

Provides common test fixtures and configuration for the test suite.
"""

import asyncio
import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool

from main import create_app
from app.core.database import get_db, Base
from app.core.config import get_settings


# Test database URL (in-memory SQLite)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="function")
async def test_db():
    """Create a test database session."""
    # Create test engine
    engine = create_async_engine(
        TEST_DATABASE_URL,
        connect_args={
            "check_same_thread": False,
        },
        poolclass=StaticPool,
    )
    
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Create session maker
    async_session_maker = async_sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session_maker() as session:
        yield session
    
    # Clean up
    await engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def client(test_db):
    """Create a test client with database dependency override."""
    from httpx import AsyncClient
    from fastapi.testclient import TestClient
    
    app = create_app()
    
    # Override database dependency
    async def override_get_db():
        yield test_db
    
    app.dependency_overrides[get_db] = override_get_db
    
    # Use TestClient for synchronous tests
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def sample_user_data():
    """Sample user data for testing."""
    return {
        "id": "user-1",
        "name": "Test User",
        "email": "test@example.com",
        "role": "admin",
        "business_unit": "IT",
        "avatar_url": "https://example.com/avatar.jpg",
        "created_at": "2024-01-01T00:00:00Z",
    }


@pytest.fixture
def sample_case_data():
    """Sample case data for testing."""
    return {
        "id": "case-1",
        "case_number": "CASE-001",
        "channel": "email",
        "status": "open",
        "category": "Technical Issue",
        "subcategory": "Login Problem",
        "sentiment": "neutral",
        "severity": "medium",
        "risk_flag": False,
        "needs_review_flag": False,
        "business_unit": "IT",
        "summary": "User cannot log into the system",
        "customer_name": "John Doe",
        "agent_id": "agent-1",
        "assigned_to": "user-1",
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z",
    }


@pytest.fixture
def sample_alert_data():
    """Sample alert data for testing."""
    return {
        "id": "alert-1",
        "type": "spike",
        "severity": "high",
        "title": "High Volume of Login Issues",
        "description": "Unusual spike in login-related cases detected",
        "business_unit": "IT",
        "category": "Technical Issue",
        "channel": "email",
        "baseline_value": 10.0,
        "current_value": 25.0,
        "percentage_change": 150.0,
        "status": "active",
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z",
    }