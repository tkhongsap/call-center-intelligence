"""
Embedding model for storing vector embeddings with pgvector.

This model stores text chunks with their 3072-dimensional embeddings
for RAG (Retrieval-Augmented Generation) operations using PostgreSQL pgvector.
"""

from typing import Optional, List
from sqlalchemy import String, Integer, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column
from pgvector.sqlalchemy import Vector

from app.core.database import Base
from app.models.base import TimestampMixin

# Embedding dimension for text-embedding-3-large
EMBEDDING_DIM = 3072


class Embedding(Base, TimestampMixin):
    """
    Model for storing document embeddings with pgvector.
    
    Attributes:
        id: Primary key
        document_id: Reference to source document
        chunk_index: Index of the chunk within the document
        content: The text content of the chunk (supports Thai and all Unicode)
        embedding: 3072-dimensional embedding vector (pgvector type)
        filename: Original filename
        embedding_metadata: Additional metadata about the chunk
    
    Note:
        Uses pgvector's Vector type for efficient similarity search.
        Exact search performs well for < 100k rows.
    """
    __tablename__ = "embeddings"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    document_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    embedding: Mapped[List[float]] = mapped_column(Vector(EMBEDDING_DIM), nullable=False)
    filename: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    embedding_metadata: Mapped[Optional[dict]] = mapped_column("metadata", JSON, nullable=True)
    
    def __repr__(self) -> str:
        return f"<Embedding(id={self.id}, document_id={self.document_id}, chunk={self.chunk_index})>"
