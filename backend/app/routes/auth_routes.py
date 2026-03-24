from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from backend.app.controller.auth_controller import authenticate_user
from backend.app.schemas.auth_schema import Token

router = APIRouter()

@router.post("/login", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    return authenticate_user(form_data.username, form_data.password)
