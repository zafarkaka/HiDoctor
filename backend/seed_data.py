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
            "title": "Holistic Approaches to Managing Chronic Hypertension",
            "slug": "managing-chronic-hypertension",
            "content": "<h1>The Comprehensive Guide to Hypertenion Control</h1><p>Hypertension, often called the 'silent killer', affects millions globally. Managing it requires more than just medication; it requires a systemic lifestyle shift.</p><h2>The DASH Diet and Sodium Reduction</h2><p>Dietary Approaches to Stop Hypertension (DASH) emphasizes fruits, vegetables, and lean proteins while minimizing sodium. Reducing daily sodium intake to under 1,500mg can lower systolic blood pressure by 5-10 mmHg.</p><h2>Exercise as a Vascular Therapy</h2><p>Regular aerobic activity strengthens the heart, allowing it to pump more blood with less effort, thereby reducing pressure on arteries. Aim for 150 minutes of moderate activity weekly.</p><h2>Stress Management and Long-term Outcomes</h2><p>Chronic stress triggers hormonal responses that constrict blood vessels. Mindfulness and deep-breening exercises are proven to improve vascular elasticity and overall cardiovascular health.</p>",
            "excerpt": "A deep dive into how diet, persistent exercise, and mindfulness can significantly lower blood pressure and improve long-term heart health.",
            "author_id": "admin",
            "author_name": "Dr. Sarah Chen, Cardiology",
            "cover_image": "https://images.unsplash.com/photo-1505751172107-1678f88636ba?w=800&auto=format&fit=crop",
            "category": "Cardiology",
            "tags": ["Hypertension", "Heart Health", "Diet"],
            "is_published": True,
            "view_count": 0,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "The Impact of Artificial Intelligence on Modern Diagnosis",
            "slug": "ai-in-medical-diagnosis",
            "content": "<h1>How AI is Transforming Patient Care</h1><p>From radiology to pathology, AI is no longer a futuristic concept but a daily tool for clinicians. Machine learning can now detect subtle patterns in MRIs and CT scans that might be missed by the human eye.</p><h2>Predictive Analytics in Early Screening</h2><p>Algorithms can analyze electronic health records to predict the onset of chronic conditions like diabetes or sepsis, allowing for preventative intervention months earlier than traditional methods.</p><h2>Personalized Medicine and Genomic Sequencing</h2><p>AI helps researchers map treatments to a patient's specific genetic makeup, ensuring that therapy is both highly effective and minimally invasive.</p>",
            "excerpt": "Discover how integrated AI platforms like HiDoctor are paving the way for faster, more accurate medical screenings and tailored treatments.",
            "author_id": "admin",
            "author_name": "Dr. Michael Ross, Health Tech",
            "cover_image": "https://images.unsplash.com/photo-1576091160550-217359f481d3?w=800&auto=format&fit=crop",
            "category": "Technology",
            "tags": ["AI", "Innovation", "Diagnostics"],
            "is_published": True,
            "view_count": 0,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Understanding Mental Health: Breaking the Stigma",
            "slug": "understanding-mental-health",
            "content": "<h1>The New Standard for Emotional Well-being</h1><p>Mental health is fundamental to overall vitality. Yet, the stigma associated with seeking help remains a significant barrier. True health requires addressing both the mind and body.</p><h2>The Biological Basis of Mental Illness</h2><p>Mental health disorders are medical conditions involving changes in brain chemistry and structure. They are not 'character flaws' but requires professional treatment and support.</p><h2>The Reach of Telehealth Counseling</h2><p>Digital platforms have democratized access to therapists. Secure video consultations allow patients to discuss anxiety, depression, and stress from a safe, private environment.</p>",
            "excerpt": "A deep dive into why mental health is critical and how digital healthcare is making professional counseling more accessible to everyone.",
            "author_id": "admin",
            "author_name": "Dr. Emily Taylor, Psychaitry",
            "cover_image": "https://images.unsplash.com/photo-1527137342181-19aab11a8ee1?w=800&auto=format&fit=crop",
            "category": "Mental Health",
            "tags": ["Mental Wellness", "Counseling", "Self-care"],
            "is_published": True,
            "view_count": 0,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Pediatric Nutrition: Building a Foundation for Life",
            "slug": "pediatric-nutrition-basics",
            "content": "<h1>Nurturing the Next Generation</h1><p>Early childhood nutrition is the cornerstone of lifelong development. A balanced intake of proteins, healthy fats, and micronutrients is essential for neurodevelopment.</p><h2>Dealing with Selective Eating Habits</h2><p>Consistency and variety are key. Introducing varied textures and whole foods early helps prevent nutritional deficiencies and establishes healthy habits for life.</p><h2>The Importance of Developmental Milestone Checks</h2><p>Regular growth monitoring by pediatricians ensures that children are meeting their unique developmental targets and receiving the right caloric intake.</p>",
            "excerpt": "Expert advice on childhood nutrition, developmental milestones, and how parents can ensure their children grow up strong and healthy.",
            "author_id": "admin",
            "author_name": "Dr. James Wilson, Pediatrics",
            "cover_image": "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop",
            "category": "Pediatrics",
            "tags": ["Kids Health", "Nutrition", "Parenting"],
            "is_published": True,
            "view_count": 0,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "The Rise of Telemedicine in Post-Pandemic Healthcare",
            "slug": "rise-of-telemedicine",
            "content": "<h1>The Future of Healthcare is Digital</h1><p>Telemedicine has evolved from a temporary crisis solution into a permanent healthcare pillar. It bridges the gap between rural patients and urban specialists.</p><h2>Convenience vs. Quality of Care</h2><p>Virtual consultations reduce travel times and costs without compromising diagnostic quality for hundreds of common conditions, from dermatology to internal medicine.</p><h2>Security and Patient Privacy</h2><p>Modern platforms prioritize end-to-end encryption for video links and health records, ensuring that the doctor-patient privilege is maintained in the digital age.</p>",
            "excerpt": "How digital transformation is democratizing access to specialized medical care and what it means for the traditional hospital model.",
            "author_id": "admin",
            "author_name": "Dr. Aisha Khan, Digital Health",
            "cover_image": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop",
            "category": "Healthcare",
            "tags": ["Telemedicine", "Future", "Accessibility"],
            "is_published": True,
            "view_count": 0,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Dermatology 101: A Guide to Sun Protection",
            "slug": "dermatology-sun-protection",
            "content": "<h1>Your Skin's Best Defense</h1><p>The skin is the body's largest organ. Protecting it from UV radiation is the single most effective way to prevent premature aging and serious skin conditions.</p><h2>The Science of SPF</h2><p>Sun Protection Factor (SPF) measures how well a sunscreen protects against UVB rays. Daily use can reduce the risk of common skin issues by over 50%.</p><h2>Hydration and Barrier Function</h2><p>External protection is only half the battle. Internal hydration and using barrier-repairing creams keep the skin resilient against pollutants and environmental stressors.</p>",
            "excerpt": "A dermatologist's guide to building a simple yet effective skincare routine centered around protection, hydration, and early detection.",
            "author_id": "admin",
            "author_name": "Dr. Robert Lim, Dermatology",
            "cover_image": "https://images.unsplash.com/photo-1512290923902-8a9f81dc2069?w=800&auto=format&fit=crop",
            "category": "Dermatology",
            "tags": ["Skincare", "Dermatology", "SPF"],
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
