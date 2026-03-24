from backend.app.model.employee_model import get_all_employees, create_employee, update_employee, delete_employee, get_employee_by_id, get_employees_by_department, get_employee_summary
from backend.app.schemas.employee_schema import EmployeeCreate, EmployeeUpdate
from fastapi import HTTPException, status
from pymongo.synchronous.database import Database

def fetch_all_employees(db: Database):
    return get_all_employees(db)

def fetch_employee_summary(db: Database):
    return get_employee_summary(db)

def add_employee(employee: EmployeeCreate, db: Database):
    return create_employee(employee, db)

def fetch_employee_by_id(employee_id: str, db: Database):
    employee = get_employee_by_id(employee_id, db)
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    return employee

def fetch_employees_by_department(department: str, db: Database):
    return get_employees_by_department(department, db)

def edit_employee(employee_id: str, employee_update: EmployeeUpdate, db: Database):
    updated_employee = update_employee(employee_id, employee_update, db)
    if not updated_employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    return updated_employee

def remove_employee(employee_id: str, db: Database):
    success = delete_employee(employee_id, db)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    return {"message": "Employee deleted successfully"}