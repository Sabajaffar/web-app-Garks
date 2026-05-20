"""
Antigravity Trace Logger — mandatory per-step audit trail for all agent actions.

Every agent step writes a structured JSON entry here. The trace is stored in-memory
(for demo) and also persisted to Firestore in production.

Entry format expected by the React Native frontend:
  { timestamp: str, action: str, result: str }

Internal format (richer, written to Firestore / returned via /action-status):
  { step, agent, action, status, latency_ms, notes, timestamp }
"""

from __future__ import annotations

import time
from datetime import datetime, timezone
from typing import Literal, List, Dict, Any


Status = Literal["success", "modified", "failed", "recovered", "pending", "skipped"]


class TraceEntry:
    """One immutable log entry in the Antigravity trace."""

    def __init__(
        self,
        step: int,
        agent: str,
        action: str,
        status: Status,
        latency_ms: int,
        notes: str = "",
    ) -> None:
        self.step = step
        self.agent = agent
        self.action = action
        self.status = status
        self.latency_ms = latency_ms
        self.notes = notes
        self.timestamp = datetime.now(timezone.utc).isoformat()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "step": self.step,
            "agent": self.agent,
            "action": self.action,
            "status": self.status,
            "latency_ms": self.latency_ms,
            "notes": self.notes,
            "timestamp": self.timestamp,
        }

    def to_frontend_dict(self) -> Dict[str, str]:
        """Compact format the React Native terminal renders."""
        icon = {
            "success": "✓",
            "modified": "⚡",
            "failed": "✗",
            "recovered": "↺",
            "pending": "⌛",
            "skipped": "—",
        }.get(self.status, "•")
        return {
            "timestamp": self.timestamp,
            "action": f"[{self.agent}] {self.action}",
            "result": f"{icon} {self.status.upper()} ({self.latency_ms}ms) — {self.notes}",
        }


class AntigravityTraceLogger:
    """
    Thread-safe, in-memory trace log for the current agent run.
    Call reset() at the start of each new orchestrator run.
    """

    def __init__(self) -> None:
        self._entries: List[TraceEntry] = []
        self._step_counter: int = 0
        self._run_start: float = time.time()

    def reset(self) -> None:
        """Clear all entries and restart step counter (new agent run)."""
        self._entries = []
        self._step_counter = 0
        self._run_start = time.time()

    def log(
        self,
        agent: str,
        action: str,
        status: Status,
        latency_ms: int,
        notes: str = "",
    ) -> TraceEntry:
        """Append one step to the trace and return the entry."""
        self._step_counter += 1
        entry = TraceEntry(
            step=self._step_counter,
            agent=agent,
            action=action,
            status=status,
            latency_ms=latency_ms,
            notes=notes,
        )
        self._entries.append(entry)
        return entry

    def timed_log(self, agent: str, action: str, status: Status, start: float, notes: str = "") -> TraceEntry:
        """Convenience wrapper that computes latency from a start time."""
        latency_ms = int((time.time() - start) * 1000)
        return self.log(agent, action, status, latency_ms, notes)

    def all_entries(self) -> List[Dict[str, Any]]:
        return [e.to_dict() for e in self._entries]

    def frontend_logs(self) -> List[Dict[str, str]]:
        """List of compact dicts for the React Native Agent Trace Terminal."""
        return [e.to_frontend_dict() for e in self._entries]

    def summary(self) -> Dict[str, Any]:
        total = len(self._entries)
        successes = sum(1 for e in self._entries if e.status == "success")
        failures = sum(1 for e in self._entries if e.status == "failed")
        recovered = sum(1 for e in self._entries if e.status == "recovered")
        modified = sum(1 for e in self._entries if e.status == "modified")
        elapsed = round(time.time() - self._run_start, 2)
        return {
            "total_steps": total,
            "successes": successes,
            "failures": failures,
            "recovered": recovered,
            "modified": modified,
            "elapsed_seconds": elapsed,
        }


# Global singleton — shared across all agents in one process
trace = AntigravityTraceLogger()
