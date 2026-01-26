"""
Database Configuration and Session Management

Provides async SQLAlchemy engine, session management, and connection handling
with retry logic, connection pooling, and comprehensive error handling.
"""

import asyncio
from typing import AsyncGenerator, Optional
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.exc import SQLAlchemyError, DisconnectionError, OperationalError
from sqlalchemy import text
import structlog

from app.core.config import get_settings
from app.core.exceptions import DatabaseError

logger = structlog.get_logger(__name__)

# Global variables for database engine and session maker
engine = None
async_session_maker = None


class Base(DeclarativeBase):
    """Base class for SQLAlchemy models."""
    pass


async def init_db() -> None:
    """Initialize database engine and session maker with retry logic."""
    global engine, async_session_maker
    
    settings = get_settings()
    
    max_retries = settings.DATABASE_RETRY_ATTEMPTS
    retry_delay = settings.DATABASE_RETRY_DELAY
    
    for attempt in range(max_retries):
        try:
            # Create async engine with enhanced configuration
            if settings.is_sqlite:
                # For SQLite, we need to use aiosqlite
                database_url = settings.DATABASE_URL.replace("sqlite://", "sqlite+aiosqlite://")
                
                engine = create_async_engine(
                    database_url,
                    echo=settings.DEBUG,  # Log SQL queries in debug mode
                    pool_pre_ping=True,   # Verify connections before use
                    pool_recycle=settings.DATABASE_POOL_RECYCLE,
                    connect_args={
                        "check_same_thread": False,
                        "timeout": 30,  # Connection timeout for SQLite
                    },
                )
            else:
                # For other databases (PostgreSQL, MySQL, etc.)
                engine = create_async_engine(
                    settings.DATABASE_URL,
                    echo=settings.DEBUG,
                    pool_pre_ping=True,
                    pool_recycle=settings.DATABASE_POOL_RECYCLE,
                    pool_size=settings.DATABASE_POOL_SIZE,
                    max_overflow=settings.DATABASE_MAX_OVERFLOW,
                    pool_timeout=settings.DATABASE_POOL_TIMEOUT,
                )
            
            # Create session maker
            async_session_maker = async_sessionmaker(
                engine,
                class_=AsyncSession,
                expire_on_commit=False,
                autoflush=True,
                autocommit=False,
            )
            
            # Test the connection
            await check_connection()
            
            logger.info(
                "Database engine initialized successfully",
                database_url=database_url if settings.is_sqlite else settings.DATABASE_URL,
                attempt=attempt + 1
            )
            return
            
        except Exception as e:
            logger.warning(
                "Failed to initialize database",
                error=str(e),
                attempt=attempt + 1,
                max_retries=max_retries
            )
            
            if attempt == max_retries - 1:
                logger.error("All database initialization attempts failed", error=str(e))
                raise DatabaseError(f"Failed to initialize database after {max_retries} attempts: {str(e)}")
            
            # Wait before retrying
            await asyncio.sleep(retry_delay)
            retry_delay *= 2  # Exponential backoff


async def check_connection() -> None:
    """Test database connection health."""
    if not engine:
        raise DatabaseError("Database engine not initialized")
    
    try:
        async with engine.begin() as conn:
            # Simple query to test connection
            result = await conn.execute(text("SELECT 1"))
            result.fetchone()
        logger.debug("Database connection test successful")
    except Exception as e:
        logger.error("Database connection test failed", error=str(e))
        raise DatabaseError(f"Database connection test failed: {str(e)}")


async def close_db() -> None:
    """Close database connections gracefully."""
    global engine, async_session_maker
    
    if engine:
        try:
            await engine.dispose()
            logger.info("Database connections closed successfully")
        except Exception as e:
            logger.error("Error closing database connections", error=str(e))
            # Don't raise exception during shutdown
        finally:
            engine = None
            async_session_maker = None


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency to get database session with comprehensive error handling.
    
    Yields:
        AsyncSession: Database session
        
    Raises:
        DatabaseError: If session creation fails
    """
    if not async_session_maker:
        raise DatabaseError("Database not initialized")
    
    session = None
    try:
        session = async_session_maker()
        yield session
        
    except DisconnectionError as e:
        logger.error("Database disconnection error", error=str(e))
        if session:
            await session.rollback()
        raise DatabaseError(f"Database connection lost: {str(e)}")
        
    except OperationalError as e:
        logger.error("Database operational error", error=str(e))
        if session:
            await session.rollback()
        raise DatabaseError(f"Database operational error: {str(e)}")
        
    except SQLAlchemyError as e:
        logger.error("SQLAlchemy error", error=str(e))
        if session:
            await session.rollback()
        raise DatabaseError(f"Database error: {str(e)}")
        
    except Exception as e:
        logger.error("Unexpected database session error", error=str(e))
        if session:
            await session.rollback()
        raise DatabaseError(f"Unexpected database session error: {str(e)}")
        
    finally:
        if session:
            try:
                await session.close()
            except Exception as e:
                logger.error("Error closing database session", error=str(e))


async def get_engine():
    """
    Get the database engine.
    
    Returns:
        AsyncEngine: The database engine
        
    Raises:
        DatabaseError: If engine is not initialized
    """
    if not engine:
        raise DatabaseError("Database engine not initialized")
    return engine


async def execute_with_retry(
    session: AsyncSession,
    operation,
    max_retries: int = 3,
    retry_delay: float = 0.1
) -> any:
    """
    Execute database operation with retry logic for transient failures.
    
    Args:
        session: Database session
        operation: Callable that performs the database operation
        max_retries: Maximum number of retry attempts
        retry_delay: Initial delay between retries (exponential backoff)
        
    Returns:
        Result of the operation
        
    Raises:
        DatabaseError: If all retry attempts fail
    """
    last_exception = None
    
    for attempt in range(max_retries):
        try:
            return await operation(session)
            
        except (DisconnectionError, OperationalError) as e:
            last_exception = e
            logger.warning(
                "Database operation failed, retrying",
                error=str(e),
                attempt=attempt + 1,
                max_retries=max_retries
            )
            
            if attempt < max_retries - 1:
                await asyncio.sleep(retry_delay)
                retry_delay *= 2  # Exponential backoff
                
                # Rollback the session before retry
                try:
                    await session.rollback()
                except Exception:
                    pass  # Ignore rollback errors during retry
            else:
                break
                
        except Exception as e:
            # Non-retryable errors
            logger.error("Non-retryable database error", error=str(e))
            raise DatabaseError(f"Database operation failed: {str(e)}")
    
    # All retries exhausted
    logger.error(
        "Database operation failed after all retries",
        error=str(last_exception),
        max_retries=max_retries
    )
    raise DatabaseError(f"Database operation failed after {max_retries} retries: {str(last_exception)}")


async def health_check() -> dict:
    """
    Perform database health check.
    
    Returns:
        dict: Health check results
    """
    try:
        if not engine:
            return {
                "status": "unhealthy",
                "error": "Database engine not initialized"
            }
        
        # Test connection
        await check_connection()
        
        # Get connection pool status (if available)
        pool_status = {}
        try:
            pool = engine.pool
            if hasattr(pool, 'size'):
                pool_status = {
                    "size": pool.size(),
                    "checked_in": pool.checkedin(),
                    "checked_out": pool.checkedout(),
                    "overflow": pool.overflow(),
                }
        except Exception as e:
            logger.debug("Could not get pool status", error=str(e))
            pool_status = {"error": "Pool status unavailable"}
        
        return {
            "status": "healthy",
            "pool": pool_status,
            "engine_echo": engine.echo
        }
        
    except Exception as e:
        logger.error("Database health check failed", error=str(e))
        return {
            "status": "unhealthy",
            "error": str(e)
        }