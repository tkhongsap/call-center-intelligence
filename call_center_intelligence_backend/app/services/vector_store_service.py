"""
Vector Store Service - PostgreSQL pgvector operations

Handles storing and retrieving embeddings using PostgreSQL with pgvector extension.
Supports similarity search with cosine distance and Thai language content.
"""

from typing import List, Dict, Any, Optional
import uuid
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, text, func

from app.models.embedding import Embedding, EMBEDDING_DIM
from app.services.embedding_service import embed_text, embed_texts

logger = logging.getLogger(__name__)


async def store_embedding(
    db: AsyncSession,
    document_id: str,
    chunk_index: int,
    content: str,
    embedding: List[float],
    filename: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> Embedding:
    """
    Store a single embedding in the database.
    
    Args:
        db: Database session
        document_id: Unique identifier for the source document
        chunk_index: Index of this chunk within the document
        content: The text content (supports Thai and all Unicode)
        embedding: The embedding vector (3072 dimensions)
        filename: Original filename (optional)
        metadata: Additional metadata (optional)
        
    Returns:
        Created Embedding object
    """
    embedding_record = Embedding(
        document_id=document_id,
        chunk_index=chunk_index,
        content=content,
        embedding=embedding,
        filename=filename,
        embedding_metadata=metadata,
    )
    
    db.add(embedding_record)
    await db.commit()
    await db.refresh(embedding_record)
    
    logger.info(f"Stored embedding for document {document_id}, chunk {chunk_index}")
    return embedding_record


async def store_embeddings_batch(
    db: AsyncSession,
    document_id: str,
    chunks: List[Dict[str, Any]],
    filename: Optional[str] = None,
) -> List[Embedding]:
    """
    Store multiple embeddings in batch.
    
    Args:
        db: Database session
        document_id: Unique identifier for the source document
        chunks: List of dicts with 'content', 'embedding', and optional 'metadata'
        filename: Original filename (optional)
        
    Returns:
        List of created Embedding objects
    """
    embedding_records = []
    
    for i, chunk in enumerate(chunks):
        record = Embedding(
            document_id=document_id,
            chunk_index=i,
            content=chunk["content"],
            embedding=chunk["embedding"],
            filename=filename,
            embedding_metadata=chunk.get("metadata"),
        )
        embedding_records.append(record)
    
    db.add_all(embedding_records)
    await db.commit()
    
    for record in embedding_records:
        await db.refresh(record)
    
    logger.info(f"Stored {len(embedding_records)} embeddings for document {document_id}")
    return embedding_records


async def embed_and_store_texts(
    db: AsyncSession,
    texts: List[str],
    document_id: Optional[str] = None,
    filename: Optional[str] = None,
    metadata_list: Optional[List[Dict[str, Any]]] = None,
) -> List[Embedding]:
    """
    Embed texts and store them in the database.
    
    Args:
        db: Database session
        texts: List of text chunks to embed (supports Thai)
        document_id: Document ID (auto-generated if not provided)
        filename: Original filename (optional)
        metadata_list: List of metadata dicts for each text (optional)
        
    Returns:
        List of created Embedding objects
    """
    if not document_id:
        document_id = str(uuid.uuid4())
    
    # Generate embeddings
    logger.info(f"Generating embeddings for {len(texts)} texts...")
    embeddings = embed_texts(texts)
    
    # Prepare chunks with embeddings
    chunks = []
    for i, (text, embedding) in enumerate(zip(texts, embeddings)):
        chunk = {
            "content": text,
            "embedding": embedding,
            "metadata": metadata_list[i] if metadata_list and i < len(metadata_list) else None,
        }
        chunks.append(chunk)
    
    # Store in database
    return await store_embeddings_batch(db, document_id, chunks, filename)


async def similarity_search(
    db: AsyncSession,
    query: str,
    limit: int = 5,
    document_id: Optional[str] = None,
    similarity_threshold: Optional[float] = None,
    force_semantic: bool = False,
) -> List[Dict[str, Any]]:
    """
    Perform similarity search using cosine distance.
    Pure semantic search - no hardcoded patterns or keywords.
    
    Args:
        db: Database session
        query: Search query text (supports Thai)
        limit: Maximum number of results
        document_id: Filter by specific document (optional)
        similarity_threshold: Minimum similarity score (0-1, optional)
        force_semantic: Kept for API compatibility (always True now)
        
    Returns:
        List of dicts with 'content', 'similarity', 'document_id', 'chunk_index', 'metadata'
    """
    # Pure semantic similarity search - let embeddings handle everything
    # Generate query embedding
    query_embedding = embed_text(query)
    
    # Build the similarity search query using pgvector's <=> operator (cosine distance)
    # Cosine distance = 1 - cosine_similarity, so we convert back
    similarity_expr = 1 - Embedding.embedding.cosine_distance(query_embedding)
    
    stmt = (
        select(
            Embedding.id,
            Embedding.document_id,
            Embedding.chunk_index,
            Embedding.content,
            Embedding.filename,
            Embedding.embedding_metadata,
            similarity_expr.label("similarity"),
        )
        .order_by(Embedding.embedding.cosine_distance(query_embedding))
        .limit(limit)
    )
    
    # Filter by document if specified
    if document_id:
        stmt = stmt.where(Embedding.document_id == document_id)
    
    result = await db.execute(stmt)
    rows = result.fetchall()
    
    # Format results
    results = []
    for row in rows:
        similarity = float(row.similarity)
        
        # Apply threshold filter if specified
        if similarity_threshold and similarity < similarity_threshold:
            continue
            
        results.append({
            "id": row.id,
            "document_id": row.document_id,
            "chunk_index": row.chunk_index,
            "content": row.content,
            "filename": row.filename,
            "metadata": row.embedding_metadata,
            "similarity": similarity,
        })
    
    logger.info(f"Similarity search returned {len(results)} results")
    return results


async def get_embeddings_by_document(
    db: AsyncSession,
    document_id: str,
) -> List[Embedding]:
    """
    Get all embeddings for a specific document.
    
    Args:
        db: Database session
        document_id: Document identifier
        
    Returns:
        List of Embedding objects
    """
    stmt = (
        select(Embedding)
        .where(Embedding.document_id == document_id)
        .order_by(Embedding.chunk_index)
    )
    
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def delete_document_embeddings(
    db: AsyncSession,
    document_id: str,
) -> int:
    """
    Delete all embeddings for a document.
    
    Args:
        db: Database session
        document_id: Document identifier
        
    Returns:
        Number of deleted records
    """
    stmt = delete(Embedding).where(Embedding.document_id == document_id)
    result = await db.execute(stmt)
    await db.commit()
    
    deleted_count = result.rowcount
    logger.info(f"Deleted {deleted_count} embeddings for document {document_id}")
    return deleted_count


async def list_documents(db: AsyncSession) -> List[Dict[str, Any]]:
    """
    List all unique documents with their chunk counts.
    
    Args:
        db: Database session
        
    Returns:
        List of dicts with 'document_id', 'filename', 'chunk_count'
    """
    stmt = text("""
        SELECT 
            document_id, 
            filename,
            COUNT(*) as chunk_count,
            MIN(created_at) as created_at
        FROM embeddings 
        GROUP BY document_id, filename
        ORDER BY MIN(created_at) DESC
    """)
    
    result = await db.execute(stmt)
    rows = result.fetchall()
    
    return [
        {
            "document_id": row.document_id,
            "filename": row.filename,
            "chunk_count": row.chunk_count,
            "created_at": row.created_at,
        }
        for row in rows
    ]


async def get_embedding_count(db: AsyncSession) -> int:
    """Get total count of embeddings in database."""
    result = await db.execute(select(func.count(Embedding.id)))
    return result.scalar() or 0


async def ensure_pgvector_extension(db: AsyncSession) -> bool:
    """
    Ensure pgvector extension is installed.
    
    Args:
        db: Database session
        
    Returns:
        True if extension is available
    """
    try:
        await db.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        await db.commit()
        logger.info("pgvector extension is available")
        return True
    except Exception as e:
        logger.error(f"Failed to create pgvector extension: {e}")
        return False
