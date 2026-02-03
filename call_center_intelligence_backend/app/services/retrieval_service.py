"""
Retrieval Service - Advanced Search & Ranking for RAG

Implements retrieval strategies following LlamaIndex production patterns:
- Top-K similarity search with configurable K
- Hybrid search (keyword + semantic)
- MMR (Maximal Marginal Relevance) for diversity
- Re-ranking with LLM
- Query routing based on intent
- Relevance score normalization (0-100)

รองรับภาษาไทยและ Unicode ทุกภาษา
"""

import re
import math
from typing import List, Dict, Any, Optional, Tuple
from enum import Enum
from dataclasses import dataclass
import logging

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.embedding import Embedding, EMBEDDING_DIM
from app.services.embedding_service import embed_text
from app.services.vector_store_service import similarity_search

logger = logging.getLogger(__name__)


class QueryIntent(str, Enum):
    """Classification of query intent for routing."""
    FACT = "fact"           # Single fact lookup
    SUMMARY = "summary"     # Summarization request
    COMPARISON = "comparison"  # Compare multiple items
    LIST = "list"           # List multiple items


@dataclass
class RetrievalResult:
    """Enhanced retrieval result with normalized scores."""
    id: int
    document_id: str
    chunk_index: int
    content: str
    filename: Optional[str]
    metadata: Optional[Dict[str, Any]]
    raw_similarity: float        # Original cosine similarity (0-1)
    keyword_score: float         # Keyword match score (0-1)
    hybrid_score: float          # Combined score (0-1)
    normalized_score: float      # Final score (0-100)
    mmr_score: Optional[float] = None  # MMR adjusted score if used


@dataclass
class RetrievalConfig:
    """Configuration for retrieval pipeline."""
    top_k: int = 10
    alpha: float = 0.7           # Weight for semantic vs keyword (1.0 = pure semantic)
    use_mmr: bool = False
    lambda_mult: float = 0.5     # MMR diversity parameter
    use_reranker: bool = False
    similarity_threshold: Optional[float] = None
    metadata_filter: Optional[Dict[str, Any]] = None


# =============================================================================
# Query Intent Classification
# =============================================================================

def classify_query_intent(query: str) -> QueryIntent:
    """
    Classify query intent using heuristics.
    
    สำหรับ production ควรใช้ LLM-based classification แทน
    
    Args:
        query: Search query text
        
    Returns:
        QueryIntent enum value
    """
    query_lower = query.lower()
    
    # Comparison patterns
    comparison_patterns = [
        r'\bcompare\b', r'\bvs\b', r'\bversus\b', r'\bdifference\b',
        r'เปรียบเทียบ', r'ต่างกัน', r'แตกต่าง'
    ]
    for pattern in comparison_patterns:
        if re.search(pattern, query_lower):
            return QueryIntent.COMPARISON
    
    # List patterns
    list_patterns = [
        r'\blist\b', r'\ball\b', r'\bevery\b', r'\beach\b',
        r'ทั้งหมด', r'รายการ', r'ทุก'
    ]
    for pattern in list_patterns:
        if re.search(pattern, query_lower):
            return QueryIntent.LIST
    
    # Summary patterns
    summary_patterns = [
        r'\bsummar', r'\boverview\b', r'\bexplain\b', r'\bdescribe\b',
        r'สรุป', r'อธิบาย', r'ภาพรวม'
    ]
    for pattern in summary_patterns:
        if re.search(pattern, query_lower):
            return QueryIntent.SUMMARY
    
    # Default to fact lookup
    return QueryIntent.FACT


# =============================================================================
# Keyword Scoring
# =============================================================================

def calculate_keyword_score(query: str, content: str) -> float:
    """
    Calculate keyword-based relevance score.
    
    Uses simple term frequency matching.
    
    Args:
        query: Search query
        content: Document content
        
    Returns:
        Score between 0 and 1
    """
    # Extract keywords (words with 2+ characters)
    query_words = set(re.findall(r'\b\w{2,}\b', query.lower()))
    content_lower = content.lower()
    
    if not query_words:
        return 0.0
    
    # Count matches
    matches = sum(1 for word in query_words if word in content_lower)
    
    # Normalize by query length
    return matches / len(query_words)


def calculate_keyword_score_weighted(query: str, content: str, metadata: Optional[Dict] = None) -> float:
    """
    Calculate weighted keyword score considering field importance.
    
    Args:
        query: Search query
        content: Document content
        metadata: Optional metadata with additional fields
        
    Returns:
        Score between 0 and 1
    """
    base_score = calculate_keyword_score(query, content)
    
    if not metadata:
        return base_score
    
    # Boost for metadata field matches
    boost = 0.0
    query_lower = query.lower()
    
    # Check category match
    if 'category' in metadata and metadata['category']:
        if query_lower in str(metadata['category']).lower():
            boost += 0.2
    
    # Check business unit match  
    if 'business_unit' in metadata and metadata['business_unit']:
        if query_lower in str(metadata['business_unit']).lower():
            boost += 0.1
    
    return min(base_score + boost, 1.0)


# =============================================================================
# Score Normalization
# =============================================================================

def normalize_score(score: float, min_val: float = 0.0, max_val: float = 1.0) -> float:
    """
    Normalize score to 0-100 range.
    
    Args:
        score: Raw score
        min_val: Minimum possible value
        max_val: Maximum possible value
        
    Returns:
        Score in 0-100 range
    """
    if max_val == min_val:
        return 50.0
    
    normalized = (score - min_val) / (max_val - min_val)
    return round(max(0.0, min(100.0, normalized * 100)), 2)


# =============================================================================
# MMR (Maximal Marginal Relevance)
# =============================================================================

def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    """
    Calculate cosine similarity between two vectors.
    
    Args:
        vec1: First vector
        vec2: Second vector
        
    Returns:
        Cosine similarity (0-1)
    """
    if len(vec1) != len(vec2):
        return 0.0
    
    dot_product = sum(a * b for a, b in zip(vec1, vec2))
    norm1 = math.sqrt(sum(a * a for a in vec1))
    norm2 = math.sqrt(sum(b * b for b in vec2))
    
    if norm1 == 0 or norm2 == 0:
        return 0.0
    
    return dot_product / (norm1 * norm2)


async def mmr_rerank(
    query_embedding: List[float],
    candidates: List[Dict[str, Any]],
    embeddings: List[List[float]],
    k: int = 10,
    lambda_mult: float = 0.5,
) -> List[Dict[str, Any]]:
    """
    Re-rank results using Maximal Marginal Relevance.
    
    MMR = λ * sim(q, d) - (1-λ) * max(sim(d, d_j)) for all d_j in selected
    
    This reduces redundancy by penalizing documents similar to already selected ones.
    
    Args:
        query_embedding: Query embedding vector
        candidates: List of candidate results with similarity scores
        embeddings: Corresponding embedding vectors for candidates
        k: Number of results to return
        lambda_mult: Diversity parameter (0=max diversity, 1=no diversity)
        
    Returns:
        Re-ranked list of results with MMR scores
    """
    if not candidates or k <= 0:
        return []
    
    # Calculate query similarities
    query_sims = [
        cosine_similarity(query_embedding, emb) 
        for emb in embeddings
    ]
    
    selected_indices = []
    selected_embeddings = []
    remaining_indices = list(range(len(candidates)))
    
    while len(selected_indices) < k and remaining_indices:
        best_score = float('-inf')
        best_idx = -1
        
        for idx in remaining_indices:
            # Relevance to query
            relevance = query_sims[idx]
            
            # Diversity: max similarity to already selected
            if selected_embeddings:
                max_sim_to_selected = max(
                    cosine_similarity(embeddings[idx], sel_emb)
                    for sel_emb in selected_embeddings
                )
            else:
                max_sim_to_selected = 0.0
            
            # MMR score
            mmr_score = lambda_mult * relevance - (1 - lambda_mult) * max_sim_to_selected
            
            if mmr_score > best_score:
                best_score = mmr_score
                best_idx = idx
        
        if best_idx >= 0:
            selected_indices.append(best_idx)
            selected_embeddings.append(embeddings[best_idx])
            remaining_indices.remove(best_idx)
            
            # Add MMR score to result
            candidates[best_idx]['mmr_score'] = best_score
    
    return [candidates[i] for i in selected_indices]


# =============================================================================
# Hybrid Search
# =============================================================================

async def hybrid_search(
    db: AsyncSession,
    query: str,
    config: RetrievalConfig,
) -> List[RetrievalResult]:
    """
    Perform hybrid search combining semantic and keyword matching.
    
    score = α * semantic_score + (1-α) * keyword_score
    
    Args:
        db: Database session
        query: Search query
        config: Retrieval configuration
        
    Returns:
        List of RetrievalResult with combined scores
    """
    # Step 1: Get semantic search results
    semantic_results = await similarity_search(
        db=db,
        query=query,
        limit=config.top_k * 2,  # Get more candidates for hybrid scoring
        document_id=config.metadata_filter.get('document_id') if config.metadata_filter else None,
        similarity_threshold=config.similarity_threshold,
    )
    
    if not semantic_results:
        return []
    
    # Step 2: Calculate hybrid scores
    results = []
    for sr in semantic_results:
        # Keyword score
        keyword_score = calculate_keyword_score_weighted(
            query, 
            sr['content'],
            sr.get('metadata')
        )
        
        # Hybrid score
        semantic_score = sr['similarity']
        hybrid_score = config.alpha * semantic_score + (1 - config.alpha) * keyword_score
        
        # Normalized score (0-100)
        normalized = normalize_score(hybrid_score)
        
        results.append(RetrievalResult(
            id=sr['id'],
            document_id=sr['document_id'],
            chunk_index=sr['chunk_index'],
            content=sr['content'],
            filename=sr.get('filename'),
            metadata=sr.get('metadata'),
            raw_similarity=semantic_score,
            keyword_score=keyword_score,
            hybrid_score=hybrid_score,
            normalized_score=normalized,
        ))
    
    # Sort by hybrid score descending
    results.sort(key=lambda x: x.hybrid_score, reverse=True)
    
    # Return top_k
    return results[:config.top_k]


# =============================================================================
# Advanced Retrieval with MMR
# =============================================================================

async def retrieve_with_mmr(
    db: AsyncSession,
    query: str,
    config: RetrievalConfig,
) -> List[RetrievalResult]:
    """
    Retrieve documents with MMR for diversity.
    
    Args:
        db: Database session
        query: Search query
        config: Retrieval configuration
        
    Returns:
        List of diverse RetrievalResult
    """
    # Get query embedding
    query_embedding = embed_text(query)
    
    # Get more candidates than needed for MMR
    candidate_limit = config.top_k * 3
    
    # Build query to also fetch embeddings
    stmt = (
        select(Embedding)
        .order_by(Embedding.embedding.cosine_distance(query_embedding))
        .limit(candidate_limit)
    )
    
    if config.metadata_filter and 'document_id' in config.metadata_filter:
        stmt = stmt.where(Embedding.document_id == config.metadata_filter['document_id'])
    
    result = await db.execute(stmt)
    rows = list(result.scalars().all())
    
    if not rows:
        return []
    
    # Prepare candidates and embeddings
    candidates = []
    embeddings = []
    
    for row in rows:
        similarity = 1 - cosine_similarity(query_embedding, list(row.embedding))
        keyword_score = calculate_keyword_score_weighted(query, row.content, row.embedding_metadata)
        hybrid_score = config.alpha * similarity + (1 - config.alpha) * keyword_score
        
        candidates.append({
            'id': row.id,
            'document_id': row.document_id,
            'chunk_index': row.chunk_index,
            'content': row.content,
            'filename': row.filename,
            'metadata': row.embedding_metadata,
            'similarity': similarity,
            'keyword_score': keyword_score,
            'hybrid_score': hybrid_score,
        })
        embeddings.append(list(row.embedding))
    
    # Apply MMR
    mmr_results = await mmr_rerank(
        query_embedding=query_embedding,
        candidates=candidates,
        embeddings=embeddings,
        k=config.top_k,
        lambda_mult=config.lambda_mult,
    )
    
    # Convert to RetrievalResult
    results = []
    for r in mmr_results:
        results.append(RetrievalResult(
            id=r['id'],
            document_id=r['document_id'],
            chunk_index=r['chunk_index'],
            content=r['content'],
            filename=r.get('filename'),
            metadata=r.get('metadata'),
            raw_similarity=r['similarity'],
            keyword_score=r['keyword_score'],
            hybrid_score=r['hybrid_score'],
            normalized_score=normalize_score(r['hybrid_score']),
            mmr_score=r.get('mmr_score'),
        ))
    
    return results


# =============================================================================
# Main Retrieval Function
# =============================================================================

async def retrieve(
    db: AsyncSession,
    query: str,
    config: Optional[RetrievalConfig] = None,
) -> List[RetrievalResult]:
    """
    Main retrieval function with configurable strategies.
    
    Routes to appropriate retrieval method based on configuration:
    - use_mmr=True → retrieve_with_mmr
    - use_mmr=False → hybrid_search
    
    Args:
        db: Database session
        query: Search query
        config: Retrieval configuration (uses defaults if None)
        
    Returns:
        List of RetrievalResult with scores
    """
    if config is None:
        config = RetrievalConfig()
    
    # Log query intent for debugging
    intent = classify_query_intent(query)
    logger.info(f"Query intent: {intent.value} for query: {query[:50]}...")
    
    # Route to appropriate retrieval method
    if config.use_mmr:
        results = await retrieve_with_mmr(db, query, config)
    else:
        results = await hybrid_search(db, query, config)
    
    logger.info(f"Retrieved {len(results)} results")
    return results


# =============================================================================
# Re-ranking with LLM (Optional)
# =============================================================================

async def rerank_with_llm(
    query: str,
    results: List[RetrievalResult],
    top_k: int = 5,
) -> List[RetrievalResult]:
    """
    Re-rank results using LLM.
    
    Uses Azure OpenAI to score relevance of each result to the query.
    
    Args:
        query: Original query
        results: Initial retrieval results
        top_k: Number of results to return after re-ranking
        
    Returns:
        Re-ranked list of results
    """
    # Import here to avoid circular dependency
    from app.services.azure_chat_service import AzureChatService
    
    if not results:
        return []
    
    # Prepare prompt for re-ranking
    documents_text = "\n\n".join([
        f"[{i+1}] {r.content[:500]}"
        for i, r in enumerate(results[:20])  # Limit to 20 for LLM context
    ])
    
    prompt = f"""Given the query: "{query}"

Rank the following documents by relevance. Return only the document numbers in order of relevance, separated by commas.

Documents:
{documents_text}

Ranking (most relevant first):"""

    try:
        chat_service = AzureChatService()
        response = await chat_service.chat(
            messages=[{"role": "user", "content": prompt}],
            max_tokens=100,
        )
        
        # Parse ranking from response
        ranking_text = response.get('content', '')
        ranking_numbers = re.findall(r'\d+', ranking_text)
        
        # Reorder results based on ranking
        reranked = []
        seen = set()
        for num_str in ranking_numbers:
            idx = int(num_str) - 1
            if 0 <= idx < len(results) and idx not in seen:
                reranked.append(results[idx])
                seen.add(idx)
        
        # Add any remaining results not in ranking
        for i, r in enumerate(results):
            if i not in seen:
                reranked.append(r)
        
        return reranked[:top_k]
        
    except Exception as e:
        logger.warning(f"LLM re-ranking failed, returning original order: {e}")
        return results[:top_k]
