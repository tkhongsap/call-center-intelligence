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
from app.services.rag_service import (
    validate_file_extension,
    validate_thai_file,
    validate_file_encoding,
    embed_file_with_thai_check,
    embed_text_list,
)
from app.services.vector_store_service import (
    store_embeddings_batch,
    similarity_search,
    list_documents,
    delete_document_embeddings,
    get_embedding_count,
)
from app.services.retrieval_service import (
    retrieve,
    rerank_with_llm,
    classify_query_intent,
    RetrievalConfig,
)
from app.schemas.retrieval import (
    AdvancedSearchRequest,
    AdvancedSearchResponse,
    RetrievalResultItem,
    QueryIntent,
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
    """Upload Excel/CSV file, embed all rows, and save to database."""
    filename = file.filename or "unknown"
    
    try:
        validate_file_extension(filename)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    file_bytes = await file.read()
    
    # Check for corrupted Thai text
    validation = validate_thai_file(file_bytes)
    if not validation["is_valid"]:
        raise HTTPException(status_code=400, detail=validation["error_detail"])
    
    try:
        result, thai_chars = embed_file_with_thai_check(file_bytes, filename)
        
        if save_to_db and result.get("results"):
            document_id = str(uuid.uuid4())
            chunks = [
                {
                    "content": r["text"],
                    "embedding": r["embedding"],
                    "metadata": r.get("metadata"),
                }
                for r in result["results"]
            ]
            
            await store_embeddings_batch(db, document_id, chunks, filename)
            
            result["document_id"] = document_id
            result["saved_to_db"] = True
            result["message"] = f"Saved {len(chunks)} embeddings to database"
            if thai_chars > 0:
                result["message"] += f" - พบภาษาไทย {thai_chars} ตัวอักษร"
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
    """Embed a list of texts and optionally save to database."""
    try:
        if not request.texts:
            raise HTTPException(status_code=400, detail="texts list cannot be empty")
        
        result = embed_text_list(request.texts)
        
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
    """Search for similar content using cosine similarity."""
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


@router.post("/search/advanced")
async def search_advanced(
    request: AdvancedSearchRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Advanced search with hybrid scoring, MMR diversity, and optional re-ranking.
    
    Features:
    - Hybrid search: combines semantic + keyword scoring
    - MMR: Maximal Marginal Relevance for diverse results
    - LLM re-ranking: optional re-ranking using Azure OpenAI
    - Score normalization: all scores in 0-100 range
    """
    try:
        # Build retrieval config
        config = RetrievalConfig(
            top_k=request.limit,
            alpha=request.alpha,
            use_mmr=request.use_mmr,
            lambda_mult=request.lambda_mult,
            use_reranker=request.use_reranker,
            similarity_threshold=request.similarity_threshold,
            metadata_filter=request.metadata_filter.model_dump() if request.metadata_filter else None,
        )
        
        # Classify intent
        intent = classify_query_intent(request.query)
        
        # Perform retrieval
        results = await retrieve(db, request.query, config)
        
        # Optional: Apply LLM re-ranking
        if request.use_reranker and results:
            results = await rerank_with_llm(request.query, results, request.limit)
        
        # Convert to response format
        result_items = [
            RetrievalResultItem(
                id=r.id,
                document_id=r.document_id,
                chunk_index=r.chunk_index,
                content=r.content,
                filename=r.filename,
                metadata=r.metadata,
                raw_similarity=r.raw_similarity,
                keyword_score=r.keyword_score,
                hybrid_score=r.hybrid_score,
                normalized_score=r.normalized_score,
                mmr_score=r.mmr_score,
            )
            for r in results
        ]
        
        return AdvancedSearchResponse(
            success=True,
            query=request.query,
            intent=intent,
            count=len(result_items),
            config={
                "alpha": request.alpha,
                "use_mmr": request.use_mmr,
                "lambda_mult": request.lambda_mult,
                "use_reranker": request.use_reranker,
            },
            results=result_items,
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/documents")
async def get_documents(db: AsyncSession = Depends(get_db)):
    """List all documents with their embedding counts."""
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
    """Delete all embeddings for a document."""
    try:
        deleted_count = await delete_document_embeddings(db, document_id)
        
        return {
            "success": True,
            "document_id": document_id,
            "deleted_count": deleted_count,
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/validate/file")
async def validate_file(file: UploadFile = File(...)):
    """Validate CSV/Excel file encoding without saving to database."""
    filename = file.filename or "unknown"
    file_bytes = await file.read()
    
    return validate_file_encoding(file_bytes, filename)

