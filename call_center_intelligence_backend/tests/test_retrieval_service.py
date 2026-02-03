"""
Tests for Retrieval Service - RAG-5 Retrieval Layer

Tests cover:
- Top-K similarity search
- Metadata pre-filtering
- MMR diversity
- Hybrid search alpha blending
- Score normalization
- Query intent classification
- LLM re-ranking (mocked)
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from typing import List

from app.services.retrieval_service import (
    classify_query_intent,
    calculate_keyword_score,
    calculate_keyword_score_weighted,
    normalize_score,
    cosine_similarity,
    mmr_rerank,
    hybrid_search,
    retrieve_with_mmr,
    retrieve,
    rerank_with_llm,
    QueryIntent,
    RetrievalConfig,
    RetrievalResult,
)


class TestQueryIntentClassification:
    """Test query intent classification."""
    
    def test_fact_intent_default(self):
        """Default intent should be FACT."""
        assert classify_query_intent("what is the error code?") == QueryIntent.FACT
        assert classify_query_intent("ปัญหาโอนเงิน") == QueryIntent.FACT
    
    def test_comparison_intent_english(self):
        """Comparison keywords should return COMPARISON."""
        assert classify_query_intent("compare service A vs B") == QueryIntent.COMPARISON
        assert classify_query_intent("what's the difference between X and Y") == QueryIntent.COMPARISON
    
    def test_comparison_intent_thai(self):
        """Thai comparison keywords should return COMPARISON."""
        assert classify_query_intent("เปรียบเทียบบริการ") == QueryIntent.COMPARISON
        assert classify_query_intent("แตกต่างกันอย่างไร") == QueryIntent.COMPARISON
    
    def test_list_intent(self):
        """List keywords should return LIST."""
        assert classify_query_intent("list all errors") == QueryIntent.LIST
        assert classify_query_intent("ทั้งหมดมีอะไรบ้าง") == QueryIntent.LIST
    
    def test_summary_intent(self):
        """Summary keywords should return SUMMARY."""
        assert classify_query_intent("summarize the issue") == QueryIntent.SUMMARY
        assert classify_query_intent("สรุปปัญหา") == QueryIntent.SUMMARY


class TestKeywordScoring:
    """Test keyword scoring functions."""
    
    def test_basic_keyword_score(self):
        """Test basic keyword matching."""
        query = "transfer money error"
        content = "Customer reported error when trying to transfer money"
        score = calculate_keyword_score(query, content)
        assert 0.5 <= score <= 1.0  # Should match most keywords
    
    def test_no_match_keyword_score(self):
        """Test when no keywords match."""
        query = "xyz abc"
        content = "Customer reported payment issue"
        score = calculate_keyword_score(query, content)
        assert score == 0.0
    
    def test_partial_match_keyword_score(self):
        """Test partial keyword matching."""
        query = "transfer error payment"
        content = "Error during transfer operation"
        score = calculate_keyword_score(query, content)
        assert 0.3 <= score <= 0.7  # Should match some keywords
    
    def test_weighted_keyword_score_with_category_boost(self):
        """Test weighted scoring with category metadata."""
        query = "payment"
        content = "Customer issue"
        metadata = {"category": "payment issues"}
        score = calculate_keyword_score_weighted(query, content, metadata)
        assert score >= 0.2  # Category boost
    
    def test_weighted_keyword_score_no_metadata(self):
        """Test weighted scoring without metadata."""
        query = "error"
        content = "error occurred"
        score = calculate_keyword_score_weighted(query, content, None)
        assert score > 0


class TestScoreNormalization:
    """Test score normalization to 0-100 range."""
    
    def test_normalize_full_range(self):
        """Test normalizing values in full range."""
        assert normalize_score(0.0) == 0.0
        assert normalize_score(1.0) == 100.0
        assert normalize_score(0.5) == 50.0
    
    def test_normalize_custom_range(self):
        """Test normalizing with custom min/max."""
        assert normalize_score(50, min_val=0, max_val=100) == 50.0
        assert normalize_score(0.8, min_val=0.5, max_val=1.0) == 60.0
    
    def test_normalize_clamps_values(self):
        """Test that values are clamped to 0-100."""
        assert normalize_score(-0.5) == 0.0
        assert normalize_score(1.5) == 100.0
    
    def test_normalize_equal_range(self):
        """Test normalization when min equals max."""
        assert normalize_score(0.5, min_val=0.5, max_val=0.5) == 50.0


class TestCosineSimilarity:
    """Test cosine similarity calculation."""
    
    def test_identical_vectors(self):
        """Identical vectors should have similarity 1."""
        vec = [1.0, 2.0, 3.0]
        assert abs(cosine_similarity(vec, vec) - 1.0) < 0.001
    
    def test_orthogonal_vectors(self):
        """Orthogonal vectors should have similarity 0."""
        vec1 = [1.0, 0.0, 0.0]
        vec2 = [0.0, 1.0, 0.0]
        assert abs(cosine_similarity(vec1, vec2)) < 0.001
    
    def test_opposite_vectors(self):
        """Opposite vectors should have similarity -1."""
        vec1 = [1.0, 0.0]
        vec2 = [-1.0, 0.0]
        assert abs(cosine_similarity(vec1, vec2) + 1.0) < 0.001
    
    def test_different_length_vectors(self):
        """Different length vectors should return 0."""
        vec1 = [1.0, 2.0]
        vec2 = [1.0, 2.0, 3.0]
        assert cosine_similarity(vec1, vec2) == 0.0


class TestMMRRerank:
    """Test MMR re-ranking."""
    
    @pytest.mark.asyncio
    async def test_mmr_basic(self):
        """Test basic MMR re-ranking."""
        query_emb = [1.0, 0.0, 0.0]
        candidates = [
            {"id": 1, "content": "doc1"},
            {"id": 2, "content": "doc2"},
            {"id": 3, "content": "doc3"},
        ]
        embeddings = [
            [0.9, 0.1, 0.0],  # Very similar to query
            [0.8, 0.2, 0.0],  # Similar to query and doc1
            [0.1, 0.9, 0.0],  # Different from query and others
        ]
        
        results = await mmr_rerank(query_emb, candidates, embeddings, k=2, lambda_mult=0.5)
        
        assert len(results) == 2
        # First result should be most relevant to query
        assert results[0]["id"] == 1
    
    @pytest.mark.asyncio
    async def test_mmr_diversity(self):
        """Test that MMR promotes diversity."""
        query_emb = [1.0, 0.0]
        # Two very similar docs and one different
        candidates = [
            {"id": 1, "content": "doc1"},
            {"id": 2, "content": "doc2"},
            {"id": 3, "content": "doc3"},
        ]
        embeddings = [
            [0.95, 0.05],  # Very similar to query
            [0.94, 0.06],  # Almost identical to doc1
            [0.5, 0.5],    # Different but still relevant
        ]
        
        # With high diversity (low lambda), should pick doc1, then doc3 (for diversity)
        results = await mmr_rerank(query_emb, candidates, embeddings, k=2, lambda_mult=0.3)
        
        assert len(results) == 2
        # Second selection should favor diversity
        ids = [r["id"] for r in results]
        assert 1 in ids  # Most relevant
        assert 3 in ids  # Most diverse
    
    @pytest.mark.asyncio
    async def test_mmr_empty_candidates(self):
        """Test MMR with empty candidates."""
        results = await mmr_rerank([1.0], [], [], k=5)
        assert results == []


class TestHybridSearch:
    """Test hybrid search functionality."""
    
    @pytest.mark.asyncio
    async def test_hybrid_search_mocked(self):
        """Test hybrid search with mocked similarity_search."""
        mock_db = AsyncMock()
        
        # Mock similarity_search to return sample results
        with patch('app.services.retrieval_service.similarity_search') as mock_sim:
            mock_sim.return_value = [
                {
                    "id": 1,
                    "document_id": "doc1",
                    "chunk_index": 0,
                    "content": "Customer transfer error occurred",
                    "filename": "test.csv",
                    "similarity": 0.85,
                    "metadata": {"category": "transfer"},
                }
            ]
            
            config = RetrievalConfig(top_k=5, alpha=0.7)
            results = await hybrid_search(mock_db, "transfer error", config)
            
            assert len(results) == 1
            assert results[0].raw_similarity == 0.85
            assert results[0].keyword_score > 0
            assert 0 <= results[0].normalized_score <= 100
    
    @pytest.mark.asyncio
    async def test_hybrid_alpha_pure_semantic(self):
        """Test alpha=1.0 gives pure semantic scoring."""
        mock_db = AsyncMock()
        
        with patch('app.services.retrieval_service.similarity_search') as mock_sim:
            mock_sim.return_value = [
                {
                    "id": 1,
                    "document_id": "doc1",
                    "chunk_index": 0,
                    "content": "unrelated content xyz",
                    "filename": None,
                    "similarity": 0.9,
                    "metadata": None,
                }
            ]
            
            config = RetrievalConfig(top_k=5, alpha=1.0)  # Pure semantic
            results = await hybrid_search(mock_db, "abc query", config)
            
            assert len(results) == 1
            # With alpha=1.0, hybrid_score should equal semantic score
            assert abs(results[0].hybrid_score - 0.9) < 0.01


class TestRetrieve:
    """Test main retrieve function."""
    
    @pytest.mark.asyncio
    async def test_retrieve_routes_to_hybrid(self):
        """Test that retrieve routes to hybrid_search when use_mmr=False."""
        mock_db = AsyncMock()
        
        with patch('app.services.retrieval_service.hybrid_search') as mock_hybrid:
            mock_hybrid.return_value = []
            
            config = RetrievalConfig(use_mmr=False)
            await retrieve(mock_db, "test query", config)
            
            mock_hybrid.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_retrieve_routes_to_mmr(self):
        """Test that retrieve routes to retrieve_with_mmr when use_mmr=True."""
        mock_db = AsyncMock()
        
        with patch('app.services.retrieval_service.retrieve_with_mmr') as mock_mmr:
            mock_mmr.return_value = []
            
            config = RetrievalConfig(use_mmr=True)
            await retrieve(mock_db, "test query", config)
            
            mock_mmr.assert_called_once()


class TestLLMReranking:
    """Test LLM-based re-ranking."""
    
    @pytest.mark.asyncio
    async def test_rerank_with_llm_mocked(self):
        """Test LLM re-ranking with mocked service."""
        results = [
            RetrievalResult(
                id=1, document_id="d1", chunk_index=0, content="doc1 content",
                filename=None, metadata=None, raw_similarity=0.8,
                keyword_score=0.5, hybrid_score=0.7, normalized_score=70
            ),
            RetrievalResult(
                id=2, document_id="d2", chunk_index=0, content="doc2 content",
                filename=None, metadata=None, raw_similarity=0.7,
                keyword_score=0.6, hybrid_score=0.65, normalized_score=65
            ),
        ]
        
        with patch('app.services.azure_chat_service.AzureChatService') as mock_service_class:
            mock_service = AsyncMock()
            mock_service_class.return_value = mock_service
            mock_service.chat.return_value = {"content": "2, 1"}  # Reorder
            
            reranked = await rerank_with_llm("test query", results, top_k=2)
            
            assert len(reranked) == 2
            # Order should be reversed based on LLM response
            assert reranked[0].id == 2
            assert reranked[1].id == 1
    
    @pytest.mark.asyncio
    async def test_rerank_with_llm_error_fallback(self):
        """Test that LLM errors fall back to original order."""
        results = [
            RetrievalResult(
                id=1, document_id="d1", chunk_index=0, content="doc1",
                filename=None, metadata=None, raw_similarity=0.8,
                keyword_score=0.5, hybrid_score=0.7, normalized_score=70
            ),
        ]
        
        with patch('app.services.azure_chat_service.AzureChatService') as mock_service_class:
            mock_service_class.side_effect = Exception("API error")
            
            reranked = await rerank_with_llm("test query", results, top_k=1)
            
            # Should return original order on error
            assert len(reranked) == 1
            assert reranked[0].id == 1
