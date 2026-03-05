import asyncio
import os
import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def list_recent_users():
    client = AsyncIOMotorClient(os.environ.get("MONGO_URL"), tlsCAFile=certifi.where())
    db = client[os.environ.get("DB_NAME", "hidoctor_db")]
    
    print("Listing all users (emails and object IDs)...")
    cursor = db.users.find({}, {"email": 1, "created_at": 1, "_id": 1}).sort("created_at", -1)
    async for user in cursor:
        print(f"User: {user.get('email')} - Created: {user.get('created_at')}")

if __name__ == "__main__":
    asyncio.run(list_recent_users())
