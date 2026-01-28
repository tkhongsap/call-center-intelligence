"""
Embedding model for storing vector embeddings.

This model stores text chunks with their 3078-dimensional embeddings
for RAG (Retrieval-Augmented Generation) operations.
"""

from typing import Optional
from sqlalchemy import String, Integer, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import TimestampMixin


class Embedding(Base, TimestampMixin):
    """
    Model for storing document embeddings.
    
    Attributes:
        id: Primary key
        document_id: Reference to source document
        chunk_index: Index of the chunk within the document
        content: The text content of the chunk
        embedding: 3078-dimensional embedding vector (stored as JSON array)
        embedding_metadata: Additional metadata about the chunk
    """
    __tablename__ = "embeddings"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    document_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    embedding: Mapped[list] = mapped_column(JSON, nullable=False)  # 3078-dim vector
    filename: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    embedding_metadata: Mapped[Optional[dict]] = mapped_column("metadata", JSON, nullable=True)
    
    def __repr__(self) -> str:
        return f"<Embedding(id={self.id}, document_id={self.document_id}, chunk={self.chunk_index})>"
