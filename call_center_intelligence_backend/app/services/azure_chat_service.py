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
from app.services.retrieval_service import (
    retrieve,
    RetrievalConfig,
    classify_query_intent,
    QueryIntent,
)

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
    
    async def classify_query(self, query: str) -> Dict[str, Any]:
        """
        Use LLM to classify the query type and determine retrieval strategy.
        
        Args:
            query: User's query
            
        Returns:
            Dict with classification results:
            - query_type: "specific_id", "generic_list", "analytical", "specific_question"
            - retrieval_strategy: "keyword", "diverse", "semantic"
            - num_results: recommended number of results
            - threshold: recommended similarity threshold
        """
        classification_prompt = f"""Analyze this user query and classify it:

Query: "{query}"

Classify into ONE of these types:
1. "generic_list" - User wants multiple/all cases with filters (e.g., "all low priority", "show me cases", "list complaints", "show me T-10006")
2. "analytical" - User wants insights/analysis (e.g., "what are the trends", "summarize the data", "give me insights")
3. "specific_question" - User asks a specific question (e.g., "what's the most common complaint", "how many cases in Bangkok")

Respond ONLY with valid JSON:
{{
  "query_type": "one of the 3 types above",
  "reasoning": "brief explanation"
}}"""

        try:
            response = self.client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are a query classifier. Respond only with valid JSON. No markdown, no code blocks, just raw JSON."},
                    {"role": "user", "content": classification_prompt}
                ],
                max_completion_tokens=200,
                model=self.deployment,
                response_format={"type": "json_object"},  # Force JSON output
            )
            
            import json
            response_text = response.choices[0].message.content.strip()
            
            # Remove markdown code blocks if present
            if response_text.startswith("```"):
                response_text = response_text.split("```")[1]
                if response_text.startswith("json"):
                    response_text = response_text[4:]
                response_text = response_text.strip()
            
            classification = json.loads(response_text)
            query_type = classification.get("query_type", "generic_list")  # Default to generic_list
            
            # Map query type to retrieval strategy
            strategy_map = {
                "generic_list": {
                    "retrieval_strategy": "diverse",
                    "num_results": 20,  # Get many for filtering
                    "threshold": 0.0,   # No threshold
                    "force_semantic": True,
                },
                "analytical": {
                    "retrieval_strategy": "diverse",
                    "num_results": 15,
                    "threshold": 0.0,
                    "force_semantic": True,
                },
                "specific_question": {
                    "retrieval_strategy": "semantic",
                    "num_results": 10,
                    "threshold": 0.0,  # Changed from 0.5 to 0.0 - let GPT filter
                    "force_semantic": True,
                },
            }
            
            result = strategy_map.get(query_type, strategy_map["specific_question"])
            result["query_type"] = query_type
            result["reasoning"] = classification.get("reasoning", "")
            
            logger.info(f"Query classified as '{query_type}': {result['reasoning']}")
            return result
            
        except Exception as e:
            logger.error(f"Query classification failed: {e}, using default strategy")
            # Fallback to permissive defaults - let GPT handle everything
            return {
                "query_type": "generic_list",
                "retrieval_strategy": "diverse",
                "num_results": 20,
                "threshold": 0.0,  # No threshold - retrieve everything
                "force_semantic": True,
                "reasoning": "Classification failed, using permissive default"
            }
    
    async def get_rag_context(
        self,
        db: AsyncSession,
        query: str,
        limit: int = 10,
        alpha: float = 0.7,
        use_mmr: bool = False,
        use_reranker: bool = False,
    ) -> List[Dict[str, Any]]:
        """
        Retrieve relevant context from vector database using advanced retrieval.
        Uses query intent classification to determine optimal retrieval strategy.
        
        Args:
            db: Database session
            query: User query
            limit: Maximum number of context chunks
            alpha: Balance between semantic (1.0) and keyword (0.0) search
            use_mmr: Whether to use MMR for diversity
            use_reranker: Whether to use LLM re-ranking
            
        Returns:
            List of relevant context chunks with hybrid scores
        """
        try:
            # 1. Classify query intent
            intent = classify_query_intent(query)
            logger.info(f"Query intent classified as: {intent.value}")
            
            # 2. Map intent to optimal retrieval config
            config_map = {
                QueryIntent.FACT: RetrievalConfig(
                    top_k=limit,
                    alpha=0.7,  # Balanced for precise answers
                    use_mmr=False,
                ),
                QueryIntent.SUMMARY: RetrievalConfig(
                    top_k=limit * 2,  # Get more for diversity
                    alpha=0.8,  # Focus on meaning
                    use_mmr=True,
                    lambda_mult=0.3,  # High diversity
                ),
                QueryIntent.COMPARISON: RetrievalConfig(
                    top_k=limit * 2,
                    alpha=0.6,  # Balance keyword + semantic
                    use_mmr=True,
                    lambda_mult=0.5,
                ),
                QueryIntent.LIST: RetrievalConfig(
                    top_k=limit * 2,
                    alpha=0.5,  # More keyword focus
                    use_mmr=True,
                    lambda_mult=0.4,
                ),
            }
            
            # Get config for intent or use defaults
            config = config_map.get(intent, RetrievalConfig(top_k=limit, alpha=alpha))
            
            # Allow user overrides
            if use_mmr:
                config.use_mmr = True
            if use_reranker:
                config.use_reranker = True
            
            logger.info(
                f"Retrieval config: alpha={config.alpha}, "
                f"use_mmr={config.use_mmr}, top_k={config.top_k}"
            )
            
            # 3. Retrieve with advanced hybrid search
            results = await retrieve(db, query, config)
            
            # 4. Convert RetrievalResult to dict format for chat
            context_chunks = []
            for r in results[:limit]:
                context_chunks.append({
                    "id": r.id,
                    "content": r.content,
                    "similarity": r.hybrid_score,  # Use hybrid score
                    "normalized_score": r.normalized_score,
                    "filename": r.filename,
                    "metadata": r.metadata,
                })
            
            logger.info(f"Retrieved {len(context_chunks)} context chunks with hybrid search")
            return context_chunks
                
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
            # Use normalized score (0-100) if available, fallback to similarity
            score = chunk.get("normalized_score", chunk.get("similarity", 0) * 100)
            content = chunk.get("content", "")
            filename = chunk.get("filename", "Unknown")
            
            context_parts.append(
                f"[Context {i}] (Relevance: {score:.0f}/100, Source: {filename})\n{content}"
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
                alpha=0.7,  # Use default hybrid search balance
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
                "You are a friendly and helpful AI assistant for a call center intelligence system. "
                "Answer questions in a natural, conversational way like a human colleague would. "
                "\n\n"
                "IMPORTANT RULES:\n"
                "1. ONLY use information from the provided context below - never use general knowledge\n"
                "2. Write naturally and conversationally - avoid bullet points, formal structures, or robotic language\n"
                "3. When summarizing cases, tell it like a story - focus on the key points that matter\n"
                "4. Be concise but friendly - get to the point without being overly formal\n"
                "5. For insights/summaries, highlight what's interesting or important in plain language\n"
                "6. Support both English and Thai - use the language that feels natural for the query\n"
                "7. If you don't have the information, just say so naturally\n"
                "\n"
                "คุณเป็นผู้ช่วย AI ที่เป็นมิตรและช่วยเหลือดีสำหรับระบบข้อมูล call center "
                "ตอบคำถามแบบธรรมชาติและเป็นกันเองเหมือนเพื่อนร่วมงาน\n"
                "\n"
                "กฎสำคัญ:\n"
                "1. ใช้เฉพาะข้อมูลจาก context ที่ให้มา - ห้ามใช้ความรู้ทั่วไป\n"
                "2. เขียนแบบธรรมชาติและเป็นกันเอง - หลีกเลี่ยงการใช้ bullet points หรือภาษาที่เป็นทางการเกินไป\n"
                "3. เมื่อสรุปเคส ให้เล่าเหมือนเล่าเรื่อง - เน้นประเด็นสำคัญ\n"
                "4. กระชับแต่เป็นมิตร - ตรงประเด็นโดยไม่เป็นทางการเกินไป\n"
                "5. สำหรับ insights/สรุป ให้เน้นสิ่งที่น่าสนใจหรือสำคัญด้วยภาษาง่ายๆ\n"
                "6. รองรับทั้งภาษาอังกฤษและไทย - ใช้ภาษาที่เหมาะสมกับคำถาม\n"
                "7. ถ้าไม่มีข้อมูล ก็บอกแบบธรรมชาติ\n"
            )
        
        # Add context to system prompt
        system_prompt += f"\n\n=== AVAILABLE INFORMATION ===\n{context_text}\n=== END ===\n"
        system_prompt += (
            "\nRemember: Write naturally like you're talking to a colleague. "
            "No bullet points or formal structures unless specifically asked. "
            "Just share the information in a friendly, conversational way.\n"
            "\nจำไว้: เขียนแบบธรรมชาติเหมือนคุยกับเพื่อนร่วมงาน "
            "ไม่ต้องใช้ bullet points หรือโครงสร้างที่เป็นทางการ เว้นแต่จะถูกขอ "
            "แค่แชร์ข้อมูลแบบเป็นกันเองและสบายๆ\n"
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
