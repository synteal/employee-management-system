from datetime import datetime
from enum import StrEnum
from pydantic import BaseModel, EmailStr, constr

class EmployeeStatus(StrEnum):
    ACTIVE = "active"
    DISABLED = "disabled"
    ON_LEAVE = "on_leave"

class Employee(BaseModel):
    employeeId: str
    name: str
    email: EmailStr
    role: str
    department: str
    yearly_salary: int
    status: EmployeeStatus

class EmployeeResponse(BaseModel):
    id: str
    createdAt: datetime
    