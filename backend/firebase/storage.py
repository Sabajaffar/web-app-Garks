"""Firebase Storage helpers — upload/download parsed documents."""
from __future__ import annotations

import io
import logging
import os
from typing import Optional

logger = logging.getLogger(__name__)

try:
    from firebase_admin import storage as fb_storage
    STORAGE_OK = True
except ImportError:
    STORAGE_OK = False


def upload_file(file_bytes: bytes, destination_path: str, content_type: str = "application/octet-stream") -> Optional[str]:
    """
    Upload bytes to Firebase Storage bucket.
    Returns public URL or None on failure.
    """
    if not STORAGE_OK or not os.getenv("FIREBASE_STORAGE_BUCKET"):
        logger.info("Firebase Storage not configured — skipping upload for '%s'", destination_path)
        return None
    try:
        bucket = fb_storage.bucket()
        blob = bucket.blob(destination_path)
        blob.upload_from_file(io.BytesIO(file_bytes), content_type=content_type)
        blob.make_public()
        return blob.public_url
    except Exception as exc:
        logger.error("Firebase Storage upload failed: %s", exc)
        return None


def download_file(storage_path: str) -> Optional[bytes]:
    """Download a file from Firebase Storage by path. Returns bytes or None."""
    if not STORAGE_OK or not os.getenv("FIREBASE_STORAGE_BUCKET"):
        return None
    try:
        bucket = fb_storage.bucket()
        blob = bucket.blob(storage_path)
        return blob.download_as_bytes()
    except Exception as exc:
        logger.error("Firebase Storage download failed: %s", exc)
        return None
