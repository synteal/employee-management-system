from fastapi.testclient import TestClient
from backend.app.model.employee_model import get_all_employees

def test_get_employees(client: TestClient):
    response = client.get("/employees")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_add_employee(client: TestClient, db_session, test_employee):
    existing_employees = get_all_employees(db_session)
    
    response = client.post("/employees/", json=test_employee)
    response_json = response.json()
    assert response.status_code == 201
    assert response_json["name"] == test_employee["name"]
    assert response_json["role"] == test_employee["role"]
    assert response_json["department"] == test_employee["department"]

    new_employees = get_all_employees(db_session)
    assert len(new_employees) == len(existing_employees) + 1
    
def test_update_employee(client: TestClient, test_employee):
    response = client.put(f"/employees/{test_employee['employeeId']}", json={
        "role": "Data Scientist",
    })
    response_json = response.json()
    assert response.status_code == 200
    assert response_json["role"] == "Data Scientist"
    
    # Verify update persisted
    get_response = client.get(f"/employees/{test_employee['employeeId']}")
    assert get_response.status_code == 200
    assert get_response.json()["role"] == "Data Scientist"

def test_get_employee_by_id(client: TestClient, test_employee):
    response = client.get(f"/employees/{test_employee['employeeId']}")
    assert response.status_code == 200
    response_json = response.json()
    assert response_json["employeeId"] == test_employee["employeeId"]
    assert response_json["name"] == test_employee["name"]
    assert response_json["email"] == test_employee["email"]
    # Expect the updated role
    assert response_json["role"] == "Data Scientist"
    assert response_json["department"] == test_employee["department"]
    assert response_json["yearlySalary"] == test_employee["yearlySalary"]

def test_get_employee_by_department(client: TestClient, test_employee):
    response = client.get(f"/employees/department/{test_employee['department']}")
    assert response.status_code == 200
    employees = response.json()
    assert isinstance(employees, list)
    assert len(employees) > 0
    assert any(emp["employeeId"] == test_employee["employeeId"] for emp in employees)
    for emp in employees:
        assert emp["department"] == test_employee["department"]

def test_delete_employee(client: TestClient, test_employee):
    response = client.delete(f"/employees/{test_employee['employeeId']}")
    assert response.status_code == 200
    assert response.json() == {"message": "Employee deleted successfully"}

    # Verify deletion
    get_response = client.get(f"/employees/{test_employee['employeeId']}")
    assert get_response.status_code == 404
    assert get_response.json()["detail"] == "Employee not found"

def test_get_summary(client: TestClient, db_session):
    # Ensure database has some data
    db_session["employees"].delete_many({}) # Clean start for this test
    
    employees = [
        {"employeeId": "TEST001", "name": "User 1", "email": "u1@ex.com", "role": "Dev", "department": "IT", "yearlySalary": 50000, "createdAt": "2024-01-01T00:00:00", "updatedAt": "2024-01-01T00:00:00"},
        {"employeeId": "TEST002", "name": "User 2", "email": "u2@ex.com", "role": "Dev", "department": "IT", "yearlySalary": 50000, "createdAt": "2024-01-01T00:00:00", "updatedAt": "2024-01-01T00:00:00"},
        {"employeeId": "TEST003", "name": "User 3", "email": "u3@ex.com", "role": "HR", "department": "HR", "yearlySalary": 50000, "createdAt": "2024-01-01T00:00:00", "updatedAt": "2024-01-01T00:00:00"},
    ]
    db_session["employees"].insert_many(employees)
    
    response = client.get("/employees/summary")
    assert response.status_code == 200
    data = response.json()
    
    assert data["total_employees"] == 3
    assert set(data["departments"]) == {"IT", "HR"}
    
    # Cleanup
    db_session["employees"].delete_many({"employeeId": {"$in": ["TEST001", "TEST002", "TEST003"]}})
