"""
Custom JSON type for SQLAlchemy to handle JSON fields in SQLite.

This module provides a custom SQLAlchemy type that properly handles JSON serialization
and deserialization for fields that store JSON data as text in SQLite.
"""

import json
from typing import Any, Optional
from sqlalchemy import TypeDecorator, Text
from sqlalchemy.engine import Dialect


class JSONType(TypeDecorator):
    """
    Custom SQLAlchemy type for JSON fields.
    
    Automatically serializes Python objects to JSON strings when storing,
    and deserializes JSON strings back to Python objects when loading.
    """
    
    impl = Text
    cache_ok = True
    
    def process_bind_param(self, value: Any, dialect: Dialect) -> Optional[str]:
        """
        Convert Python object to JSON string for storage.
        
        Args:
            value: Python object to serialize
            dialect: SQLAlchemy dialect
            
        Returns:
            JSON string or None
        """
        if value is None:
            return None
        return json.dumps(value, ensure_ascii=False)
    
    def process_result_value(self, value: Optional[str], dialect: Dialect) -> Any:
        """
        Convert JSON string back to Python object.
        
        Args:
            value: JSON string from database
            dialect: SQLAlchemy dialect
            
        Returns:
            Python object or None
        """
        if value is None:
            return None
        try:
            return json.loads(value)
        except (json.JSONDecodeError, TypeError):
            # Return the raw value if it's not valid JSON
            return value
    
    def copy(self):
        """Return a copy of this type."""
        return JSONType()


def json_field(nullable: bool = True) -> JSONType:
    """
    Helper function to create a JSON field with proper configuration.
    
    Args:
        nullable: Whether the field can be null
        
    Returns:
        Configured JSONType instance
    """
    return JSONType()