"""
Celery configuration for background task scheduling.

Usage:
  Start worker:    celery -A celery_config worker --loglevel=info
  Start beat:      celery -A celery_config beat --loglevel=info
  Combined (dev):  celery -A celery_config worker --beat --loglevel=info
"""
import os
from celery import Celery
from celery.schedules import crontab

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

app = Celery(
    "garks_agents",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["celery_tasks"],
)

app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Karachi",
    enable_utc=True,
    task_track_started=True,
    worker_max_tasks_per_child=50,
    task_acks_late=True,
)

# ── Beat Schedule ─────────────────────────────────────────────────────────────

app.conf.beat_schedule = {
    # Monitoring Agent runs every 5 minutes
    "monitoring-every-5-minutes": {
        "task": "celery_tasks.run_monitoring_cycle",
        "schedule": crontab(minute="*/5"),
        "options": {"queue": "monitoring"},
    },
    # Heightened monitoring check (runs every 1 min, skips if not in heightened mode)
    "monitoring-heightened-check": {
        "task": "celery_tasks.check_heightened_monitoring",
        "schedule": crontab(minute="*/1"),
        "options": {"queue": "monitoring"},
    },
}

app.conf.task_queues = {
    "monitoring": {"exchange": "monitoring", "routing_key": "monitoring"},
    "intelligence": {"exchange": "intelligence", "routing_key": "intelligence"},
    "action": {"exchange": "action", "routing_key": "action"},
    "default": {"exchange": "default", "routing_key": "default"},
}
