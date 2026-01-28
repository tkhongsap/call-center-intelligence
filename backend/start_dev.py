#!/usr/bin/env python3
"""
Cross-platform development startup script for FastAPI backend.
This replaces start-dev.sh for better Windows compatibility.
"""

import asyncio
import os
import subprocess
import sys
import time
from pathlib import Path

def print_banner():
    """Print startup banner."""
    print("🚀 Starting FastAPI Backend in Development Mode")
    print("=" * 48)

async def wait_for_database():
    """Wait for database connection to be ready."""
    print("⏳ Waiting for database connection...")
    
    # Add current directory to Python path
    sys.path.insert(0, str(Path(__file__).parent))
    
    try:
        from app.core.database import init_db
        from app.core.exceptions import DatabaseError
        
        max_retries = 30
        for i in range(max_retries):
            try:
                await init_db()
                print("✅ Database connection established")
                return True
            except Exception as e:
                if i < max_retries - 1:
                    print(f"⏳ Database not ready, retrying... ({i+1}/{max_retries})")
                    await asyncio.sleep(2)
                else:
                    print(f"❌ Failed to connect to database after {max_retries} attempts")
                    print(f"Error: {e}")
                    return False
    except ImportError as e:
        print(f"❌ Failed to import database modules: {e}")
        return False

def run_migrations():
    """Run Alembic database migrations."""
    print("🔧 Running database migrations...")
    try:
        result = subprocess.run(
            ["alembic", "upgrade", "head"],
            check=True,
            capture_output=True,
            text=True
        )
        print("✅ Database migrations applied")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Migration failed: {e}")
        if e.stdout:
            print(f"stdout: {e.stdout}")
        if e.stderr:
            print(f"stderr: {e.stderr}")
        return False
    except FileNotFoundError:
        print("❌ Alembic not found. Make sure it's installed.")
        return False

def run_seeding():
    """Run database seeding if enabled."""
    seed_db = os.getenv("SEED_DATABASE", "true").lower() == "true"
    
    if seed_db:
        print("🌱 Seeding database with sample data...")
        try:
            result = subprocess.run(
                [sys.executable, "seed_postgres.py"],
                check=True,
                capture_output=True,
                text=True
            )
            print("✅ Database seeding completed")
            if result.stdout:
                print(result.stdout)
            return True
        except subprocess.CalledProcessError as e:
            print(f"❌ Seeding failed: {e}")
            if e.stdout:
                print(f"stdout: {e.stdout}")
            if e.stderr:
                print(f"stderr: {e.stderr}")
            return False
        except FileNotFoundError:
            print("❌ seed_postgres.py not found")
            return False
    else:
        print("⏭️  Skipping database seeding (SEED_DATABASE=false)")
        return True

def start_server():
    """Start the FastAPI server."""
    port = os.getenv("PORT", "8000")
    print("🎯 Starting FastAPI server...")
    print(f"📍 Server will be available at: http://localhost:{port}")
    print(f"📚 API docs will be available at: http://localhost:{port}/docs")
    print("")
    
    try:
        # Use exec to replace the current process
        os.execv(sys.executable, [sys.executable, "main.py"])
    except Exception as e:
        print(f"❌ Failed to start server: {e}")
        sys.exit(1)

async def main():
    """Main startup sequence."""
    print_banner()
    
    # Wait for database
    if not await wait_for_database():
        sys.exit(1)
    
    # Run migrations
    if not run_migrations():
        sys.exit(1)
    
    # Run seeding
    if not run_seeding():
        sys.exit(1)
    
    # Start server
    start_server()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n🛑 Startup interrupted by user")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Startup failed: {e}")
        sys.exit(1)