from datetime import datetime, timezone
from typing import Optional
from pymongo.synchronous.database import Database
from backend.app.schemas.activity_schema import ActivityBase

def log_activity(db: Database, username: str, action: str, ip_address: Optional[str] = None) -> None:
    """
    Logs a user activity to the 'activity_logs' collection.
    """
    activity = ActivityBase(
        username=username,
        action=action,
        ip_address=ip_address,
        timestamp=datetime.now(timezone.utc)
    )
    db["activity_logs"].insert_one(activity.model_dump())
