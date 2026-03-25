from enum import StrEnum
from pydantic import BaseModel, Field
from datetime import datetime, timezone
from typing import Optional

class UserAction(StrEnum):
    REGISTER = "register"
    LOGIN = "login"
    LOGOUT = "logout"

class ActivityBase(BaseModel):
    username: str
    action: UserAction
    ip_address: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ActivityInDB(ActivityBase):
    id: Optional[str] = Field(None, alias="_id")
