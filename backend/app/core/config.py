"""
Application Configuration

Manages environment-specific configuration using Pydantic settings.
Supports development, staging, and production environments.
"""

from functools import lru_cache
from typing import List
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )
    
    # Database Configuration
    DATABASE_URL: str = Field(
        default="sqlite:///../call-center.db",
        description="Database connection URL"
    )
    DATABASE_POOL_SIZE: int = Field(
        default=10,
        description="Database connection pool size"
    )
    DATABASE_MAX_OVERFLOW: int = Field(
        default=20,
        description="Maximum overflow connections"
    )
    DATABASE_POOL_TIMEOUT: int = Field(
        default=30,
        description="Timeout for getting connection from pool (seconds)"
    )
    DATABASE_POOL_RECYCLE: int = Field(
        default=3600,
        description="Connection recycle time (seconds)"
    )
    DATABASE_RETRY_ATTEMPTS: int = Field(
        default=3,
        description="Maximum database operation retry attempts"
    )
    DATABASE_RETRY_DELAY: float = Field(
        default=0.1,
        description="Initial delay between database retries (seconds)"
    )
    
    # FastAPI Configuration
    DEBUG: bool = Field(default=True, description="Enable debug mode")
    HOST: str = Field(default="0.0.0.0", description="Server host")
    PORT: int = Field(default=8000, description="Server port")
    RELOAD: bool = Field(default=True, description="Enable auto-reload in development")
    
    # CORS Configuration
    CORS_ORIGINS: str = Field(
        default="http://localhost:3000,http://127.0.0.1:3000",
        description="Allowed CORS origins (comma-separated)"
    )
    
    # Authentication Configuration
    SECRET_KEY: str = Field(
        default="dev-secret-key-change-in-production",
        description="Secret key for JWT tokens"
    )
    ALGORITHM: str = Field(default="HS256", description="JWT algorithm")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        default=30,
        description="Access token expiration time in minutes"
    )
    
    # Logging Configuration
    LOG_LEVEL: str = Field(default="INFO", description="Logging level")
    LOG_FORMAT: str = Field(default="json", description="Log format (json or text)")
    
    # File Upload Configuration
    MAX_FILE_SIZE: int = Field(
        default=10485760,  # 10MB
        description="Maximum file upload size in bytes"
    )
    ALLOWED_FILE_TYPES: str = Field(
        default=".csv,.xlsx,.xls",
        description="Allowed file extensions for uploads (comma-separated)"
    )
    
    # Cache Configuration
    REDIS_URL: str = Field(
        default="redis://localhost:6379/0",
        description="Redis connection URL for caching"
    )
    CACHE_TTL: int = Field(
        default=300,  # 5 minutes
        description="Default cache TTL in seconds"
    )
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Convert CORS_ORIGINS string to list if needed
        if isinstance(self.CORS_ORIGINS, str):
            self.CORS_ORIGINS = [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
        
        # Convert ALLOWED_FILE_TYPES string to list if needed
        if isinstance(self.ALLOWED_FILE_TYPES, str):
            self.ALLOWED_FILE_TYPES = [ext.strip() for ext in self.ALLOWED_FILE_TYPES.split(",")]
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Get CORS origins as a list."""
        if isinstance(self.CORS_ORIGINS, str):
            return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
        return self.CORS_ORIGINS
    
    @property
    def allowed_file_types_list(self) -> List[str]:
        """Get allowed file types as a list."""
        if isinstance(self.ALLOWED_FILE_TYPES, str):
            return [ext.strip() for ext in self.ALLOWED_FILE_TYPES.split(",")]
        return self.ALLOWED_FILE_TYPES
    
    @property
    def is_sqlite(self) -> bool:
        """Check if using SQLite database."""
        return self.DATABASE_URL.startswith("sqlite")
    
    @property
    def database_path(self) -> str:
        """Get the database file path for SQLite."""
        if self.is_sqlite:
            return self.DATABASE_URL.replace("sqlite:///", "").replace("sqlite://", "")
        return ""


@lru_cache()
def get_settings() -> Settings:
    """Get cached application settings."""
    return Settings()