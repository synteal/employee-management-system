import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.config.database import get_db, close_db_connection
from backend.config import auth

# Disable rate limit for tests
auth.LOGIN_RATE_LIMIT = "1000/minute"
app.state.limiter.enabled = False

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
def setup_test_users(db_session):
    """
    Fixture: Ensures that 'admin' and 'user' accounts exist in the database.
    """
    from backend.app.model.user_model import get_password_hash
    from backend.app.schemas.user_schema import UserRole
    
    # Create admin
    if not db_session["users"].find_one({"username": "admin"}):
        db_session["users"].insert_one({
            "username": "admin",
            "hashed_password": get_password_hash("admin123"),
            "email": "admin@example.com",
            "role": UserRole.ADMIN
        })
    
    # Create user
    if not db_session["users"].find_one({"username": "user"}):
        db_session["users"].insert_one({
            "username": "user",
            "hashed_password": get_password_hash("user123"),
            "email": "user@example.com",
            "role": UserRole.USER
        })
    
    yield
    
    # No cleanup here as they are shared by many tests, but could be added if needed

@pytest.fixture(scope="module")
def admin_headers(client, setup_test_users):
    """
    Fixture: Returns headers for an admin user.
    """
    response = client.post("/auth/login", data={"username": "admin", "password": "admin123"})
    if response.status_code != 200:
        raise Exception(f"Admin login failed: {response.json()}")
    token = response.json().get("access_token")
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture(scope="module")
def user_headers(client, setup_test_users):
    """
    Fixture: Returns headers for a regular user.
    """
    response = client.post("/auth/login", data={"username": "user", "password": "user123"})
    if response.status_code != 200:
        raise Exception(f"User login failed: {response.json()}")
    token = response.json().get("access_token")
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
