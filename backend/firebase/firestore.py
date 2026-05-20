"""
Firestore helpers — read/write store state and agent logs.

Falls back to an in-memory dict if Firebase is not configured (demo mode).
"""
from __future__ import annotations

import os
import json
import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

_firestore_client: Optional[Any] = None
_DEMO_STORE: Dict[str, Any] = {}      # in-memory fallback

try:
    import firebase_admin
    from firebase_admin import credentials, firestore as fb_firestore
    FIREBASE_OK = True
except ImportError:
    FIREBASE_OK = False
    logger.warning("firebase-admin not installed — using in-memory store.")


def _init():
    global _firestore_client
    if _firestore_client is not None:
        return
    if not FIREBASE_OK:
        return
    project_id = os.getenv("FIREBASE_PROJECT_ID")
    if not project_id:
        logger.info("FIREBASE_PROJECT_ID not set — using in-memory store.")
        return
    try:
        if not firebase_admin._apps:
            cred_dict = {
                "type": "service_account",
                "project_id": project_id,
                "private_key_id": os.getenv("FIREBASE_PRIVATE_KEY_ID", ""),
                "private_key": os.getenv("FIREBASE_PRIVATE_KEY", "").replace("\\n", "\n"),
                "client_email": os.getenv("FIREBASE_CLIENT_EMAIL", ""),
                "client_id": os.getenv("FIREBASE_CLIENT_ID", ""),
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
            cred = credentials.Certificate(cred_dict)
            firebase_admin.initialize_app(cred)
        _firestore_client = fb_firestore.client()
        logger.info("Firestore initialized for project '%s'", project_id)
    except Exception as exc:
        logger.error("Firestore init failed: %s — falling back to in-memory", exc)


def get_store_state() -> Dict[str, Any]:
    """Return the latest GarKS store state document."""
    _init()
    if _firestore_client:
        try:
            doc = _firestore_client.collection("store_state").document("current").get()
            if doc.exists:
                return doc.to_dict()
        except Exception as exc:
            logger.error("Firestore read error: %s", exc)
    return _DEMO_STORE.get("store_state", _default_store_state())


def set_store_state(data: Dict[str, Any]) -> None:
    _init()
    _DEMO_STORE["store_state"] = data
    if _firestore_client:
        try:
            _firestore_client.collection("store_state").document("current").set(data)
        except Exception as exc:
            logger.error("Firestore write error: %s", exc)


def get_inventory() -> List[Dict[str, Any]]:
    _init()
    if _firestore_client:
        try:
            docs = _firestore_client.collection("inventory").stream()
            return [d.to_dict() for d in docs]
        except Exception as exc:
            logger.error("Firestore inventory read: %s", exc)
    return _DEMO_STORE.get("inventory", _default_inventory())


def update_inventory_item(item_id: str, data: Dict[str, Any]) -> None:
    _init()
    inv = _DEMO_STORE.setdefault("inventory", _default_inventory())
    for i, item in enumerate(inv):
        if item.get("id") == item_id or item.get("sku") == item_id:
            inv[i].update(data)
            break
    _DEMO_STORE["inventory"] = inv
    if _firestore_client:
        try:
            _firestore_client.collection("inventory").document(item_id).set(data, merge=True)
        except Exception as exc:
            logger.error("Firestore update_inventory: %s", exc)


def add_agent_log(log_entry: Dict[str, Any]) -> None:
    _init()
    logs = _DEMO_STORE.setdefault("agent_logs", [])
    logs.append(log_entry)
    if _firestore_client:
        try:
            _firestore_client.collection("agent_logs").add(log_entry)
        except Exception as exc:
            logger.error("Firestore add_agent_log: %s", exc)


def get_agent_logs(limit: int = 50) -> List[Dict[str, Any]]:
    _init()
    if _firestore_client:
        try:
            docs = (
                _firestore_client.collection("agent_logs")
                .order_by("timestamp", direction=fb_firestore.Query.DESCENDING)
                .limit(limit)
                .stream()
            )
            return [d.to_dict() for d in docs]
        except Exception as exc:
            logger.error("Firestore get_agent_logs: %s", exc)
    logs = _DEMO_STORE.get("agent_logs", [])
    return list(reversed(logs[-limit:]))


def save_insight(insight: Dict[str, Any]) -> None:
    _init()
    _DEMO_STORE["latest_insight"] = insight
    if _firestore_client:
        try:
            _firestore_client.collection("insights").document("latest").set(insight)
        except Exception as exc:
            logger.error("Firestore save_insight: %s", exc)


def get_latest_insight() -> Optional[Dict[str, Any]]:
    _init()
    if _firestore_client:
        try:
            doc = _firestore_client.collection("insights").document("latest").get()
            if doc.exists:
                return doc.to_dict()
        except Exception as exc:
            logger.error("Firestore get_latest_insight: %s", exc)
    return _DEMO_STORE.get("latest_insight")


def save_action_result(result: Dict[str, Any]) -> None:
    _init()
    _DEMO_STORE["latest_action_result"] = result
    if _firestore_client:
        try:
            _firestore_client.collection("action_results").document("latest").set(result)
        except Exception as exc:
            logger.error("Firestore save_action_result: %s", exc)


def get_latest_action_result() -> Optional[Dict[str, Any]]:
    _init()
    if _firestore_client:
        try:
            doc = _firestore_client.collection("action_results").document("latest").get()
            if doc.exists:
                return doc.to_dict()
        except Exception as exc:
            logger.error("Firestore get_latest_action_result: %s", exc)
    return _DEMO_STORE.get("latest_action_result")


# ─────────────────────────── DEFAULT DEMO DATA ───────────────────────────────

def _default_store_state() -> Dict[str, Any]:
    return {
        "saleActive": False,
        "saleDiscount": 0,
        "saleEndTime": None,
        "stockoutRisk": "CRITICAL",
        "revenueChange": -15,
        "kpiRevenue": 45231,
        "kpiOrders": 1284,
        "kpiCustomers": 10902,
    }


def _default_inventory() -> List[Dict[str, Any]]:
    return [
        {"id": "m3", "sku": "JK-LE-003", "name": "Biker Leather Jacket",
         "stock": 0, "price": 295, "category": "Leather Jackets",
         "onSale": False, "originalPrice": None},
        {"id": "m1", "sku": "SH-OX-001", "name": "Premium Oxford Shirt",
         "stock": 24, "price": 85, "category": "Shirts",
         "onSale": False, "originalPrice": None},
        {"id": "w4", "sku": "SW-CS-009", "name": "Cashmere Sweater",
         "stock": 0, "price": 210, "category": "Women",
         "onSale": False, "originalPrice": None},
    ]
