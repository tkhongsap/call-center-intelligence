"""
RAG API Routes - Embedding with Database Storage

Upload file → embed → store in PostgreSQL with pgvector
รองรับภาษาไทยและ Unicode ทุกภาษา
"""

import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.services.rag_service import embed_file_rows, embed_text_list, validate_file_extension
from app.services.vector_store_service import (
    store_embeddings_batch,
    embed_and_store_texts,
    similarity_search,
    list_documents,
    delete_document_embeddings,
    get_embedding_count,
)

router = APIRouter()


class EmbedTextsRequest(BaseModel):
    """Request model for embedding texts."""
    texts: List[str]
    document_id: Optional[str] = None
    save_to_db: bool = True


class SearchRequest(BaseModel):
    """Request model for similarity search."""
    query: str
    limit: int = 5
    document_id: Optional[str] = None
    similarity_threshold: Optional[float] = None


@router.post("/embed/file")
async def embed_file(
    file: UploadFile = File(...),
    save_to_db: bool = True,
    db: AsyncSession = Depends(get_db),
):
    """
    Upload Excel/CSV file, embed all rows, and optionally save to database.
    
    - รองรับไฟล์ .xlsx และ .csv
    - รองรับภาษาไทยและ Unicode
    - Embedding dimension: 3072 (text-embedding-3-large)
    
    Args:
        file: Excel or CSV file
        save_to_db: Whether to save embeddings to PostgreSQL (default: True)
        
    Returns:
        Embeddings with metadata, and document_id if saved to database
    """
    filename = file.filename or "unknown"
    
    # Validate extension
    try:
        validate_file_extension(filename)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # Read file
    file_bytes = await file.read()
    
    try:
        # Embed file rows
        result = embed_file_rows(file_bytes, filename)
        
        # Save to database if requested
        if save_to_db and result.get("results"):
            document_id = str(uuid.uuid4())
            
            # Prepare chunks for batch insert
            chunks = [
                {
                    "content": r["text"],
                    "embedding": r["embedding"],
                    "metadata": r.get("metadata"),
                }
                for r in result["results"]
            ]
            
            # Store in PostgreSQL with pgvector
            await store_embeddings_batch(db, document_id, chunks, filename)
            
            result["document_id"] = document_id
            result["saved_to_db"] = True
            result["message"] = f"Saved {len(chunks)} embeddings to database"
        else:
            result["saved_to_db"] = False
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/embed/texts")
async def embed_texts_endpoint(
    request: EmbedTextsRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Embed a list of texts and optionally save to database.
    
    - รองรับภาษาไทยและ Unicode
    - Embedding dimension: 3072
    
    Example request:
    ```json
    {
        "texts": ["ข้อความภาษาไทย", "English text"],
        "save_to_db": true
    }
    ```
    """
    try:
        if not request.texts:
            raise HTTPException(status_code=400, detail="texts list cannot be empty")
        
        # Embed texts
        result = embed_text_list(request.texts)
        
        # Save to database if requested
        if request.save_to_db:
            document_id = request.document_id or str(uuid.uuid4())
            
            chunks = [
                {
                    "content": r["text"],
                    "embedding": r["embedding"],
                    "metadata": None,
                }
                for r in result["results"]
            ]
            
            await store_embeddings_batch(db, document_id, chunks)
            
            result["document_id"] = document_id
            result["saved_to_db"] = True
        else:
            result["saved_to_db"] = False
        
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/search")
async def search_similar(
    request: SearchRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Search for similar content using cosine similarity.
    
    - รองรับ query ภาษาไทย
    - ใช้ pgvector สำหรับ similarity search
    
    Example request:
    ```json
    {
        "query": "ค้นหาข้อมูลลูกค้า",
        "limit": 5
    }
    ```
    """
    try:
        results = await similarity_search(
            db=db,
            query=request.query,
            limit=request.limit,
            document_id=request.document_id,
            similarity_threshold=request.similarity_threshold,
        )
        
        return {
            "success": True,
            "query": request.query,
            "count": len(results),
            "results": results,
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/documents")
async def get_documents(db: AsyncSession = Depends(get_db)):
    """
    List all documents with their embedding counts.
    
    Returns list of documents stored in the database.
    """
    try:
        documents = await list_documents(db)
        total_embeddings = await get_embedding_count(db)
        
        return {
            "success": True,
            "total_documents": len(documents),
            "total_embeddings": total_embeddings,
            "documents": documents,
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/documents/{document_id}")
async def delete_document(
    document_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Delete all embeddings for a document.
    
    Args:
        document_id: The document ID to delete
    """
    try:
        deleted_count = await delete_document_embeddings(db, document_id)
        
        return {
            "success": True,
            "document_id": document_id,
            "deleted_count": deleted_count,
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
