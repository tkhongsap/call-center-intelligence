"""
RAG (Retrieval-Augmented Generation) Service

Handles RAG document management, file processing, and retrieval operations.
"""

from pathlib import Path
from fastapi import UploadFile, HTTPException
from app.services.llama_index_service import (
    initialize_settings,
    index_file,
    index_parsed_documents,
    query_index,
    get_index_stats,
)
from app.services.excel_parser import excel_parser

# Allowed file extensions for RAG upload
# Excel files (.xlsx, .csv) use custom parser
# Other files use LlamaIndex SimpleDirectoryReader
ALLOWED_EXTENSIONS = {".pdf", ".txt", ".docx", ".csv", ".md", ".json", ".xlsx"}
EXCEL_EXTENSIONS = {".xlsx", ".csv"}

# Initialize LlamaIndex settings on module load
initialize_settings()


def validate_file_extension(filename: str) -> str:
    """Validate file extension and return it."""
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{ext}' is not supported. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    return ext


async def get_all_documents():
    """Get all RAG documents/index statistics."""
    stats = get_index_stats()
    return {
        "message": "RAG index statistics",
        "stats": stats,
    }


async def get_document_by_id(document_id: str):
    """Get a specific RAG document by ID."""
    # TODO: Implement single document retrieval from index
    return {"message": f"Get document {document_id} - to be implemented"}


async def create_document():
    """Create a new RAG document manually."""
    # TODO: Implement manual document creation
    return {"message": "Create document - to be implemented"}


async def upload_document(file: UploadFile) -> dict:
    """
    Upload and index a file for RAG.
    
    Flow:
    1. Validate file extension
    2. Read file bytes
    3. Parse with appropriate parser (Excel or LlamaIndex)
    4. Index documents
    5. Return result
    
    Args:
        file: Uploaded file from FastAPI
        
    Returns:
        Indexing result
    """
    # 1. Get file info and validate
    filename = file.filename or "unknown"
    ext = validate_file_extension(filename)
    
    # 2. Read file bytes
    file_bytes = await file.read()
    
    # 3. Parse and index based on file type
    if ext in EXCEL_EXTENSIONS:
        # Use custom Excel parser
        try:
            parsed_docs = excel_parser.parse(file_bytes, filename)
            result = index_parsed_documents(parsed_docs)
            result["filename"] = filename
            result["parser"] = "excel_parser"
        except Exception as e:
            return {
                "success": False,
                "filename": filename,
                "error": str(e),
            }
    else:
        # Use LlamaIndex SimpleDirectoryReader for other file types
        result = index_file(file_bytes, filename)
    
    return result


async def search_documents(query: str, top_k: int = 5) -> dict:
    """
    Search/query the RAG index.
    
    Args:
        query: User question
        top_k: Number of results to return
        
    Returns:
        Query response with answer and sources
    """
    result = query_index(query, top_k=top_k)
    return result


async def delete_document(document_id: str):
    """Delete a RAG document by ID."""
    # TODO: Implement document deletion from index
    return {"message": f"Delete document {document_id} - to be implemented"}
