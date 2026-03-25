import pytest
from backend.app.schemas.user_schema import UserRole
from backend.app.auth_utils import create_access_token
from datetime import timedelta

@pytest.fixture(scope="module")
def register_data():
    return {
        "username": "new_test_user",
        "email": "new_test@example.com",
        "password": "StrongPassword123!"
    }

@pytest.fixture(scope="module")
def weak_password_data():
    return {
        "username": "weak_user",
        "email": "weak@example.com",
        "password": "123"
    }

@pytest.fixture(scope="module")
def existing_user_data(client, db_session):
    # Register a user to ensure it exists
    user_data = {
        "username": "existing_user",
        "email": "existing@example.com",
        "password": "StrongPassword123!"
    }
    # Clear first just in case
    db_session["users"].delete_one({"username": user_data["username"]})
    client.post("/auth/register", json=user_data)
    
    yield user_data
    
    # Teardown
    db_session["users"].delete_one({"username": user_data["username"]})

@pytest.fixture(scope="module", autouse=True)
def cleanup_users(db_session, register_data, weak_password_data):
    db_session["users"].delete_many(
        {"username": {"$in": [register_data["username"], weak_password_data["username"], "admin_user"]}}
    )
    yield
    db_session["users"].delete_many(
        {"username": {"$in": [register_data["username"], weak_password_data["username"], "admin_user"]}}
    )

def test_register_user_success(client, register_data):
    response = client.post("/auth/register", json=register_data)
    assert response.status_code == 200 # or 201 depending on the current implementation
    data = response.json()
    assert data["username"] == register_data["username"]
    assert "password" not in data

def test_register_duplicate_username_returns_409(client, existing_user_data):
    # Try to register the same user again
    response = client.post("/auth/register", json=existing_user_data)
    assert response.status_code == 409

def test_register_weak_password_returns_422(client, weak_password_data):
    response = client.post("/auth/register", json=weak_password_data)
    assert response.status_code == 422

def test_login_success_returns_jwt(client, existing_user_data):
    response = client.post(
        "/auth/login",
        data={"username": existing_user_data["username"], "password": existing_user_data["password"]}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_wrong_password_returns_401(client, existing_user_data):
    response = client.post(
        "/auth/login",
        data={"username": existing_user_data["username"], "password": "WrongPassword123!"}
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect username or password"

def test_login_nonexistent_user_returns_401(client):
    response = client.post(
        "/auth/login",
        data={"username": "does_not_exist_user", "password": "SomePassword123!"}
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect username or password"

def test_protected_route_without_token_returns_401(client):
    response = client.get("/employees/") # assuming /employees/ is protected
    assert response.status_code == 401

def test_protected_route_with_valid_token_succeeds(client, existing_user_data):
    # First login
    login_response = client.post(
        "/auth/login",
        data={"username": existing_user_data["username"], "password": existing_user_data["password"]}
    )
    token = login_response.json()["access_token"]
    
    # Request protected route
    response = client.get(
        "/employees/",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200

def test_protected_route_with_expired_token_returns_401(client, existing_user_data):
    # Create an expired token manually
    expired_token = create_access_token(
        data={"sub": existing_user_data["username"], "role": UserRole.USER},
        expires_delta=timedelta(minutes=-10) # 10 minutes past
    )
    
    response = client.get(
        "/employees/",
        headers={"Authorization": f"Bearer {expired_token}"}
    )
    assert response.status_code == 401

def test_admin_route_with_user_role_returns_403(client, existing_user_data):
    # Make sure existing_user has USER role by default
    login_response = client.post(
        "/auth/login",
        data={"username": existing_user_data["username"], "password": existing_user_data["password"]}
    )
    token = login_response.json()["access_token"]
    
    # Let's say adding an employee requires admin permissions
    employee_data = {
        "employeeId": "TEST_ADMIN_ROUTE",
        "name": "Should Fail",
        "email": "fail@example.com",
        "department": "IT",
        "role": "Software Engineer",
        "yearlySalary": 100000
    }
    
    response = client.post(
        "/employees/",
        json=employee_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 403
