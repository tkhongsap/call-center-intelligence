"""
User model definition.

Matches the existing Drizzle schema for the users table.
"""

from typing import Optional, List
from sqlalchemy import String, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import UserRole, CreatedAtMixin


class User(Base, CreatedAtMixin):
    """
    User model matching the existing Drizzle schema.
    
    Represents users in the call center system with roles and business unit assignments.
    """
    __tablename__ = "users"
    
    # Primary key
    id: Mapped[str] = mapped_column(String, primary_key=True)
    
    # Required fields
    name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[UserRole] = mapped_column(SQLEnum(UserRole, create_type=False), nullable=False)
    
    # Optional fields
    business_unit: Mapped[Optional[str]] = mapped_column(String, name="business_unit")
    avatar_url: Mapped[Optional[str]] = mapped_column(String, name="avatar_url")
    password_hash: Mapped[Optional[str]] = mapped_column(String, name="password_hash")
    
    # Relationships
    sent_shares: Mapped[List["Share"]] = relationship(
        "Share", 
        foreign_keys="Share.sender_id",
        back_populates="sender",
        lazy="select"
    )
    
    received_shares: Mapped[List["Share"]] = relationship(
        "Share", 
        foreign_keys="Share.recipient_id",
        back_populates="recipient",
        lazy="select"
    )
    
    def __repr__(self) -> str:
        return f"<User(id='{self.id}', name='{self.name}', role='{self.role}')>"