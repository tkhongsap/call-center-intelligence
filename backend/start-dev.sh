#!/bin/bash

# Development startup script
# This script runs database seeding and then starts the FastAPI server

set -e

echo "🚀 Starting FastAPI Backend in Development Mode"
echo "================================================"

# Wait for database to be ready
echo "⏳ Waiting for database connection..."
python -c "
import asyncio
import sys
from app.core.database import init_db
from app.core.exceptions import DatabaseError

async def wait_for_db():
    max_retries = 30
    for i in range(max_retries):
        try:
            await init_db()
            print('✅ Database connection established')
            return
        except DatabaseError as e:
            if i < max_retries - 1:
                print(f'⏳ Database not ready, retrying... ({i+1}/{max_retries})')
                await asyncio.sleep(2)
            else:
                print(f'❌ Failed to connect to database after {max_retries} attempts')
                sys.exit(1)

asyncio.run(wait_for_db())
"

# Initialize database schema
echo "🔧 Initializing database schema..."
python init_db_schema.py
echo "✅ Database schema initialized"

# Run database seeding if SEED_DATABASE is true
if [ "${SEED_DATABASE:-true}" = "true" ]; then
    echo "🌱 Seeding database with sample data..."
    python seed_postgres.py
    echo "✅ Database seeding completed"
else
    echo "⏭️  Skipping database seeding (SEED_DATABASE=false)"
fi

echo "🎯 Starting FastAPI server..."
echo "📍 Server will be available at: http://localhost:${PORT:-8000}"
echo "📚 API docs will be available at: http://localhost:${PORT:-8000}/docs"
echo ""

# Start the FastAPI server
exec python main.py