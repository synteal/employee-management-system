from contextlib import asynccontextmanager
from fastapi import FastAPI
import os

from backend.config.logger import logger
from backend.config.database import client, close_db_connection
from backend.app.routes.Employee_routes import router as employee_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Asynchronous context manager to manage the application's lifecycle.
    """
    try:
        # Check database connection with a lighter 'ping' command
        client.admin.command('ping')
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

app.include_router(employee_router, prefix="/employees")

@app.get("/health")
async def health_check():
    return {"message": "OK"}

