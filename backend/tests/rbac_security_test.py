import pytest
from fastapi.testclient import TestClient
from backend.app.schemas.user_schema import UserRole

def test_role_injection_prevention(client: TestClient, db_session):
    username = "attacker_user"
    # Attempt to register with 'admin' role
    response = client.post("/auth/register", json={
        "username": username,
        "password": "testpassword123",
        "email": "attacker@example.com",
        "role": "admin" # This should be ignored
    })
    assert response.status_code == 200
    
    # Verify the user actually has 'user' role in DB
    user = db_session["users"].find_one({"username": username})
    assert user is not None
    assert user["role"] == UserRole.USER
    assert user["role"] != UserRole.ADMIN
    
    # Cleanup
    db_session["users"].delete_one({"username": username})
    db_session["activity_logs"].delete_many({"username": username})

def test_admin_route_access_denied_for_user(client: TestClient, db_session):
    # 1. Create a regular user
    username = "normal_user"
    client.post("/auth/register", json={
        "username": username,
        "password": "testpassword123"
    })
    
    # 2. Login to get token
    response = client.post("/auth/login", data={
        "username": username,
        "password": "testpassword123"
    })
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 3. Attempt to access admin-only route (POST /employees)
    response = client.post("/employees/", headers=headers, json={
        "name": "Should Fail",
        "department": "IT",
        "yearlySalary": 50000,
        "email": "fail@example.com"
    })
    assert response.status_code == 403
    assert response.json()["detail"] == "Operation not permitted"
    
    # Cleanup
    db_session["users"].delete_one({"username": username})
    db_session["activity_logs"].delete_many({"username": username})
