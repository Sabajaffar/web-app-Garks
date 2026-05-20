"""
Agent 1 — Monitoring Agent

Runs on Celery beat every 5 minutes.
  - Reads inventory + sales from Firestore
  - Sends to Gemini for analysis
  - If stock below reorder threshold OR sales drop >15%:
      → pushes WebSocket alert to admin app
      → queues task for Action Agent
"""
from __future__ import annotations

import logging
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from antigravity.trace_logger import trace
from firebase.firestore import get_inventory, get_store_state, set_store_state
from agents.notification import notify

logger = logging.getLogger(__name__)

REORDER_THRESHOLD = 10          # units below which restock is triggered
SALES_DROP_PERCENT = 15.0       # % drop vs 7-day average that triggers alert

# WebSocket broadcast callback — injected by main.py at startup
_broadcast_fn: Optional[Any] = None


def set_broadcast(fn) -> None:
    """Register the WebSocket broadcast function from main.py."""
    global _broadcast_fn
    _broadcast_fn = fn


async def _broadcast(event: Dict[str, Any]) -> None:
    if _broadcast_fn:
        try:
            await _broadcast_fn(event)
        except Exception as exc:
            logger.warning("WebSocket broadcast failed: %s", exc)


def _compute_sales_change(store_state: Dict[str, Any]) -> float:
    """Return revenue change as a percentage (negative = drop)."""
    return float(store_state.get("revenueChange", 0))


async def run_cycle() -> Dict[str, Any]:
    """
    Execute one monitoring cycle. Returns a summary dict.
    Called by Celery beat every 5 minutes AND on-demand via GET /monitoring.
    """
    start = time.time()
    trace.log("MonitoringAgent", "Starting monitoring cycle", "success", 0)

    # 1. Read current state
    store_state = get_store_state()
    inventory = get_inventory()

    t1 = time.time()
    trace.log(
        "MonitoringAgent", "Read inventory + store state from Firestore", "success",
        int((t1 - start) * 1000), f"{len(inventory)} products loaded"
    )

    # 2. Find low-stock items
    low_stock: List[Dict[str, Any]] = [
        item for item in inventory if item.get("stock", 999) < REORDER_THRESHOLD
    ]

    # 3. Check sales drop
    sales_change = _compute_sales_change(store_state)
    sales_dropped = sales_change <= -SALES_DROP_PERCENT

    alerts: List[str] = []
    if low_stock:
        item_names = ", ".join(i.get("name", i.get("sku", "?")) for i in low_stock[:3])
        alerts.append(f"Low stock: {item_names} (< {REORDER_THRESHOLD} units)")

    if sales_dropped:
        alerts.append(f"Sales dropped {abs(sales_change):.1f}% vs 7-day average")

    t2 = time.time()
    if alerts:
        trace.log(
            "MonitoringAgent", "Threshold breach detected", "success",
            int((t2 - t1) * 1000), "; ".join(alerts)
        )

        # 4. WebSocket push to admin
        await _broadcast({
            "type": "monitoring_alert",
            "alerts": alerts,
            "low_stock": [{"name": i.get("name"), "stock": i.get("stock")} for i in low_stock],
            "sales_change": sales_change,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

        # 5. Email notification
        await notify(
            event_type="monitoring_alert",
            title="⚠️ GarKS Monitoring Alert",
            message=f"Threshold breaches detected: {'; '.join(alerts)}",
            data={"low_stock_count": len(low_stock), "sales_change": sales_change},
            send_email_flag=bool(alerts),
            send_push_flag=True,
        )

        # 6. Update Firestore with alert
        store_state["last_monitoring_alert"] = datetime.now(timezone.utc).isoformat()
        store_state["stockoutRisk"] = "CRITICAL" if low_stock else "HIGH"
        set_store_state(store_state)

    else:
        trace.log("MonitoringAgent", "All metrics within normal range", "success", int((t2 - t1) * 1000))

    total_latency = int((time.time() - start) * 1000)
    trace.log(
        "MonitoringAgent", "Monitoring cycle complete", "success",
        total_latency, f"{len(alerts)} alerts generated"
    )

    return {
        "alerts": alerts,
        "low_stock": low_stock,
        "sales_change": sales_change,
        "sales_dropped": sales_dropped,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "cycle_latency_ms": total_latency,
    }
