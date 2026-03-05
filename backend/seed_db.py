import asyncio
import os
import certifi
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt
from datetime import datetime, timezone
import uuid
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.environ.get('MONGO_URL', "mongodb://localhost:27017")
DB_NAME = os.environ.get('DB_NAME', 'hidoctor_db')

async def seed_data():
    print(f"Connecting to {MONGO_URL}...")
    # Add tlsCAFile=certifi.where() for atlas connections to prevent SSL failures on Windows
    client = AsyncIOMotorClient(MONGO_URL, tlsCAFile=certifi.where())
    db = client[DB_NAME]
    
    # 1. Admin
    admin_email = "admin@hidoctor.app"
    admin_exists = await db.users.find_one({"email": admin_email})
    if not admin_exists:
        hashed_pw = bcrypt.hashpw("Admin123!".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        admin_doc = {
            "id": str(uuid.uuid4()),
            "email": admin_email,
            "full_name": "HiDoctor Administrator",
            "password": hashed_pw,
            "phone": "+19999999999",
            "role": "admin",
            "is_verified": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin_doc)
        
        admin_profile = {"user_id": admin_doc["id"], "permissions": ["all"]}
        await db.admins.insert_one(admin_profile)
        
        print("Added Admin: admin@hidoctor.app / Admin123!")

    # 2. Patients
    patients = [
        ("patient1@example.com", "John Doe Patient", "Patient123!"),
        ("patient2@example.com", "Jane Smith", "Patient123!"),
        ("patient3@example.com", "Mike Johnson", "Patient123!")
    ]

    for p_email, p_name, p_pass in patients:
        p_exists = await db.users.find_one({"email": p_email})
        if not p_exists:
            hashed_pw = bcrypt.hashpw(p_pass.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            p_doc = {
                "id": str(uuid.uuid4()),
                "email": p_email,
                "full_name": p_name,
                "password": hashed_pw,
                "role": "patient",
                "phone": "+1234567890",
                "is_verified": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.users.insert_one(p_doc)
            print(f"Added Patient: {p_email} / {p_pass}")

    # 3. Doctors
    specialties = [
        "Cardiology", "Dermatology", "Neurology", "Pediatrics", 
        "Psychiatry", "Orthopedics", "Ophthalmology", "Dentistry", 
        "Gynecology", "General Medicine"
    ]
    
    doctor_names = [
        "Dr. Sarah Jenkins", "Dr. Robert Chen", "Dr. Emily Blunt", 
        "Dr. Michael Chang", "Dr. Olivia Wilde", "Dr. James Wilson", 
        "Dr. Sophia Martinez", "Dr. William Patel", "Dr. Mia Kim", 
        "Dr. Alexander Wright"
    ]

    stock_avatars = [
        "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&h=300&fit=crop", # Female doctor
        "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&h=300&fit=crop", # Male doctor
        "https://images.unsplash.com/photo-1594824436998-ef4f4c243bc5?w=300&h=300&fit=crop", # Female doctor
        "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&h=300&fit=crop", # Male doctor
        "https://images.unsplash.com/photo-1527613426441-4da17471b66d?w=300&h=300&fit=crop", # Female doctor
        "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=300&h=300&fit=crop", # Male doctor
        "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&h=300&fit=crop", # Female doctor
        "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&h=300&fit=crop", # Male doctor
        "https://images.unsplash.com/photo-1594824436998-ef4f4c243bc5?w=300&h=300&fit=crop", # Female doctor
        "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&h=300&fit=crop"  # Male doctor
    ]

    for i in range(10):
        d_email = f"doctor{i+1}@hidoctor.app"
        d_name = doctor_names[i]
        d_pass = "Doctor123!"
        d_spec = specialties[i]
        
        d_exists = await db.users.find_one({"email": d_email})
        if not d_exists:
            # 1. Create User Account
            hashed_pw = bcrypt.hashpw(d_pass.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            user_id = str(uuid.uuid4())
            d_doc = {
                "id": user_id,
                "email": d_email,
                "full_name": d_name,
                "password": hashed_pw,
                "role": "doctor",
                "phone": f"+19876543{i:02d}",
                "is_verified": True,
                "profile_image": stock_avatars[i],
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            res = await db.users.insert_one(d_doc)

            # 2. Create Doctor Profile
            profile = {
                "user_id": user_id,
                "full_name": d_name,
                "profile_image": stock_avatars[i],
                "title": "Dr.",
                "license_number": f"LIC-{10000+i}",
                "specialties": [d_spec],
                "sub_specialties": [],
                "years_experience": 5 + i,
                "qualifications": ["MBBS", "MD"],
                "languages": ["English", "Spanish"],
                "affiliation_type": "hospital" if i % 2 == 0 else "clinic",
                "clinic_name": f"{d_spec} Care Center",
                "clinic_address": "123 Medical Boulevard, City Center",
                "clinic_photos": [],
                "consultation_types": ["in_person", "telehealth"],
                "consultation_fee": 1500.0 + (i * 100),  # INR
                "accepted_insurances": ["Cigna", "Aetna", "BlueCross"],
                "working_hours": {
                    "monday": {"start": "09:00", "end": "17:00", "slots": 16},
                    "tuesday": {"start": "09:00", "end": "17:00", "slots": 16},
                    "wednesday": {"start": "09:00", "end": "17:00", "slots": 16},
                    "thursday": {"start": "09:00", "end": "17:00", "slots": 16},
                    "friday": {"start": "09:00", "end": "13:00", "slots": 8}
                },
                "holidays": [],
                "is_verified": True,
                "is_active": True,
                "bio": f"I am a leading specialist in {d_spec} with over {5+i} years of experience helping patients achieve their best health outcomes.",
                "rating": 4.5 + (i * 0.05) if i < 10 else 5.0,
                "review_count": 20 + i * 5,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.doctors.insert_one(profile)
            print(f"Added Doctor: {d_email} / {d_pass} ({d_spec})")

    print("\nDatabase Seeded successfully!")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_data())
