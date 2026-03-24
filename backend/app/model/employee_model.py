from pymongo.synchronous.database import Database
from backend.app.schemas.employee_schema import EmployeeCreate, EmployeeResponse, EmployeeUpdate
from datetime import datetime, timezone
from pymongo import ReturnDocument

def create_employee(employee: EmployeeCreate, db: Database) -> EmployeeResponse:
    doc = employee.model_dump()
    now = datetime.now(timezone.utc)
    doc["createdAt"] = now
    doc["updatedAt"] = now
    result = db["employees"].insert_one(doc)
    doc["_id"] = result.inserted_id
    return EmployeeResponse(**doc)

def get_employee_by_id(employee_id: str, db: Database) -> EmployeeResponse | None:
    employee = db["employees"].find_one({"employeeId": employee_id})
    if employee:
        return EmployeeResponse(**employee)
    return None

def get_all_employees(db: Database) -> list[dict]:
    return list(db["employees"].find())

def get_employees_by_department(department: str, db: Database) -> list[dict]:
    return list(db["employees"].find({"department": department}))

def update_employee(employee_id: str, employee_update: EmployeeUpdate, db: Database) -> EmployeeResponse | None:
    update_data = employee_update.model_dump(exclude_unset=True)
    if not update_data:
        return get_employee_by_id(employee_id, db)
        
    update_data["updatedAt"] = datetime.now(timezone.utc)
    
    updated_doc = db["employees"].find_one_and_update(
        {"employeeId": employee_id},
        {"$set": update_data},
        return_document=ReturnDocument.AFTER
    )
    
    if updated_doc:
        return EmployeeResponse(**updated_doc)
    return None

def delete_employee(employee_id: str, db: Database) -> bool:
    result = db["employees"].delete_one({"employeeId": employee_id})
    return result.deleted_count > 0
