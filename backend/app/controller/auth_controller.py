from datetime import timedelta
from fastapi import HTTPException, status
from backend.app.auth_utils import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    USERS_DB,
    create_access_token,
    verify_password,
)

def authenticate_user(username: str, password: str) -> dict:
    """
    Validates user credentials and returns a JWT token.
    This is the 'Controller' logic.
    """
    user = USERS_DB.get(username)
    if not user or not verify_password(password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"], "role": user["role"]},
        expires_delta=access_token_expires,
    )
    
    return {"access_token": access_token, "token_type": "bearer"}
