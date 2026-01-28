"""
Embedding Service - Simple Azure OpenAI Embedding

แค่ embed text/rows แล้วได้ตัวเลข vector ออกมา (ไม่ต้องต่อ database)
"""

from typing import List, Dict, Any
import logging
from openai import AzureOpenAI

from app.core.config import get_settings

logger = logging.getLogger(__name__)


def get_embedding_client() -> AzureOpenAI:
    """Get Azure OpenAI client."""
    settings = get_settings()
    return AzureOpenAI(
        api_key=settings.AZURE_OPENAI_API_KEY,
        api_version=settings.AZURE_OPENAI_API_VERSION,
        azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
    )


def embed_text(text: str) -> List[float]:
    """
    Embed a single text and return vector.
    
    Args:
        text: Text to embed
        
    Returns:
        Embedding vector (3072 dimensions)
    """
    settings = get_settings()
    client = get_embedding_client()
    
    response = client.embeddings.create(
        input=[text],
        model=settings.AZURE_EMBEDDING_DEPLOYMENT
    )
    
    return response.data[0].embedding


def embed_texts(texts: List[str]) -> List[List[float]]:
    """
    Embed multiple texts in batch.
    
    Args:
        texts: List of texts to embed
        
    Returns:
        List of embedding vectors
    """
    settings = get_settings()
    client = get_embedding_client()
    
    response = client.embeddings.create(
        input=texts,
        model=settings.AZURE_EMBEDDING_DEPLOYMENT
    )
    
    # Sort by index to maintain order
    return [item.embedding for item in sorted(response.data, key=lambda x: x.index)]


def embed_row(row_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Embed a single row of data.
    
    Args:
        row_data: Dictionary containing row data
        
    Returns:
        Dictionary with text and embedding vector
    """
    # Combine all fields into text
    text_parts = []
    for key, value in row_data.items():
        if value and str(value).strip():
            text_parts.append(f"{key}: {value}")
    
    combined_text = " | ".join(text_parts)
    embedding = embed_text(combined_text)
    
    return {
        "text": combined_text,
        "embedding": embedding,
        "embedding_dim": len(embedding),
    }


def embed_rows(rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Embed multiple rows of data.
    
    Args:
        rows: List of dictionaries containing row data
        
    Returns:
        List of dictionaries with text and embedding vectors
    """
    # Prepare texts
    texts = []
    for row in rows:
        text_parts = []
        for key, value in row.items():
            if value and str(value).strip():
                text_parts.append(f"{key}: {value}")
        texts.append(" | ".join(text_parts))
    
    # Get embeddings in batch
    embeddings = embed_texts(texts)
    
    # Combine results
    results = []
    for i, (text, embedding) in enumerate(zip(texts, embeddings)):
        results.append({
            "index": i,
            "text": text,
            "embedding": embedding,
            "embedding_dim": len(embedding),
        })
    
    return results
