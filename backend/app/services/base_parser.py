"""
Base Parser Module

Provides unified interface for all document parsers in the RAG data ingestion layer.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Dict, Any, Optional
from pathlib import Path
import uuid
import logging

logger = logging.getLogger(__name__)


@dataclass
class ParsedDocument:
    """
    Unified document format for RAG ingestion.
    
    All parsers must output documents in this format for consistent processing.
    """
    id: str
    content: str
    metadata: Dict[str, Any]
    source: str  # "excel", "pdf", "database", "csv"
    timestamp: datetime
    filename: Optional[str] = None
    
    @classmethod
    def create(
        cls,
        content: str,
        source: str,
        metadata: Optional[Dict[str, Any]] = None,
        filename: Optional[str] = None,
        doc_id: Optional[str] = None,
    ) -> "ParsedDocument":
        """Factory method to create a ParsedDocument with auto-generated fields."""
        return cls(
            id=doc_id or str(uuid.uuid4()),
            content=content,
            metadata=metadata or {},
            source=source,
            timestamp=datetime.utcnow(),
            filename=filename,
        )
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            "id": self.id,
            "content": self.content,
            "metadata": self.metadata,
            "source": self.source,
            "timestamp": self.timestamp.isoformat(),
            "filename": self.filename,
        }


class BaseParser(ABC):
    """
    Abstract base class for document parsers.
    
    All parsers must implement the parse and validate methods.
    """
    
    @property
    @abstractmethod
    def supported_extensions(self) -> List[str]:
        """Return list of supported file extensions (e.g., ['.xlsx', '.csv'])."""
        pass
    
    @abstractmethod
    def parse(self, file_bytes: bytes, filename: str) -> List[ParsedDocument]:
        """
        Parse file content into list of ParsedDocuments.
        
        Args:
            file_bytes: Raw file bytes
            filename: Original filename
            
        Returns:
            List of ParsedDocument objects
        """
        pass
    
    def validate(self, filename: str) -> bool:
        """
        Validate if file can be parsed by this parser.
        
        Args:
            filename: Filename to validate
            
        Returns:
            True if file extension is supported
        """
        ext = Path(filename).suffix.lower()
        return ext in self.supported_extensions
    
    def _log_parse_start(self, filename: str):
        """Log parsing start."""
        logger.info("Starting document parsing", filename=filename, parser=self.__class__.__name__)
    
    def _log_parse_complete(self, filename: str, doc_count: int):
        """Log parsing completion."""
        logger.info("Document parsing complete", filename=filename, doc_count=doc_count)
    
    def _log_parse_error(self, filename: str, error: str):
        """Log parsing error."""
        logger.error("Document parsing failed", filename=filename, error=error)
