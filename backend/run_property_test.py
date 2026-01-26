"""
Run property-based tests with hypothesis
"""

import asyncio
from hypothesis import given, strategies as st, settings
from test_property_simple import test_user_crud_equivalence_direct, user_data_strategy


@settings(max_examples=100, deadline=None)
@given(user_data=user_data_strategy())
def test_with_hypothesis(user_data):
    """Run the property test with hypothesis-generated data."""
    try:
        asyncio.run(test_user_crud_equivalence_direct(user_data))
        print(f"✓ Test passed for user: {user_data['id'][:20]}...")
    except Exception as e:
        print(f"✗ Test failed for user {user_data['id']}: {e}")
        raise


if __name__ == "__main__":
    print("Running property-based tests with hypothesis (100 examples)...")
    print("This validates Property 3: Database Operation Equivalence")
    print("Requirements: 2.2, 2.4, 8.1, 8.2, 8.3")
    print("=" * 60)
    
    # Run the hypothesis test
    test_with_hypothesis()
    
    print("=" * 60)
    print("✅ All property-based tests passed!")
    print("Database model equivalence validated successfully.")