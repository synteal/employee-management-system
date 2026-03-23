from backend.app.model.Employee_model import get_all_employees
from backend.app.schemas.Employee_schema import EmployeeResponse

def fetch_all_employees():
    employees = get_all_employees()
    return [EmployeeResponse(**emp) for emp in employees]