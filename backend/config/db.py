# backend/config/db.py
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

db_client = None

async def startup_db_client():
    """
    Connect to MongoDB on application startup.
    """
    global db_client
    try:
        db_client = AsyncIOMotorClient(os.getenv("MONGO_CONNECTION_STRING"))
        await db_client.admin.command('ping')
        print("Connected to MongoDB!")

        # Create database and collections if not present
        db_name = "ExtractIQ"
        collection_names = ["Documents", "schemas"]  
        
        database = db_client[db_name]
        existing_collections = await database.list_collection_names()
        for col in collection_names:
            if col not in existing_collections:
                await database.create_collection(col)
                print(f"Created collection: {col}")
    except Exception as e:
        print(f"Could not connect to MongoDB: {e}")

async def shutdown_db_client():
    """
    Close MongoDB connection on application shutdown.
    """
    global db_client
    if db_client:
        db_client.close()
        print("MongoDB connection closed.")
        
async def get_db():
    """
    Return the ExtractIQ database instance.
    """
    global db_client
    if not db_client:
        raise Exception("DB client not initialized. Did you call startup_db_client?")
    return db_client.ExtractIQ
