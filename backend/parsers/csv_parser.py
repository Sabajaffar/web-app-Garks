"""CSV parser — handles structured inventory / sales CSV files."""
from __future__ import annotations

import csv
import io
from typing import Any, Dict, List


def parse_csv(content: bytes | str) -> Dict[str, Any]:
    """
    Parse CSV bytes/string into rows + plain text summary.

    Returns:
        {
            "rows": List[Dict],
            "headers": List[str],
            "row_count": int,
            "text": str,         # flat text for Gemini
        }
    """
    if isinstance(content, bytes):
        text = content.decode("utf-8", errors="replace")
    else:
        text = content

    reader = csv.DictReader(io.StringIO(text))
    headers = reader.fieldnames or []
    rows: List[Dict] = []
    for row in reader:
        rows.append(dict(row))

    flat_text = f"CSV Data ({len(rows)} rows):\n"
    flat_text += ", ".join(headers) + "\n"
    for row in rows[:50]:          # cap at 50 rows for context window
        flat_text += ", ".join(str(v) for v in row.values()) + "\n"

    return {
        "rows": rows,
        "headers": list(headers),
        "row_count": len(rows),
        "text": flat_text,
    }
