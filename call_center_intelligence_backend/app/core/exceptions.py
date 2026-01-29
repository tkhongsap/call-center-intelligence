"""
Custom Exception Classes

Defines application-specific exceptions for consistent error handling.
"""

from typing import Any, Dict, Optional


class BaseAPIException(Exception):
    """Base exception class for API errors."""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        self.message = message
        self.details = details or {}
        super().__init__(self.message)


class DatabaseError(BaseAPIException):
    """Raised when database operations fail."""
    pass


class ValidationError(BaseAPIException):
    """Raised when input validation fails."""
    pass


class AuthenticationError(BaseAPIException):
    """Raised when authentication fails."""
    pass


class AuthorizationError(BaseAPIException):
    """Raised when authorization fails."""
    pass


class NotFoundError(BaseAPIException):
    """Raised when a requested resource is not found."""
    pass


class ConflictError(BaseAPIException):
    """Raised when there's a conflict with existing data."""
    pass


class FileUploadError(BaseAPIException):
    """Raised when file upload operations fail."""
    pass


class WebSocketError(BaseAPIException):
    """Raised when WebSocket operations fail."""
    pass