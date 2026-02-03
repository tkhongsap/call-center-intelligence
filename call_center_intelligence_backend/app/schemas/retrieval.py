"""
Retrieval Schemas - Request/Response models for advanced retrieval.

Pydantic models for hybrid search, MMR, and configurable retrieval.
"""

from typing import List, Dict, Any, Optional
from enum import Enum
from pydantic import BaseModel, Field


class QueryIntent(str, Enum):
    """Classification of query intent for routing."""
    FACT = "fact"
    SUMMARY = "summary"
    COMPARISON = "comparison"
    LIST = "list"


class MetadataFilter(BaseModel):
    """Filter for metadata-based pre-filtering."""
    document_id: Optional[str] = None
    filename: Optional[str] = None
    category: Optional[str] = None
    business_unit: Optional[str] = None
    custom: Optional[Dict[str, Any]] = None


class AdvancedSearchRequest(BaseModel):
    """Request model for advanced retrieval search."""
    query: str = Field(..., min_length=1, description="Search query text")
    limit: int = Field(default=10, ge=1, le=100, description="Maximum number of results")
    alpha: float = Field(default=0.7, ge=0.0, le=1.0, description="Hybrid: weight for semantic vs keyword (1.0 = pure semantic)")
    use_mmr: bool = Field(default=False, description="Enable MMR for diversity")
    lambda_mult: float = Field(default=0.5, ge=0.0, le=1.0, description="MMR diversity parameter (0=max diversity, 1=no diversity)")
    use_reranker: bool = Field(default=False, description="Enable LLM-based re-ranking")
    similarity_threshold: Optional[float] = Field(default=None, ge=0.0, le=1.0, description="Minimum similarity score")
    metadata_filter: Optional[MetadataFilter] = Field(default=None, description="Metadata filters")

    class Config:
        json_schema_extra = {
            "example": {
                "query": "ลูกค้าโอนเงินไม่ได้",
                "limit": 10,
                "alpha": 0.7,
                "use_mmr": False,
                "lambda_mult": 0.5,
                "use_reranker": False,
            }
        }


class RetrievalResultItem(BaseModel):
    """Single retrieval result with scores."""
    id: int
    document_id: str
    chunk_index: int
    content: str
    filename: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    raw_similarity: float = Field(..., description="Original cosine similarity (0-1)")
    keyword_score: float = Field(..., description="Keyword match score (0-1)")
    hybrid_score: float = Field(..., description="Combined score (0-1)")
    normalized_score: float = Field(..., description="Final score (0-100)")
    mmr_score: Optional[float] = Field(default=None, description="MMR adjusted score if used")


class AdvancedSearchResponse(BaseModel):
    """Response model for advanced retrieval search."""
    success: bool = True
    query: str
    intent: QueryIntent
    count: int
    config: Dict[str, Any]
    results: List[RetrievalResultItem]

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "query": "ลูกค้าโอนเงินไม่ได้",
                "intent": "fact",
                "count": 5,
                "config": {
                    "alpha": 0.7,
                    "use_mmr": False,
                    "lambda_mult": 0.5,
                },
                "results": []
            }
        }


class SimpleSearchRequest(BaseModel):
    """Simplified search request for basic use cases."""
    query: str = Field(..., min_length=1)
    limit: int = Field(default=5, ge=1, le=50)
    document_id: Optional[str] = None
    similarity_threshold: Optional[float] = Field(default=None, ge=0.0, le=1.0)


class SimpleSearchResponse(BaseModel):
    """Simplified search response."""
    success: bool = True
    query: str
    count: int
    results: List[Dict[str, Any]]
