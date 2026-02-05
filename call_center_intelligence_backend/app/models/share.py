"""
Share model definition.

Matches the existing Drizzle schema for the shares table.
"""

from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import ShareType, ShareSourceType, ShareChannel, ShareStatus, CreatedAtMixin

if TYPE_CHECKING:
    from app.models.user import User


class Share(Base, CreatedAtMixin):
    """
    Share model matching the existing Drizzle schema.
    
    Represents sharing and escalation of alerts and cases between users.
    """
    __tablename__ = "shares"
    
    # Primary key
    id: Mapped[str] = mapped_column(String, primary_key=True)
    
    # Required fields
    type: Mapped[ShareType] = mapped_column(SQLEnum(ShareType, create_type=False), nullable=False)
    source_type: Mapped[ShareSourceType] = mapped_column(SQLEnum(ShareSourceType, create_type=False), nullable=False, name="source_type")
    source_id: Mapped[str] = mapped_column(String, nullable=False, name="source_id")
    sender_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False, name="sender_id")
    recipient_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False, name="recipient_id")
    channel: Mapped[ShareChannel] = mapped_column(SQLEnum(ShareChannel, create_type=False), nullable=False, default=ShareChannel.internal)
    status: Mapped[ShareStatus] = mapped_column(SQLEnum(ShareStatus, create_type=False), nullable=False, default=ShareStatus.pending)
    
    # Optional fields
    message: Mapped[Optional[str]] = mapped_column(String)
    read_at: Mapped[Optional[str]] = mapped_column(String, name="read_at")
    actioned_at: Mapped[Optional[str]] = mapped_column(String, name="actioned_at")
    
    # Relationships
    sender: Mapped["User"] = relationship(
        "User",
        foreign_keys=[sender_id],
        back_populates="sent_shares",
        lazy="select"
    )
    
    recipient: Mapped["User"] = relationship(
        "User",
        foreign_keys=[recipient_id],
        back_populates="received_shares",
        lazy="select"
    )
    
    def __repr__(self) -> str:
        return f"<Share(id='{self.id}', type='{self.type}', source_type='{self.source_type}', status='{self.status}')>"