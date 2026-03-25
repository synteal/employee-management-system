from fastapi.testclient import TestClient
from backend.app.schemas.user_schema import UserCreate
from backend.app.model.user_model import create_user

def test_activity_logging_flow(client: TestClient, db_session):
    # 1. Test Registration Logging
    username = "activity_test_user"
    new_user = UserCreate(
        username=username,
        password="testpassword123",
        email="activity@example.com",
        role="user"
    )
    create_user(new_user, db_session)
    
    # Verify "register" log exists
    log = db_session["activity_logs"].find_one({"username": username, "action": "register"})
    assert log is not None
    assert log["username"] == username
    assert log["action"] == "register"
    
    # 2. Test Login Logging
    response = client.post("/auth/login", data={
        "username": username,
        "password": "testpassword123"
    })
    assert response.status_code == 200
    token_data = response.json()
    
    # Verify "login" log exists
    log = db_session["activity_logs"].find_one({"username": username, "action": "login"})
    assert log is not None
    assert log["action"] == "login"
    assert "ip_address" in log
    
    # 3. Test Logout Logging
    headers = {"Authorization": f"Bearer {token_data['access_token']}"}
    response = client.post("/auth/logout", headers=headers)
    assert response.status_code == 200
    assert response.json()["message"] == "Successfully logged out"
    
    # Verify "logout" log exists
    log = db_session["activity_logs"].find_one({"username": username, "action": "logout"})
    assert log is not None
    assert log["action"] == "logout"
    
    # Cleanup
    db_session["users"].delete_one({"username": username})
    db_session["activity_logs"].delete_many({"username": username})
