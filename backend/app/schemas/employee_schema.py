from datetime import datetime
from enum import StrEnum
from typing import Annotated
from pydantic import BaseModel, EmailStr, Field, BeforeValidator, ConfigDict

# Validator to handle MongoDB ObjectId conversion to string.
# Personal notes: This is to prevent Pydantic from getting confused about _id being an `ObjectId`
# and instead treat it as a string.
PyObjectId = Annotated[str, BeforeValidator(str)]

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

class EmployeeCreate(EmployeeBase):
    pass

class EmployeeUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    role: str | None = None
    department: str | None = None
    yearlySalary: int | None = None
    status: EmployeeStatus | None = None

class EmployeeResponse(EmployeeBase):
    # Notes: MongoDb will return _id, but that'd be inappropriate to return for a json API.
    id: PyObjectId = Field(alias="_id") 
    createdAt: datetime | None = None
    updatedAt: datetime | None = None
    
    model_config = ConfigDict(
        populate_by_name=True, # To allow object creation with either "_id" or "id"
        arbitrary_types_allowed=True # To avoid Pydantic errors about ObjectId
    )

class EmployeeSummary(BaseModel):
    total_employees: int
    departments: list[str]
    