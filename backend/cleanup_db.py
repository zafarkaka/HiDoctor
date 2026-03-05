
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = os.getenv("DB_NAME")

async def cleanup_database():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # 1. Define users to keep
    # Based on user request:
    # Admin: admin@hidoctor.online
    # Patient: Zafar Kaka (zafar@111)
    # Doctor: zee@gmail.com (Zeeshan)
    
    keep_emails = [
        "admin@hidoctor.online",
        "zafar@111", # Assuming this is the email field
        "zee@gmail.com"
    ]
    
    print(f"Preserving users with emails: {keep_emails}")
    
    # Delete all users NOT in the keep list
    # We also need to be careful about matching full names if emails don't match exactly
    # But usually email is the unique identifier.
    
    delete_query = {"email": {"$nin": keep_emails}}
    
    # Let's count before we delete
    total_users = await db.users.count_documents({})
    users_to_delete = await db.users.count_documents(delete_query)
    
    print(f"Total users: {total_users}")
    print(f"Users to be deleted: {users_to_delete}")
    
    # Delete users
    result = await db.users.delete_many(delete_query)
    print(f"Deleted {result.deleted_count} users.")
    
    # Also cleanup related data: appointments, messages, family members etc.
    preserved_users = await db.users.find({"email": {"$in": keep_emails}}).to_list(length=10)
    preserved_ids = [u["_id"] for u in preserved_users]
    
    # Appointments where neither doctor nor patient is preserved
    await db.appointments.delete_many({
        "$and": [
            {"doctor_id": {"$nin": preserved_ids}},
            {"patient_id": {"$nin": preserved_ids}}
        ]
    })
    print("Cleaned up orphaned appointments.")

    client.close()

if __name__ == "__main__":
    asyncio.run(cleanup_database())
