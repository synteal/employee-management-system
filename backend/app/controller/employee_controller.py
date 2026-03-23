from backend.app.model.employee_model import get_all_employees, create_employee
from backend.app.schemas.employee_schema import EmployeeCreate

def fetch_all_employees():
    return get_all_employees()

def add_employee(employee: EmployeeCreate):
    return create_employee(employee)











    