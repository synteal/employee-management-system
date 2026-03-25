from typing import Optional
from pydantic import EmailStr, BaseModel

class UserBase(BaseModel):
    username: str
    email: Optional[EmailStr] = None
    role: str = "user"

class UserCreate(UserBase):
    password: str

class UserInDB(UserBase):
    hashed_password: str

class UserResponse(UserBase):
    pass

