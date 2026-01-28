"""
FastAPI Backend Application

This is the main FastAPI application that replaces the Next.js API routes.
It provides identical functionality while maintaining proper separation of concerns.
"""

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
                "Authenticated request",
                user_id=user["id"],
                user_role=user.get("role"),
                path=request.url.path,
                method=request.method,
            )

        response = await call_next(request)
        return response

    # Add trusted host middleware for security
    if not settings.DEBUG:
        app.add_middleware(
            TrustedHostMiddleware, allowed_hosts=["localhost", "127.0.0.1", "0.0.0.0"]
        )

    # Include API routes
    app.include_router(api_router, prefix="/api")

    # Global exception handlers
    @app.exception_handler(DatabaseError)
    async def database_exception_handler(request, exc: DatabaseError):
        logger.error("Database error occurred", error=str(exc), path=request.url.path)
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
            "Validation error occurred", error=str(exc), path=request.url.path
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
            "Authentication error occurred", error=str(exc), path=request.url.path
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
        logger.info("Resource not found", error=str(exc), path=request.url.path)
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
        logger.warning("Conflict error occurred", error=str(exc), path=request.url.path)
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
        logger.error("Unexpected error occurred", error=str(exc), path=request.url.path)
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
    settings = get_settings()
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.RELOAD,
        log_level=settings.LOG_LEVEL.lower(),
    )
