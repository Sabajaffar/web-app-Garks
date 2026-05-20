"""
Constraint Checker — validates each action before execution.

Constraints enforced:
  1. Budget: total spend must not exceed PKR 50,000 per run
  2. Time deadline: actions must complete within 30 minutes
  3. API rate limits: Gemini calls capped per minute
  4. Inventory floor: reorder quantities must be positive

When a constraint is violated, calls Gemini to generate a modified feasible alternative.
"""
from __future__ import annotations

import os
import time
import logging
from typing import Any, Dict, Tuple

logger = logging.getLogger(__name__)

BUDGET_LIMIT_PKR = float(os.getenv("BUDGET_LIMIT_PKR", "50000"))
TIME_DEADLINE_SECONDS = 1800  # 30 minutes
GEMINI_RPM_LIMIT = 14          # Gemini 1.5 Pro free tier


class ConstraintState:
    """Tracks cumulative resource usage across a single agent run."""

    def __init__(self) -> None:
        self.reset()

    def reset(self) -> None:
        self.spent_pkr: float = 0.0
        self.run_start: float = time.time()
        self.gemini_calls: int = 0
        self.gemini_window_start: float = time.time()

    def record_spend(self, amount: float) -> None:
        self.spent_pkr += amount

    def record_gemini_call(self) -> None:
        now = time.time()
        if now - self.gemini_window_start > 60:
            self.gemini_calls = 0
            self.gemini_window_start = now
        self.gemini_calls += 1

    @property
    def budget_remaining(self) -> float:
        return max(0.0, BUDGET_LIMIT_PKR - self.spent_pkr)

    @property
    def elapsed_seconds(self) -> float:
        return time.time() - self.run_start


# Singleton for the current run
constraint_state = ConstraintState()


def check(action: Dict[str, Any]) -> Tuple[bool, str]:
    """
    Validate a single action against all constraints.

    Returns (is_valid: bool, violation_reason: str).
    violation_reason is empty string when valid.
    """
    cost = float(action.get("estimated_cost_pkr", 0))
    name = action.get("name", "unknown action")

    # 1. Budget check
    if cost > constraint_state.budget_remaining:
        reason = (
            f"Action '{name}' costs PKR {cost:,.0f} but only "
            f"PKR {constraint_state.budget_remaining:,.0f} remaining "
            f"(limit PKR {BUDGET_LIMIT_PKR:,.0f})"
        )
        logger.warning("Constraint VIOLATION (budget): %s", reason)
        return False, reason

    # 2. Time deadline
    if constraint_state.elapsed_seconds > TIME_DEADLINE_SECONDS:
        reason = f"Action '{name}' would exceed time deadline ({TIME_DEADLINE_SECONDS // 60}min)"
        logger.warning("Constraint VIOLATION (time): %s", reason)
        return False, reason

    # 3. Gemini rate limit
    if constraint_state.gemini_calls >= GEMINI_RPM_LIMIT:
        reason = f"Gemini API rate limit reached ({GEMINI_RPM_LIMIT} calls/min)"
        logger.warning("Constraint VIOLATION (rate limit): %s", reason)
        return False, reason

    # 4. Inventory floor
    qty = action.get("quantity", None)
    if qty is not None and float(qty) <= 0:
        return False, f"Action '{name}' has invalid quantity {qty}"

    # All checks passed
    action["constraint_check"] = (
        f"Budget PKR {cost:,.0f} / PKR {BUDGET_LIMIT_PKR:,.0f} — PASS"
    )
    return True, ""


def record_execution(action: Dict[str, Any]) -> None:
    """Call this AFTER a successful action execution to update state."""
    cost = float(action.get("estimated_cost_pkr", 0))
    constraint_state.record_spend(cost)
    logger.info(
        "Constraint state updated: spent PKR %.0f / PKR %.0f remaining",
        constraint_state.spent_pkr,
        constraint_state.budget_remaining,
    )
