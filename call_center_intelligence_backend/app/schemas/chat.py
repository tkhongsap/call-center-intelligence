"""
Chat-related Pydantic schemas.

This module defines request and response schemas for chat endpoints:
- POST /api/chat (send chat message)
- GET /api/chat (get chat history)
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict, field_validator

from app.schemas.base import PaginationInfo, PaginationParams


# ═══════════════════════════════════════════════════════════════════════════════
# Chat Message Schemas
# ═══════════════════════════════════════════════════════════════════════════════

class ChatMessageBase(BaseModel):
    """Base chat message schema."""
    content: str = Field(..., min_length=1, max_length=2000, description="Message content")
    message_type: str = Field("user", description="Message type (user, assistant, system)")
    
    @field_validator('message_type')
    @classmethod
    def validate_message_type(cls, v):
        allowed_types = ['user', 'assistant', 'system']
        if v not in allowed_types:
            raise ValueError(f'message_type must be one of: {", ".join(allowed_types)}')
        return v


class ChatMessageCreate(BaseModel):
    """Schema for creating chat messages - simplified to only require query."""
    query: str = Field(..., min_length=1, max_length=2000, description="User query/question")


class ChatMessageResponse(ChatMessageBase):
    """Complete chat message response schema."""
    id: str = Field(..., description="Message ID")
    session_id: str = Field(..., description="Chat session ID")
    user_id: Optional[str] = Field(None, description="User ID (for user messages)")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Message metadata")
    created_at: str = Field(..., description="Message timestamp")

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "msg-123",
                "content": "What are the current critical alerts?",
                "message_type": "user",
                "session_id": "session-456",
                "user_id": "user-789",
                "metadata": {
                    "source": "web_interface",
                    "user_agent": "Mozilla/5.0..."
                },
                "created_at": "2024-01-15T10:30:00Z"
            }
        }
    )


# ═══════════════════════════════════════════════════════════════════════════════
# Chat Session Schemas
# ═══════════════════════════════════════════════════════════════════════════════

class ChatSession(BaseModel):
    """Chat session information."""
    id: str = Field(..., description="Session ID")
    user_id: str = Field(..., description="User ID")
    title: Optional[str] = Field(None, description="Session title")
    created_at: str = Field(..., description="Session creation timestamp")
    updated_at: str = Field(..., description="Last message timestamp")
    message_count: int = Field(..., description="Number of messages in session")


# ═══════════════════════════════════════════════════════════════════════════════
# Chat Query Parameters
# ═══════════════════════════════════════════════════════════════════════════════

class ChatHistoryParams(PaginationParams):
    """Query parameters for chat history."""
    session_id: Optional[str] = Field(None, description="Filter by session ID")
    user_id: Optional[str] = Field(None, description="Filter by user ID")
    message_type: Optional[str] = Field(None, description="Filter by message type")


# ═══════════════════════════════════════════════════════════════════════════════
# Chat Response Schemas
# ═══════════════════════════════════════════════════════════════════════════════

class ChatResponse(BaseModel):
    """Response schema for chat message creation."""
    message: ChatMessageResponse = Field(..., description="User message")
    response: ChatMessageResponse = Field(..., description="Assistant response")
    session_id: str = Field(..., description="Chat session ID")
    context_used: int = Field(0, description="Number of RAG context chunks used")
    context_chunks: List[Dict[str, Any]] = Field(default_factory=list, description="RAG context chunks")
    usage: Optional[Dict[str, int]] = Field(None, description="Token usage statistics")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "message": {
                    "id": "msg-123",
                    "content": "What are the current critical alerts?",
                    "message_type": "user",
                    "session_id": "session-456",
                    "user_id": "user-789",
                    "created_at": "2024-01-15T10:30:00Z"
                },
                "response": {
                    "id": "msg-124",
                    "content": "There are currently 3 critical alerts: 1 case volume spike in Business Unit A, 1 system outage alert, and 1 urgency escalation.",
                    "message_type": "assistant",
                    "session_id": "session-456",
                    "user_id": None,
                    "created_at": "2024-01-15T10:30:05Z"
                },
                "session_id": "session-456",
                "context_used": 3,
                "context_chunks": [
                    {
                        "content": "Alert: Case volume spike detected...",
                        "similarity": 0.89,
                        "filename": "alerts_data.csv"
                    }
                ],
                "usage": {
                    "prompt_tokens": 1250,
                    "completion_tokens": 150,
                    "total_tokens": 1400
                }
            }
        }
    )


class ChatHistoryResponse(BaseModel):
    """Response schema for chat history."""
    messages: List[ChatMessageResponse] = Field(..., description="Chat messages")
    pagination: PaginationInfo = Field(..., description="Pagination information")
    session: Optional[ChatSession] = Field(None, description="Session information")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "messages": [
                    {
                        "id": "msg-123",
                        "content": "What are the current critical alerts?",
                        "message_type": "user",
                        "session_id": "session-456",
                        "user_id": "user-789",
                        "created_at": "2024-01-15T10:30:00Z"
                    },
                    {
                        "id": "msg-124",
                        "content": "There are currently 3 critical alerts...",
                        "message_type": "assistant",
                        "session_id": "session-456",
                        "user_id": None,
                        "created_at": "2024-01-15T10:30:05Z"
                    }
                ],
                "pagination": {
                    "page": 1,
                    "limit": 20,
                    "total": 2,
                    "total_pages": 1
                },
                "session": {
                    "id": "session-456",
                    "user_id": "user-789",
                    "title": "Alert Discussion",
                    "created_at": "2024-01-15T10:30:00Z",
                    "updated_at": "2024-01-15T10:30:05Z",
                    "message_count": 2
                }
            }
        }
    )