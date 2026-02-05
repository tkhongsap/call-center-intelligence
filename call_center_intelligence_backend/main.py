"""
FastAPI Backend Application

This is the main FastAPI application that replaces the Next.js API routes.
It provides identical functionality while maintaining proper separation of concerns.
"""

import os
from pathlib import Path

# Load .env file if running locally (not in Docker)
# In Docker, environment variables are passed directly
if not os.getenv("DOCKER_CONTAINER"):
    try:
        from dotenv import load_dotenv

        # Look for .env file in the parent directory (root of project)
        env_file = Path(__file__).parent.parent / ".env"
        if env_file.exists():
            load_dotenv(env_file)
        else:
            # Fallback to local .env file for backward compatibility
            local_env_file = Path(__file__).parent / ".env"
            if local_env_file.exists():
                load_dotenv(local_env_file)
    except ImportError:
        # python-dotenv not installed, skip loading
        pass

from contextlib import asynccontextmanager
from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
import logging
import uvicorn

from app.core.config import get_settings
from app.core.database import init_db, close_db
from app.core.exceptions import (
    DatabaseError,
    ValidationError,
    AuthenticationError,
    NotFoundError,
    ConflictError,
)
from app.core.auth import auth_middleware
from app.api import api_router


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger(__name__)


def get_timestamp() -> str:
    """Get current timestamp in ISO format."""
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for startup and shutdown events."""
    # Startup
    logger.info("Starting FastAPI backend application")
    await init_db()
    logger.info("Database initialized successfully")

    yield

    # Shutdown
    logger.info("Shutting down FastAPI backend application")
    await close_db()
    logger.info("Database connections closed")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    settings = get_settings()

    app = FastAPI(
        title="Call Center Backend API",
        description="FastAPI backend for the call center management system",
        version="1.0.0",
        docs_url="/docs" if settings.DEBUG else None,
        redoc_url="/redoc" if settings.DEBUG else None,
        lifespan=lifespan,
    )

    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )

    # Add authentication middleware for request logging
    @app.middleware("http")
    async def authentication_logging_middleware(request, call_next):
        """Log authentication information for requests."""
        # Get user information if available (non-blocking)
        user = await auth_middleware.get_current_user(request, None)
        if user:
            logger.info(
                f"Authenticated request - User ID: {user['id']}, "
                f"Role: {user.get('role')}, Path: {request.url.path}, "
                f"Method: {request.method}"
            )

        response = await call_next(request)
        return response

    # Add trusted host middleware for security
    if not settings.DEBUG:
        # Get allowed hosts from settings
        allowed_hosts = settings.ALLOWED_HOSTS
        if isinstance(allowed_hosts, str):
            allowed_hosts = [host.strip() for host in allowed_hosts.split(",")]

        app.add_middleware(TrustedHostMiddleware, allowed_hosts=allowed_hosts)

    # Include API routes
    app.include_router(api_router, prefix="/api")

    # Global exception handlers
    @app.exception_handler(DatabaseError)
    async def database_exception_handler(request, exc: DatabaseError):
        logger.error(f"Database error occurred: {str(exc)} at path: {request.url.path}")
        return JSONResponse(
            status_code=500,
            content={
                "error": {
                    "code": "DATABASE_ERROR",
                    "message": "A database error occurred",
                    "details": str(exc) if settings.DEBUG else None,
                    "timestamp": get_timestamp(),
                }
            },
        )

    @app.exception_handler(ValidationError)
    async def validation_exception_handler(request, exc: ValidationError):
        logger.warning(
            f"Validation error occurred: {str(exc)} at path: {request.url.path}"
        )
        return JSONResponse(
            status_code=422,
            content={
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Invalid input data",
                    "details": exc.details if hasattr(exc, "details") else str(exc),
                    "timestamp": get_timestamp(),
                }
            },
        )

    @app.exception_handler(AuthenticationError)
    async def authentication_exception_handler(request, exc: AuthenticationError):
        logger.warning(
            f"Authentication error occurred: {str(exc)} at path: {request.url.path}"
        )
        return JSONResponse(
            status_code=401,
            content={
                "error": {
                    "code": "AUTHENTICATION_ERROR",
                    "message": "Authentication failed",
                    "details": str(exc) if settings.DEBUG else None,
                    "timestamp": get_timestamp(),
                }
            },
        )

    @app.exception_handler(NotFoundError)
    async def not_found_exception_handler(request, exc: NotFoundError):
        logger.info(f"Resource not found: {str(exc)} at path: {request.url.path}")
        return JSONResponse(
            status_code=404,
            content={
                "error": {
                    "code": "NOT_FOUND",
                    "message": "Resource not found",
                    "details": str(exc),
                    "timestamp": get_timestamp(),
                }
            },
        )

    @app.exception_handler(ConflictError)
    async def conflict_exception_handler(request, exc: ConflictError):
        logger.warning(
            f"Conflict error occurred: {str(exc)} at path: {request.url.path}"
        )
        return JSONResponse(
            status_code=409,
            content={
                "error": {
                    "code": "CONFLICT_ERROR",
                    "message": "Resource conflict",
                    "details": str(exc),
                    "timestamp": get_timestamp(),
                }
            },
        )

    @app.exception_handler(Exception)
    async def general_exception_handler(request, exc: Exception):
        logger.error(
            f"Unexpected error occurred: {str(exc)} at path: {request.url.path}"
        )
        return JSONResponse(
            status_code=500,
            content={
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "An unexpected error occurred",
                    "details": str(exc) if settings.DEBUG else None,
                    "timestamp": get_timestamp(),
                }
            },
        )

    # Health check endpoint
    @app.get("/health")
    async def health_check():
        """Health check endpoint for monitoring."""
        from app.core.database import health_check as db_health_check

        db_health = await db_health_check()

        overall_status = "healthy" if db_health["status"] == "healthy" else "unhealthy"

        return {
            "status": overall_status,
            "service": "call-center-backend",
            "database": db_health,
            "timestamp": get_timestamp(),
        }

    return app


# Create the application instance
app = create_app()


if __name__ == "__main__":
    import argparse
    import sys
    import subprocess

    # Parse command line arguments for debug mode
    parser = argparse.ArgumentParser(description="FastAPI Backend Server")
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Run in debug mode with enhanced logging and debugger support",
    )
    parser.add_argument(
        "--seed",
        action="store_true",
        help="Run database seeding before starting server",
    )
    parser.add_argument("--host", type=str, help="Override host from environment")
    parser.add_argument("--port", type=int, help="Override port from environment")
    parser.add_argument("--no-reload", action="store_true", help="Disable auto-reload")

    args = parser.parse_args()
    settings = get_settings()

    # Debug mode setup
    if args.debug:
        print("🐛 DEBUG MODE ENABLED")
        print("=" * 50)
        print("✓ Enhanced logging enabled")
        print("✓ Detailed error messages enabled")
        print("✓ Auto-reload disabled for debugging stability")
        print("✓ Set breakpoints with: import pdb; pdb.set_trace()")
        print("=" * 50)

        # Set debug environment
        os.environ["DEBUG"] = "true"
        os.environ["LOG_LEVEL"] = "DEBUG"

        # Configure detailed logging for debug mode
        logging.basicConfig(
            level=logging.DEBUG,
            format="%(asctime)s - %(name)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s",
            force=True,
        )

        # Enable SQLAlchemy query logging in debug mode
        logging.getLogger("sqlalchemy.engine").setLevel(logging.INFO)
        logging.getLogger("sqlalchemy.pool").setLevel(logging.DEBUG)

    # Handle database seeding if requested
    if args.seed:
        print("🌱 Running database seeding...")
        try:
            # Run the seed script
            seed_path = Path(__file__).parent / "seed_postgres.py"
            if seed_path.exists():
                result = subprocess.run(
                    [sys.executable, str(seed_path)],
                    check=True,
                    capture_output=True,
                    text=True,
                )
                print("✅ Database seeding completed successfully")
                if result.stdout:
                    print(result.stdout)
            else:
                print("⚠️  Seed file not found at:", seed_path)
        except subprocess.CalledProcessError as e:
            print(f"❌ Database seeding failed: {e}")
            if e.stderr:
                print(f"Error output: {e.stderr}")
            if not args.debug:  # In debug mode, continue anyway
                sys.exit(1)
        except Exception as e:
            print(f"❌ Unexpected error during seeding: {e}")
            if not args.debug:
                sys.exit(1)

    # Configure server settings
    if args.debug:
        # Debug mode: disable reload for stability, enable debug logging
        reload = False
        log_level = "debug"
    else:
        # Normal mode: use environment settings
        reload = not args.no_reload and settings.RELOAD
        log_level = settings.LOG_LEVEL.lower()

    # Override settings with command line args
    host = args.host or settings.HOST
    port = args.port or settings.PORT

    # Display startup information
    print(f"🚀 Starting FastAPI Backend Server")
    print(f"   Host: {host}")
    print(f"   Port: {port}")
    print(f"   Debug Mode: {'ON' if args.debug else 'OFF'}")
    print(f"   Auto-reload: {'ON' if reload else 'OFF'}")
    print(f"   Log Level: {log_level.upper()}")
    print()
    print(f"📍 Server URLs:")
    print(f"   • API: http://{host}:{port}")
    print(f"   • Docs: http://{host}:{port}/docs")
    print(f"   • Health: http://{host}:{port}/health")
    print()

    if args.debug:
        print("🔧 Debug Tips:")
        print("   • Use 'import pdb; pdb.set_trace()' for breakpoints")
        print("   • Check detailed logs for request/response info")
        print("   • Database queries are logged in debug mode")
        print("   • Press Ctrl+C to stop the server")
        print()

    # Start the server
    try:
        uvicorn.run(
            "main:app",
            host=host,
            port=port,
            reload=reload,
            log_level=log_level,
            access_log=args.debug,  # Enable access logs in debug mode
        )
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"\n❌ Server error: {e}")
        if args.debug:
            import traceback

            traceback.print_exc()
        sys.exit(1)
