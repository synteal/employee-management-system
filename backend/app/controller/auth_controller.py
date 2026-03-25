from datetime import timedelta
from fastapi import HTTPException, status
from backend.config.auth import ACCESS_TOKEN_EXPIRE_MINUTES
from backend.app.auth_utils import (
    create_access_token,
    verify_password,
)
from pymongo.synchronous.database import Database
from backend.app.model.user_model import get_user_by_username, create_user
from backend.app.model.activity_model import log_activity
from backend.app.schemas.user_schema import UserCreate, UserResponse

def authenticate_user(username: str, password: str, db: Database, ip_address: str | None = None) -> dict:
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
    
    # Log the login activity
    log_activity(db, user.username, "login", ip_address)
    
    
    return {"access_token": access_token, "token_type": "bearer"}

def register_new_user(user: UserCreate, db: Database, ip_address: str | None = None) -> UserResponse:
    """
    Registers a new user after checking for duplicates.
    This is the 'Controller' logic.
    """
    existing_user = get_user_by_username(user.username, db)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already registered"
        )
    
    new_user_in_db = create_user(user, db, ip_address=ip_address)
    return UserResponse(**new_user_in_db.model_dump())
