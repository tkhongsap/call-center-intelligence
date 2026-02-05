"""
RAG Service - Business Logic for RAG Operations

แยก business logic ออกจาก routes
รองรับภาษาไทย - ตรวจจับ encoding อัตโนมัติ
"""

from typing import List, Dict, Any, Tuple
from pathlib import Path
import logging

from app.services.embedding_service import embed_texts
from app.services.excel_parser import ExcelParser, check_corrupted_thai_text, count_thai_characters

logger = logging.getLogger(__name__)

ALLOWED_EXTENSIONS = {".xlsx", ".csv"}

# Thai encoding list for validation
THAI_ENCODINGS = [
    "utf-8", "utf-8-sig", "tis-620", "cp874", 
    "windows-874", "iso-8859-11"
]


def validate_file_extension(filename: str) -> str:
    """
    Validate file extension.
    
    Args:
        filename: Name of the file
        
    Returns:
        File extension (lowercase)
        
    Raises:
        ValueError: If extension not supported
    """
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(f"Only .xlsx and .csv files are supported. Got: {ext}")
    return ext


def validate_thai_file(file_bytes: bytes) -> Dict[str, Any]:
    """
    Validate file for Thai text corruption.
    
    ตรวจสอบไฟล์ว่ามีข้อความภาษาไทยเสียหายหรือไม่
    
    Args:
        file_bytes: Raw file content
        
    Returns:
        Dict with validation result:
        - is_valid: True if file is valid
        - corrupted: True if Thai text is corrupted
        - error_detail: Error details if corrupted
    """
    corruption_check = check_corrupted_thai_text(file_bytes)
    
    if corruption_check.get("corrupted"):
        return {
            "is_valid": False,
            "corrupted": True,
            "error_detail": {
                "error": "corrupted_thai_text",
                "message_th": corruption_check["message_th"],
                "message_en": corruption_check["message_en"],
                "patterns_found": corruption_check["patterns_found"],
                "total_question_marks": corruption_check["total_question_marks"],
                "suggestion": "Re-export the CSV file using UTF-8 encoding from the source system"
            }
        }
    
    return {"is_valid": True, "corrupted": False}


def validate_file_encoding(file_bytes: bytes, filename: str) -> Dict[str, Any]:
    """
    Validate file encoding and return detailed analysis.
    
    ตรวจสอบ encoding ของไฟล์และวิเคราะห์รายละเอียด
    
    Args:
        file_bytes: Raw file content
        filename: Name of the file
        
    Returns:
        Dict with encoding analysis
    """
    # Check for corruption
    corruption_check = check_corrupted_thai_text(file_bytes)
    
    # Try to detect encoding
    detected_encoding = "unknown"
    decode_success = False
    decode_error = None
    content = ""
    
    for encoding in THAI_ENCODINGS:
        try:
            content = file_bytes.decode(encoding)
            detected_encoding = encoding
            decode_success = True
            break
        except (UnicodeDecodeError, LookupError):
            continue
    
    if not decode_success:
        try:
            content = file_bytes.decode('utf-8', errors='replace')
            detected_encoding = "utf-8 (with replacements)"
            decode_success = True
        except Exception as e:
            decode_error = str(e)
    
    # Count Thai characters
    thai_char_count = count_thai_characters(content)
    
    # Get sample lines
    sample_lines = content.split('\n')[:5] if content else []
    
    # Determine recommendation
    if corruption_check.get("corrupted"):
        recommendation = {
            "th": "ไฟล์มีข้อความภาษาไทยเสียหาย กรุณา export ใหม่ด้วย UTF-8",
            "en": "File has corrupted Thai text. Re-export with UTF-8 encoding.",
            "action": "re-export"
        }
    elif thai_char_count > 0:
        recommendation = {
            "th": "ไฟล์พร้อมสำหรับการอัปโหลด",
            "en": "File is ready for upload.",
            "action": "upload"
        }
    elif thai_char_count == 0 and not corruption_check.get("corrupted"):
        recommendation = {
            "th": "ไม่พบภาษาไทยในไฟล์ (อาจจะถูกต้องหากไม่มีข้อมูลภาษาไทย)",
            "en": "No Thai characters found (this may be correct if file has no Thai data).",
            "action": "verify"
        }
    else:
        recommendation = {
            "th": "กรุณาตรวจสอบไฟล์",
            "en": "Please verify the file.",
            "action": "verify"
        }
    
    return {
        "filename": filename,
        "file_size_bytes": len(file_bytes),
        "encoding_detected": detected_encoding,
        "decode_success": decode_success,
        "decode_error": decode_error,
        "corrupted_thai": corruption_check.get("corrupted", False),
        "corruption_details": corruption_check if corruption_check.get("corrupted") else None,
        "thai_characters_found": thai_char_count,
        "has_thai_content": thai_char_count > 0,
        "sample_content": sample_lines,
        "recommendation": recommendation
    }


def embed_file_rows(file_bytes: bytes, filename: str) -> Dict[str, Any]:
    """
    Parse file and embed each row.
    
    Args:
        file_bytes: Raw file content
        filename: Name of the file
        
    Returns:
        Dictionary with embeddings and metadata
    """
    # Validate
    validate_file_extension(filename)
    
    # Parse Excel/CSV
    parser = ExcelParser()
    parsed_docs = parser.parse(file_bytes, filename)
    
    if not parsed_docs:
        return {
            "success": True,
            "filename": filename,
            "total_rows": 0,
            "embedding_dim": 0,
            "results": [],
        }
    
    # Get text content from each row
    texts = [doc.content for doc in parsed_docs]
    
    logger.info(f"Embedding {len(texts)} rows from {filename}")
    
    # Embed all texts
    embeddings = embed_texts(texts)
    
    # Build results with metadata
    results = []
    for i, (doc, emb) in enumerate(zip(parsed_docs, embeddings)):
        results.append({
            "row_index": i,
            "text": doc.content,
            "metadata": doc.metadata,
            "embedding": emb,
            "embedding_dim": len(emb),
        })
    
    return {
        "success": True,
        "filename": filename,
        "total_rows": len(results),
        "embedding_dim": len(embeddings[0]) if embeddings else 0,
        "results": results,
    }


def embed_file_with_thai_check(file_bytes: bytes, filename: str) -> Tuple[Dict[str, Any], int]:
    """
    Embed file rows with Thai character counting.
    
    Args:
        file_bytes: Raw file content
        filename: Name of the file
        
    Returns:
        Tuple of (result dict, thai_char_count)
    """
    result = embed_file_rows(file_bytes, filename)
    
    # Count Thai characters in the parsed content
    total_thai_chars = 0
    if result.get("results"):
        for r in result["results"]:
            total_thai_chars += count_thai_characters(r.get("text", ""))
    
    result["thai_characters_found"] = total_thai_chars
    result["has_thai_content"] = total_thai_chars > 0
    
    return result, total_thai_chars


def embed_text_list(texts: List[str]) -> Dict[str, Any]:
    """
    Embed a list of texts.
    
    Args:
        texts: List of texts to embed
        
    Returns:
        Dictionary with embeddings
        
    Raises:
        ValueError: If texts list is empty
    """
    if not texts:
        raise ValueError("texts list cannot be empty")
    
    logger.info(f"Embedding {len(texts)} texts")
    
    embeddings = embed_texts(texts)
    
    results = []
    for i, (text, emb) in enumerate(zip(texts, embeddings)):
        results.append({
            "index": i,
            "text": text,
            "embedding": emb,
            "embedding_dim": len(emb),
        })
    
    return {
        "success": True,
        "count": len(results),
        "embedding_dim": len(embeddings[0]) if embeddings else 0,
        "results": results,
    }
