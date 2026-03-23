from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_get_employees():
    response = client.get("/employees")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_add_employee():
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
    