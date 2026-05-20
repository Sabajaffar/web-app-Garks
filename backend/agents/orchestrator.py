"""
Orchestrator — coordinates all 4 agents for a complete run cycle.

Exposed as:
  GET  /api/orchestrator/run             → trigger full pipeline (Intelligence → await approval)
  POST /api/orchestrator/approve-sale    → approve sale action → trigger Action Agent
  POST /api/orchestrator/approve-marketing → approve marketing → trigger Action Agent

This module also holds the in-memory run state so the frontend can poll progress.
"""
from __future__ import annotations

import asyncio
import logging
import time
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from antigravity.trace_logger import trace
from agents import intelligence, action, monitoring, notification

logger = logging.getLogger(__name__)

# Global run state (one run at a time for demo)
_current_run: Dict[str, Any] = {
    "status": "idle",       # idle | running | awaiting_approval | executing | complete | error
    "insight_result": None,
    "action_result": None,
    "started_at": None,
    "completed_at": None,
}


def get_run_state() -> Dict[str, Any]:
    return dict(_current_run)


async def run_pipeline(
    uploaded_file: Optional[bytes] = None,
    filename: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Full orchestration: Intelligence Agent → (await approval) → return plan.

    The Action Agent is triggered separately via approve_sale / approve_marketing.
    """
    global _current_run

    if _current_run["status"] == "running":
        return {"error": "A pipeline run is already in progress."}

    trace.reset()
    _current_run = {
        "status": "running",
        "insight_result": None,
        "action_result": None,
        "started_at": datetime.now(timezone.utc).isoformat(),
        "completed_at": None,
    }

    start = time.time()
    trace.log("Orchestrator", "Pipeline initiated", "success", 0, "Intelligence → Action → Notify")

    try:
        # ── Monitoring cycle (quick sync check before full analysis) ─────────
        monitoring_result = await monitoring.run_cycle()
        trace.log("Orchestrator", "Monitoring pre-check done", "success",
                  monitoring_result.get("cycle_latency_ms", 0),
                  f"{len(monitoring_result.get('alerts', []))} alerts")

        # ── Intelligence Agent ────────────────────────────────────────────────
        insight_result = await intelligence.run(uploaded_file, filename)
        _current_run["insight_result"] = insight_result
        _current_run["status"] = "awaiting_approval"

        trace.log("Orchestrator", "Awaiting admin approval", "pending",
                  int((time.time() - start) * 1000), "Action chain ready for review")

        return insight_result

    except Exception as exc:
        logger.error("Orchestrator pipeline error: %s", exc, exc_info=True)
        _current_run["status"] = "error"
        trace.log("Orchestrator", "Pipeline error", "failed", 0, str(exc)[:120])
        return {"error": str(exc), "type": "error"}


async def approve_sale(discount: int, duration_hours: int) -> Dict[str, Any]:
    """
    Admin approved a flash sale. Trigger Action Agent with the confirmed chain.
    """
    global _current_run

    _current_run["status"] = "executing"
    insight = _current_run.get("insight_result") or {}
    action_chain = insight.get("action_chain", [])

    # Update discount/duration from admin's final choice
    for a in action_chain:
        if "promo" in a.get("name", "").lower() or a.get("id") == 4:
            a["discount_percent"] = discount
            a["description"] = (
                f"Launch {discount}% flash sale for {duration_hours} hours"
            )

    if not action_chain:
        from services.gemini_client import _mock_action_chain
        action_chain = _mock_action_chain()["action_chain"]

    trace.log("Orchestrator", "Admin approved sale strategy", "success", 0,
              f"discount={discount}% duration={duration_hours}h")

    result = await action.run(action_chain)
    _current_run["action_result"] = result
    _current_run["status"] = "complete"
    _current_run["completed_at"] = datetime.now(timezone.utc).isoformat()

    return result


async def approve_marketing(
    campaign_type: str,
    target_audience: str,
    estimated_reach: str,
) -> Dict[str, Any]:
    """Admin approved a marketing campaign."""
    global _current_run
    _current_run["status"] = "executing"

    marketing_chain = [
        {
            "id": 1, "name": "Send Push Notification",
            "description": f"Send '{campaign_type}' to {target_audience} ({estimated_reach})",
            "status": "awaiting_approval", "reasoning": "Active sale + low stock → urgency push",
            "constraint_check": "No cost — PASS", "estimated_cost_pkr": 0,
            "rollback": "Cannot unsend — use follow-up correction message",
        },
        {
            "id": 2, "name": "Update Campaign Metrics",
            "description": "Record campaign reach and adjust targeting for next cycle",
            "status": "awaiting_approval", "reasoning": "Track ROI for next campaign optimization",
            "constraint_check": "No cost — PASS", "estimated_cost_pkr": 0,
            "rollback": "Revert campaign status to Draft",
        },
    ]

    trace.log("Orchestrator", "Admin approved marketing campaign", "success", 0,
              f"type={campaign_type} audience={target_audience} reach={estimated_reach}")

    result = await action.run(marketing_chain)
    _current_run["action_result"] = result
    _current_run["status"] = "complete"
    _current_run["completed_at"] = datetime.now(timezone.utc).isoformat()
    return result
