"""
Contradiction Detector — cross-source fact comparison.

Algorithm:
  1. Parse numeric claims from each source (stock levels, prices, quantities)
  2. Compare same-metric claims across sources
  3. Score conflict by relative difference and source freshness
  4. Conflicts above threshold (0.6) are flagged and sent to Gemini for resolution
"""
from __future__ import annotations

import re
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from services.gemini_client import detect_contradictions as gemini_detect

logger = logging.getLogger(__name__)

CONFLICT_THRESHOLD = 0.6

# Patterns to extract numeric claims: "X units", "PKR X", "X% ROI", etc.
CLAIM_PATTERNS = [
    (r"(\d+(?:\.\d+)?)\s+units?", "units"),
    (r"PKR\s+(\d+(?:,\d+)*(?:\.\d+)?)", "PKR"),
    (r"\$(\d+(?:\.\d+)?)", "USD"),
    (r"(\d+(?:\.\d+)?)%", "percent"),
    (r"(\d+(?:\.\d+)?)\s+days?", "days"),
]


def _extract_claims(text: str, source_name: str) -> List[Dict[str, Any]]:
    claims = []
    lines = text.split("\n")
    for line in lines:
        for pattern, unit in CLAIM_PATTERNS:
            for match in re.finditer(pattern, line, re.IGNORECASE):
                claims.append({
                    "source": source_name,
                    "value": float(match.group(1).replace(",", "")),
                    "unit": unit,
                    "context": line.strip()[:120],
                })
    return claims


def _timestamp_age_hours(doc: Dict[str, Any]) -> float:
    ts_str = doc.get("last_updated") or doc.get("timestamp")
    if not ts_str:
        return 0.0
    try:
        ts_str = str(ts_str).replace("Z", "+00:00")
        ts = datetime.fromisoformat(ts_str)
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
        delta = datetime.now(timezone.utc) - ts
        return delta.total_seconds() / 3600
    except Exception:
        return 0.0


def _conflict_score(val_a: float, val_b: float, age_a: float, age_b: float) -> float:
    if val_a == 0 and val_b == 0:
        return 0.0
    max_val = max(abs(val_a), abs(val_b))
    if max_val == 0:
        return 0.0
    magnitude_diff = abs(val_a - val_b) / max_val
    # Penalise the older source — higher age difference → higher conflict
    age_penalty = min(0.3, abs(age_a - age_b) / 72)
    score = min(1.0, magnitude_diff + age_penalty)
    return round(score, 3)


def run(documents: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], List[Dict[str, str]]]:
    """
    Compare all documents pairwise and return (contradictions, analysis_notes).

    Uses heuristic detection first, then sends to Gemini for resolution text.
    """
    # Build per-source claim maps
    all_claims: List[Dict[str, Any]] = []
    for doc in documents:
        text = doc.get("text", "")
        name = doc.get("source", "unknown")
        age = _timestamp_age_hours(doc)
        claims = _extract_claims(text, name)
        for c in claims:
            c["age_hours"] = age
        all_claims.extend(claims)

    # Group by unit and find value conflicts between sources
    heuristic_conflicts: List[Dict[str, Any]] = []
    by_unit: Dict[str, List[Dict]] = {}
    for c in all_claims:
        by_unit.setdefault(c["unit"], []).append(c)

    for unit, unit_claims in by_unit.items():
        if unit != "units":     # focus on unit (stock) counts for the demo
            continue
        sources_seen: Dict[str, Dict] = {}
        for claim in unit_claims:
            src = claim["source"]
            if src not in sources_seen:
                sources_seen[src] = claim
            else:
                # Pick the higher-value claim per source
                if claim["value"] > sources_seen[src]["value"]:
                    sources_seen[src] = claim

        sources = list(sources_seen.values())
        for i in range(len(sources)):
            for j in range(i + 1, len(sources)):
                a, b = sources[i], sources[j]
                score = _conflict_score(
                    a["value"], b["value"], a["age_hours"], b["age_hours"]
                )
                if score >= CONFLICT_THRESHOLD:
                    heuristic_conflicts.append({
                        "metric": f"Stock ({unit})",
                        "source_a": a["source"],
                        "source_b": b["source"],
                        "claim_a": f"{a['value']} units — {a['context']}",
                        "claim_b": f"{b['value']} units — {b['context']}",
                        "conflict_score": score,
                        "resolution": "Pending Gemini analysis",
                        "recommended_action": "Validate physically and reconcile records",
                    })

    # Use Gemini for richer resolution text
    gemini_results = gemini_detect(documents)

    # Merge: prefer Gemini results, fall back to heuristic
    final = gemini_results if gemini_results else heuristic_conflicts

    notes = [
        {"note": f"Heuristic found {len(heuristic_conflicts)} conflicts"},
        {"note": f"Gemini found {len(gemini_results)} conflicts"},
    ]

    return final, notes
