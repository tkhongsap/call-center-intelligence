#!/usr/bin/env python3
"""
Thai CSV Upload Script

This script handles uploading CSV files with Thai language content to the database.
It properly handles encoding and ensures Thai text is preserved.

IMPORTANT: The source CSV file MUST be saved with proper encoding (UTF-8 or TIS-620/CP874).
If the file already contains question marks (?) instead of Thai characters,
the file was corrupted during export and needs to be re-exported from the source system.

How to export CSV with Thai properly:
1. From Excel: Save As -> "CSV UTF-8 (Comma delimited) (*.csv)"
2. From database exports: Ensure UTF-8 encoding is selected
3. From ticketing systems: Use UTF-8 export option if available

Usage:
    python scripts/upload_thai_csv.py <csv_file_path>
    
Example:
    python scripts/upload_thai_csv.py data/report_thai.csv
"""

import sys
import os
import csv
import io
import asyncio
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any, Optional
import uuid
import logging

# Add the app directory to Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Try to import chardet for encoding detection
try:
    import chardet
    CHARDET_AVAILABLE = True
except ImportError:
    CHARDET_AVAILABLE = False
    logger.warning("chardet not available. Install with: pip install chardet")


def detect_encoding(file_bytes: bytes) -> str:
    """
    Detect the encoding of a file with special handling for Thai text.
    
    Thai encodings priority:
    1. UTF-8 / UTF-8 with BOM
    2. TIS-620 (Thai Industrial Standard)
    3. Windows-874 / CP874 (Windows Thai)
    4. ISO-8859-11 (Latin/Thai)
    
    Returns the detected encoding string.
    """
    if CHARDET_AVAILABLE:
        detection = chardet.detect(file_bytes)
        detected = detection.get('encoding', 'utf-8')
        confidence = detection.get('confidence', 0)
        
        logger.info(f"Chardet detected: {detected} (confidence: {confidence:.2f})")
        
        # Check for non-ASCII bytes (Thai characters are > 127)
        has_non_ascii = any(b > 127 for b in file_bytes[:1000])
        is_ascii = detected and detected.lower() in ['ascii', 'us-ascii']
        
        # If ASCII detected but has non-ASCII bytes, try Thai encodings
        if is_ascii and has_non_ascii:
            logger.warning("ASCII detected but file contains non-ASCII bytes")
            detected = None
        elif confidence > 0.7 and detected:
            return detected
    
    # Manual encoding detection for Thai
    # Check for UTF-8 BOM
    if file_bytes[:3] == b'\xef\xbb\xbf':
        return 'utf-8-sig'
    
    # Try each encoding and validate Thai characters
    thai_encodings = [
        ('utf-8', 'UTF-8'),
        ('tis-620', 'TIS-620 (Thai)'),
        ('cp874', 'Windows-874 (Thai)'),
        ('windows-874', 'Windows-874'),
        ('iso-8859-11', 'ISO-8859-11 (Thai)'),
    ]
    
    for encoding, name in thai_encodings:
        try:
            decoded = file_bytes.decode(encoding)
            # Check if decoded text contains valid Thai characters (Unicode range)
            thai_chars = [c for c in decoded if '\u0E00' <= c <= '\u0E7F']
            if thai_chars:
                logger.info(f"Successfully decoded with {name}, found {len(thai_chars)} Thai characters")
                return encoding
        except (UnicodeDecodeError, LookupError):
            continue
    
    # Default fallback
    return 'utf-8'


def check_for_question_marks(file_bytes: bytes) -> bool:
    """
    Check if the file contains sequences of question marks that indicate corrupted Thai text.
    
    Corrupted Thai text pattern: Multiple consecutive question marks (3+)
    where Thai characters should be.
    """
    try:
        content = file_bytes.decode('ascii', errors='ignore')
        # Pattern: 3 or more consecutive question marks
        import re
        corrupted_patterns = re.findall(r'\?{3,}', content)
        
        if corrupted_patterns:
            total_question_marks = sum(len(p) for p in corrupted_patterns)
            logger.warning(f"Found {len(corrupted_patterns)} corrupted text patterns with {total_question_marks} question marks")
            return True
        return False
    except Exception:
        return False


def read_csv_with_thai(file_path: str) -> tuple[List[Dict[str, Any]], List[str], str]:
    """
    Read a CSV file with proper Thai encoding handling.
    
    Returns:
        tuple: (rows as list of dicts, headers list, detected encoding)
    """
    with open(file_path, 'rb') as f:
        file_bytes = f.read()
    
    # Check for corrupted Thai text (question marks)
    if check_for_question_marks(file_bytes):
        logger.error("""
╔═══════════════════════════════════════════════════════════════════════════════╗
║  WARNING: CORRUPTED THAI TEXT DETECTED!                                       ║
║                                                                               ║
║  The CSV file contains question marks (?) instead of Thai characters.         ║
║  This means the file was corrupted during export.                             ║
║                                                                               ║
║  To fix this:                                                                 ║
║  1. Go back to the source system (ticketing system, database, etc.)           ║
║  2. Re-export the data with proper UTF-8 encoding                             ║
║                                                                               ║
║  For Excel exports:                                                           ║
║  - Save As -> "CSV UTF-8 (Comma delimited) (*.csv)"                          ║
║                                                                               ║
║  The file cannot be recovered once Thai characters are replaced with ?        ║
╚═══════════════════════════════════════════════════════════════════════════════╝
        """)
        raise ValueError("CSV file contains corrupted Thai text. Please re-export with proper encoding.")
    
    # Detect encoding
    encoding = detect_encoding(file_bytes)
    logger.info(f"Using encoding: {encoding}")
    
    # Decode content
    try:
        content = file_bytes.decode(encoding)
    except UnicodeDecodeError:
        # Fallback with error replacement
        content = file_bytes.decode('utf-8', errors='replace')
        logger.warning("Using UTF-8 with error replacement")
    
    # Parse CSV
    reader = csv.DictReader(io.StringIO(content))
    headers = reader.fieldnames or []
    rows = list(reader)
    
    # Clean up empty columns from headers
    headers = [h for h in headers if h and h.strip()]
    
    # Verify Thai content
    sample_text = str(rows[0]) if rows else ""
    thai_chars = [c for c in sample_text if '\u0E00' <= c <= '\u0E7F']
    
    if thai_chars:
        logger.info(f"✓ Thai characters detected in data: {len(thai_chars)} characters found")
    else:
        logger.warning("⚠ No Thai characters found in data - check encoding")
    
    return rows, headers, encoding


async def save_to_database(rows: List[Dict[str, Any]], file_name: str, db_config: Optional[Dict] = None):
    """
    Save parsed CSV rows to the database.
    
    This requires the database to be properly configured with UTF-8 encoding.
    PostgreSQL supports Thai natively with UTF-8.
    """
    # Import database modules
    from app.core.database import init_db, get_db
    from app.models.case import Case
    from app.models.upload import Upload
    from app.models.base import UploadStatus, Channel, CaseStatus, Sentiment, Severity
    from sqlalchemy import select
    
    # Initialize database
    await init_db()
    
    async for db in get_db():
        try:
            # Create upload record
            upload_id = str(uuid.uuid4())
            upload = Upload(
                id=upload_id,
                file_name=file_name,
                file_size=0,  # Will be updated
                status=UploadStatus.processing,
                total_rows=len(rows),
                success_count=0,
                error_count=0,
                errors=[],
                uploaded_by="system",
            )
            db.add(upload)
            
            success_count = 0
            error_count = 0
            errors = []
            
            for idx, row in enumerate(rows):
                try:
                    # Map CSV columns to Case model
                    # Adjust column names based on your actual CSV structure
                    case = Case(
                        id=str(uuid.uuid4()),
                        ticket_number=row.get('Ticket number', ''),
                        subject=row.get('Name', ''),
                        description=row.get('????????????????????????', ''),  # Thai column
                        channel=Channel.phone,  # Default
                        status=CaseStatus.closed if row.get('Status', '').lower() == 'closed' else CaseStatus.open,
                        sentiment=Sentiment.positive,  # For compliments
                        severity=Severity.low if row.get('Priority', '').lower() == 'low' else Severity.medium,
                        branch_code=row.get('Ticket data: branch', ''),
                        brand=row.get('??????????????????', ''),  # Thai brand column
                        province=row.get('???????', ''),  # Thai province column
                        created_at=datetime.now().isoformat(),
                        metadata=row,  # Store full row as metadata
                    )
                    db.add(case)
                    success_count += 1
                    
                except Exception as e:
                    error_count += 1
                    errors.append({
                        "row": idx + 1,
                        "error": str(e),
                        "data": str(row)[:200]
                    })
                    logger.warning(f"Error processing row {idx + 1}: {e}")
            
            # Update upload record
            upload.success_count = success_count
            upload.error_count = error_count
            upload.errors = errors
            upload.status = UploadStatus.completed if error_count == 0 else UploadStatus.partial
            
            await db.commit()
            
            logger.info(f"""
Upload completed:
- File: {file_name}
- Total rows: {len(rows)}
- Success: {success_count}
- Errors: {error_count}
- Upload ID: {upload_id}
            """)
            
            return upload_id
            
        except Exception as e:
            await db.rollback()
            logger.error(f"Database error: {e}")
            raise


def main():
    """Main entry point."""
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    
    file_path = sys.argv[1]
    
    if not os.path.exists(file_path):
        print(f"Error: File not found: {file_path}")
        sys.exit(1)
    
    print(f"\n{'='*60}")
    print(f"Thai CSV Upload Tool")
    print(f"{'='*60}\n")
    
    try:
        # Read and parse CSV
        rows, headers, encoding = read_csv_with_thai(file_path)
        
        print(f"\nFile: {file_path}")
        print(f"Encoding detected: {encoding}")
        print(f"Headers: {headers[:5]}...")  # Show first 5 headers
        print(f"Total rows: {len(rows)}")
        
        # Show sample data with Thai
        if rows:
            print(f"\nSample row (first row):")
            for key, value in list(rows[0].items())[:5]:
                if value:
                    print(f"  {key}: {value}")
        
        # Ask to proceed with database save
        response = input("\nSave to database? (y/n): ")
        if response.lower() == 'y':
            asyncio.run(save_to_database(rows, os.path.basename(file_path)))
        else:
            print("Skipped database save.")
            
    except ValueError as e:
        print(f"\nError: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\nUnexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
