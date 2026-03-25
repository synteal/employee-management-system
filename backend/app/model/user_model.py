from pymongo.synchronous.database import Database
from backend.app.schemas.user_schema import UserCreate, UserInDB, UserRole
from backend.app.auth_utils import get_password_hash
from backend.app.model.activity_model import log_activity

def get_user_by_username(username: str, db: Database) -> UserInDB | None:
    user_doc = db["users"].find_one({"username": username})
    if user_doc:
        return UserInDB(**user_doc)
    return None

def create_user(user: UserCreate, db: Database, ip_address: str | None = None) -> UserInDB:
    hashed_password = get_password_hash(user.password)
    user_doc = user.model_dump(exclude={"password"})
    user_doc["hashed_password"] = hashed_password
    user_doc["role"] = UserRole.USER # Default to 'user' role
    db["users"].insert_one(user_doc)
    
    # Log the registration activity
    log_activity(db, user.username, "register", ip_address=ip_address)
    
    return UserInDB(**user_doc)
