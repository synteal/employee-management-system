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
