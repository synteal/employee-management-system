from contextlib import asynccontextmanager
from fastapi import FastAPI

from backend.config.logger import logger
from backend.config.database import init_db, close_db_connection
from backend.app.routes.employee_routes import router as employee_router
from backend.app.routes.auth_routes import router as auth_router
from backend.app.core.limiter import limiter
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Asynchronous context manager to manage the application's lifecycle.
    """
    try:
        init_db()
        logger.info("Connected to MongoDB successfully.")
        logger.info("Starting up the Employee Management System API")
        yield
    except Exception as e:
        logger.error(f"Failed to initialize database connection: {e}")
        # Not raising here to allow app to potentially start, but depends on your requirements
        raise e
    finally:
        # Ensure the connection is closed to release resources
        close_db_connection()
        logger.info("MongoDB connection closed.")
        logger.info("Shutting down FastAPI")

# === FastApi setup ===
app = FastAPI(title="Employee Management System API", version="1.0", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(employee_router, prefix="/employees")
                                                                        
@app.get("/health")
async def health_check():
    return {"message": "OK"}

