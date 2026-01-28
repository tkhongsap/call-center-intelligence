"""
Application Configuration

Manages environment-specific configuration using Pydantic settings.
Supports development, staging, and production environments.
"""

from functools import lru_cache
from typing import List
from pydantic import Field, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings with environment variable support."""

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", case_sensitive=False, extra="ignore"
    )

    # Database Configuration - Individual components
    DB_HOST: str = Field(description="Database host")
    DB_USER: str = Field(description="Database username")
    DB_PASSWORD: str = Field(description="Database password")
    DB_PORT: int = Field(description="Database port")
    DB_NAME: str = Field(description="Database name")
    
    # Database Pool Configuration
    DATABASE_POOL_SIZE: int = Field(
        default=10, description="Database connection pool size"
    )
    DATABASE_MAX_OVERFLOW: int = Field(
        default=20, description="Maximum overflow connections"
    )
    DATABASE_POOL_TIMEOUT: int = Field(
        default=30, description="Timeout for getting connection from pool (seconds)"
    )
    DATABASE_POOL_RECYCLE: int = Field(
        default=3600, description="Connection recycle time (seconds)"
    )
    DATABASE_RETRY_ATTEMPTS: int = Field(
        default=3, description="Maximum database operation retry attempts"
    )
    DATABASE_RETRY_DELAY: float = Field(
        default=0.1, description="Initial delay between database retries (seconds)"
    )

    # FastAPI Configuration
    DEBUG: bool = Field(description="Enable debug mode")
    HOST: str = Field(description="Server host")
    PORT: int = Field(description="Server port")
    RELOAD: bool = Field(description="Enable auto-reload in development")

    # CORS Configuration
    CORS_ORIGINS: str = Field(description="Allowed CORS origins (comma-separated)")

    # Authentication Configuration
    SECRET_KEY: str = Field(description="Secret key for JWT tokens")
    ALGORITHM: str = Field(description="JWT algorithm")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        description="Access token expiration time in minutes"
    )

    # Logging Configuration
    LOG_LEVEL: str = Field(description="Logging level")
    LOG_FORMAT: str = Field(description="Log format (json or text)")

    # Azure OpenAI Configuration
    AZURE_OPENAI_ENDPOINT: str = Field(
        description="Azure OpenAI endpoint URL",
    )
    AZURE_OPENAI_API_KEY: str = Field(
        description="Azure OpenAI API key",
    )
    AZURE_OPENAI_API_VERSION: str = Field(
        description="Azure OpenAI API version",
    )
    AZURE_EMBEDDING_DEPLOYMENT: str = Field(
        description="Azure OpenAI embedding model deployment name",
    )

    # File Upload Configuration
    MAX_FILE_SIZE: int = Field(description="Maximum file upload size in bytes")
    ALLOWED_FILE_TYPES: str = Field(
        description="Allowed file extensions for uploads (comma-separated)"
    )

    # Cache Configuration
    REDIS_URL: str = Field(description="Redis connection URL for caching")
    CACHE_TTL: int = Field(description="Default cache TTL in seconds")

    # Nginx Configuration (optional)
    SERVER_NAME: str = Field(default="localhost", description="Server name for nginx")
    
    # Security Configuration
    ALLOWED_HOSTS: str = Field(
        default="localhost,127.0.0.1,0.0.0.0", 
        description="Allowed hosts for TrustedHostMiddleware (comma-separated)"
    )

    @computed_field
    @property
    def DATABASE_URL(self) -> str:
        """Construct database URL from individual components."""
        return f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Convert CORS_ORIGINS string to list if needed
        if isinstance(self.CORS_ORIGINS, str):
            self.CORS_ORIGINS = [
                origin.strip() for origin in self.CORS_ORIGINS.split(",")
            ]

        # Convert ALLOWED_FILE_TYPES string to list if needed
        if isinstance(self.ALLOWED_FILE_TYPES, str):
            self.ALLOWED_FILE_TYPES = [
                ext.strip() for ext in self.ALLOWED_FILE_TYPES.split(",")
            ]

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
