import pytest
from backend.app.model.employee_model import get_all_employees
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.config.database import get_db

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def clean_database():
    db = next(get_db())
    db["employees"].delete_many({"employeeId": "EMP020"})
    yield
    db["employees"].delete_many({"employeeId": "EMP020"})

def test_get_employees():
    response = client.get("/employees")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_add_employee():
    db = next(get_db())
    existing_employees = get_all_employees(db)
    new_employee = {
        "employeeId": "EMP020",
        "name": "Jane Doe",
        "email": "jane.doe@example.com",
        "role": "Data Analyst",
        "department": "IT",
        "yearlySalary": 65000
    }
    response = client.post("/employees/employee", json=new_employee)
    response_json = response.json()
    assert response.status_code == 201
    assert response_json["name"] == "Jane Doe"
    assert response_json["role"] == "Data Analyst"
    assert response_json["department"] == "IT"

    new_employees = get_all_employees(db)
    assert len(new_employees) == len(existing_employees) + 1
    
def test_update_employee():
    response = client.put("/employees/employee/EMP020", json={
        "role": "Data Scientist",
    })
    response_json = response.json()
    assert response.status_code == 200
    assert response_json["role"] == "Data Scientist"
    
    # Verify update persisted
    get_response = client.get("/employees/employee/EMP020")
    assert get_response.status_code == 200
    assert get_response.json()["role"] == "Data Scientist"

def test_get_employee_by_id():
    response = client.get("/employees/employee/EMP020")
    assert response.status_code == 200
    response_json = response.json()
    assert response_json["employeeId"] == "EMP020"
    assert response_json["name"] == "Jane Doe"
    assert response_json["email"] == "jane.doe@example.com"
    assert response_json["role"] == "Data Scientist"
    assert response_json["department"] == "IT"
    assert response_json["yearlySalary"] == 65000

def test_get_employee_by_department():
    response = client.get("/employees/department/IT")
    assert response.status_code == 200
    employees = response.json()
    assert isinstance(employees, list)
    assert len(employees) > 0
    assert any(emp["employeeId"] == "EMP020" for emp in employees)
    for emp in employees:
        assert emp["department"] == "IT"

def test_delete_employee():
    response = client.delete("/employees/employee/EMP020")
    assert response.status_code == 200
    assert response.json() == {"message": "Employee deleted successfully"}

    # Verify deletion
    get_response = client.get("/employees/employee/EMP020")
    assert get_response.status_code == 404
    assert get_response.json()["detail"] == "Employee not found"