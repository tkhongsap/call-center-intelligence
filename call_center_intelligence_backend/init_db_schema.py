#!/usr/bin/env python3
"""
Database Schema Initialization Script

Creates all database tables from SQLAlchemy models.
This should be run before seeding the database.
"""

import asyncio
import sys
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

# Add the app directory to Python path
sys.path.insert(0, ".")

from app.core.config import get_settings
from app.core.database import Base

# Import all models to ensure they're registered with Base.metadata
from app.models.user import User
from app.models.case import Case
from app.models.alert import Alert
from app.models.trending_topic import TrendingTopic
from app.models.feed_item import FeedItem
from app.models.share import Share
from app.models.upload import Upload
from app.models.embedding import Embedding
from app.models.search_analytic import SearchAnalytic

# Define all ENUM types that need to be created
ENUM_TYPES = [
    ("userrole", ["admin", "bu_manager", "supervisor"]),
    ("channel", ["phone", "email", "line", "web"]),
    ("casestatus", ["open", "in_progress", "resolved", "closed"]),
    ("sentiment", ["positive", "neutral", "negative"]),
    ("severity", ["low", "medium", "high", "critical"]),
    ("alerttype", ["spike", "threshold", "urgency", "misclassification"]),
    ("alertstatus", ["active", "acknowledged", "resolved", "dismissed"]),
    ("trend", ["rising", "stable", "declining"]),
    ("feeditemtype", ["alert", "trending", "highlight", "upload"]),
    ("sharetype", ["share", "escalation"]),
    ("sharesourcetype", ["alert", "case"]),
    ("sharechannel", ["internal", "email", "line"]),
    ("sharestatus", ["pending", "read", "actioned"]),
    ("uploadstatus", ["processing", "completed", "failed", "partial"]),
    ("recomputestatus", ["pending", "processing", "completed", "failed"]),
]


async def create_enum_types(conn):
    """Create PostgreSQL ENUM types if they don't exist."""
    print("📋 Creating ENUM types...")
    for enum_name, values in ENUM_TYPES:
        # Check if the type already exists
        check_query = text(
            "SELECT 1 FROM pg_type WHERE typname = :type_name"
        )
        result = await conn.execute(check_query, {"type_name": enum_name})
        exists = result.fetchone() is not None

        if not exists:
            values_str = ", ".join(f"'{v}'" for v in values)
            create_query = text(f"CREATE TYPE {enum_name} AS ENUM ({values_str})")
            await conn.execute(create_query)
            print(f"   ✓ Created ENUM type: {enum_name}")
        else:
            print(f"   - ENUM type already exists: {enum_name}")


async def init_schema():
    """Initialize database schema by creating all tables."""
    settings = get_settings()

    # Create async engine
    engine = create_async_engine(
        settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://"),
        echo=True,
    )

    print("🔧 Initializing database schema...")
    print(f"📊 Database URL: {settings.DATABASE_URL.split('@')[1] if '@' in settings.DATABASE_URL else settings.DATABASE_URL}")

    try:
        async with engine.begin() as conn:
            # First create ENUM types
            await create_enum_types(conn)

            # Then create all tables
            print("📋 Creating tables...")
            await conn.run_sync(Base.metadata.create_all)

        print("✅ Database schema initialized successfully!")
        print(f"📝 Created {len(Base.metadata.tables)} tables:")
        for table_name in sorted(Base.metadata.tables.keys()):
            print(f"   - {table_name}")

    except Exception as e:
        print(f"❌ Error initializing database schema: {e}")
        raise
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(init_schema())
