"""
RAG Service - Business Logic for RAG Operations

แยก business logic ออกจาก routes
"""

from typing import List, Dict, Any
from pathlib import Path
import logging

from app.services.embedding_service import embed_texts
from app.services.excel_parser import ExcelParser

logger = logging.getLogger(__name__)

ALLOWED_EXTENSIONS = {".xlsx", ".csv"}


def validate_file_extension(filename: str) -> str:
    """
    Validate file extension.
    
    Args:
        filename: Name of the file
        
    Returns:
        File extension (lowercase)
        
    Raises:
        ValueError: If extension not supported
    """
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(f"Only .xlsx and .csv files are supported. Got: {ext}")
    return ext


def embed_file_rows(file_bytes: bytes, filename: str) -> Dict[str, Any]:
    """
    Parse file and embed each row.
    
    Args:
        file_bytes: Raw file content
        filename: Name of the file
        
    Returns:
        Dictionary with embeddings and metadata
    """
    # Validate
    validate_file_extension(filename)
    
    # Parse Excel/CSV
    parser = ExcelParser()
    parsed_docs = parser.parse(file_bytes, filename)
    
    if not parsed_docs:
        return {
            "success": True,
            "filename": filename,
            "total_rows": 0,
            "embedding_dim": 0,
            "results": [],
        }
    
    # Get text content from each row
    texts = [doc.content for doc in parsed_docs]
    
    logger.info(f"Embedding {len(texts)} rows from {filename}")
    
    # Embed all texts
    embeddings = embed_texts(texts)
    
    # Build results with metadata
    results = []
    for i, (doc, emb) in enumerate(zip(parsed_docs, embeddings)):
        results.append({
            "row_index": i,
            "text": doc.content,
            "metadata": doc.metadata,
            "embedding": emb,
            "embedding_dim": len(emb),
        })
    
    return {
        "success": True,
        "filename": filename,
        "total_rows": len(results),
        "embedding_dim": len(embeddings[0]) if embeddings else 0,
        "results": results,
    }


def embed_text_list(texts: List[str]) -> Dict[str, Any]:
    """
    Embed a list of texts.
    
    Args:
        texts: List of texts to embed
        
    Returns:
        Dictionary with embeddings
        
    Raises:
        ValueError: If texts list is empty
    """
    if not texts:
        raise ValueError("texts list cannot be empty")
    
    logger.info(f"Embedding {len(texts)} texts")
    
    embeddings = embed_texts(texts)
    
    results = []
    for i, (text, emb) in enumerate(zip(texts, embeddings)):
        results.append({
            "index": i,
            "text": text,
            "embedding": emb,
            "embedding_dim": len(emb),
        })
    
    return {
        "success": True,
        "count": len(results),
        "embedding_dim": len(embeddings[0]) if embeddings else 0,
        "results": results,
    }
