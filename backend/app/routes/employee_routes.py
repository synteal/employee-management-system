from backend.app.controller.employee_controller import fetch_all_employees, add_employee, edit_employee, remove_employee, fetch_employee_by_id, fetch_employees_by_department, fetch_employee_summary
from backend.app.schemas.employee_schema import EmployeeCreate, EmployeeResponse, EmployeeUpdate, EmployeeSummary
from fastapi import APIRouter, status, Depends
from pymongo.synchronous.database import Database
from backend.config.database import get_db

from backend.app.auth_utils import RoleChecker


router = APIRouter()

# Role checkers
admin_or_user = Depends(RoleChecker(["admin", "user"]))
admin_only = Depends(RoleChecker(["admin"]))


@router.get("/", response_model=list[EmployeeResponse], dependencies=[admin_or_user])
def get_employees(db: Database = Depends(get_db)):
    return fetch_all_employees(db)    

@router.get("/summary", response_model=EmployeeSummary, dependencies=[admin_or_user])
def get_summary(db: Database = Depends(get_db)):
    return fetch_employee_summary(db)

@router.get("/{employee_id}", response_model=EmployeeResponse, dependencies=[admin_or_user])
def get_employee(employee_id: str, db: Database = Depends(get_db)):
    return fetch_employee_by_id(employee_id, db)

@router.get("/department/{department}", response_model=list[EmployeeResponse], dependencies=[admin_or_user])
def get_employees_by_dept(department: str, db: Database = Depends(get_db)):
    return fetch_employees_by_department(department, db)

@router.post("/", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED, dependencies=[admin_only])
def post_employee(employee: EmployeeCreate, db: Database = Depends(get_db)):
    return add_employee(employee, db)

@router.put("/{employee_id}", response_model=EmployeeResponse, dependencies=[admin_only])
def put_employee(employee_id: str, employee_update: EmployeeUpdate, db: Database = Depends(get_db)):
    return edit_employee(employee_id, employee_update, db)

@router.delete("/{employee_id}", dependencies=[admin_only])
def delete_employee(employee_id: str, db: Database = Depends(get_db)):
    return remove_employee(employee_id, db)

