from backend.config.database import employees_collection
from backend.app.schemas.employee_schema import EmployeeCreate, EmployeeResponse
from datetime import datetime, timezone

def create_employee(employee: EmployeeCreate) -> EmployeeResponse:
    doc = employee.model_dump()
    now = datetime.now(timezone.utc)
    doc["createdAt"] = now
    doc["updatedAt"] = now
    result = employees_collection.insert_one(doc)
    doc["_id"] = result.inserted_id
    return EmployeeResponse(**doc)

def get_all_employees() -> list[dict]:
    return list(employees_collection.find())
