from backend.app.controller.employee_controller import fetch_all_employees, add_employee
from backend.app.schemas.employee_schema import EmployeeCreate, EmployeeResponse
from fastapi import APIRouter, status


router = APIRouter()


@router.get("/", response_model=list[EmployeeResponse])
def get_employees():
    return fetch_all_employees()    

@router.post("/employee", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
def post_employee(employee: EmployeeCreate):
    return add_employee(employee)