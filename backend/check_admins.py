import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def check_admins():
    mongo_url = os.environ.get('MONGO_URL')
    db_name = os.environ.get('DB_NAME')
    
    print(f"Connecting to MongoDB at {mongo_url}...")
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print("Finding all 'admin' users...")
    admins = await db.users.find({"role": "admin"}).to_list(length=100)
    
    if not admins:
        print("No users with role 'admin' found!")
    else:
        for admin in admins:
            print(f"Admin User: ID={admin['id']}, Email={admin.get('email')}, Phone={admin.get('phone')}, Username={admin.get('username')}")
            
    print("\nFinding all admin profiles...")
    admin_profiles = await db.admins.find({}).to_list(length=100)
    if not admin_profiles:
        print("No admin profiles found!")
    else:
        for profile in admin_profiles:
            print(f"Admin Profile: UserID={profile['user_id']}, Permissions={profile.get('permissions')}")

    client.close()

if __name__ == "__main__":
    asyncio.run(check_admins())
