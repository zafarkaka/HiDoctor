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
    
    phone = "+91 9894977003"
    password = "admin"
    email = "admin_9894977003@hidoctor.com"
    
    existing = await db.users.find_one({"phone": phone})
    if existing:
        print(f"Admin user {phone} already exists! Updating password...")
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        await db.users.update_one({"phone": phone}, {"$set": {"password": hashed_password, "role": "admin"}})
        
        # update admin profile
        admin_prof = await db.admins.find_one({"user_id": existing["id"]})
        if not admin_prof:
            await db.admins.insert_one({"user_id": existing["id"], "permissions": ["all"]})
        
        print(f"Updated existing user {phone} to admin with new password.")
        client.close()
        return
        
    print(f"Creating admin user {phone}...")
    
    user_id = str(uuid.uuid4())
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    user_doc = {
        "id": user_id,
        "email": email,
        "password": hashed_password,
        "full_name": "System Administrator",
        "phone": phone,
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
    print(f"Phone: {phone}")
    print(f"Password: {password}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(create_admin())
