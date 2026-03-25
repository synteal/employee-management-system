from datetime import timedelta
from fastapi import HTTPException, status
from backend.config.auth import ACCESS_TOKEN_EXPIRE_MINUTES
from backend.app.auth_utils import (
    create_access_token,
    verify_password,
)
from pymongo.synchronous.database import Database
from backend.app.model.user_model import get_user_by_username

def authenticate_user(username: str, password: str, db: Database) -> dict:
    """
    Validates user credentials against MongoDB and returns a JWT token.
    This is the 'Controller' logic.
    """
    user = get_user_by_username(username, db)
    
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role},
        expires_delta=access_token_expires,
    )
    
    return {"access_token": access_token, "token_type": "bearer"}
