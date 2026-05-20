"""
Noise Filter — cleans multi-source inputs before feeding to Gemini.

Filters:
  1. Staleness: removes documents with last_updated > 72 hours ago
  2. Deduplication: removes near-duplicates with cosine similarity > 0.85
  3. Off-topic: removes content not related to retail/inventory/supply chain
  4. Low-credibility: removes sources with credibility_score < 0.3
"""
from __future__ import annotations

import re
import math
import logging
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Tuple

logger = logging.getLogger(__name__)

STALENESS_HOURS = 72
SIMILARITY_THRESHOLD = 0.85
CREDIBILITY_FLOOR = 0.3

RETAIL_KEYWORDS = {
    "inventory", "stock", "product", "sale", "revenue", "order", "supplier",
    "fabric", "leather", "garment", "price", "delivery", "warehouse", "SKU",
    "campaign", "customer", "marketing", "reorder", "procurement", "shipment",
    "logistics", "transport", "discount", "fashion", "collection",
}


def _tokenize(text: str) -> Dict[str, int]:
    words = re.findall(r"[a-zA-Z]{3,}", text.lower())
    freq: Dict[str, int] = {}
    for w in words:
        freq[w] = freq.get(w, 0) + 1
    return freq


def _cosine_similarity(a: Dict[str, int], b: Dict[str, int]) -> float:
    keys = set(a) & set(b)
    dot = sum(a[k] * b[k] for k in keys)
    mag_a = math.sqrt(sum(v * v for v in a.values()))
    mag_b = math.sqrt(sum(v * v for v in b.values()))
    if mag_a == 0 or mag_b == 0:
        return 0.0
    return dot / (mag_a * mag_b)


def _is_stale(doc: Dict[str, Any]) -> Tuple[bool, str]:
    ts_str = doc.get("last_updated") or doc.get("timestamp")
    if not ts_str:
        return False, ""
    try:
        if isinstance(ts_str, str):
            ts_str = ts_str.replace("Z", "+00:00")
            ts = datetime.fromisoformat(ts_str)
            if ts.tzinfo is None:
                ts = ts.replace(tzinfo=timezone.utc)
        else:
            return False, ""
        age = datetime.now(timezone.utc) - ts
        if age > timedelta(hours=STALENESS_HOURS):
            return True, f"Data is {int(age.total_seconds() / 3600)}h old (limit {STALENESS_HOURS}h)"
    except (ValueError, TypeError):
        pass
    return False, ""


def _credibility_score(doc: Dict[str, Any]) -> float:
    score = doc.get("credibility_score", None)
    if score is not None:
        return float(score)
    # Heuristic: structured data is more credible than unstructured
    type_map = {"STRUCTURED": 0.9, "SEMI-STRUCTURED": 0.7, "UNSTRUCTURED": 0.5}
    base = type_map.get(doc.get("type", "UNSTRUCTURED"), 0.6)
    # Penalise if stale
    is_stale, _ = _is_stale(doc)
    if is_stale:
        base -= 0.3
    return max(0.0, base)


def _is_off_topic(text: str) -> bool:
    tokens = set(re.findall(r"[a-zA-Z]{3,}", text.lower()))
    overlap = tokens & RETAIL_KEYWORDS
    # Off-topic if fewer than 2 retail keywords in the first 500 chars
    return len(overlap) < 2


def run(documents: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], List[Dict[str, str]]]:
    """
    Filter documents and return (kept_docs, filter_log).

    filter_log entries: { source, reason }
    """
    kept: List[Dict[str, Any]] = []
    removed: List[Dict[str, str]] = []
    vectors: List[Dict[str, int]] = []

    for doc in documents:
        source = doc.get("source", "unknown")
        text = doc.get("text", "")

        # 1. Credibility gate
        cred = _credibility_score(doc)
        if cred < CREDIBILITY_FLOOR:
            removed.append({"source": source, "reason": f"Low credibility score {cred:.2f} < {CREDIBILITY_FLOOR}"})
            logger.info("Noise filter removed '%s': low credibility %.2f", source, cred)
            continue

        # 2. Staleness gate (warn but don't always remove — flag for Gemini)
        is_stale, stale_reason = _is_stale(doc)
        if is_stale:
            doc["_stale"] = True
            doc["_stale_reason"] = stale_reason
            logger.info("Noise filter flagged '%s' as stale: %s", source, stale_reason)

        # 3. Off-topic gate
        if text and _is_off_topic(text[:500]):
            removed.append({"source": source, "reason": "Content not related to retail operations"})
            logger.info("Noise filter removed '%s': off-topic", source)
            continue

        # 4. Deduplication
        if text:
            vec = _tokenize(text[:2000])
            is_dup = False
            for existing_vec in vectors:
                sim = _cosine_similarity(vec, existing_vec)
                if sim >= SIMILARITY_THRESHOLD:
                    removed.append({"source": source, "reason": f"Near-duplicate (similarity {sim:.2f} ≥ {SIMILARITY_THRESHOLD})"})
                    logger.info("Noise filter removed '%s': near-duplicate (%.2f)", source, sim)
                    is_dup = True
                    break
            if is_dup:
                continue
            vectors.append(vec)

        kept.append(doc)

    return kept, removed
