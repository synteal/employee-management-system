from enum import StrEnum
from typing import Optional
from pydantic import EmailStr, BaseModel

class UserRole(StrEnum):
    ADMIN = "admin"
    USER = "user"

class UserBase(BaseModel):
    username: str
    email: Optional[EmailStr] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    role: UserRole

class UserInDB(UserResponse):
    hashed_password: str

