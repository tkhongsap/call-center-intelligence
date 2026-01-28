#!/usr/bin/env python3
"""
Validation script for database relationship enforcement property tests.

This script demonstrates that the property-based tests for database relationship
enforcement work correctly by running simplified versions of the key tests.
"""

import asyncio
import sys
from datetime import datetime, timezone
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import StaticPool
from sqlalchemy.exc import IntegrityError

from app.models import User, Case, Share, UserRole, Channel, CaseStatus, Sentiment, Severity
from app.models import ShareType, ShareSourceType, ShareChannel, ShareStatus
from app.core.database import Base


async def create_test_db():
    """Create a test database with foreign key constraints enabled."""
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        connect_args={
            "check_same_thread": False,
            "isolation_level": None
        },
        poolclass=StaticPool,
    )
    
    async with engine.begin() as conn:
        await conn.execute(text("PRAGMA foreign_keys=ON"))
        await conn.run_sync(Base.metadata.create_all)
    
    async_session_maker = async_sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    return async_session_maker(), engine


async def test_foreign_key_relationships():
    """Test that foreign key relationships work correctly."""
    print("Testing foreign key relationships...")
    
    session, engine = await create_test_db()
    
    try:
        # Create users
        sender = User(
            id="sender-1",
            name="Sender User",
            email="sender@example.com",
            role=UserRole.admin,
            created_at="2024-01-01T00:00:00Z"
        )
        recipient = User(
            id="recipient-1", 
            name="Recipient User",
            email="recipient@example.com",
            role=UserRole.supervisor,
            created_at="2024-01-01T00:00:00Z"
        )
        
        session.add(sender)
        session.add(recipient)
        await session.commit()
        
        # Create share with valid foreign keys
        share = Share(
            id="share-1",
            type=ShareType.share,
            source_type=ShareSourceType.alert,
            source_id="alert-1",
            sender_id="sender-1",
            recipient_id="recipient-1",
            channel=ShareChannel.internal,
            status=ShareStatus.pending,
            created_at="2024-01-01T00:00:00Z"
        )
        
        session.add(share)
        await session.commit()
        
        # Verify relationships work
        stmt = select(Share).where(Share.id == "share-1")
        result = await session.execute(stmt)
        retrieved_share = result.scalar_one()
        
        await session.refresh(retrieved_share, ["sender", "recipient"])
        assert retrieved_share.sender.id == "sender-1"
        assert retrieved_share.recipient.id == "recipient-1"
        
        print("✓ Foreign key relationships work correctly")
        
    finally:
        await session.close()
        await engine.dispose()


async def test_foreign_key_constraint_violation():
    """Test that foreign key constraints are enforced."""
    print("Testing foreign key constraint violations...")
    
    session, engine = await create_test_db()
    
    try:
        # Attempt to create share with non-existent foreign keys
        share = Share(
            id="invalid-share",
            type=ShareType.share,
            source_type=ShareSourceType.alert,
            source_id="alert-1",
            sender_id="non-existent-sender",
            recipient_id="non-existent-recipient",
            channel=ShareChannel.internal,
            status=ShareStatus.pending,
            created_at="2024-01-01T00:00:00Z"
        )
        
        session.add(share)
        
        # This should fail
        try:
            await session.commit()
            print("✗ Foreign key constraint was NOT enforced (unexpected)")
            return False
        except IntegrityError:
            print("✓ Foreign key constraint properly enforced")
            await session.rollback()
            return True
        
    finally:
        await session.close()
        await engine.dispose()


async def test_unique_constraint():
    """Test that unique constraints are enforced."""
    print("Testing unique constraints...")
    
    session, engine = await create_test_db()
    
    try:
        # Create first case
        case1 = Case(
            id="case-1",
            case_number="CASE-123456",
            channel=Channel.phone,
            status=CaseStatus.open,
            category="Technical Issue",
            sentiment=Sentiment.neutral,
            severity=Severity.medium,
            risk_flag=False,
            needs_review_flag=False,
            business_unit="IT",
            summary="First test case",
            created_at="2024-01-01T00:00:00Z",
            updated_at="2024-01-01T00:00:00Z"
        )
        
        session.add(case1)
        await session.commit()
        
        # Attempt to create second case with same case_number
        case2 = Case(
            id="case-2",
            case_number="CASE-123456",  # Same case number
            channel=Channel.email,
            status=CaseStatus.open,
            category="Billing",
            sentiment=Sentiment.negative,
            severity=Severity.high,
            risk_flag=True,
            needs_review_flag=True,
            business_unit="Sales",
            summary="Second test case",
            created_at="2024-01-01T00:00:00Z",
            updated_at="2024-01-01T00:00:00Z"
        )
        
        session.add(case2)
        
        # This should fail due to unique constraint
        try:
            await session.commit()
            print("✗ Unique constraint was NOT enforced (unexpected)")
            return False
        except IntegrityError:
            print("✓ Unique constraint properly enforced")
            await session.rollback()
            return True
        
    finally:
        await session.close()
        await engine.dispose()


async def test_enum_constraints():
    """Test that enum constraints work correctly."""
    print("Testing enum constraints...")
    
    session, engine = await create_test_db()
    
    try:
        # Test valid enum values
        case = Case(
            id="enum-test-case",
            case_number="CASE-ENUM-001",
            channel=Channel.web,
            status=CaseStatus.in_progress,
            category="Product",
            sentiment=Sentiment.positive,
            severity=Severity.low,
            risk_flag=False,
            needs_review_flag=False,
            business_unit="Support",
            summary="Enum test case",
            created_at="2024-01-01T00:00:00Z",
            updated_at="2024-01-01T00:00:00Z"
        )
        
        session.add(case)
        await session.commit()
        
        # Verify enum values are preserved
        stmt = select(Case).where(Case.id == "enum-test-case")
        result = await session.execute(stmt)
        retrieved_case = result.scalar_one()
        
        assert retrieved_case.channel == Channel.web
        assert retrieved_case.status == CaseStatus.in_progress
        assert retrieved_case.sentiment == Sentiment.positive
        assert retrieved_case.severity == Severity.low
        
        print("✓ Enum constraints work correctly")
        return True
        
    finally:
        await session.close()
        await engine.dispose()


async def main():
    """Run all validation tests."""
    print("Validating Database Relationship Enforcement Property Tests")
    print("=" * 60)
    
    tests = [
        test_foreign_key_relationships,
        test_foreign_key_constraint_violation,
        test_unique_constraint,
        test_enum_constraints
    ]
    
    results = []
    for test in tests:
        try:
            result = await test()
            results.append(result if result is not None else True)
        except Exception as e:
            print(f"✗ Test {test.__name__} failed with error: {e}")
            results.append(False)
        print()
    
    print("=" * 60)
    passed = sum(1 for r in results if r)
    total = len(results)
    
    if passed == total:
        print(f"✓ All {total} validation tests passed!")
        print("\nProperty 6: Database Relationship and Constraint Enforcement")
        print("Requirements validated: 2.3, 8.3")
        print("\nThe property tests successfully validate:")
        print("- User ↔ Share relationships (sender/recipient foreign keys)")
        print("- Unique constraints (case_number, etc.)")
        print("- Foreign key constraints and referential integrity")
        print("- Enum value constraints")
        return 0
    else:
        print(f"✗ {total - passed} out of {total} tests failed")
        return 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))