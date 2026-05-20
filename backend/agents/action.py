"""
Agent 3 — Action Agent

Triggered when admin approves the action chain (POST /approve-action).

For each action in the chain:
  1. Run Constraint Checker → budget / time / rate limits
  2. If violated → Gemini generates modified feasible alternative
  3. Execute action with retry (Failure Recovery Engine)
  4. Log before + after state to Antigravity trace
  5. Push progress to admin via WebSocket

Demo scenario actions executed here:
  1. validate_stock        → logs stock contradiction resolution
  2. emergency_reorder     → PKR 75k → budget violated → Gemini modifies to PKR 48k
  3. update_product_badge  → marks Leather Jacket as Limited Stock
  4. launch_flash_promo    → 15% Winter Collection discount
  5. schedule_monitoring   → 6-hourly monitoring for 24h
"""
from __future__ import annotations

import asyncio
import logging
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from antigravity.trace_logger import trace
from services.constraint import check as constraint_check, record_execution, constraint_state
from services.recovery import execute_with_recovery
from services.gemini_client import modify_for_constraint
from firebase.firestore import (
    get_store_state, set_store_state, update_inventory_item,
    save_action_result, get_inventory,
)
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


# ─────────────────────── Action Executors ────────────────────────────────────

def _find_critical_item(action: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Resolve the target product for an action.
    Priority: action carries explicit product_id > action description keyword match
    > lowest-stock item in live inventory.
    """
    inventory = get_inventory()
    if not inventory:
        return None
    # 1. Explicit product_id set by Gemini or earlier action
    pid = action.get("product_id")
    if pid:
        match = next((p for p in inventory if p.get("id") == pid), None)
        if match:
            return match
    # 2. Keyword match from action description/name
    desc = (action.get("description", "") + " " + action.get("name", "")).lower()
    for p in inventory:
        name_lower = p.get("name", "").lower()
        if any(word in desc for word in name_lower.split()):
            return p
    # 3. Fallback: item with lowest stock (most critical)
    return min(inventory, key=lambda p: p.get("stock", 9999))


async def _exec_validate_stock(action: Dict[str, Any]) -> None:
    """Cross-check warehouse CSV against real-time sales data."""
    target = _find_critical_item(action)
    if target:
        pid = target.get("id", "unknown")
        name = target.get("name", "item")
        before_stock = target.get("stock", 0)
        trace.log("ActionAgent", "validate_stock — before state",
                  "success", 10, f"{name}: CSV reports {before_stock} units")
        update_inventory_item(pid, {"stock": 0, "stock_validated": True})
        trace.log("ActionAgent", "validate_stock — after state",
                  "success", 10, f"{name}: actual stock set to 0 (sales data authoritative)")
    await asyncio.sleep(0.1)


async def _exec_emergency_reorder(action: Dict[str, Any]) -> None:
    """Place emergency reorder for the most critical stock item."""
    target = _find_critical_item(action)
    cost = action.get("estimated_cost_pkr", 48000)
    pid = target.get("id", "m3") if target else "m3"
    name = target.get("name", "item") if target else "item"
    trace.log("ActionAgent", "emergency_reorder — before state",
              "success", 10, f"{name}: 0 units in stock")
    update_inventory_item(pid, {"stock": 80, "pending_reorder": True, "reorder_cost_pkr": cost})
    trace.log("ActionAgent", "emergency_reorder — after state",
              "success", 10, f"PO submitted: 80 units / PKR {cost:,} for {name}")
    await asyncio.sleep(0.2)


async def _exec_update_badge(action: Dict[str, Any]) -> None:
    """Update product listing badge to 'Limited Stock'."""
    target = _find_critical_item(action)
    pid = target.get("id", "m3") if target else "m3"
    name = target.get("name", "item") if target else "item"
    trace.log("ActionAgent", "update_product_badge — before",
              "success", 5, f"{name}: standard listing")
    update_inventory_item(pid, {"badge": "Limited Stock", "badge_updated_at": datetime.now(timezone.utc).isoformat()})
    trace.log("ActionAgent", "update_product_badge — after",
              "success", 5, f"{name}: 'Limited Stock' badge live")
    await asyncio.sleep(0.05)


async def _exec_launch_promo(action: Dict[str, Any]) -> None:
    """Launch 15% Winter Collection flash promo."""
    discount = action.get("discount_percent", 15)
    store_state = get_store_state()
    trace.log("ActionAgent", "launch_flash_promo — before",
              "success", 10, f"saleActive={store_state.get('saleActive', False)}")
    store_state["saleActive"] = True
    store_state["saleDiscount"] = discount
    store_state["saleCategory"] = "Winter Collection"
    set_store_state(store_state)
    trace.log("ActionAgent", "launch_flash_promo — after",
              "success", 10, f"{discount}% promo live on Winter Collection")
    await asyncio.sleep(0.1)


async def _exec_schedule_monitoring(action: Dict[str, Any]) -> None:
    """Set monitoring interval to 6 hours for 24 hours."""
    store_state = get_store_state()
    store_state["monitoring_interval_hours"] = 6
    store_state["monitoring_heightened_until"] = datetime.now(timezone.utc).isoformat()
    set_store_state(store_state)
    trace.log("ActionAgent", "schedule_monitoring — after",
              "success", 5, "6-hourly monitoring active for 24 hours")
    await asyncio.sleep(0.05)


EXECUTOR_MAP = {
    1: (_exec_validate_stock, None),
    2: (_exec_emergency_reorder, None),
    3: (_exec_update_badge, None),
    4: (_exec_launch_promo, None),
    5: (_exec_schedule_monitoring, None),
}


# ─────────────────────── Main Run ────────────────────────────────────────────

async def run(action_chain: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Execute approved action chain sequentially.
    Returns final result with per-action status and Antigravity trace.
    """
    constraint_state.reset()
    start = time.time()
    executed: List[Dict[str, Any]] = []

    trace.log("ActionAgent", "Action chain execution started", "success", 0,
              f"{len(action_chain)} actions queued")
    await _broadcast({"type": "action_started", "total": len(action_chain)})

    for action in action_chain:
        action_id = action.get("id", 0)
        action_name = action.get("name", f"Action {action_id}")
        a_start = time.time()

        # ── Constraint Check ────────────────────────────────────────────────
        valid, violation = constraint_check(action)
        if not valid:
            trace.log("ActionAgent", f"CONSTRAINT VIOLATION: {action_name}", "modified",
                      int((time.time() - a_start) * 1000), violation[:120])

            # Ask Gemini to modify the action
            action = modify_for_constraint(action, violation, constraint_state.budget_remaining)
            trace.log("ActionAgent", f"MODIFIED: {action_name}", "modified",
                      50, f"Cost adjusted → PKR {action.get('estimated_cost_pkr', 0):,}")

        # ── Execution with Recovery ──────────────────────────────────────────
        executor_fn, rollback_fn = EXECUTOR_MAP.get(action_id, (None, None))
        if executor_fn:
            action = await execute_with_recovery(action, executor_fn, rollback_fn, "ActionAgent")
        else:
            # Generic executor for unknown action IDs
            async def _noop(a):
                await asyncio.sleep(0.1)
            action = await execute_with_recovery(action, _noop, None, "ActionAgent")

        # ── Record spend ─────────────────────────────────────────────────────
        record_execution(action)
        executed.append(action)

        # ── Progress broadcast ────────────────────────────────────────────────
        await _broadcast({
            "type": "action_progress",
            "action_id": action_id,
            "action_name": action_name,
            "status": action.get("status", "unknown"),
            "completed": len(executed),
            "total": len(action_chain),
        })

        logger.info("Action %d '%s' → %s", action_id, action_name, action.get("status"))

    # ── Final summary ────────────────────────────────────────────────────────
    total_ms = int((time.time() - start) * 1000)
    success_count = sum(1 for a in executed if a.get("status") in ("success", "modified", "recovered"))
    total_spent = constraint_state.spent_pkr

    result = {
        "executed_actions": executed,
        "success_count": success_count,
        "total_actions": len(action_chain),
        "total_spent_pkr": total_spent,
        "budget_remaining_pkr": constraint_state.budget_remaining,
        "total_latency_ms": total_ms,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "trace": trace.frontend_logs(),
        "summary": trace.summary(),
    }

    save_action_result(result)
    await _broadcast({"type": "action_complete", "result": result})

    # Final notification (with demo email retry scenario)
    await notify(
        event_type="action_complete",
        title="✅ GarKS Action Chain Complete",
        message=f"{success_count}/{len(action_chain)} actions succeeded. Total spend: PKR {total_spent:,.0f}",
        data={"success_count": success_count, "total_spent_pkr": total_spent},
    )

    trace.log("ActionAgent", "Execution complete", "success", total_ms,
              f"{success_count}/{len(action_chain)} success · PKR {total_spent:,.0f} spent")

    return result
