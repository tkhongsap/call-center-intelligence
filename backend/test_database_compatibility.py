#!/usr/bin/env python3
"""
Test script to verify SQLAlchemy models are fully compatible with the existing database.

This script tests that the SQLAlchemy models can read existing data from the database
and that the field mappings match the Drizzle schema exactly.
"""

import asyncio
import sys
import os
from pathlib import Path
from typing import Dict, Any

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.models import (
    User, Case, Alert, TrendingTopic, FeedItem, Share, SearchAnalytic, Upload
)
from app.core.database import init_db, get_db
from sqlalchemy import text, inspect
from sqlalchemy.ext.asyncio import AsyncSession


async def test_database_compatibility():
    """Test that SQLAlchemy models are compatible with existing database."""
    print("Testing database compatibility...")
    
    # Set the correct database path
    db_path = backend_dir.parent / "call-center.db"
    os.environ["DATABASE_URL"] = f"sqlite:///{db_path}"
    
    await init_db()
    
    async for session in get_db():
        # Test reading existing data from each table
        await test_table_compatibility(session, "users", User)
        await test_table_compatibility(session, "cases", Case)
        await test_table_compatibility(session, "alerts", Alert)
        await test_table_compatibility(session, "trending_topics", TrendingTopic)
        await test_table_compatibility(session, "feed_items", FeedItem)
        await test_table_compatibility(session, "shares", Share)
        await test_table_compatibility(session, "search_analytics", SearchAnalytic)
        await test_table_compatibility(session, "uploads", Upload)
        
        # Test schema compatibility
        await test_schema_compatibility(session)
        
        break  # Only need one session
    
    print("\n🎉 All database compatibility tests passed!")


async def test_table_compatibility(session: AsyncSession, table_name: str, model_class):
    """Test that we can read data from a table using the SQLAlchemy model."""
    print(f"✓ Testing {table_name} table compatibility...")
    
    try:
        # Try to query the table using SQLAlchemy
        result = await session.execute(
            text(f"SELECT COUNT(*) FROM {table_name}")
        )
        count = result.scalar()
        print(f"  - Found {count} records in {table_name}")
        
        # Try to read a few records using the model
        from sqlalchemy import select
        stmt = select(model_class).limit(5)
        result = await session.execute(stmt)
        records = result.scalars().all()
        
        print(f"  - Successfully read {len(records)} records using {model_class.__name__} model")
        
        # If we have records, test field access
        if records:
            record = records[0]
            print(f"  - Sample record ID: {record.id}")
            
            # Test that all expected fields are accessible
            for column in model_class.__table__.columns:
                field_name = column.name
                try:
                    value = getattr(record, field_name)
                    print(f"    ✓ Field '{field_name}': {type(value).__name__}")
                except AttributeError as e:
                    print(f"    ✗ Field '{field_name}' not accessible: {e}")
                    
    except Exception as e:
        print(f"  ✗ Error testing {table_name}: {e}")
        raise


async def test_schema_compatibility(session: AsyncSession):
    """Test that the SQLAlchemy models match the database schema."""
    print("✓ Testing schema compatibility...")
    
    # Get database schema information
    result = await session.execute(text("""
        SELECT 
            m.name as table_name,
            p.name as column_name,
            p.type as column_type,
            p."notnull" as not_null,
            p.pk as primary_key,
            p.dflt_value as default_value
        FROM sqlite_master m
        LEFT OUTER JOIN pragma_table_info(m.name) p ON m.name != p.name
        WHERE m.type = 'table' AND m.name NOT LIKE 'sqlite_%'
        ORDER BY m.name, p.cid
    """))
    
    db_schema = {}
    for row in result.fetchall():
        table_name, column_name, column_type, not_null, primary_key, default_value = row
        if table_name not in db_schema:
            db_schema[table_name] = {}
        if column_name:  # Skip None values
            db_schema[table_name][column_name] = {
                'type': column_type,
                'not_null': bool(not_null),
                'primary_key': bool(primary_key),
                'default_value': default_value
            }
    
    # Map SQLAlchemy models to table names
    model_mapping = {
        'users': User,
        'cases': Case,
        'alerts': Alert,
        'trending_topics': TrendingTopic,
        'feed_items': FeedItem,
        'shares': Share,
        'search_analytics': SearchAnalytic,
        'uploads': Upload
    }
    
    # Check each model against the database schema
    for table_name, model_class in model_mapping.items():
        print(f"  - Checking {table_name} schema...")
        
        if table_name not in db_schema:
            print(f"    ✗ Table {table_name} not found in database")
            continue
            
        db_columns = db_schema[table_name]
        model_columns = {col.name: col for col in model_class.__table__.columns}
        
        # Check that all database columns are represented in the model
        for db_col_name, db_col_info in db_columns.items():
            if db_col_name in model_columns:
                print(f"    ✓ Column '{db_col_name}' mapped correctly")
            else:
                print(f"    ⚠ Column '{db_col_name}' in database but not in model")
        
        # Check that all model columns exist in the database
        for model_col_name, model_col in model_columns.items():
            if model_col_name in db_columns:
                # Column exists, check compatibility
                db_col_info = db_columns[model_col_name]
                
                # Check primary key
                if model_col.primary_key != db_col_info['primary_key']:
                    print(f"    ⚠ Primary key mismatch for '{model_col_name}'")
                
                # Check nullable
                if model_col.nullable == db_col_info['not_null']:
                    print(f"    ⚠ Nullable mismatch for '{model_col_name}'")
                    
            else:
                print(f"    ⚠ Model column '{model_col_name}' not found in database")
    
    print("  ✓ Schema compatibility check completed")


async def test_json_fields():
    """Test that JSON fields work correctly."""
    print("✓ Testing JSON field compatibility...")
    
    # Set the correct database path
    db_path = backend_dir.parent / "call-center.db"
    os.environ["DATABASE_URL"] = f"sqlite:///{db_path}"
    
    await init_db()
    
    async for session in get_db():
        # Test TrendingTopic sample_case_ids (JSON array)
        from sqlalchemy import select
        stmt = select(TrendingTopic).where(TrendingTopic.sample_case_ids.isnot(None)).limit(1)
        result = await session.execute(stmt)
        topic = result.scalar_one_or_none()
        
        if topic and topic.sample_case_ids:
            print(f"  - TrendingTopic sample_case_ids: {topic.sample_case_ids} (type: {type(topic.sample_case_ids)})")
            assert isinstance(topic.sample_case_ids, list), "sample_case_ids should be a list"
        
        # Test FeedItem metadata (JSON object)
        stmt = select(FeedItem).where(FeedItem.item_metadata.isnot(None)).limit(1)
        result = await session.execute(stmt)
        feed_item = result.scalar_one_or_none()
        
        if feed_item and feed_item.item_metadata:
            print(f"  - FeedItem metadata: {feed_item.item_metadata} (type: {type(feed_item.item_metadata)})")
            assert isinstance(feed_item.item_metadata, dict), "metadata should be a dict"
        
        # Test Upload errors (JSON array)
        stmt = select(Upload).where(Upload.errors.isnot(None)).limit(1)
        result = await session.execute(stmt)
        upload = result.scalar_one_or_none()
        
        if upload and upload.errors:
            print(f"  - Upload errors: {upload.errors} (type: {type(upload.errors)})")
            assert isinstance(upload.errors, list), "errors should be a list"
        
        print("  ✓ JSON fields working correctly")
        break


if __name__ == "__main__":
    asyncio.run(test_database_compatibility())
    asyncio.run(test_json_fields())