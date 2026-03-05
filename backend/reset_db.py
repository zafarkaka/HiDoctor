import asyncio
import os
import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.environ.get('MONGO_URL', "mongodb://localhost:27017")
DB_NAME = os.environ.get('DB_NAME', 'hidoctor_db')

async def reset_seed():
    print(f"Connecting to {MONGO_URL}...")
    client = AsyncIOMotorClient(MONGO_URL, tlsCAFile=certifi.where())
    db = client[DB_NAME]
    
    # Clean up all users created by seed
    print("Deleting demo users...")
    await db.users.delete_many({"email": {"$regex": "@(hidoctor\.app|example\.com)$"}})
    await db.doctor_profiles.drop()
    await db.doctors.delete_many({"license_number": {"$regex": "^LIC-"}})
    
    print("Database cleaned. Ready to re-seed!")
    client.close()

if __name__ == "__main__":
    asyncio.run(reset_seed())
