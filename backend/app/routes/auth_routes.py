from fastapi import APIRouter, Depends, Request
from fastapi.security import OAuth2PasswordRequestForm
from backend.app.controller.auth_controller import authenticate_user, register_new_user
from backend.app.auth_utils import get_current_user
from backend.app.schemas.auth_schema import Token, TokenData
from backend.app.schemas.user_schema import UserCreate, UserResponse
from backend.app.model.activity_model import log_activity
from backend.app.core.limiter import limiter
from backend.config.auth import LOGIN_RATE_LIMIT

from pymongo.synchronous.database import Database
from backend.config.database import get_db

router = APIRouter()

def get_login_limit() -> str:
    return LOGIN_RATE_LIMIT

@router.post("/register", response_model=UserResponse)
async def register(
    request: Request,
    user: UserCreate,
    db: Database = Depends(get_db)
):
    return register_new_user(user, db, ip_address=request.client.host)

@router.post("/login", response_model=Token)
@limiter.limit(get_login_limit)
async def login_for_access_token(
    request: Request, 
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Database = Depends(get_db)
):
    return authenticate_user(form_data.username, form_data.password, db, ip_address=request.client.host)

@router.post("/logout")
async def logout(
    request: Request,
    current_user: TokenData = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """
    Logs the user out by recording the activity.
    Since JWT is stateless, the client should also delete the token.
    """
    log_activity(db, current_user.username, "logout", ip_address=request.client.host)
    return {"message": "Successfully logged out"}
