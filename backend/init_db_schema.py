#!/usr/bin/env python3
"""
Database Schema Initialization Script

Creates all database tables from SQLAlchemy models.
This should be run before seeding the database.
"""

import asyncio
import sys
from sqlalchemy.ext.asyncio import create_async_engine

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
        # Create all tables
        async with engine.begin() as conn:
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
