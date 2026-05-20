"""
GarKS Backend — FastAPI + Multi-Agent System
============================================

Start: uvicorn main:app --host 0.0.0.0 --port 8000 --reload

Also serves as the Mock API (port 3001 path) for the React Native frontend
source-loading pings via /warehouse, /supplier_email, etc.
"""
from __future__ import annotations

import asyncio
import json
import logging
import os
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Set

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, Query, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="GarKS Agentic Backend",
    description="Multi-agent retail intelligence system powered by Gemini 1.5 Pro",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────── WebSocket Manager ───────────────────────────────────

class ConnectionManager:
    def __init__(self):
        self.active: Set[WebSocket] = set()

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.add(ws)
        logger.info("WebSocket client connected (total: %d)", len(self.active))

    def disconnect(self, ws: WebSocket):
        self.active.discard(ws)
        logger.info("WebSocket client disconnected (total: %d)", len(self.active))

    async def broadcast(self, data: Dict[str, Any]):
        if not self.active:
            return
        message = json.dumps(data)
        dead: Set[WebSocket] = set()
        for ws in list(self.active):
            try:
                await ws.send_text(message)
            except Exception:
                dead.add(ws)
        for ws in dead:
            self.active.discard(ws)


ws_manager = ConnectionManager()


async def _broadcast(event: Dict[str, Any]) -> None:
    await ws_manager.broadcast(event)


# ─────────────────────── Inject broadcast into agents ────────────────────────

@app.on_event("startup")
async def startup():
    from agents import monitoring, intelligence, action
    monitoring.set_broadcast(_broadcast)
    intelligence.set_broadcast(_broadcast)
    action.set_broadcast(_broadcast)
    logger.info("GarKS backend started — agents initialized")


# ─────────────────────── Request / Response Models ───────────────────────────

class ApproveSaleRequest(BaseModel):
    discount: int = 15
    duration: int = 6


class ApproveMarketingRequest(BaseModel):
    campaignType: str = "Send promotional push notification to customers"
    targetAudience: str = "Wishlist Customers"
    estimatedReach: str = "1,200 users"


class ChatRequest(BaseModel):
    message: str
    isAdmin: bool = False
    context: Dict[str, Any] = {}


class ExecuteSaleRequest(BaseModel):
    discount: int = 20
    duration: int = 4


# ─────────────────────── WebSocket Endpoint ──────────────────────────────────

@app.websocket("/ws/admin")
async def websocket_admin(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                if msg.get("type") == "ping":
                    await websocket.send_text(json.dumps({"type": "pong"}))
            except Exception:
                pass
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)


# ─────────────────────── Intelligence / Upload ───────────────────────────────

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    Accept a document upload, trigger Intelligence Agent pipeline.
    Returns insight JSON immediately (pipeline runs async; WS pushes progress).
    """
    content = await file.read()
    from agents.orchestrator import run_pipeline
    try:
        result = await run_pipeline(content, file.filename)
        return result
    except Exception as exc:
        logger.error("Upload pipeline error: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/insights")
async def get_insights():
    """Return latest insight summary with contradiction details."""
    from firebase.firestore import get_latest_insight
    from services.gemini_client import _mock_insights, _mock_contradictions
    insight = get_latest_insight()
    if not insight:
        insight = {
            "summary": _mock_insights()["summary"],
            "problems": _mock_insights()["problems"],
            "contradictions": _mock_contradictions(),
            "confidence_scores": _mock_insights()["confidence_scores"],
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    return insight


# ─────────────────────── Orchestrator Endpoints ──────────────────────────────

@app.get("/api/orchestrator/run")
async def orchestrator_run():
    """
    Trigger full Intelligence Agent pipeline using mock data.
    Returns awaiting_approval response with action chain.
    """
    from agents.orchestrator import run_pipeline
    result = await run_pipeline()
    return result


@app.post("/api/orchestrator/approve-sale")
async def orchestrator_approve_sale(req: ApproveSaleRequest):
    """Admin approved flash sale — trigger Action Agent."""
    from agents.orchestrator import approve_sale
    result = await approve_sale(req.discount, req.duration)
    return result


@app.post("/api/orchestrator/approve-marketing")
async def orchestrator_approve_marketing(req: ApproveMarketingRequest):
    """Admin approved marketing campaign — trigger Action Agent."""
    from agents.orchestrator import approve_marketing
    result = await approve_marketing(req.campaignType, req.targetAudience, req.estimatedReach)
    return result


# ─────────────────────── Action Endpoints ────────────────────────────────────

@app.post("/approve-action")
async def approve_action(body: Dict[str, Any]):
    """Admin approves a specific action chain (generic endpoint)."""
    action_chain = body.get("action_chain", [])
    if not action_chain:
        from agents.orchestrator import get_run_state
        state = get_run_state()
        action_chain = (state.get("insight_result") or {}).get("action_chain", [])
    from agents.action import run as action_run
    result = await action_run(action_chain)
    return result


@app.get("/action-status")
async def action_status():
    """Return current action chain progress and full Antigravity trace."""
    from agents.orchestrator import get_run_state
    from antigravity.trace_logger import trace
    from firebase.firestore import get_latest_action_result
    state = get_run_state()
    return {
        "status": state.get("status", "idle"),
        "started_at": state.get("started_at"),
        "completed_at": state.get("completed_at"),
        "action_result": state.get("action_result") or get_latest_action_result(),
        "trace": trace.frontend_logs(),
        "summary": trace.summary(),
    }


# ─────────────────────── Agent Endpoints (React Native) ──────────────────────

@app.get("/api/agent/logs")
async def get_agent_logs():
    """
    Return Antigravity trace logs for the React Native terminal widget.
    Format: [{ timestamp, action, result }]
    """
    from antigravity.trace_logger import trace
    from firebase.firestore import get_agent_logs
    logs = trace.frontend_logs()
    if not logs:
        logs = get_agent_logs(limit=20)
    return logs


@app.get("/api/agent/products")
async def get_products():
    """Return product catalog with current sale prices."""
    from firebase.firestore import get_store_state, get_inventory
    store_state = get_store_state()
    inventory = get_inventory()
    return {
        "products": inventory,
        "saleActive": store_state.get("saleActive", False),
        "saleDiscount": store_state.get("saleDiscount", 0),
        "saleEndTime": store_state.get("saleEndTime"),
    }


@app.post("/api/agent/end-sale")
async def end_sale():
    """End active flash sale and restore original prices."""
    from firebase.firestore import get_store_state, set_store_state, get_inventory, update_inventory_item
    from antigravity.trace_logger import trace
    store_state = get_store_state()
    store_state["saleActive"] = False
    store_state["saleDiscount"] = 0
    store_state["saleEndTime"] = None
    set_store_state(store_state)
    trace.log("ActionAgent", "Flash sale terminated", "success", 0, "Catalog prices restored")
    await _broadcast({"type": "sale_ended", "timestamp": datetime.now(timezone.utc).isoformat()})
    return {"success": True, "message": "Flash sale ended"}


@app.post("/api/agent/run")
async def run_agent():
    """
    Quick agent analysis triggered from Gargi chat.
    Returns risk assessment without full pipeline.
    """
    from firebase.firestore import get_store_state, get_inventory
    from antigravity.trace_logger import trace
    store_state = get_store_state()
    inventory = get_inventory()
    low_stock = [p for p in inventory if p.get("stock", 999) < 10]
    risk = "CRITICAL" if len(low_stock) > 2 else "HIGH" if low_stock else "LOW"
    trace.log("MonitoringAgent", "Quick agent analysis", "success", 50,
              f"Risk: {risk}, Low stock items: {len(low_stock)}")
    return {
        "risk_level": risk,
        "sale_recommended": risk in ("HIGH", "CRITICAL"),
        "recommended_discount": 20 if risk == "CRITICAL" else 15,
        "recommended_duration": 4,
        "low_stock_items": [{"name": p.get("name"), "stock": p.get("stock")} for p in low_stock[:3]],
    }


@app.post("/api/agent/execute-sale")
async def execute_sale(req: ExecuteSaleRequest):
    """Execute a flash sale directly (triggered from Gargi inline approval)."""
    from firebase.firestore import get_store_state, set_store_state
    from antigravity.trace_logger import trace
    store_state = get_store_state()
    from datetime import timedelta
    end_time = datetime.now(timezone.utc) + timedelta(hours=req.duration)
    store_state["saleActive"] = True
    store_state["saleDiscount"] = req.discount
    store_state["saleEndTime"] = end_time.isoformat()
    set_store_state(store_state)
    trace.log("ActionAgent", f"Flash sale launched via Gargi", "success", 100,
              f"{req.discount}% off for {req.duration}h")
    await _broadcast({
        "type": "sale_launched",
        "discount": req.discount,
        "duration": req.duration,
        "end_time": end_time.isoformat(),
    })
    return {"success": True, "discount": req.discount, "duration": req.duration}


# ─────────────────────── Gargi Chat ──────────────────────────────────────────

@app.post("/api/gargi/chat")
async def gargi_chat(req: ChatRequest):
    """Gargi AI concierge — conversational endpoint."""
    from services.gemini_client import chat_with_gargi
    try:
        response_text = chat_with_gargi(req.message, req.isAdmin, req.context)
        return {"text": response_text}
    except Exception as exc:
        logger.error("Gargi chat error: %s", exc)
        return {"text": "I'm momentarily unavailable. Please try again in a moment."}


# ─────────────────────── Dashboard ───────────────────────────────────────────

@app.get("/dashboard")
async def get_dashboard():
    """Before vs after metrics for outcome visualization."""
    from firebase.firestore import get_store_state, get_latest_action_result
    state = get_store_state()
    action_result = get_latest_action_result()
    return {
        "before": {
            "leather_jacket_stock": 80,
            "actual_stock": 0,
            "revenue_pkr": state.get("kpiRevenue", 45231),
            "sale_active": False,
            "contradiction_score": 0.87,
        },
        "after": {
            "leather_jacket_stock": 80 if action_result else 0,
            "reorder_placed": bool(action_result),
            "reorder_cost_pkr": 48000,
            "sale_active": state.get("saleActive", False),
            "sale_discount": state.get("saleDiscount", 0),
            "badge_updated": bool(action_result),
            "monitoring_heightened": state.get("monitoring_interval_hours", 5) <= 6,
        },
        "trace_summary": action_result.get("summary") if action_result else None,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/monitoring")
async def get_monitoring():
    """Return latest monitoring agent findings."""
    from agents.monitoring import run_cycle
    try:
        result = await run_cycle()
        return result
    except Exception as exc:
        logger.error("Monitoring endpoint error: %s", exc)
        return {"alerts": [], "error": str(exc), "timestamp": datetime.now(timezone.utc).isoformat()}


# ─────────────────────── Mock Source Endpoints (port 3001 compat) ────────────
# These serve the 5 data sources the frontend pings on the AIIntelligence screen.

def _load_mock(filename: str) -> Any:
    import os
    path = os.path.join(os.path.dirname(__file__), "mock_data", filename)
    if os.path.exists(path):
        with open(path) as f:
            if filename.endswith(".json"):
                return json.load(f)
            return f.read()
    return {}


@app.get("/warehouse")
async def get_warehouse():
    return _load_mock("inventory.csv") or {"status": "ok"}


@app.get("/supplier_email")
async def get_supplier_email():
    return _load_mock("supplier_report_mock.json")


@app.get("/sales_dashboard")
async def get_sales_dashboard():
    data = _load_mock("sales_realtime.json")
    if isinstance(data, dict):
        data["suggested_discount"] = data.get("revenue_summary", {}).get("suggested_discount", 15)
        data["suggested_duration"] = data.get("revenue_summary", {}).get("suggested_duration_hours", 6)
    return data


@app.get("/customer_reviews")
async def get_customer_reviews():
    return _load_mock("marketing_results_mock.json")


@app.get("/news_feed")
async def get_news_feed():
    return _load_mock("news_mock.json")


@app.get("/store_state")
async def get_store_state_endpoint():
    from firebase.firestore import get_store_state
    state = get_store_state()
    return {
        **state,
        "product": "Biker Leather Jacket",
        "product_category": "Leather Jackets",
        "stockout_risk": state.get("stockoutRisk", "CRITICAL"),
        "stock_risk": state.get("stockoutRisk", "CRITICAL"),
        "revenueChange": state.get("revenueChange", -14.2),
    }


# ─────────────────────── Health Check ────────────────────────────────────────

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "GarKS Agentic Backend",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "gemini_key_set": bool(os.getenv("GEMINI_API_KEY")),
        "firebase_set": bool(os.getenv("FIREBASE_PROJECT_ID")),
        "websocket_connections": len(ws_manager.active),
    }


@app.get("/")
async def root():
    return {"message": "GarKS Agentic Backend running. Visit /docs for API reference."}


# ─────────────────────── Entry Point ─────────────────────────────────────────

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
