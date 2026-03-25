import os
from backend.config.logger import logger
SECRET_KEY = os.getenv("SECRET_KEY")
if SECRET_KEY is None:
    logger.error("SECRET_KEY is not set. JWT Token generation cannot occur.")
    raise ValueError("SECRET_KEY is not set.")
    
ALGORITHM = os.getenv("ALGORITHM")
if ALGORITHM is None:
    logger.error("ALGORITHM is not set. JWT Token generation cannot occur.")
    raise ValueError("ALGORITHM is not set.")
    
env_expire = os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES")
if env_expire is None:
    logger.error("ACCESS_TOKEN_EXPIRE_MINUTES is not set. JWT Token lifespan cannot be determined.")
    raise ValueError("ACCESS_TOKEN_EXPIRE_MINUTES is not set.")
    
ACCESS_TOKEN_EXPIRE_MINUTES = int(env_expire)
    
LOGIN_RATE_LIMIT = "5/minute"
