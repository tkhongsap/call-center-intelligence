"""
LlamaIndex Service with ChromaDB Vector Store

Internal service for LlamaIndex operations - indexing and querying using ChromaDB.
"""

import os
import tempfile
from typing import Optional, List, Dict, Any
from pathlib import Path

# LlamaIndex imports
from llama_index.core import (
    VectorStoreIndex,
    SimpleDirectoryReader,
    StorageContext,
    Settings,
    Document,
    PromptTemplate,
)
from llama_index.core.node_parser import SentenceSplitter
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.llms.openai import OpenAI
from llama_index.vector_stores.chroma import ChromaVectorStore

import chromadb
from chromadb.config import Settings as ChromaSettings

import logging

logger = logging.getLogger(__name__)

# ChromaDB storage path
CHROMA_PERSIST_DIR = Path("./storage/chroma_db")
COLLECTION_NAME = "rag_documents"


def initialize_settings(
    model: str = "gpt-4o-mini",
    embedding_model: str = "text-embedding-3-small",
    chunk_size: int = 1024,
    chunk_overlap: int = 200,
):
    """
    Initialize LlamaIndex settings.
    
    Args:
        model: LLM model name
        embedding_model: Embedding model name
        chunk_size: Size of text chunks
        chunk_overlap: Overlap between chunks
    """
    Settings.llm = OpenAI(model=model)
    Settings.embed_model = OpenAIEmbedding(model=embedding_model)
    Settings.node_parser = SentenceSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
    )
    logger.info("LlamaIndex settings initialized", model=model, embedding_model=embedding_model)


def get_chroma_client() -> chromadb.PersistentClient:
    """Get or create ChromaDB persistent client."""
    CHROMA_PERSIST_DIR.mkdir(parents=True, exist_ok=True)
    client = chromadb.PersistentClient(
        path=str(CHROMA_PERSIST_DIR),
        settings=ChromaSettings(anonymized_telemetry=False)
    )
    return client


def get_or_create_index() -> Optional[VectorStoreIndex]:
    """
    Load existing index from ChromaDB or return None if not exists.
    
    Returns:
        VectorStoreIndex or None
    """
    try:
        client = get_chroma_client()
        
        # Check if collection exists
        collections = client.list_collections()
        collection_names = [c.name for c in collections]
        
        if COLLECTION_NAME not in collection_names:
            logger.info("No existing collection found")
            return None
        
        # Load existing collection
        collection = client.get_collection(COLLECTION_NAME)
        
        if collection.count() == 0:
            logger.info("Collection exists but is empty")
            return None
        
        # Create vector store from existing collection
        vector_store = ChromaVectorStore(chroma_collection=collection)
        storage_context = StorageContext.from_defaults(vector_store=vector_store)
        
        # Load index
        index = VectorStoreIndex.from_vector_store(
            vector_store=vector_store,
            storage_context=storage_context,
        )
        
        logger.info("Loaded existing index from ChromaDB", num_docs=collection.count())
        return index
        
    except Exception as e:
        logger.warning("Failed to load index from ChromaDB", error=str(e))
        return None


def index_documents(documents: List[Document]) -> VectorStoreIndex:
    """
    Create or update index with new documents using ChromaDB.
    
    Args:
        documents: List of LlamaIndex Document objects
        
    Returns:
        VectorStoreIndex
    """
    client = get_chroma_client()
    
    # Get or create collection
    collection = client.get_or_create_collection(COLLECTION_NAME)
    
    # Create vector store
    vector_store = ChromaVectorStore(chroma_collection=collection)
    storage_context = StorageContext.from_defaults(vector_store=vector_store)
    
    # Create index (this will embed and store in ChromaDB)
    index = VectorStoreIndex.from_documents(
        documents,
        storage_context=storage_context,
    )
    
    logger.info("Indexed documents in ChromaDB", num_docs=len(documents), total=collection.count())
    
    return index


def index_file(file_bytes: bytes, filename: str) -> Dict[str, Any]:
    """
    Index a single file.
    
    Args:
        file_bytes: Raw file bytes
        filename: Original filename
        
    Returns:
        Indexing result with metadata
    """
    # Save to temp file for SimpleDirectoryReader
    with tempfile.NamedTemporaryFile(delete=False, suffix=f"_{filename}") as tmp:
        tmp.write(file_bytes)
        tmp_path = tmp.name
    
    try:
        # Load document using LlamaIndex reader
        documents = SimpleDirectoryReader(input_files=[tmp_path]).load_data()
        
        # Add metadata
        for doc in documents:
            doc.metadata["original_filename"] = filename
        
        # Index documents
        index = index_documents(documents)
        
        # Get collection count
        client = get_chroma_client()
        collection = client.get_collection(COLLECTION_NAME)
        num_nodes = collection.count()
        
        return {
            "success": True,
            "filename": filename,
            "num_documents": len(documents),
            "num_nodes": num_nodes,
            "message": f"Successfully indexed {filename}",
        }
    
    except Exception as e:
        logger.error("Failed to index file", filename=filename, error=str(e))
        return {
            "success": False,
            "filename": filename,
            "error": str(e),
        }
    
    finally:
        # Cleanup temp file
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)


def index_parsed_documents(parsed_docs: List[Any]) -> Dict[str, Any]:
    """
    Index documents from custom parsers (Excel, Database, etc.).
    
    Args:
        parsed_docs: List of ParsedDocument objects from parsers
        
    Returns:
        Indexing result with metadata
    """
    try:
        # Convert ParsedDocuments to LlamaIndex Documents
        documents = []
        for parsed_doc in parsed_docs:
            doc = Document(
                text=parsed_doc.content,
                metadata={
                    "doc_id": parsed_doc.id,
                    "source": parsed_doc.source,
                    "original_filename": parsed_doc.filename or "unknown",
                    "timestamp": parsed_doc.timestamp.isoformat(),
                    **parsed_doc.metadata,
                },
            )
            documents.append(doc)
        
        if not documents:
            return {
                "success": False,
                "error": "No documents to index",
            }
        
        # Index documents
        index = index_documents(documents)
        
        # Get collection count
        client = get_chroma_client()
        collection = client.get_collection(COLLECTION_NAME)
        num_nodes = collection.count()
        
        return {
            "success": True,
            "num_documents": len(documents),
            "num_nodes": num_nodes,
            "message": f"Successfully indexed {len(documents)} documents",
        }
    
    except Exception as e:
        logger.error("Failed to index parsed documents", error=str(e))
        return {
            "success": False,
            "error": str(e),
        }


def query_index(query: str, top_k: int = 5) -> Dict[str, Any]:
    """
    Query the index with a question.
    
    Args:
        query: User question
        top_k: Number of similar documents to retrieve
        
    Returns:
        Query response with answer and sources
    """
    index = get_or_create_index()
    
    if not index:
        return {
            "success": False,
            "error": "No index found. Please upload documents first.",
        }
    
    try:
        # Prompt Template
        qa_template_str = (
            "Context:\n{context_str}\n\n"
            "Question: {query_str}\n\n"
            "Rules:\n"
            "1. Answer using ONLY the context provided\n"
            "2. Be concise and specific\n"
            "3. If unsure, say 'I cannot find this information'\n\n"
            "Answer:"
        )
        qa_template = PromptTemplate(qa_template_str)
        
        # Create query engine with custom prompt
        query_engine = index.as_query_engine(
            similarity_top_k=top_k,
            text_qa_template=qa_template,
        )
        
        # Execute query
        response = query_engine.query(query)
        
        # Extract source nodes info
        sources = []
        if response.source_nodes:
            for node in response.source_nodes:
                sources.append({
                    "text": node.text[:500] + "..." if len(node.text) > 500 else node.text,
                    "score": node.score,
                    "metadata": node.metadata,
                })
        
        return {
            "success": True,
            "query": query,
            "answer": str(response),
            "sources": sources,
        }
    
    except Exception as e:
        logger.error("Query failed", query=query, error=str(e))
        return {
            "success": False,
            "query": query,
            "error": str(e),
        }


def get_index_stats() -> Dict[str, Any]:
    """
    Get statistics about the current index.
    
    Returns:
        Index statistics
    """
    try:
        client = get_chroma_client()
        collections = client.list_collections()
        collection_names = [c.name for c in collections]
        
        if COLLECTION_NAME not in collection_names:
            return {
                "exists": False,
                "message": "No index found",
            }
        
        collection = client.get_collection(COLLECTION_NAME)
        
        return {
            "exists": True,
            "num_nodes": collection.count(),
            "collection_name": COLLECTION_NAME,
            "storage_path": str(CHROMA_PERSIST_DIR),
        }
    
    except Exception as e:
        logger.error("Failed to get index stats", error=str(e))
        return {
            "exists": False,
            "error": str(e),
        }


def delete_collection() -> Dict[str, Any]:
    """
    Delete the entire collection.
    
    Returns:
        Deletion result
    """
    try:
        client = get_chroma_client()
        client.delete_collection(COLLECTION_NAME)
        logger.info("Deleted collection", collection=COLLECTION_NAME)
        return {
            "success": True,
            "message": f"Deleted collection {COLLECTION_NAME}",
        }
    except Exception as e:
        logger.error("Failed to delete collection", error=str(e))
        return {
            "success": False,
            "error": str(e),
        }
