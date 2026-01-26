#!/usr/bin/env python3
"""
Development Server Runner

Simple script to run the FastAPI development server with proper configuration.
"""

import os
import sys
from pathlib import Path

# Add the app directory to Python path
backend_dir = Path(__file__).parent
app_dir = backend_dir / "app"
sys.path.insert(0, str(backend_dir))

# Set environment variables for development
os.environ.setdefault("DEBUG", "true")
os.environ.setdefault("HOST", "0.0.0.0")
os.environ.setdefault("PORT", "8000")
os.environ.setdefault("RELOAD", "true")

if __name__ == "__main__":
    import uvicorn
    from app.main import app
    
    # Run the server
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )