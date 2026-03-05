import asyncio
import os
import certifi
import uuid
import bcrypt
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'hidoctor_db')

# New admin credentials
NEW_ADMIN_EMAIL = "admin@admin.com"
NEW_ADMIN_PASSWORD = "admin@321"

async def reset_and_create_admin():
    print(f"Connecting to {MONGO_URL}...")
    client = AsyncIOMotorClient(MONGO_URL, tlsCAFile=certifi.where())
    db = client[DB_NAME]

    # 1. Delete all doctor profiles
    doc_result = await db.doctors.delete_many({})
    print(f"Deleted {doc_result.deleted_count} doctor profiles from 'doctors' collection")

    # 2. Delete all users with role 'doctor'
    doc_users = await db.users.delete_many({"role": "doctor"})
    print(f"Deleted {doc_users.deleted_count} doctor users from 'users' collection")

    # 3. Delete all users with role 'patient'
    pat_users = await db.users.delete_many({"role": "patient"})
    print(f"Deleted {pat_users.deleted_count} patient users from 'users' collection")

    # 4. Delete all old admin users
    admin_users = await db.users.delete_many({"role": "admin"})
    print(f"Deleted {admin_users.deleted_count} old admin users from 'users' collection")

    old_admins = await db.admins.delete_many({})
    print(f"Deleted {old_admins.deleted_count} old admin profiles from 'admins' collection")

    # 5. Create fresh admin
    user_id = str(uuid.uuid4())
    hashed_pw = bcrypt.hashpw(NEW_ADMIN_PASSWORD.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    admin_doc = {
        "id": user_id,
        "email": NEW_ADMIN_EMAIL,
        "full_name": "HiDoctor Admin",
        "password": hashed_pw,
        "phone": "+10000000000",
        "role": "admin",
        "is_verified": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(admin_doc)

    admin_profile = {
        "user_id": user_id,
        "permissions": ["all"]
    }
    await db.admins.insert_one(admin_profile)

    print(f"\n{'='*50}")
    print(f"  NEW ADMIN CREATED SUCCESSFULLY")
    print(f"{'='*50}")
    print(f"  Email:    {NEW_ADMIN_EMAIL}")
    print(f"  Password: {NEW_ADMIN_PASSWORD}")
    print(f"{'='*50}")
    print(f"\nAll doctor and patient accounts have been removed.")

    client.close()

if __name__ == "__main__":
    asyncio.run(reset_and_create_admin())
