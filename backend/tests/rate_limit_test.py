from fastapi.testclient import TestClient
from backend.app.main import app
from backend.config import auth

def test_login_rate_limiting():
    # Set a specific limit for this test
    # We use 10 to be sure we have enough "room" if other tests used some
    auth.LOGIN_RATE_LIMIT = "10/minute"
    client = TestClient(app)
    
    # Attempt logins until we hit the rate limit
    got_rate_limited = False
    for i in range(15):
        response = client.post("/auth/login", data={"username": "admin", "password": "admin123"})
        if response.status_code == 429:
            assert "limit exceeded" in response.json()["error"].lower()
            got_rate_limited = True
            break
        assert response.status_code == 200
    
    assert got_rate_limited, "Should have been rate limited after multiple attempts"
