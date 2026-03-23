from backend.app.controller.Employee_controller import fetch_all_employees
from backend.app.schemas.Employee_schema import EmployeeResponse
from fastapi import APIRouter


router = APIRouter()


@router.get("/", response_model=list[EmployeeResponse])
def get_employees():
    return fetch_all_employees()