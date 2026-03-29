
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

async def check_doctors():
    ROOT_DIR = Path(__file__).parent
    load_dotenv(ROOT_DIR / '.env')
    mongo_url = os.environ.get('MONGO_URL')
    db_name = os.environ.get('DB_NAME')
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    doctors = await db.doctors.find().to_list(100)
    print(f"Found {len(doctors)} doctors in total")
    for d in doctors:
        print(f"ID: {d.get('user_id')}, Name: {d.get('full_name')}, Verified: {d.get('is_verified')}, Active: {d.get('is_active')}, Location: {d.get('location')}, Address: {d.get('clinic_address')}")

if __name__ == '__main__':
    asyncio.run(check_doctors())
