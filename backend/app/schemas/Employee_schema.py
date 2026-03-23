from datetime import datetime, timezone
from enum import StrEnum
from pydantic import BaseModel, EmailStr, Field

class EmployeeStatus(StrEnum):
    ACTIVE = "active"
    DISABLED = "disabled"
    ON_LEAVE = "on_leave"

class EmployeeBase(BaseModel):
    employeeId: str
    name: str
    email: EmailStr
    role: str
    department: str
    yearlySalary: int
    status: EmployeeStatus = EmployeeStatus.ACTIVE
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EmployeeCreate(EmployeeBase):
    pass

class EmployeeResponse(EmployeeBase):
    id: str
    