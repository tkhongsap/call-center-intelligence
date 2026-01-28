"""
RAG (Retrieval-Augmented Generation) API Routes

Handles RAG document management, file uploads, and retrieval operations.
"""

from fastapi import APIRouter, UploadFile, File, Query
from app.services.rag_service import (
    get_all_documents,
    get_document_by_id,
    create_document,
    upload_document,
    delete_document,
    search_documents,
)

router = APIRouter()


@router.get("/")
async def get_rag_documents():
    """Get RAG index statistics."""
    return await get_all_documents()


@router.get("/{document_id}")
async def get_rag_document(document_id: str):
    """Get a specific RAG document by ID."""
    return await get_document_by_id(document_id)


@router.post("/")
async def create_rag_document():
    """Create a new RAG document manually."""
    return await create_document()


@router.post("/upload")
async def upload_rag_file(file: UploadFile = File(...)):
    """Upload a file for RAG indexing."""
    return await upload_document(file)


@router.post("/query")
async def query_rag(
    query: str = Query(..., description="Question to ask"),
    top_k: int = Query(5, ge=1, le=20, description="Number of results"),
):
    """Query the RAG index with a question."""
    return await search_documents(query, top_k=top_k)


@router.delete("/{document_id}")
async def delete_rag_document(document_id: str):
    """Delete a RAG document by ID."""
    return await delete_document(document_id)