#!/usr/bin/env python3
"""
FastAPI Server Startup Script

Simple script to start the FastAPI development server.
"""

import sys
import os
import uvicorn

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(__file__))


def main():
    """Start the FastAPI development server."""
    try:
        print("=" * 60)
        print("FastAPI Backend Development Server")
        print("=" * 60)
        print()
        print("Starting FastAPI development server...")
        print("Server will be available at: http://localhost:8000")
        print("API documentation will be available at: http://localhost:8000/docs")
        print("WebSocket endpoint will be available at: ws://localhost:8000/api/ws")
        print("Health check endpoint: http://localhost:8000/health")
        print()
        print("Note: Make sure you have activated the conda environment:")
        print("  conda activate fastapi-backend")
        print()
        print("Press Ctrl+C to stop the server")
        print("=" * 60)

        uvicorn.run(
            "app.main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            log_level="info",
        )
    except KeyboardInterrupt:
        print("\n" + "=" * 60)
        print("Server stopped by user")
        print("=" * 60)
    except Exception as e:
        print(f"\nError starting server: {e}")
        print("\nTroubleshooting:")
        print(
            "1. Make sure conda environment is activated: conda activate fastapi-backend"
        )
        print(
            "2. Make sure dependencies are installed: pip install -r requirements.txt"
        )
        print("3. Check if port 8000 is already in use")
        sys.exit(1)


if __name__ == "__main__":
    main()
