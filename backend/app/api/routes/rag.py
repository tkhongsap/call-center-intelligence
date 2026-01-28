"""
RAG API Routes - Simple Embedding Only

แค่ upload file แล้วได้ embedding vectors ออกมา
"""

from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List

from app.services.rag_service import embed_file_rows, embed_text_list, validate_file_extension

router = APIRouter()


@router.post("/embed/file")
async def embed_file(file: UploadFile = File(...)):
    """
    Upload Excel/CSV file and get embeddings for all rows.
    
    Returns embedding vectors (3072 dimensions for text-embedding-3-large).
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
        return embed_file_rows(file_bytes, filename)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/embed/texts")
async def embed_texts_endpoint(texts: List[str]):
    """
    Embed a list of texts.
    
    Example: ["text1", "text2", "text3"]
    """
    try:
        return embed_text_list(texts)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
