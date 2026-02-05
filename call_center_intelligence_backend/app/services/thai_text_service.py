"""
Thai Text Analysis Service

Provides Thai word tokenization and frequency analysis using pythainlp.
Used to analyze incident details and rank most frequently used words.
"""

import re
import logging
from typing import List, Dict, Tuple, Optional
from collections import Counter

logger = logging.getLogger(__name__)

try:
    from pythainlp.tokenize import word_tokenize
    from pythainlp.corpus import thai_stopwords
    from pythainlp.util import find_keyword
    PYTHAINLP_AVAILABLE = True
except ImportError:
    PYTHAINLP_AVAILABLE = False
    logger.warning("pythainlp not installed. Thai text analysis will not be available.")


# Extended Thai stopwords (common words that don't add meaning for business analysis)
EXTENDED_STOPWORDS = {
    # ===== Common Thai Stopwords =====
    "ครับ", "ค่ะ", "คะ", "และ", "ที่", "ได้", "ให้", "ของ", "ใน", "จะ",
    "เป็น", "มี", "ไม่", "ว่า", "กับ", "แล้ว", "จาก", "โดย", "ก็", "แต่",
    "นี้", "ซึ่ง", "ถ้า", "เมื่อ", "อยู่", "หรือ", "เพื่อ", "แม้", "ดัง",
    "อาจ", "ถึง", "ต้อง", "คือ", "เพราะ", "ทั้ง", "นั้น", "ไป", "มา", "อีก",
    "ยัง", "ทำ", "บ้าง", "ด้วย", "เลย", "แค่", "เอง", "กัน", "ขึ้น", "ลง",
    "แบบ", "เรา", "คน", "อัน", "ตัว", "เข้า", "ออก", "เอา", "ใช้", "มาก",
    "น้อย", "ดี", "สุด", "เพียง", "เท่า", "อื่น", "ไหน", "ใด", "บาง", "ทุก",
    "ไว้", "ตาม", "ตอน", "ผ่าน", "ต่อ", "หลัง", "ก่อน", "ระหว่าง", "ภายใน",
    "ภายนอก", "ข้าง", "บน", "ล่าง", "หน้า", "เมื่อไหร่", "อย่าง", "แห่ง",
    "นะ", "นะคะ", "นะครับ", "หา", "เข้ามา", "ออกมา", "ขอ", "ใหม่",
    
    # ===== Titles / Formal Terms =====
    "นาย", "นาง", "นางสาว", "คุณ", "ท่าน", "ผู้", "ราย",
    
    # ===== Numbers =====
    "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า", "สิบ",
    "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน", "ที่1", "ที่2", "ที่3",
    
    # ===== Symbols/Characters =====
    "ๆ", "ฯ", ".", "-", "/", ":", ";", "=", "*", "**", "_x0009_",
    
    # ===== Location Words =====
    # Location abbreviations
    "จ.", "อ.", "ต.", "ม.", "ซ.", "ถ.", "แขวง", "เขต", "จังหวัด", "อำเภอ", "ตำบล",
    "กทม", "กทม.", "ถนน", "ซอย", "เลขที่", "หมู่", "พื้นที่",
    # City/District names (generic - not product related)
    "เมือง", "มหานคร",
    
    # ===== Contact/Template Field Labels =====
    "ติดต่อ", "หมายเลข", "ชื่อ", "รายละเอียด", "ข้อมูล", "เบอร์", "โทร", "โทรศัพท์",
    "ที่อยู่", "อีเมล", "email", "tel", "fax", "แฟกซ์",
    "ชื่อผู้ติดต่อ", "หมายเลขติดต่อ", "ติดต่อจากพื้นที่", "ติดต่อจากร้าน",
    "หมายเลขติดต่อกลับ", "ชื่อร้านค้า", "ชื่อร้าน", "ประเภทร้าน", "รหัสร้านค้า",
    "QRCode", "QRCod", "QR", "Code", "VSMS", "ระบบ", "ติดต่อกลับ",
    
    # ===== Call Center Process/Actions =====
    "แจ้ง", "เบื้องต้น", "รหัส", "เลข", "ลำดับ", "วันที่", "เวลา", "ประมาณ",
    "ดำเนินการ", "ตรวจสอบ", "ประสานงาน", "ติดตาม", "รับเรื่อง", "ปิดเรื่อง",
    "บันทึก", "รายงาน", "เอกสาร", "แนบ", "ส่ง", "รับ", "โอน", "สอบถาม",
    "แนะนำ", "รับทราบ", "ทราบ", "ต้องการ", "ประสาน", "พบ", "ไม่พบ", "แทน",
    "center", "Center", "call", "Call", "Issue", "System", "Not",
    
    # ===== Company Internal Terms =====
    "หัวหน้าภาค", "หัวหน้า", "สาขา", "ภาค", "โรงงาน",
    "ทำการ", "เวลาทำการ","การค้า", "ผู้จัดการการค้า",
    
    # ===== Status/State Words =====
    "เสร็จ", "เรียบร้อย", "สำเร็จ", "เปิด", "ปิด", "รอ", "กำลัง", "อยู่ระหว่าง",
    "ขอด่วน", "ด่วน", "รบกวน",
    
    # ===== Filler/Polite Words =====
    "กรุณา", "โปรด", "ขอ", "ขอบคุณ", "ยินดี", "สวัสดี", "สวัสดีครับ", "สวัสดีค่ะ",
    
    # ===== Time (วัน/เดือน/เวลา) =====
    "วัน", "เดือน", "ปี", "ชั่วโมง", "นาที", "วินาที", "สัปดาห์", "น.",
    "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
    "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
    
    # ===== Generic References =====
    "ดังกล่าว", "ดังนี้", "ตามที่", "เนื่องจาก", "เพราะว่า", "เกี่ยวกับ",
    "เรื่อง", "กรณี", "ประเด็น", "หัวข้อ", "รายการ", "ปัจจุบัน", "ที่อยู่ปัจจุบัน", 
    "โดยตรง",
    
    # ===== Units =====
    "บาท", "สตางค์", "ชิ้น", "อัน", "ตัว", "กล่อง", "ลัง", "แพ็ค", "โหล",
    "กิโล", "กรัม", "ลิตร", "มิลลิลิตร", "เมตร", "เซนติเมตร",
    "ขวด", "ประตู", "ชั้น", "ใบ",
    
    # ===== Shop Type (generic) =====
    "บริโภค", "ร้านอาหาร", "ปลีก", "ส่ง",
    
    # ===== Common names appearing in templates (staff names) =====
    # These appear frequently because they're in contact info templates
    "เจริญ", "พิพัฒน์", "สิน", "วัฒน์", "วัฒนา", "กิตติ", "กิตติวัฒน์",
    "ประวิทย์", "กล่อม", "เกลา", "พงษ์", "พัฒน์", "ศรี", "สุข",
    "ทรัพย์", "ทอง", "แก้ว", "ดาว", "วรรณ", "นันท์",
    # More name parts
    "ชัย", "โชค", "พร", "ภัทร", "มาน", "นิ", "ลัด", "มะ", "วุฒิ",
    "ยุทธ", "นา", "รมล", "มล", "ภพ", "ยง", "ชล", "รี",
    
    # ===== Agent/Line related =====
    "Agent", "Sub", "agent", "Line", "Camp",
    
    # ===== Company names (not product related) =====
    "บริษัท", "จำกัด", "มหาชน", "เบียร์ทิพย์", "บริวเวอรี่",
    "เสริมสุข", "Sermsuk",
    
    # ===== Polite endings / Filler verbs =====
    "ขอรับ", "ขอรับครับ", "ขอรับค่ะ",
    
    # ===== Generic verbs (not business-specific) =====
    "ติด", "หมุน", "เบา", "หัก", "เปลี่ยน", "สั่ง",
}



class ThaiTextService:
    """
    Service for analyzing Thai text from incident details.
    
    Features:
    - Thai word tokenization using pythainlp
    - Stopwords filtering (built-in + custom)
    - Word frequency counting
    - Top N word ranking
    """
    
    def __init__(self, use_extended_stopwords: bool = True):
        """
        Initialize ThaiTextService.
        
        Args:
            use_extended_stopwords: Include extended custom stopwords
        """
        if not PYTHAINLP_AVAILABLE:
            raise ImportError("pythainlp is required. Install with: pip install pythainlp")
        
        # Combine pythainlp stopwords with extended stopwords
        self.stopwords = set(thai_stopwords())
        if use_extended_stopwords:
            self.stopwords.update(EXTENDED_STOPWORDS)
        
        logger.info(f"Initialized ThaiTextService with {len(self.stopwords)} stopwords")
    
    def tokenize(self, text: str) -> List[str]:
        """
        Tokenize Thai text into words.
        
        Args:
            text: Thai text to tokenize
            
        Returns:
            List of tokenized words
        """
        if not text or not isinstance(text, str):
            return []
        
        # Use newmm engine (default, good for general Thai text)
        tokens = word_tokenize(text, engine="newmm")
        
        return tokens
    
    def clean_tokens(self, tokens: List[str]) -> List[str]:
        """
        Clean tokenized words by removing unwanted tokens.
        
        Removes:
        - Stopwords
        - Numbers and special characters
        - Whitespace and empty strings
        - Single character tokens
        - Tokens with only English characters (optional)
        
        Args:
            tokens: List of tokenized words
            
        Returns:
            List of cleaned tokens
        """
        cleaned = []
        
        for token in tokens:
            # Skip empty or whitespace-only tokens
            token = token.strip()
            if not token:
                continue
            
            # Skip stopwords
            if token.lower() in self.stopwords or token in self.stopwords:
                continue
            
            # Skip single characters
            if len(token) <= 1:
                continue
            
            # Skip numbers only
            if token.isdigit():
                continue
            
            # Skip tokens with only special characters or punctuation
            if re.match(r'^[\s\d\W_]+$', token):
                continue
            
            # Check if token contains at least one Thai character
            has_thai = any('\u0E00' <= char <= '\u0E7F' for char in token)
            if not has_thai:
                continue
            
            cleaned.append(token)
        
        return cleaned
    
    def analyze_text(self, text: str) -> Dict:
        """
        Analyze a single text and return word frequency.
        
        Args:
            text: Thai text to analyze
            
        Returns:
            Dict with word counts
        """
        tokens = self.tokenize(text)
        cleaned_tokens = self.clean_tokens(tokens)
        return Counter(cleaned_tokens)
    
    def analyze_texts(self, texts: List[str]) -> Tuple[Counter, int, int]:
        """
        Analyze multiple texts and return combined word frequency.
        
        Args:
            texts: List of Thai texts to analyze
            
        Returns:
            Tuple of (word_counter, total_words, unique_words)
        """
        combined_counter = Counter()
        total_tokens = 0
        
        for text in texts:
            if text:
                tokens = self.tokenize(text)
                cleaned_tokens = self.clean_tokens(tokens)
                total_tokens += len(cleaned_tokens)
                combined_counter.update(cleaned_tokens)
        
        return combined_counter, total_tokens, len(combined_counter)
    
    def get_top_words(
        self, 
        texts: List[str], 
        top_n: int = 20
    ) -> Dict:
        """
        Get top N most frequent words from a list of texts.
        
        Args:
            texts: List of Thai texts to analyze
            top_n: Number of top words to return
            
        Returns:
            Dict containing:
            - total_words: Total number of words analyzed
            - unique_words: Number of unique words
            - top_words: List of dicts with rank, word, count, percentage
        """
        word_counter, total_words, unique_words = self.analyze_texts(texts)
        
        # Get top N words
        top_words = []
        for rank, (word, count) in enumerate(word_counter.most_common(top_n), start=1):
            percentage = (count / total_words * 100) if total_words > 0 else 0
            top_words.append({
                "rank": rank,
                "word": word,
                "count": count,
                "percentage": round(percentage, 2)
            })
        
        return {
            "total_words": total_words,
            "unique_words": unique_words,
            "top_words": top_words
        }
    
    def find_keywords(
        self,
        texts: List[str],
        top_n: int = 20
    ) -> Dict:
        """
        Extract keywords from texts using pythainlp's find_keyword.
        
        This method finds repeated/important keywords in the text
        using pythainlp's algorithm instead of simple frequency counting.
        
        Args:
            texts: List of Thai texts to analyze
            top_n: Number of top keywords to return
            
        Returns:
            Dict containing:
            - total_keywords: Total unique keywords found
            - keywords: List of keyword items with rank, word, count
        """
        # Combine all texts
        combined_text = " ".join([t for t in texts if t])
        
        if not combined_text:
            return {
                "total_keywords": 0,
                "keywords": []
            }
        
        # Use find_keyword to extract keywords
        keyword_dict = find_keyword(combined_text)
        
        # Filter out stopwords from keywords
        filtered_keywords = {
            word: count for word, count in keyword_dict.items()
            if word not in self.stopwords 
            and len(word) > 1
            and any('\u0E00' <= char <= '\u0E7F' for char in word)
        }
        
        # Sort by count and get top N
        sorted_keywords = sorted(
            filtered_keywords.items(), 
            key=lambda x: x[1], 
            reverse=True
        )[:top_n]
        
        # Format result
        keywords = []
        for rank, (word, count) in enumerate(sorted_keywords, start=1):
            keywords.append({
                "rank": rank,
                "word": word,
                "count": count
            })
        
        return {
            "total_keywords": len(filtered_keywords),
            "keywords": keywords
        }


# Singleton instance for convenience
thai_text_service: Optional[ThaiTextService] = None


def get_thai_text_service(force_reload: bool = False) -> ThaiTextService:
    """Get or create singleton ThaiTextService instance."""
    global thai_text_service
    if thai_text_service is None or force_reload:
        thai_text_service = ThaiTextService()
    return thai_text_service


def reset_thai_text_service():
    """Reset the singleton instance to reload stopwords."""
    global thai_text_service
    thai_text_service = None
