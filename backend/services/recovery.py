"""
Failure Recovery Engine — retry logic, rollback, and fallback generation.

Strategy:
  1. Retry failed action up to MAX_RETRIES (3) times with exponential backoff
  2. On permanent failure: execute rollback callback
  3. Ask Gemini to generate a feasible fallback action
  4. Log every attempt in Antigravity trace
"""
from __future__ import annotations

import asyncio
import logging
import time
from typing import Any, Callable, Coroutine, Dict, Optional

from antigravity.trace_logger import trace
from services.gemini_client import generate_fallback_action

logger = logging.getLogger(__name__)

MAX_RETRIES = 3
BASE_DELAY_SECONDS = 1.0     # exponential backoff: 1s, 2s, 4s


async def execute_with_recovery(
    action: Dict[str, Any],
    executor: Callable[[Dict[str, Any]], Coroutine],
    rollback: Optional[Callable[[Dict[str, Any]], Coroutine]] = None,
    agent_name: str = "ActionAgent",
) -> Dict[str, Any]:
    """
    Run `executor(action)` with retry/fallback.

    Parameters
    ----------
    action     : action dict (has 'name', 'id', etc.)
    executor   : async callable that performs the action; raises on failure
    rollback   : async callable to undo side-effects if all retries fail
    agent_name : label written to Antigravity trace

    Returns the (possibly modified) action dict with final status.
    """
    action_name = action.get("name", f"Action {action.get('id')}")
    last_error: Optional[Exception] = None

    for attempt in range(1, MAX_RETRIES + 1):
        start = time.time()
        try:
            logger.info("Executing '%s' (attempt %d/%d)", action_name, attempt, MAX_RETRIES)
            await executor(action)
            latency = int((time.time() - start) * 1000)
            note = f"Succeeded on attempt {attempt}"
            if attempt > 1:
                action["status"] = "recovered"
                trace.log(agent_name, action_name, "recovered", latency, note)
            else:
                action["status"] = "success"
                trace.log(agent_name, action_name, "success", latency, note)
            return action

        except Exception as exc:
            last_error = exc
            latency = int((time.time() - start) * 1000)
            trace.log(
                agent_name,
                action_name,
                "failed",
                latency,
                f"Attempt {attempt}/{MAX_RETRIES}: {str(exc)[:120]}",
            )
            logger.warning("'%s' attempt %d failed: %s", action_name, attempt, exc)

            if attempt < MAX_RETRIES:
                delay = BASE_DELAY_SECONDS * (2 ** (attempt - 1))
                logger.info("Retrying '%s' in %.1fs", action_name, delay)
                await asyncio.sleep(delay)

    # All retries exhausted — rollback then fallback
    logger.error("'%s' failed after %d attempts", action_name, MAX_RETRIES)

    if rollback:
        rb_start = time.time()
        try:
            await rollback(action)
            trace.log(
                agent_name,
                f"ROLLBACK: {action_name}",
                "success",
                int((time.time() - rb_start) * 1000),
                "State rolled back successfully",
            )
        except Exception as rb_exc:
            trace.log(
                agent_name,
                f"ROLLBACK: {action_name}",
                "failed",
                int((time.time() - rb_start) * 1000),
                f"Rollback also failed: {str(rb_exc)[:80]}",
            )

    # Ask Gemini for a fallback action
    fallback_start = time.time()
    fallback = generate_fallback_action(action, str(last_error))
    fallback["status"] = "recovered"
    trace.log(
        agent_name,
        f"FALLBACK: {fallback.get('name', action_name)}",
        "recovered",
        int((time.time() - fallback_start) * 1000),
        "Gemini-generated fallback applied after 3 failed attempts",
    )

    return fallback
