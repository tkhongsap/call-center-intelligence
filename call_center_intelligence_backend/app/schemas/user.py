"""
User-related Pydantic schemas.

This module defines request and response schemas for user-related endpoints
and authentication.
"""

from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

from app.models.base import UserRole


# ═══════════════════════════════════════════════════════════════════════════════
# User Base Schemas
# ═══════════════════════════════════════════════════════════════════════════════

class UserBase(BaseModel):
    """Base user schema."""
    name: str = Field(..., min_length=1, max_length=100, description="User full name")
    email: str = Field(..., description="User email address")
    role: UserRole = Field(..., description="User role")
    business_unit: Optional[str] = Field(None, description="User's business unit")
    avatar_url: Optional[str] = Field(None, description="Avatar image URL")


class UserCreate(UserBase):
    """Schema for creating users."""
    pass


class UserUpdate(BaseModel):
    """Schema for updating users."""
    name: Optional[str] = Field(None, min_length=1, max_length=100, description="User full name")
    email: Optional[str] = Field(None, description="User email address")
    role: Optional[UserRole] = Field(None, description="User role")
    business_unit: Optional[str] = Field(None, description="User's business unit")
    avatar_url: Optional[str] = Field(None, description="Avatar image URL")


class UserResponse(UserBase):
    """Complete user response schema."""
    id: str = Field(..., description="User ID")
    created_at: str = Field(..., description="Creation timestamp")

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "user-123",
                "name": "John Doe",
                "email": "john.doe@company.com",
                "role": "supervisor",
                "business_unit": "Business Unit A",
                "avatar_url": "https://example.com/avatars/john.jpg",
                "created_at": "2024-01-15T10:30:00Z"
            }
        }
    )


# ═══════════════════════════════════════════════════════════════════════════════
# Authentication Schemas
# ═══════════════════════════════════════════════════════════════════════════════

class LoginRequest(BaseModel):
    """Login request schema."""
    email: str = Field(..., description="User email")
    password: str = Field(..., min_length=1, description="User password")


class LoginResponse(BaseModel):
    """Login response schema."""
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field("bearer", description="Token type")
    user: UserResponse = Field(..., description="User information")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "user": {
                    "id": "user-123",
                    "name": "John Doe",
                    "email": "john.doe@company.com",
                    "role": "supervisor",
                    "business_unit": "Business Unit A",
                    "created_at": "2024-01-15T10:30:00Z"
                }
            }
        }
    )


class CurrentUserResponse(UserResponse):
    """Current user response with additional context."""
    permissions: list[str] = Field(..., description="User permissions")
    business_units_access: list[str] = Field(..., description="Accessible business units")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id": "user-123",
                "name": "John Doe",
                "email": "john.doe@company.com",
                "role": "supervisor",
                "business_unit": "Business Unit A",
                "avatar_url": None,
                "created_at": "2024-01-15T10:30:00Z",
                "permissions": ["read:cases", "write:cases", "read:alerts"],
                "business_units_access": ["Business Unit A", "Business Unit B"]
            }
        }
    )