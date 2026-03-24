from backend.app.model.employee_model import get_all_employees, create_employee, update_employee, delete_employee, get_employee_by_id, get_employees_by_department
from backend.app.schemas.employee_schema import EmployeeCreate, EmployeeUpdate
from fastapi import HTTPException, status

def fetch_all_employees():
    return get_all_employees()

def add_employee(employee: EmployeeCreate):
    return create_employee(employee)

def fetch_employee_by_id(employee_id: str):
    employee = get_employee_by_id(employee_id)
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    return employee

def fetch_employees_by_department(department: str):
    return get_employees_by_department(department)

def edit_employee(employee_id: str, employee_update: EmployeeUpdate):
    updated_employee = update_employee(employee_id, employee_update)
    if not updated_employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    return updated_employee

def remove_employee(employee_id: str):
    success = delete_employee(employee_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    return {"message": "Employee deleted successfully"}











    