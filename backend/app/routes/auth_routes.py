from fastapi import APIRouter, Depends, Request
from fastapi.security import OAuth2PasswordRequestForm
from backend.app.controller.auth_controller import authenticate_user
from backend.app.schemas.auth_schema import Token
from backend.app.core.limiter import limiter
from backend.app.auth_utils import LOGIN_RATE_LIMIT

router = APIRouter()

def get_login_limit() -> str:
    return LOGIN_RATE_LIMIT

@router.post("/login", response_model=Token)
@limiter.limit(get_login_limit)
async def login_for_access_token(request: Request, form_data: OAuth2PasswordRequestForm = Depends()):
    return authenticate_user(form_data.username, form_data.password)
