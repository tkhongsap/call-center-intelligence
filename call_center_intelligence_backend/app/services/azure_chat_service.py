"""
Azure OpenAI Chat Service

Handles chat completions using Azure OpenAI with RAG context retrieval.
Supports Thai language and retrieves relevant context from vector database.
"""

import os
import logging
from typing import List, Dict, Any, Optional
from openai import AzureOpenAI
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.vector_store_service import similarity_search

logger = logging.getLogger(__name__)


class AzureChatService:
    """Service for Azure OpenAI chat completions with RAG."""
    
    _instance = None
    _initialized = False
    
    def __new__(cls):
        """Singleton pattern to ensure only one instance."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        """Initialize Azure OpenAI client (lazy initialization)."""
        # Skip if already initialized
        if self._initialized:
            return
            
        self.endpoint = os.getenv("AZURE_OPENAI_CHAT_ENDPOINT")
        self.api_key = os.getenv("AZURE_OPENAI_CHAT_API_KEY")
        self.api_version = os.getenv("AZURE_OPENAI_CHAT_API_VERSION", "2024-12-01-preview")
        self.deployment = os.getenv("AZURE_OPENAI_CHAT_DEPLOYMENT", "gpt-5-mini")
        
        if not self.endpoint or not self.api_key:
            raise ValueError(
                "Azure OpenAI configuration missing. "
                "Set AZURE_OPENAI_CHAT_ENDPOINT and AZURE_OPENAI_CHAT_API_KEY in .env file"
            )
        
        self.client = AzureOpenAI(
            api_version=self.api_version,
            azure_endpoint=self.endpoint,
            api_key=self.api_key,
        )
        
        self._initialized = True
        logger.info(f"Azure Chat Service initialized with deployment: {self.deployment}")
    
    async def get_rag_context(
        self,
        db: AsyncSession,
        query: str,
        limit: int = 5,
        similarity_threshold: float = 0.7,
    ) -> List[Dict[str, Any]]:
        """
        Retrieve relevant context from vector database.
        
        For generic queries (insights, summary, overview), retrieves a diverse sample
        of documents instead of just similarity-based results.
        
        Args:
            db: Database session
            query: User query
            limit: Maximum number of context chunks
            similarity_threshold: Minimum similarity score
            
        Returns:
            List of relevant context chunks
        """
        try:
            # Check for generic queries that need diverse sampling
            generic_queries = [
                "insight", "summary", "overview", "tell me about", 
                "what do you have", "show me", "give me", "analyze",
                "สรุป", "ข้อมูล", "วิเคราะห์", "แสดง"
            ]
            
            is_generic = any(term in query.lower() for term in generic_queries)
            
            if is_generic:
                # For generic queries, get diverse sample of documents
                logger.info(f"Generic query detected, retrieving diverse document sample")
                
                # Get more documents with lower threshold for diversity
                results = await similarity_search(
                    db=db,
                    query=query,
                    limit=limit * 3,  # Get more documents
                    similarity_threshold=0.0,  # No threshold - get any documents
                )
                
                # If we got results, take a diverse sample
                if results:
                    # Take every Nth document for diversity
                    step = max(1, len(results) // limit)
                    diverse_results = results[::step][:limit]
                    logger.info(f"Retrieved {len(diverse_results)} diverse chunks for generic query")
                    return diverse_results
                else:
                    return []
            else:
                # For specific queries, use similarity search
                results = await similarity_search(
                    db=db,
                    query=query,
                    limit=limit,
                    similarity_threshold=similarity_threshold,
                )
                
                logger.info(f"Retrieved {len(results)} context chunks for specific query")
                return results
                
        except Exception as e:
            logger.error(f"Error retrieving RAG context: {e}")
            return []
    
    def format_context_for_prompt(self, context_chunks: List[Dict[str, Any]]) -> str:
        """
        Format context chunks into a prompt string.
        
        Args:
            context_chunks: List of context chunks from vector search
            
        Returns:
            Formatted context string
        """
        if not context_chunks:
            return "No relevant context found in the knowledge base."
        
        context_parts = []
        for i, chunk in enumerate(context_chunks, 1):
            similarity = chunk.get("similarity", 0)
            content = chunk.get("content", "")
            filename = chunk.get("filename", "Unknown")
            
            context_parts.append(
                f"[Context {i}] (Similarity: {similarity:.2f}, Source: {filename})\n{content}"
            )
        
        return "\n\n".join(context_parts)
    
    async def chat_with_rag(
        self,
        db: AsyncSession,
        user_message: str,
        system_prompt: Optional[str] = None,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        use_rag: bool = True,
        rag_limit: int = 5,
        rag_threshold: float = 0.7,
        max_tokens: int = 16384,
    ) -> Dict[str, Any]:
        """
        Generate chat completion with RAG context.
        
        IMPORTANT: This chatbot ONLY answers questions based on uploaded documents.
        It will refuse to answer questions not related to the knowledge base.
        
        Args:
            db: Database session
            user_message: User's message
            system_prompt: Custom system prompt (optional)
            conversation_history: Previous messages (optional)
            use_rag: Whether to use RAG context retrieval
            rag_limit: Maximum RAG context chunks
            rag_threshold: Minimum similarity threshold for RAG
            max_tokens: Maximum completion tokens
            
        Returns:
            Dict with response and metadata
        """
        # Retrieve RAG context if enabled
        context_chunks = []
        if use_rag:
            context_chunks = await self.get_rag_context(
                db=db,
                query=user_message,
                limit=rag_limit,
                similarity_threshold=rag_threshold,
            )
        
        # Check if we have relevant context
        if not context_chunks:
            # Check if there are ANY documents in the database
            from app.services.vector_store_service import get_embedding_count
            total_embeddings = await get_embedding_count(db)
            
            if total_embeddings == 0:
                # No documents uploaded at all
                return {
                    "response": (
                        "I apologize, but there are no documents uploaded to the system yet. "
                        "Please upload your call center data files (CSV or Excel) using the "
                        "/api/rag/embed-file endpoint, and then I'll be able to answer your questions.\n\n"
                        "ขออภัย ยังไม่มีเอกสารใดๆ ที่อัปโหลดในระบบ "
                        "กรุณาอัปโหลดไฟล์ข้อมูล call center (CSV หรือ Excel) ผ่าน "
                        "/api/rag/embed-file แล้วฉันจะสามารถตอบคำถามของคุณได้"
                    ),
                    "context_used": 0,
                    "context_chunks": [],
                    "model": self.deployment,
                    "usage": {
                        "prompt_tokens": 0,
                        "completion_tokens": 0,
                        "total_tokens": 0,
                    },
                }
            else:
                # Documents exist but query doesn't match well
                return {
                    "response": (
                        f"I found {total_embeddings} document chunks in the system, but your question "
                        "doesn't seem to match any of them closely enough. "
                        "Try asking more specific questions about:\n"
                        "• Call center alerts and notifications\n"
                        "• Customer cases and complaints\n"
                        "• Specific data from your uploaded files\n"
                        "• Trends or patterns in the data\n\n"
                        "Or try rephrasing your question to be more specific.\n\n"
                        f"พบข้อมูล {total_embeddings} ส่วนในระบบ แต่คำถามของคุณไม่ตรงกับข้อมูลใดๆ "
                        "ลองถามคำถามที่เฉพาะเจาะจงมากขึ้น เช่น:\n"
                        "• การแจ้งเตือนและข้อมูล call center\n"
                        "• เคสและข้อร้องเรียนของลูกค้า\n"
                        "• ข้อมูลเฉพาะจากไฟล์ที่อัปโหลด\n"
                        "• แนวโน้มหรือรูปแบบในข้อมูล\n\n"
                        "หรือลองเปลี่ยนวิธีถามให้ชัดเจนขึ้น"
                    ),
                    "context_used": 0,
                    "context_chunks": [],
                    "model": self.deployment,
                    "usage": {
                        "prompt_tokens": 0,
                        "completion_tokens": 0,
                        "total_tokens": 0,
                    },
                }
        
        # Format context
        context_text = self.format_context_for_prompt(context_chunks)
        
        # Build strict system prompt that only uses provided context
        if not system_prompt:
            system_prompt = (
                "You are a specialized AI assistant for a call center intelligence system. "
                "You MUST ONLY answer questions based on the context provided below from uploaded documents. "
                "\n\n"
                "STRICT RULES:\n"
                "1. ONLY use information from the provided context below\n"
                "2. For generic queries (insights, summary, overview), analyze the provided documents and generate meaningful insights\n"
                "3. For specific queries, answer based on relevant information in the context\n"
                "4. If the context doesn't contain relevant information, say you don't have that information\n"
                "5. DO NOT use general knowledge or information outside the provided context\n"
                "6. DO NOT make up or infer information not present in the context\n"
                "7. When asked for insights or summaries, identify patterns, trends, and key findings from the documents\n"
                "8. Support both English and Thai languages in your responses\n"
                "\n"
                "คุณเป็นผู้ช่วย AI เฉพาะทางสำหรับระบบข้อมูล call center "
                "คุณต้องตอบคำถามโดยอ้างอิงจากข้อมูลที่ให้มาเท่านั้น\n"
                "\n"
                "กฎที่เข้มงวด:\n"
                "1. ใช้เฉพาะข้อมูลจาก context ที่ให้มา\n"
                "2. สำหรับคำถามทั่วไป (insights, สรุป, ภาพรวม) ให้วิเคราะห์เอกสารและสร้าง insights ที่มีความหมาย\n"
                "3. สำหรับคำถามเฉพาะ ให้ตอบตามข้อมูลที่เกี่ยวข้องใน context\n"
                "4. ถ้าไม่มีข้อมูลที่เกี่ยวข้อง ให้บอกว่าไม่มีข้อมูลนั้น\n"
                "5. ห้ามใช้ความรู้ทั่วไปหรือข้อมูลนอกเหนือจาก context\n"
                "6. ห้ามสร้างหรือคาดเดาข้อมูลที่ไม่มีใน context\n"
                "7. เมื่อถูกถามเกี่ยวกับ insights หรือสรุป ให้ระบุรูปแบบ แนวโน้ม และข้อค้นพบสำคัญจากเอกสาร\n"
            )
        
        # Add context to system prompt
        system_prompt += f"\n\n=== CONTEXT FROM UPLOADED DOCUMENTS ===\n{context_text}\n=== END OF CONTEXT ===\n"
        system_prompt += (
            "\nBased on the context above:\n"
            "- For generic queries: Analyze the documents and provide meaningful insights, patterns, or summaries\n"
            "- For specific queries: Answer directly based on the relevant information\n"
            "- Always cite or reference the information from the context when possible\n"
            "\nตามข้อมูลข้างต้น:\n"
            "- สำหรับคำถามทั่วไป: วิเคราะห์เอกสารและให้ insights, รูปแบบ, หรือสรุปที่มีความหมาย\n"
            "- สำหรับคำถามเฉพาะ: ตอบตรงๆ ตามข้อมูลที่เกี่ยวข้อง\n"
            "- อ้างอิงหรืออ้างถึงข้อมูลจาก context เมื่อเป็นไปได้\n"
        )
        
        # Build messages
        messages = [{"role": "system", "content": system_prompt}]
        
        # Add conversation history if provided
        if conversation_history:
            messages.extend(conversation_history)
        
        # Add current user message
        messages.append({"role": "user", "content": user_message})
        
        # Call Azure OpenAI
        try:
            logger.info(f"Calling Azure OpenAI with {len(messages)} messages and {len(context_chunks)} context chunks")
            
            response = self.client.chat.completions.create(
                messages=messages,
                max_completion_tokens=max_tokens,
                model=self.deployment,
            )
            
            # Extract response
            assistant_message = response.choices[0].message.content
            
            # Build result
            result = {
                "response": assistant_message,
                "context_used": len(context_chunks),
                "context_chunks": context_chunks,
                "model": self.deployment,
                "usage": {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens,
                },
            }
            
            logger.info(
                f"Chat completion successful. "
                f"Tokens: {result['usage']['total_tokens']}, "
                f"Context chunks: {len(context_chunks)}"
            )
            
            return result
            
        except Exception as e:
            logger.error(f"Error calling Azure OpenAI: {e}")
            raise
    
    async def chat_simple(
        self,
        user_message: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 16384,
    ) -> str:
        """
        Simple chat without RAG context.
        
        Args:
            user_message: User's message
            system_prompt: Custom system prompt (optional)
            max_tokens: Maximum completion tokens
            
        Returns:
            Assistant's response
        """
        if not system_prompt:
            system_prompt = "You are a helpful assistant."
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ]
        
        try:
            response = self.client.chat.completions.create(
                messages=messages,
                max_completion_tokens=max_tokens,
                model=self.deployment,
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"Error in simple chat: {e}")
            raise


# Global service instance
_chat_service: Optional[AzureChatService] = None


def get_chat_service() -> AzureChatService:
    """Get or create the global chat service instance."""
    global _chat_service
    if _chat_service is None:
        _chat_service = AzureChatService()
    return _chat_service
