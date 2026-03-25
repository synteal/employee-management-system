import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.config.database import get_db, close_db_connection
from backend.app import auth_utils

# Increase rate limit for tests to avoid collisions
auth_utils.LOGIN_RATE_LIMIT = "100/minute"

@pytest.fixture(scope="module")
def client():
    """
    Fixture: A TestClient instance for our FastAPI application.
    By putting this in conftest.py, pytest automatically reads it and makes 
    the 'client' parameter available to all test functions.
    """
    return TestClient(app)

@pytest.fixture(scope="module")
def db_session():
    """
    Fixture: Provides a MongoDB database session for tests to directly interact
    with the database (e.g. for teardowns or checking raw data).
    """
    db = next(get_db())
    yield db
    close_db_connection()

@pytest.fixture(scope="module")
def test_employee():
    """
    Fixture: Provides standard test data. 
    Using this makes our tests parametric, meaning we define the data in one place 
    (the fixture) and inject it into tests, rather than hardcoding 'EMP020' or 'Jane Doe'
    in every test function.
    """
    return {
        "employeeId": "EMP020",
        "name": "Jane Doe",
        "email": "jane.doe@example.com",
        "role": "Data Analyst",
        "department": "IT",
        "yearlySalary": 65000
    }

@pytest.fixture(scope="module")
def admin_headers(client):
    """
    Fixture: Returns headers for an admin user.
    """
    response = client.post("/auth/login", data={"username": "admin", "password": "admin123"})
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture(scope="module")
def user_headers(client):
    """
    Fixture: Returns headers for a regular user.
    """
    response = client.post("/auth/login", data={"username": "user", "password": "user123"})
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="module", autouse=True)
def clean_database(db_session, test_employee):
    """
    Fixture: Cleans up the database.
    scope="module": runs once for the whole test file.
    autouse=True: automatically runs without tests needing to explicitly request it.
    It takes 'db_session' and 'test_employee' as its own dependencies (fixtures using fixtures).
    """
    db_session["employees"].delete_many({"employeeId": test_employee["employeeId"]})
    yield  # The tests within the module run at this point
    db_session["employees"].delete_many({"employeeId": test_employee["employeeId"]})
