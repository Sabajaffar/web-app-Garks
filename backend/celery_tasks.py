"""Celery task definitions — thin wrappers that delegate to agent modules."""
import asyncio
import logging
from celery_config import app
from firebase.firestore import get_store_state

logger = logging.getLogger(__name__)


@app.task(name="celery_tasks.run_monitoring_cycle", bind=True, max_retries=3)
def run_monitoring_cycle(self):
    """Periodic monitoring cycle — runs every 5 minutes via beat."""
    try:
        from agents.monitoring import run_cycle
        result = asyncio.get_event_loop().run_until_complete(run_cycle())
        logger.info("Monitoring cycle completed: %s alerts", len(result.get("alerts", [])))
        return result
    except Exception as exc:
        logger.error("Monitoring cycle failed: %s", exc)
        raise self.retry(exc=exc, countdown=30)


@app.task(name="celery_tasks.check_heightened_monitoring", bind=True)
def check_heightened_monitoring(self):
    """Check if heightened monitoring is active and run shorter cycle."""
    try:
        store_state = get_store_state()
        interval = store_state.get("monitoring_interval_hours", 5 / 60)  # default 5min
        if interval and float(interval) <= 0.5:   # heightened = ≤30min
            from agents.monitoring import run_cycle
            asyncio.get_event_loop().run_until_complete(run_cycle())
    except Exception as exc:
        logger.warning("Heightened monitoring check failed: %s", exc)


@app.task(name="celery_tasks.run_intelligence_pipeline", bind=True, max_retries=2)
def run_intelligence_pipeline(self, file_path: str = None):
    """Trigger Intelligence Agent from a queued task."""
    try:
        from agents.orchestrator import run_pipeline
        file_bytes = None
        filename = None
        if file_path:
            with open(file_path, "rb") as f:
                file_bytes = f.read()
            filename = file_path.split("/")[-1]
        result = asyncio.get_event_loop().run_until_complete(
            run_pipeline(file_bytes, filename)
        )
        return result
    except Exception as exc:
        logger.error("Intelligence pipeline task failed: %s", exc)
        raise self.retry(exc=exc, countdown=60)
