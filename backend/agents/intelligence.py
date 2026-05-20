"""
Agent 2 — Intelligence Agent

Triggered when admin uploads a file (POST /upload) or via mock data.

Pipeline:
  1. Parse uploaded file (PDF / Excel / CSV / DOCX)
  2. Merge multiple similar documents
  3. Run Noise Filter (staleness, duplicates, off-topic, low-credibility)
  4. Send cleaned content to Gemini for insight extraction
  5. Run Contradiction Detector across all sources
  6. Return structured JSON: problems, risks, opportunities, action_chain proposal
  7. Push result to admin via WebSocket for approval
"""
from __future__ import annotations

import logging
import mimetypes
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from antigravity.trace_logger import trace
from parsers.csv_parser import parse_csv
from parsers.pdf_parser import parse_pdf
from parsers.excel_parser import parse_excel
from parsers.docx_parser import parse_docx
from services.noise_filter import run as noise_filter_run
from services.contradiction import run as contradiction_run
from services.gemini_client import extract_insights, plan_action_chain
from firebase.firestore import save_insight, get_store_state, get_inventory
from agents.notification import notify

logger = logging.getLogger(__name__)

_broadcast_fn: Optional[Any] = None


def set_broadcast(fn) -> None:
    global _broadcast_fn
    _broadcast_fn = fn


async def _broadcast(event: Dict[str, Any]) -> None:
    if _broadcast_fn:
        try:
            await _broadcast_fn(event)
        except Exception as exc:
            logger.warning("WebSocket broadcast failed: %s", exc)


def _parse_file(content: bytes, filename: str) -> Dict[str, Any]:
    """Route file bytes to the correct parser based on extension."""
    name_lower = filename.lower()
    if name_lower.endswith(".csv"):
        parsed = parse_csv(content)
        parsed["type"] = "STRUCTURED"
    elif name_lower.endswith(".pdf"):
        parsed = parse_pdf(content)
        parsed["type"] = "UNSTRUCTURED"
    elif name_lower.endswith((".xlsx", ".xls")):
        parsed = parse_excel(content)
        parsed["type"] = "SEMI-STRUCTURED"
    elif name_lower.endswith(".docx"):
        parsed = parse_docx(content)
        parsed["type"] = "SEMI-STRUCTURED"
    else:
        parsed = {"text": content.decode("utf-8", errors="replace"), "type": "UNSTRUCTURED"}
    parsed["source"] = filename
    return parsed


def _load_mock_sources() -> List[Dict[str, Any]]:
    """Load the 5 hardcoded demo data sources when no file is uploaded."""
    import json, csv, io, os
    base = os.path.join(os.path.dirname(__file__), "..", "mock_data")

    sources = []

    # 1. inventory.csv — STRUCTURED (stale: timestamp from file mtime or simulated)
    inv_path = os.path.join(base, "inventory.csv")
    if os.path.exists(inv_path):
        with open(inv_path, "rb") as f:
            parsed = parse_csv(f.read())
        parsed["source"] = "inventory.csv"
        parsed["type"] = "STRUCTURED"
        # Use actual file mtime — file hasn't changed since creation, so it'll be "stale"
        file_mtime = os.path.getmtime(inv_path)
        parsed["last_updated"] = datetime.fromtimestamp(file_mtime, tz=timezone.utc).isoformat()
        parsed["credibility_score"] = 0.55
        sources.append(parsed)

    # 2. supplier_report_mock.json — SEMI-STRUCTURED
    sup_path = os.path.join(base, "supplier_report_mock.json")
    if os.path.exists(sup_path):
        with open(sup_path) as f:
            data = json.load(f)
        text = json.dumps(data, indent=2)
        sources.append({"source": "supplier_email", "type": "SEMI-STRUCTURED",
                         "text": text, "credibility_score": 0.82,
                         "last_updated": datetime.now(timezone.utc).isoformat()})

    # 3. sales_realtime.json — STRUCTURED (today)
    sales_path = os.path.join(base, "sales_realtime.json")
    if os.path.exists(sales_path):
        with open(sales_path) as f:
            data = json.load(f)
        text = json.dumps(data, indent=2)
        sources.append({"source": "sales_dashboard", "type": "STRUCTURED",
                         "text": text, "credibility_score": 0.97,
                         "last_updated": datetime.now(timezone.utc).isoformat()})

    # 4. marketing_results_mock.json — SEMI-STRUCTURED
    mkt_path = os.path.join(base, "marketing_results_mock.json")
    if os.path.exists(mkt_path):
        with open(mkt_path) as f:
            data = json.load(f)
        text = json.dumps(data, indent=2)
        sources.append({"source": "customer_reviews", "type": "SEMI-STRUCTURED",
                         "text": text, "credibility_score": 0.74,
                         "last_updated": datetime.now(timezone.utc).isoformat()})

    # 5. news_mock.json — UNSTRUCTURED
    news_path = os.path.join(base, "news_mock.json")
    if os.path.exists(news_path):
        with open(news_path) as f:
            data = json.load(f)
        text = data.get("content", json.dumps(data))
        sources.append({"source": "news_feed", "type": "UNSTRUCTURED",
                         "text": text, "credibility_score": 0.65,
                         "last_updated": datetime.now(timezone.utc).isoformat()})

    return sources


async def run(
    uploaded_file: Optional[bytes] = None,
    filename: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Full Intelligence Agent pipeline.

    Parameters
    ----------
    uploaded_file : raw bytes from POST /upload (None = use mock data)
    filename      : original filename for parser routing

    Returns the insight + action plan dict broadcast to admin.
    """
    start = time.time()
    trace.log("IntelligenceAgent", "Pipeline started", "success", 0,
              f"file={filename or 'mock_data'}")

    # ── Step 1: Parse ───────────────────────────────────────────────────────
    t1 = time.time()
    if uploaded_file and filename:
        parsed_doc = _parse_file(uploaded_file, filename)
        sources = [parsed_doc]
        # Also add mock sources as additional context
        sources += _load_mock_sources()
    else:
        sources = _load_mock_sources()

    trace.log("IntelligenceAgent", "Documents parsed", "success",
              int((time.time() - t1) * 1000), f"{len(sources)} sources ingested")

    # ── Step 2: Noise Filter ────────────────────────────────────────────────
    t2 = time.time()
    clean_sources, filter_log = noise_filter_run(sources)
    removed_count = len(sources) - len(clean_sources)
    trace.log(
        "IntelligenceAgent", "Noise filter applied", "success",
        int((time.time() - t2) * 1000),
        f"{removed_count} sources removed: "
        + "; ".join(f"{r['source']} ({r['reason'][:40]})" for r in filter_log[:3]),
    )

    # ── Step 3: Insight Extraction (Gemini) ─────────────────────────────────
    t3 = time.time()
    insights = extract_insights(clean_sources)
    trace.log("IntelligenceAgent", "Gemini insight extraction complete", "success",
              int((time.time() - t3) * 1000),
              f"Risk: {insights.get('key_metrics', {}).get('stock_risk', 'UNKNOWN')}")

    # ── Step 4: Contradiction Detection ─────────────────────────────────────
    t4 = time.time()
    contradictions, _ = contradiction_run(clean_sources)
    high_conflict = [c for c in contradictions if c.get("conflict_score", 0) >= 0.6]
    trace.log(
        "IntelligenceAgent", "Contradiction analysis complete", "success",
        int((time.time() - t4) * 1000),
        f"{len(contradictions)} contradictions found; {len(high_conflict)} high-conflict (≥0.6)",
    )

    # ── Step 5: Action Chain Planning (Gemini) ──────────────────────────────
    t5 = time.time()
    store_state = get_store_state()
    # Enrich with live inventory so Gemini sees actual stock counts
    live_inventory = get_inventory()
    store_state_enriched = {
        **store_state,
        "inventory_snapshot": [
            {"id": p.get("id"), "name": p.get("name"), "stock": p.get("stock"),
             "category": p.get("category"), "reorder_level": p.get("reorderLevel", 20)}
            for p in live_inventory[:12]
        ],
        "critical_items": [
            {"id": p.get("id"), "name": p.get("name"), "stock": p.get("stock"),
             "category": p.get("category")}
            for p in live_inventory if p.get("stock", 999) < 10
        ],
        "analyzed_at": datetime.now(timezone.utc).isoformat(),
    }
    action_plan = plan_action_chain(insights, contradictions, store_state_enriched)
    trace.log("IntelligenceAgent", "Action chain planned by Gemini", "success",
              int((time.time() - t5) * 1000),
              f"{len(action_plan.get('action_chain', []))} actions generated")

    # ── Step 6: Assemble result ──────────────────────────────────────────────
    analyzed_at = datetime.now(timezone.utc).isoformat()
    result: Dict[str, Any] = {
        "type": "awaiting_approval",
        "reasoning": action_plan.get("reasoning", ""),
        "recommended_discount": action_plan.get("recommended_discount", 15),
        "recommended_duration": action_plan.get("recommended_duration", 6),
        "sale_recommended": action_plan.get("sale_recommended", True),
        "action_chain": action_plan.get("action_chain", []),
        "action": action_plan.get("action_chain", [{}])[-2] if len(action_plan.get("action_chain", [])) >= 2 else {},
        "analysis_result": {
            "insights": insights.get("problems", []) + insights.get("opportunities", []),
            "contradictions": contradictions,
            "summary": insights.get("summary", ""),
            "confidence_scores": insights.get("confidence_scores", {}),
            "key_metrics": insights.get("key_metrics", {}),
        },
        "filter_log": filter_log,
        "sources_analyzed": [s.get("source") for s in clean_sources],
        "analyzed_at": analyzed_at,
        "timestamp": analyzed_at,
        "pipeline_latency_ms": int((time.time() - start) * 1000),
    }

    # ── Step 7: Persist + broadcast ─────────────────────────────────────────
    save_insight(result)
    await _broadcast({"type": "intelligence_ready", "data": result})

    # Notify admin
    await notify(
        event_type="intelligence_complete",
        title="🧠 Intelligence Analysis Complete",
        message=f"GarKS agent found {len(contradictions)} contradictions and {len(action_plan.get('action_chain', []))} actions. Review and approve.",
        data={"conflict_count": len(contradictions), "action_count": len(action_plan.get("action_chain", []))},
    )

    trace.log("IntelligenceAgent", "Pipeline complete — awaiting admin approval", "success",
              int((time.time() - start) * 1000), f"Total: {result['pipeline_latency_ms']}ms")

    return result
