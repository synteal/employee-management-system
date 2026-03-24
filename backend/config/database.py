from backend.config.logger import logger
from pymongo.synchronous.collection import Collection
from pymongo.synchronous.database import Database
import os
from dotenv import load_dotenv
from pymongo import MongoClient
from typing import Generator

load_dotenv()

# Global MongoDB instances
client: MongoClient | None = None
db: Database | None = None
employees_collection: Collection | None = None

def init_db():
    mongo_uri = os.getenv("MONGO_URI")
    if mongo_uri is None:
        logger.error("MONGO_URI is not set.")
        raise ValueError("MONGO_URI is not set.")
    mongo_db_name = os.getenv("MONGO_DB_NAME")
    if mongo_db_name is None:
        logger.error("MONGO_DB_NAME is not set.")
        raise ValueError("MONGO_DB_NAME is not set.")

    global client, db, employees_collection
    if client is None:
        client = MongoClient(
            mongo_uri,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000
        )
        try:
            client.admin.command('ping')
        except Exception as e:
            logger.error(f"Failed to ping MongoDB at {mongo_uri}: {e}")
            raise e
        logger.info(f"Connected to MongoDB at {mongo_uri} successfully.")
        db = client[mongo_db_name]
        logger.info(f"Connected to MongoDB database {mongo_db_name} successfully.")
        employees_collection = db["employees"]

def get_db() -> Generator[Database, None, None]:
    """
    Dependency provider that yields the MongoDB database instance.
    FastAPI will execute this function to resolve the Depends() request.
    """
    if db is None:
        init_db()
    
    yield db

def close_db_connection() -> None:
    """
    Closes the MongoDB connection.
    """
    global client, db, employees_collection
    if client:
        client.close()
        client = None
        db = None
        employees_collection = None
