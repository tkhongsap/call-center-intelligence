"""
Chat API Routes

Handles chat functionality with RAG (Retrieval-Augmented Generation).
Supports Thai language and retrieves context from vector database.
"""

import uuid
import logging
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.chat import (
    ChatMessageCreate,
    ChatMessageResponse,
    ChatResponse,
)
from app.services.azure_chat_service import get_chat_service

router = APIRouter()
logger = logging.getLogger(__name__)


def get_timestamp() -> str:
    """Get current timestamp in ISO format."""
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


@router.post("/", status_code=status.HTTP_200_OK)
async def send_chat_message(
    message: ChatMessageCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Send a chat message and get AI response with RAG context.
    
    This endpoint:
    1. Retrieves relevant context from the vector database
    2. Sends the message with context to Azure OpenAI
    3. Returns only the AI response content
    
    Supports both English and Thai languages.
    
    Request body:
    ```json
    {
        "query": "What are the current alerts?"
    }
    ```
    
    Response:
    ```json
    {
        "response": "AI response content here..."
    }
    ```
    
    Args:
        message: Chat message with query
        db: Database session
        
    Returns:
        Dict with only the response content
    """
    try:
        # Get chat service (lazy initialization)
        try:
            chat_service = get_chat_service()
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Azure OpenAI configuration error: {str(e)}. Please check your .env file.",
            )
        
        # Call Azure OpenAI with RAG (always enabled)
        # Use more context for generic queries
        is_generic_query = any(term in message.query.lower() for term in [
            "insight", "summary", "overview", "tell me about",
            "what do you have", "show me", "give me", "analyze",
            "สรุป", "ข้อมูล", "วิเคราะห์"
        ])
        
        rag_limit = 10 if is_generic_query else 5
        
        result = await chat_service.chat_with_rag(
            db=db,
            user_message=message.query,
            use_rag=True,
            rag_limit=rag_limit,
            rag_threshold=0.5,  # Lower threshold for better recall
        )
        
        # Return only the response content
        return {
            "response": result["response"]
        }
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing chat message: {str(e)}",
        )


@router.post("/simple", status_code=status.HTTP_200_OK)
async def send_simple_message(
    message: str,
    system_prompt: Optional[str] = None,
):
    """
    Send a simple chat message without RAG context.
    
    Useful for testing or simple conversations that don't need knowledge base context.
    
    Args:
        message: User message
        system_prompt: Optional custom system prompt
        
    Returns:
        Dict with AI response
    """
    try:
        chat_service = get_chat_service()
        
        response = await chat_service.chat_simple(
            user_message=message,
            system_prompt=system_prompt,
        )
        
        return {
            "message": message,
            "response": response,
            "timestamp": get_timestamp(),
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing message: {str(e)}",
        )