"""
Simple property test to verify the setup works.
"""

import pytest
import asyncio
from hypothesis import given, strategies as st, settings
from app.models import User, UserRole


@pytest.mark.asyncio
@settings(max_examples=10)
@given(
    user_id=st.text(min_size=1, max_size=20),
    name=st.text(min_size=1, max_size=50),
    email=st.emails().map(str)
)
async def test_simple_user_creation(user_id, name, email):
    """Simple test to verify property-based testing works."""
    user_data = {
        "id": user_id,
        "name": name,
        "email": email,
        "role": UserRole.admin,
        "created_at": "2024-01-01T00:00:00Z"
    }
    
    user = User(**user_data)
    
    # Basic assertions
    assert user.id == user_id
    assert user.name == name
    assert user.email == email
    assert user.role == UserRole.admin
    
    print(f"✓ Created user: {user.id}")


async def simple_user_test():
    """Simple test without hypothesis decorator."""
    user_data = {
        "id": "test-user",
        "name": "Test User", 
        "email": "test@example.com",
        "role": UserRole.admin,
        "created_at": "2024-01-01T00:00:00Z"
    }
    
    user = User(**user_data)
    
    # Basic assertions
    assert user.id == "test-user"
    assert user.name == "Test User"
    assert user.email == "test@example.com"
    assert user.role == UserRole.admin
    
    print(f"✓ Created user: {user.id}")


if __name__ == "__main__":
    # Run the test directly
    import hypothesis
    print(f"Hypothesis version: {hypothesis.__version__}")
    
    # Test the function with a simple example
    asyncio.run(simple_user_test())
    print("✓ Simple property test passed!")