"""
Simplified Property-Based Test for Database Model Equivalence

**Property 3: Database Operation Equivalence**
**Validates: Requirements 2.2, 2.4, 8.1, 8.2, 8.3**
"""

import pytest
import asyncio
from datetime import datetime, timezone
from hypothesis import given, strategies as st, settings
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool

from app.models import User, UserRole
from app.core.database import Base
from app.core.database import get_db


# Test database URL (in-memory SQLite)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


async def create_test_db():
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
        return session, engine


# Hypothesis strategies
valid_id_strategy = st.text(
    alphabet=st.characters(whitelist_categories=("Lu", "Ll", "Nd"), whitelist_characters="-_"),
    min_size=1,
    max_size=50
).filter(lambda x: x and not x.startswith('-') and not x.endswith('-'))

email_strategy = st.emails().map(str)
user_role_strategy = st.sampled_from(list(UserRole))

@st.composite
def user_data_strategy(draw):
    """Generate valid User model data."""
    return {
        "id": draw(valid_id_strategy),
        "name": draw(st.text(min_size=1, max_size=100)),
        "email": draw(email_strategy),
        "role": draw(user_role_strategy),
        "business_unit": draw(st.one_of(st.none(), st.sampled_from(["IT", "Sales", "Support"]))),
        "avatar_url": draw(st.one_of(st.none(), st.text(min_size=10, max_size=200).map(lambda x: f"https://example.com/{x}"))),
        "created_at": "2024-01-01T00:00:00Z"
    }


async def test_user_crud_equivalence_direct(user_data):
    """
    **Validates: Requirements 2.2, 2.4, 8.1, 8.2, 8.3**
    
    Test that User CRUD operations work identically to expected behavior.
    
    Feature: backend-migration-fastapi, Property 3: Database Operation Equivalence
    """
    session, engine = await create_test_db()
    
    try:
        # Create user
        user = User(**user_data)
        session.add(user)
        await session.commit()
        
        # Read user
        stmt = select(User).where(User.id == user_data["id"])
        result = await session.execute(stmt)
        retrieved_user = result.scalar_one()
        
        # Verify all fields match exactly
        assert retrieved_user.id == user_data["id"]
        assert retrieved_user.name == user_data["name"]
        assert retrieved_user.email == user_data["email"]
        assert retrieved_user.role == user_data["role"]
        assert retrieved_user.business_unit == user_data["business_unit"]
        assert retrieved_user.avatar_url == user_data["avatar_url"]
        assert retrieved_user.created_at == user_data["created_at"]
        
        # Update user
        new_name = f"Updated {user_data['name']}"
        retrieved_user.name = new_name
        await session.commit()
        
        # Verify update
        stmt = select(User).where(User.id == user_data["id"])
        result = await session.execute(stmt)
        updated_user = result.scalar_one()
        assert updated_user.name == new_name
        
        # Delete user
        await session.delete(retrieved_user)
        await session.commit()
        
        # Verify deletion
        stmt = select(User).where(User.id == user_data["id"])
        result = await session.execute(stmt)
        deleted_user = result.scalar_one_or_none()
        assert deleted_user is None
        
        print(f"✓ CRUD test passed for user: {user_data['id']}")
        
    finally:
        await session.close()
        await engine.dispose()


@settings(max_examples=20, deadline=None)
@given(user_data=user_data_strategy())
def test_user_crud_equivalence_sync(user_data):
    """Sync wrapper for the async test."""
    asyncio.run(test_user_crud_equivalence_direct(user_data))


if __name__ == "__main__":
    # Run a simple test
    print("Running property-based test for database model equivalence...")
    
    # Test with a simple example
    test_data = {
        "id": "test-user-1",
        "name": "Test User",
        "email": "test@example.com",
        "role": UserRole.admin,
        "business_unit": "IT",
        "avatar_url": "https://example.com/avatar.jpg",
        "created_at": "2024-01-01T00:00:00Z"
    }
    
    asyncio.run(test_user_crud_equivalence_direct(test_data))
    print("✓ Property-based test completed successfully!")