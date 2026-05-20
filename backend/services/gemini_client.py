"""
Gemini 1.5 Pro client — all prompts live here.

All other modules call functions in this file instead of calling the Gemini
SDK directly, so prompts can be tuned in one place.
"""
from __future__ import annotations

import os
import json
import time
import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

try:
    from google import genai
    from google.genai import types as genai_types
    GEMINI_OK = True
except ImportError:
    GEMINI_OK = False
    logger.warning("google-genai not installed — Gemini calls will return mock data.")

_client: Optional[Any] = None


def _get_client() -> Any:
    global _client
    if _client is None and GEMINI_OK:
        api_key = os.getenv("GEMINI_API_KEY", "")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY not set in environment")
        _client = genai.Client(api_key=api_key)
    return _client


def _call(prompt: str, temperature: float = 0.3, max_tokens: int = 2048) -> str:
    """Low-level wrapper — retries once on transient errors."""
    client = _get_client()
    for attempt in range(2):
        try:
            response = client.models.generate_content(
                model="gemini-1.5-pro",
                contents=prompt,
                config=genai_types.GenerateContentConfig(
                    temperature=temperature,
                    max_output_tokens=max_tokens,
                ),
            )
            return response.text or ""
        except Exception as exc:
            if attempt == 0:
                logger.warning("Gemini call failed (attempt 1): %s — retrying", exc)
                time.sleep(1)
            else:
                raise


# ─────────────────────────── PROMPTS ─────────────────────────────────────────

def extract_insights(documents: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Intelligence Agent prompt — extract problems, risks, opportunities from
    multiple parsed documents.

    Returns structured JSON: { problems, risks, opportunities, summary,
                                confidence_scores }
    """
    docs_text = ""
    for i, doc in enumerate(documents, 1):
        docs_text += f"\n--- Document {i}: {doc.get('source', 'unknown')} ---\n"
        docs_text += doc.get("text", "")[:3000]   # cap per-document

    prompt = f"""You are an AI analyst for GarKS, a premium garments store.
Analyze the following business documents and extract actionable intelligence.

DOCUMENTS:
{docs_text}

Return ONLY valid JSON in this exact schema (no markdown, no extra text):
{{
  "problems": ["problem1", "problem2"],
  "risks": ["risk1", "risk2"],
  "opportunities": ["opp1", "opp2"],
  "summary": "2-3 sentence executive summary",
  "confidence_scores": {{
    "inventory": 0.0,
    "sales": 0.0,
    "supplier": 0.0,
    "marketing": 0.0
  }},
  "key_metrics": {{
    "revenue_trend": "increasing|decreasing|stable",
    "stock_risk": "LOW|MEDIUM|HIGH|CRITICAL",
    "supplier_reliability": "HIGH|MEDIUM|LOW"
  }}
}}"""

    if not GEMINI_OK or not os.getenv("GEMINI_API_KEY"):
        return _mock_insights()

    raw = _call(prompt, temperature=0.2)
    try:
        raw = raw.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        return json.loads(raw)
    except Exception:
        logger.error("Failed to parse Gemini insights JSON: %s", raw[:200])
        return _mock_insights()


def detect_contradictions(sources: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Intelligence Agent prompt — find conflicts across multiple sources.

    Returns list of contradictions: [{ metric, source_a, source_b,
                                        claim_a, claim_b, conflict_score,
                                        resolution }]
    """
    sources_text = ""
    for s in sources:
        sources_text += f"\nSource: {s.get('name')} (timestamp: {s.get('timestamp')})\n"
        sources_text += s.get("text", "")[:1500]

    prompt = f"""You are a data integrity auditor for GarKS.
Compare the following data sources and identify factual contradictions.

SOURCES:
{sources_text}

Return ONLY valid JSON array of contradictions (no markdown):
[
  {{
    "metric": "what is being contradicted (e.g. Leather Jacket stock)",
    "source_a": "source name",
    "source_b": "source name",
    "claim_a": "what source A claims",
    "claim_b": "what source B claims",
    "conflict_score": 0.87,
    "resolution": "which source is more credible and why",
    "recommended_action": "specific action to resolve"
  }}
]

If no contradictions found, return empty array [].
Focus on stock levels, sales figures, prices, and delivery timelines."""

    if not GEMINI_OK or not os.getenv("GEMINI_API_KEY"):
        return _mock_contradictions()

    raw = _call(prompt, temperature=0.1)
    try:
        raw = raw.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        result = json.loads(raw)
        return result if isinstance(result, list) else _mock_contradictions()
    except Exception:
        logger.error("Failed to parse contradictions JSON")
        return _mock_contradictions()


def plan_action_chain(
    insights: Dict[str, Any],
    contradictions: List[Dict],
    store_state: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Orchestrator prompt — generate 3-5 connected actions given analysis.

    Returns: { action_chain, recommended_discount, recommended_duration,
               reasoning, sale_recommended }
    """
    prompt = f"""You are ShopAgent, the autonomous retail AI for GarKS premium garments.

CURRENT STORE STATE:
{json.dumps(store_state, indent=2)[:1500]}

DETECTED PROBLEMS:
{json.dumps(insights.get('problems', []))}

CONTRADICTIONS FOUND:
{json.dumps(contradictions[:3])}

RISK LEVEL: {insights.get('key_metrics', {}).get('stock_risk', 'MEDIUM')}

Generate a connected action chain of 3-5 steps to resolve these issues.
Each action must depend on the previous one. Budget limit is PKR 50,000.

Return ONLY valid JSON (no markdown):
{{
  "reasoning": "2-3 sentence explanation of the strategy",
  "sale_recommended": true,
  "recommended_discount": 15,
  "recommended_duration": 6,
  "action_chain": [
    {{
      "id": 1,
      "name": "Action Name",
      "description": "What this action does",
      "status": "awaiting_approval",
      "reasoning": "Why this action is needed",
      "constraint_check": "Budget: PKR X / PKR 50000 — PASS",
      "estimated_cost_pkr": 0,
      "rollback": "How to undo this action"
    }}
  ]
}}"""

    if not GEMINI_OK or not os.getenv("GEMINI_API_KEY"):
        return _mock_action_chain()

    raw = _call(prompt, temperature=0.3)
    try:
        raw = raw.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        return json.loads(raw)
    except Exception:
        logger.error("Failed to parse action chain JSON")
        return _mock_action_chain()


def modify_for_constraint(
    action: Dict[str, Any],
    violation_reason: str,
    budget_remaining: float,
) -> Dict[str, Any]:
    """
    Constraint checker prompt — when an action violates a constraint,
    ask Gemini to generate a feasible alternative.

    Returns modified action dict.
    """
    prompt = f"""The following action for GarKS violates a constraint:

ACTION: {json.dumps(action)}
VIOLATION: {violation_reason}
AVAILABLE BUDGET: PKR {budget_remaining}

Generate a modified version of this action that fits within the constraints.
Return ONLY valid JSON with the same schema as the input action, but with:
- Adjusted cost to fit within PKR {budget_remaining}
- Updated name to reflect it's a partial/modified action
- status: "modified"
- A note in constraint_check explaining the modification"""

    if not GEMINI_OK or not os.getenv("GEMINI_API_KEY"):
        modified = dict(action)
        modified["estimated_cost_pkr"] = int(budget_remaining * 0.96)
        modified["name"] = f"Partial: {action.get('name', 'Action')}"
        modified["status"] = "modified"
        modified["constraint_check"] = (
            f"Budget exceeded — modified to PKR {int(budget_remaining * 0.96)} "
            f"(partial order) / PKR {int(budget_remaining)} remaining — PASS"
        )
        return modified

    raw = _call(prompt, temperature=0.2)
    try:
        raw = raw.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        result = json.loads(raw)
        result["status"] = "modified"
        return result
    except Exception:
        modified = dict(action)
        modified["status"] = "modified"
        modified["estimated_cost_pkr"] = int(budget_remaining * 0.96)
        return modified


def generate_fallback_action(failed_action: Dict[str, Any], error: str) -> Dict[str, Any]:
    """Recovery Engine prompt — generate a fallback when an action fails permanently."""
    prompt = f"""Action failed in the GarKS autonomous system:

FAILED ACTION: {json.dumps(failed_action)}
ERROR: {error}

Generate a simpler fallback action that achieves the same business goal
with lower risk. Return ONLY valid JSON matching the action schema."""

    if not GEMINI_OK or not os.getenv("GEMINI_API_KEY"):
        fallback = dict(failed_action)
        fallback["name"] = f"Fallback: {failed_action.get('name', 'Action')}"
        fallback["status"] = "recovered"
        fallback["description"] = "Simplified fallback: manual notification sent to warehouse team."
        return fallback

    raw = _call(prompt, temperature=0.3)
    try:
        raw = raw.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        return json.loads(raw)
    except Exception:
        fallback = dict(failed_action)
        fallback["status"] = "recovered"
        return fallback


_FASHION_KEYWORDS = {
    "dress", "jacket", "shirt", "trousers", "pant", "suit", "coat", "sweater",
    "polo", "fabric", "leather", "cotton", "wool", "silk", "collection",
    "fashion", "style", "outfit", "wardrobe", "size", "colour", "color",
    "wear", "garment", "cloth", "sale", "discount", "price", "order", "delivery",
    "return", "shipping", "garks", "brand", "store", "shop", "buy", "recommend",
}
_OFFTOPIC_KEYWORDS = {
    "weather", "politics", "news", "sports", "cricket", "football", "food",
    "recipe", "cook", "movie", "music", "song", "code", "programming", "math",
    "capital", "country", "history", "science", "medicine", "doctor",
}


def _is_offtopic(message: str) -> bool:
    words = set(message.lower().split())
    if words & _OFFTOPIC_KEYWORDS and not words & _FASHION_KEYWORDS:
        return True
    return False


def chat_with_gargi(
    message: str,
    is_admin: bool,
    context: Dict[str, Any],
) -> str:
    """Gargi AI concierge — conversational response for in-app chat."""
    role = "the GarKS Admin" if is_admin else "a valued GarKS customer"
    agent_context = ""
    if context.get("agentAnalysis"):
        agent_context = f"\nLatest Agent Analysis: {json.dumps(context['agentAnalysis'])[:500]}"

    # Demo mode — no API key
    if not GEMINI_OK or not os.getenv("GEMINI_API_KEY"):
        if is_admin:
            msg_lower = message.lower()
            if "stock" in msg_lower or "inventory" in msg_lower:
                return "Live inventory check: Biker Leather Jacket is at 0 units — critically depleted. Cashmere Sweater also out. Emergency reorder of PKR 48,000 is recommended. Shall I trigger the full agent pipeline?"
            if "sale" in msg_lower or "revenue" in msg_lower or "discount" in msg_lower:
                return "Revenue is down 14.2% vs last week, driven by the Leather Jacket stockout. A 15% Winter Collection flash sale for 6 hours would recover approximately PKR 18,000. Ready to launch — tap 'Apply Strategy' in the AI Lab."
            if "agent" in msg_lower or "run" in msg_lower or "analys" in msg_lower:
                return "Running a quick analysis now... Stock risk: CRITICAL. Two items depleted. Contradiction score 0.87 on inventory data. I recommend opening the AI Lab for the full 5-step action chain."
            return "Analyzing store metrics... Revenue trending down 14.2% this week. Leather Jacket stock is critically low — recommend emergency reorder from Tuscan Leather S.p.A. A 15% flash sale on Winter Collection would accelerate turnover."
        # Customer mode
        if _is_offtopic(message):
            return "I'm your dedicated GarKS fashion concierge — I'm best at helping with our collections, style advice, sizing, and orders. What can I help you discover today?"
        return "Welcome to GarKS! Our Biker Leather Jacket in black is a bestseller this season. May I help you find your perfect size or suggest complementary pieces from our Winter Collection?"

    prompt = f"""You are Gargi, the AI Fashion Concierge for GarKS — a premium garments brand.
You are speaking with {role} named {context.get('userName', 'the user')}.{agent_context}

User message: "{message}"

{"As an admin query, provide operational insights, agent analysis summaries, and specific actionable recommendations (reorder quantities, sale percentages, campaign targets)." if is_admin else "As a customer query, be helpful, warm and sophisticated about GarKS products, fashion advice, sizing, and orders. If the user asks about anything unrelated to fashion, clothing, or GarKS (e.g. weather, politics, coding, sports), politely respond: 'I'm your dedicated fashion concierge — let me help you with style or our collections instead!'"}

Respond in 2-4 sentences. Be direct and specific. No markdown, plain text only."""

    return _call(prompt, temperature=0.7, max_tokens=256)


# ─────────────────────────── MOCK FALLBACKS ──────────────────────────────────

def _mock_insights() -> Dict[str, Any]:
    return {
        "problems": [
            "Leather Jacket inventory CSV is 3 days stale — shows 80 units but sales data indicates depletion",
            "Stock contradiction detected: warehouse records not synced with real-time sales feed",
            "Highway N-55 logistics bottleneck causing 2-day delivery delays",
        ],
        "risks": [
            "Stockout risk HIGH for Leather Jackets within 24 hours",
            "Revenue declining due to supply chain disruption",
            "Customer satisfaction risk if orders cannot be fulfilled",
        ],
        "opportunities": [
            "Launch 15% flash sale on Winter Collection to clear existing stock",
            "Emergency reorder from Tuscan Leather S.p.A (PKR 48,000 partial order within budget)",
            "Update product badges to 'Limited Stock' to create urgency and boost conversions",
        ],
        "summary": (
            "Critical stock contradiction detected: warehouse CSV shows 80 Leather Jackets "
            "but 7-day sales feed confirms 84 units consumed — actual stock is depleted. "
            "Immediate reorder and flash sale strategy recommended to maintain revenue."
        ),
        "confidence_scores": {
            "inventory": 0.41,
            "sales": 0.97,
            "supplier": 0.78,
            "marketing": 0.82,
        },
        "key_metrics": {
            "revenue_trend": "decreasing",
            "stock_risk": "CRITICAL",
            "supplier_reliability": "HIGH",
        },
    }


def _mock_contradictions() -> List[Dict[str, Any]]:
    return [
        {
            "metric": "Leather Jacket stock level",
            "source_a": "inventory.csv (3 days old)",
            "source_b": "sales_realtime.json (today)",
            "claim_a": "80 units available in warehouse",
            "claim_b": "84 units sold in last 7 days (12/day average)",
            "conflict_score": 0.87,
            "resolution": (
                "sales_realtime.json is more credible — it is real-time data vs "
                "a 3-day-old CSV snapshot. Actual stock is likely 0 or negative."
            ),
            "recommended_action": "Immediately validate warehouse physical stock and halt new orders",
        }
    ]


def _mock_action_chain() -> Dict[str, Any]:
    return {
        "reasoning": (
            "Stock contradiction (score 0.87) indicates Leather Jacket depletion. "
            "Chain: validate → reorder (budget-constrained) → badge update → flash promo → monitoring."
        ),
        "sale_recommended": True,
        "recommended_discount": 15,
        "recommended_duration": 6,
        "action_chain": [
            {
                "id": 1,
                "name": "Validate Warehouse Stock",
                "description": "Cross-check physical inventory against CSV and sales data",
                "status": "awaiting_approval",
                "reasoning": "Contradiction score 0.87 — physical count needed before any reorder",
                "constraint_check": "No cost — PASS",
                "estimated_cost_pkr": 0,
                "rollback": "N/A — read-only validation",
            },
            {
                "id": 2,
                "name": "Emergency Partial Reorder (PKR 48,000)",
                "description": "Place emergency reorder with Tuscan Leather S.p.A — 80 units at PKR 600/unit",
                "status": "awaiting_approval",
                "reasoning": "Full reorder PKR 75,000 exceeds budget — Gemini modified to partial order PKR 48,000",
                "constraint_check": "Original PKR 75,000 EXCEEDED budget PKR 50,000 → Modified to PKR 48,000 — PASS",
                "estimated_cost_pkr": 48000,
                "rollback": "Cancel PO within 2 hours of submission",
            },
            {
                "id": 3,
                "name": "Update Product Badge",
                "description": "Mark Leather Jacket as 'Limited Stock' on product listing",
                "status": "awaiting_approval",
                "reasoning": "Create purchase urgency while reorder is in transit",
                "constraint_check": "No cost — PASS",
                "estimated_cost_pkr": 0,
                "rollback": "Revert badge to standard listing",
            },
            {
                "id": 4,
                "name": "Launch 15% Winter Collection Flash Promo",
                "description": "Activate 15% discount on Winter Collection for 6 hours via push notification",
                "status": "awaiting_approval",
                "reasoning": "Offset Leather Jacket stockout impact by boosting other winter items",
                "constraint_check": "Marketing cost PKR 0 (push only) — PASS",
                "estimated_cost_pkr": 0,
                "rollback": "Deactivate promo via admin dashboard",
            },
            {
                "id": 5,
                "name": "Schedule 6-Hourly Monitoring",
                "description": "Enable heightened monitoring for 24 hours — check stock every 6 hours",
                "status": "awaiting_approval",
                "reasoning": "Ensure reorder arrival and stock levels stay tracked during recovery",
                "constraint_check": "No cost — PASS",
                "estimated_cost_pkr": 0,
                "rollback": "Revert to standard 5-minute monitoring interval",
            },
        ],
    }
