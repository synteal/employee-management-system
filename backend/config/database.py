import os
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

# Global MongoDB client instance
client = MongoClient(
    os.environ["MONGO_URI"],
    # Adding a short connection timeout to prevent long hangs on startup
    serverSelectionTimeoutMS=5000,
    connectTimeoutMS=5000
)

db = client[os.environ["MONGO_DB_NAME"]]
employees_collection = db["employees"]

def close_db_connection():
    """
    Closes the MongoDB connection.
    """
    client.close()
