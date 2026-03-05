import asyncio
import os
import uuid
from datetime import datetime, timezone
import bcrypt
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def create_admin():
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'hidoctor')
    
    print(f"Connecting to MongoDB at {mongo_url}...")
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    email = "admin@admin.com"
    password = "admin"
    
    existing = await db.users.find_one({"email": email})
    if existing:
        print(f"Admin user {email} already exists!")
        return
        
    print(f"Creating admin user {email}...")
    
    user_id = str(uuid.uuid4())
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    user_doc = {
        "id": user_id,
        "email": email,
        "password": hashed_password,
        "full_name": "System Administrator",
        "phone": "+10000000000",
        "role": "admin",
        "is_verified": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    admin_profile = {
        "user_id": user_id,
        "permissions": ["all"]
    }
    await db.admins.insert_one(admin_profile)
    
    print(f"Successfully created admin user!")
    print(f"Email: {email}")
    print(f"Password: {password}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(create_admin())
