import pytest
from fastapi.testclient import TestClient
from backend.app.schemas.user_schema import UserCreate
from backend.app.model.user_model import create_user

def test_mongodb_auth_flow(client: TestClient, db_session):
    # 1. Create a new user directly in DB (using model)
    new_user = UserCreate(
        username="newtestuser",
        password="testpassword123",
        email="test@example.com",
        role="user"
    )
    create_user(new_user, db_session)
    
    # 2. Try to login with this new user
    response = client.post("/auth/login", data={
        "username": "newtestuser",
        "password": "testpassword123"
    })
    
    assert response.status_code == 200
    token_data = response.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"
    
    # 3. Verify the token works for a protected route
    headers = {"Authorization": f"Bearer {token_data['access_token']}"}
    response = client.get("/employees", headers=headers)
    assert response.status_code == 200
    
    # Cleanup
    db_session["users"].delete_one({"username": "newtestuser"})

def test_login_invalid_credentials(client: TestClient):
    response = client.post("/auth/login", data={
        "username": "nonexistent",
        "password": "wrongpassword"
    })
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect username or password"

def test_register_endpoint(client: TestClient, db_session):
    username = "endpoint_reg_test"
    # Ensure user does not exist
    db_session["users"].delete_one({"username": username})
    
    # 1. Register a new user via API
    response = client.post("/auth/register", json={
        "username": username,
        "password": "testpassword123",
        "email": "endpoint@example.com",
        "role": "user"
    })
    assert response.status_code == 200
    assert response.json()["username"] == username
    
    # 2. Verify user exists in DB
    user = db_session["users"].find_one({"username": username})
    assert user is not None
    
    # 3. Verify activity log exists
    log = db_session["activity_logs"].find_one({"username": username, "action": "register"})
    assert log is not None
    assert log["action"] == "register"
    assert "ip_address" in log
    
    # 4. Try to register same username again
    response = client.post("/auth/register", json={
        "username": username,
        "password": "differentpassword",
        "email": "different@example.com",
        "role": "user"
    })
    assert response.status_code == 409
    assert response.json()["detail"] == "Username already registered"
    
    # Cleanup
    db_session["users"].delete_one({"username": username})
    db_session["activity_logs"].delete_many({"username": username})
