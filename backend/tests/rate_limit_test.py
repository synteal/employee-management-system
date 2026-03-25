from fastapi.testclient import TestClient
from backend.app.main import app
from backend.config import auth

def test_login_rate_limiting():
    # Re-enable the limiter for this specific test
    app.state.limiter.enabled = True
    # Ensure a very small limit so we hit it quickly
    auth.LOGIN_RATE_LIMIT = "5/minute"
    client = TestClient(app)
    
    try:
        # Attempt logins until we hit the rate limit
        got_rate_limited = False
        for i in range(10):
            response = client.post("/auth/login", data={"username": "admin", "password": "admin123"})
            if response.status_code == 429:
                got_rate_limited = True
                break
            assert response.status_code == 200
        
        assert got_rate_limited, "Should have been rate limited after multiple attempts"
    finally:
        # Reset for other tests
        app.state.limiter.enabled = False
        auth.LOGIN_RATE_LIMIT = "1000/minute"
