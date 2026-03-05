import asyncio
import os
import uuid
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def seed():
    mongo_url = os.environ.get('MONGO_URL')
    db_name = os.environ.get('DB_NAME')
    
    print(f"Connecting to {mongo_url}, database: {db_name}")
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # 1. Seed Ads
    print("Seeding Ads...")
    now = datetime.now(timezone.utc)
    future = now + timedelta(days=30)
    
    sample_ads = [
        {
            "id": str(uuid.uuid4()),
            "title": "Premium Health Checkup - 50% OFF",
            "image_url": "https://img.freepik.com/free-vector/medical-healthcare-services-banner-design_1017-24814.jpg",
            "redirect_url": "https://example.com/checkup",
            "placement": "home",
            "is_active": True,
            "start_date": now.isoformat(),
            "end_date": future.isoformat(),
            "impressions": 0,
            "clicks": 0,
            "created_at": now.isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Book Your COVID-19 Booster Shot",
            "image_url": "https://img.freepik.com/free-vector/vaccination-campaign-concept-illustration_114360-6431.jpg",
            "redirect_url": "https://example.com/vaccine",
            "placement": "home",
            "is_active": True,
            "start_date": now.isoformat(),
            "end_date": future.isoformat(),
            "impressions": 0,
            "clicks": 0,
            "created_at": now.isoformat()
        }
    ]
    
    for ad in sample_ads:
        await db.ads.update_one({"title": ad["title"]}, {"$setOnInsert": ad}, upsert=True)
    
    # 2. Seed Blogs
    print("Seeding Blogs...")
    sample_blogs = [
        {
            "id": str(uuid.uuid4()),
            "title": "10 Tips for a Healthier Heart",
            "slug": "10-tips-for-a-healthier-heart",
            "content": "<h1>Heart Health Matters</h1><p>Keeping your heart healthy is vital for overall well-being. Here are 10 tips to get you started...</p>",
            "excerpt": "Learn how to keep your heart in top shape with these simple daily habits.",
            "author_id": "admin",
            "author_name": "HiDoctor Health Team",
            "cover_image": "https://img.freepik.com/free-photo/red-heart-shape-wooden-table_23-2148518973.jpg",
            "category": "Wellness",
            "tags": ["Heart", "Health", "Tips"],
            "is_published": True,
            "view_count": 0,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "The Importance of Sleep",
            "slug": "importance-of-sleep",
            "content": "<h1>Why Sleep is Critical</h1><p>Sleep plays a crucial role in your physical health, brain function, and emotional well-being...</p>",
            "excerpt": "Discover why getting 8 hours of sleep is non-negotiable for your health.",
            "author_id": "admin",
            "author_name": "HiDoctor Health Team",
            "cover_image": "https://img.freepik.com/free-photo/woman-sleeping-bed_23-2148820067.jpg",
            "category": "Lifestyle",
            "tags": ["Sleep", "Mental Health"],
            "is_published": True,
            "view_count": 0,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat()
        }
    ]
    
    for blog in sample_blogs:
        await db.blog_posts.update_one({"slug": blog["slug"]}, {"$setOnInsert": blog}, upsert=True)
        
    print("Seeding complete!")

if __name__ == "__main__":
    asyncio.run(seed())
