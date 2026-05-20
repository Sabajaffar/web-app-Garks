"""PDF parser using pdfplumber — handles unstructured supplier reports."""
from __future__ import annotations

import io
from typing import Any, Dict

try:
    import pdfplumber
    PDFPLUMBER_OK = True
except ImportError:
    PDFPLUMBER_OK = False


def parse_pdf(content: bytes) -> Dict[str, Any]:
    """
    Extract text from PDF bytes.

    Returns:
        {
            "pages": int,
            "text": str,
            "tables": List[List[List]],   # raw table data if any
        }
    """
    if not PDFPLUMBER_OK:
        return {"pages": 0, "text": "[pdfplumber not installed]", "tables": []}

    text_parts = []
    tables = []

    with pdfplumber.open(io.BytesIO(content)) as pdf:
        pages = len(pdf.pages)
        for page in pdf.pages:
            page_text = page.extract_text() or ""
            if page_text:
                text_parts.append(page_text)
            page_tables = page.extract_tables()
            for tbl in (page_tables or []):
                tables.append(tbl)

    full_text = "\n\n".join(text_parts)
    return {
        "pages": pages,
        "text": full_text,
        "tables": tables[:10],    # cap to avoid context overflow
    }
