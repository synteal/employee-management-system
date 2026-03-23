from backend.app.model.employee_model import get_all_employees
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_get_employees():
    response = client.get("/employees")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_add_employee():
    existing_employees = get_all_employees()
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

    new_employees = get_all_employees()
    assert len(new_employees) == len(existing_employees) + 1
    
def test_update_employee():
    response = client.put("/employees/employee/EMP020", json={
        "role": "Data Scientist",
    })
    response_json = response.json()
    assert response.status_code == 200
    assert response_json["role"] == "Data Scientist"

def test_delete_employee():
    response = client.delete("/employees/employee/EMP020")
    assert response.status_code == 200

def test_get_employee_by_id():
    response = client.get("/employees/employee/EMP020")
    assert response.status_code == 200
    assert response.json()["employeeId"] == "EMP020"

def test_get_employee_by_department():
    response = client.get("/employees/department/IT")
    assert response.status_code == 200
    assert isinstance(response.json(), list)