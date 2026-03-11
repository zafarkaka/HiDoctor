from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, UploadFile, File, Query, Form, WebSocket, WebSocketDisconnect, Response
from fastapi.responses import FileResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import re
import asyncio
import logging
import httpx
from pathlib import Path

# Configure logging early to avoid NameErrors in initialization
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
import secrets
from datetime import datetime, timezone, timedelta
import bcrypt
from jose import jwt, JWTError
from enum import Enum
from notification_utils import send_chat_notification, send_call_notification, send_push_notification_to_user
import firebase_admin
from firebase_admin import auth, credentials

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from apscheduler.schedulers.asyncio import AsyncIOScheduler

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Firebase Admin Initialization
firebase_service_account = os.environ.get('FIREBASE_SERVICE_ACCOUNT_JSON')
if firebase_service_account:
    try:
        import json
        cert_dict = json.loads(firebase_service_account)
        cred = credentials.Certificate(cert_dict)
        firebase_admin.initialize_app(cred)
        logger.info("Firebase Admin initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize Firebase Admin with JSON: {e}")
else:
    # Fallback to default credentials if running in a Google Cloud environment
    try:
        firebase_admin.initialize_app()
        logger.info("Firebase Admin initialized with default credentials.")
    except Exception as e:
        logger.warning(f"Firebase Admin not initialized: {e}. 'FIREBASE_SERVICE_ACCOUNT_JSON' is required for non-GCP environments.")

# JWT Settings
SECRET_KEY = os.environ.get('JWT_SECRET', 'healthcare-platform-secret-key-2024')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Backend URL for absolute image paths
BACKEND_URL = os.environ.get('BACKEND_URL', 'https://hidoctor-production.up.railway.app').rstrip('/')

# Robust production detection: ignore 'localhost' if running on cloud platforms
IS_RAILWAY = os.environ.get('RAILWAY_ENVIRONMENT') is not None or os.environ.get('RAILWAY_STATIC_URL') is not None
if IS_RAILWAY and 'localhost' in BACKEND_URL:
    logger.info(f"Production detected (Railway). Overriding localhost BACKEND_URL '{BACKEND_URL}' with production default.")
    BACKEND_URL = 'https://hidoctor-production.up.railway.app'

if not BACKEND_URL.startswith('http') and not 'localhost' in BACKEND_URL:
    BACKEND_URL = f"https://{BACKEND_URL}"
elif 'localhost' not in BACKEND_URL and BACKEND_URL.startswith('http://'):
    # Force https for railway/production domains
    BACKEND_URL = BACKEND_URL.replace('http://', 'https://')

def normalize_image_url(url: Optional[str]) -> Optional[str]:
    if not url:
        return url
    
    # Clean whitespace and normalize slashes
    url = url.strip()
    
    # If it's already a full URL with http/https, just return it
    if url.startswith('http://') or url.startswith('https://'):
        # If it's a localhost URL, replace it with the live backend URL
        if 'localhost:8001' in url:
            return url.replace('http://localhost:8001', BACKEND_URL).replace('https://localhost:8001', BACKEND_URL)
        return url
    
    # If it's a relative path starting with uploads/ or /uploads/
    if url.startswith('/uploads/') or url.startswith('uploads/'):
        path = url if url.startswith('/') else f"/{url}"
        return f"{BACKEND_URL}{path}"
    
    # Fallback: if it's just a filename that looks like it belongs in uploads
    if not '/' in url and (url.endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp'))):
        return f"{BACKEND_URL}/uploads/{url}"
        
    return url

app = FastAPI(title="HiDoctor API")
app.state.db = db

# Configure CORS
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:8081",
    "http://127.0.0.1:8081",
    "http://localhost:19006",
    "exp://localhost:8081",
    "https://www.hidoctor.online",
    "https://hidoctor.online",
    "https://hidoctor-production.up.railway.app",
    "https://api.hidoctor.online",
]

# Clean origins and ensure no trailing slashes
origins = list(set([o.rstrip('/') for o in origins if o]))

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads directory
UPLOADS_DIR = ROOT_DIR / 'uploads'
UPLOADS_DIR.mkdir(exist_ok=True)

@app.get("/uploads/{filename}")
async def serve_image(filename: str):
    """Smart image server: uses disk first, falls back to MongoDB Atlas"""
    file_path = UPLOADS_DIR / filename
    
    # 1. Try serving from local disk (fastest)
    if file_path.exists():
        return FileResponse(file_path)
        
    # 2. Fallback to MongoDB (Railway ephemeral storage fix)
    logger.info(f"IMAGE_RECOVERY: File {filename} not found on disk. Checking MongoDB...")
    image_data = await db.images.find_one({"filename": filename})
    
    if image_data:
        logger.info(f"IMAGE_RECOVERY: Restoring {filename} from MongoDB...")
        content = image_data["content"]
        content_type = image_data.get("content_type", "image/jpeg")
        
        # Optionally restore to disk for subsequent fast access
        try:
            with open(file_path, "wb") as f:
                f.write(content)
        except Exception as e:
            logger.error(f"IMAGE_RECOVERY: Failed to write {filename} to disk: {str(e)}")
            
        return Response(content=content, media_type=content_type)
        
    # 3. Last resort: 404
    logger.warning(f"IMAGE_RECOVERY: File {filename} not found in DB either.")
    raise HTTPException(status_code=404, detail="Image not found")

async def save_image_to_db(filename: str, content: bytes, content_type: str):
    """Saves image binary data to MongoDB for persistence across deployments"""
    try:
        await db.images.update_one(
            {"filename": filename},
            {"$set": {
                "filename": filename,
                "content": content,
                "content_type": content_type,
                "created_at": datetime.now(timezone.utc).isoformat()
            }},
            upsert=True
        )
        logger.info(f"IMAGE_DB_PERSIST: Saved {filename} to MongoDB ({len(content)} bytes)")
    except Exception as e:
        logger.error(f"IMAGE_DB_PERSIST: Failed to save {filename} to MongoDB: {str(e)}")

api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# ============== ENUMS ==============
class UserRole(str, Enum):
    PATIENT = "patient"
    DOCTOR = "doctor"
    CLINIC = "clinic"
    ADMIN = "admin"

class AppointmentStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"

class ConsultationType(str, Enum):
    IN_PERSON = "in_person"
    HOME_VISIT = "home_visit"
    TELEHEALTH = "telehealth"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"
    REFUNDED = "refunded"
    FAILED = "failed"

# ============== MODELS ==============
class UserBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    username: str
    full_name: str
    phone: str
    role: UserRole

class UserCreate(BaseModel):
    username: str
    password: str
    full_name: str
    phone: str
    role: UserRole
    firebase_token: str # Required for verification during registration

class UserLogin(BaseModel):
    identifier: str  # Can be username or phone
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    username: str
    full_name: str
    phone: str
    role: UserRole
    is_verified: bool = False
    created_at: str
    profile_image: Optional[str] = None
    push_token: Optional[str] = None

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class DoctorProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    title: str = "Dr."
    license_number: str
    specialties: List[str] = []
    sub_specialties: List[str] = []
    years_experience: int = 0
    qualifications: List[str] = []
    languages: List[str] = ["English"]
    affiliation_type: str = "clinic"  # "clinic" or "hospital"
    clinic_name: Optional[str] = None
    clinic_address: Optional[str] = None
    clinic_coordinates: Optional[Dict[str, float]] = None
    clinic_photos: List[str] = []

class PushTokenRequest(BaseModel):
    token: str
    consultation_types: List[ConsultationType] = [ConsultationType.IN_PERSON]
    consultation_fee: float = 0.0
    accepted_insurances: List[str] = []
    working_hours: Dict[str, Any] = {}
    holidays: List[str] = []  # List of date strings "YYYY-MM-DD"
    emergency_phone: Optional[str] = None
    emergency_email: Optional[str] = None
    bio: Optional[str] = None
    intro_video: Optional[str] = None
    is_verified: bool = False
    is_active: bool = True
    rating: float = 0.0
    review_count: int = 0
    profile_image: Optional[str] = None

class RegisterPushTokenRequest(BaseModel):
    token: str

class DoctorCreate(BaseModel):
    full_name: Optional[str] = None
    title: str = "Dr."
    license_number: str
    specialties: List[str]
    years_experience: int
    qualifications: List[str] = []
    languages: List[str] = ["English"]
    affiliation_type: str = "clinic"  # "clinic" or "hospital"
    clinic_name: Optional[str] = None
    clinic_address: Optional[str] = None
    clinic_coordinates: Optional[Dict[str, float]] = None
    consultation_types: List[ConsultationType] = [ConsultationType.IN_PERSON]
    consultation_fee: float
    accepted_insurances: List[str] = []
    holidays: List[str] = []
    bio: Optional[str] = None
    profile_image: Optional[str] = None
    phone: Optional[str] = None

class DoctorUpdate(BaseModel):
    full_name: Optional[str] = None
    title: Optional[str] = None
    license_number: Optional[str] = None
    specialties: Optional[List[str]] = None
    years_experience: Optional[int] = None
    qualifications: Optional[List[str]] = None
    languages: Optional[List[str]] = None
    affiliation_type: Optional[str] = None
    clinic_name: Optional[str] = None
    clinic_address: Optional[str] = None
    clinic_coordinates: Optional[Dict[str, float]] = None
    consultation_types: Optional[List[ConsultationType]] = None
    consultation_fee: Optional[float] = None
    accepted_insurances: Optional[List[str]] = None
    holidays: Optional[List[str]] = None
    bio: Optional[str] = None
    profile_image: Optional[str] = None
    phone: Optional[str] = None

class AdminDoctorUpdate(DoctorUpdate):
    is_verified: Optional[bool] = None
    is_active: Optional[bool] = None

class PatientProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    preferred_language: str = "English"
    insurance_provider: Optional[str] = None
    insurance_id: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    allergies: List[str] = []
    chronic_conditions: List[str] = []
    medications: List[str] = []
    profile_image: Optional[str] = None

class PatientUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    preferred_language: Optional[str] = None
    insurance_provider: Optional[str] = None
    insurance_id: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    allergies: Optional[List[str]] = None
    chronic_conditions: Optional[List[str]] = None
    medications: Optional[List[str]] = None
    profile_image: Optional[str] = None

class FamilyMember(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    patient_id: str
    full_name: str
    date_of_birth: str
    gender: str
    relationship: str
    allergies: List[str] = []
    chronic_conditions: List[str] = []
    insurance_provider: Optional[str] = None
    insurance_id: Optional[str] = None

class FamilyMemberCreate(BaseModel):
    full_name: str
    date_of_birth: str
    gender: str
    relationship: str
    allergies: List[str] = []
    chronic_conditions: List[str] = []
    insurance_provider: Optional[str] = None
    insurance_id: Optional[str] = None

class Appointment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    hex_reference: str = Field(default_factory=lambda: secrets.token_hex(4).upper())
    patient_id: str
    doctor_id: str
    family_member_id: Optional[str] = None
    consultation_type: ConsultationType
    appointment_date: str
    appointment_time: str
    reason: Optional[str] = None
    patient_notes: Optional[str] = None
    notes: Optional[str] = None
    status: AppointmentStatus = AppointmentStatus.PENDING
    payment_status: PaymentStatus = PaymentStatus.PENDING
    payment_amount: float = 0.0
    payment_method: Optional[str] = None
    payment_session_id: Optional[str] = None
    is_home_visit: bool = False
    home_address: Optional[str] = None
    jitsi_room_id: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class AppointmentCreate(BaseModel):
    doctor_id: str
    family_member_id: Optional[str] = None
    consultation_type: ConsultationType
    appointment_date: str
    appointment_time: str
    reason: Optional[str] = None
    patient_notes: Optional[str] = None
    is_home_visit: bool = False
    home_address: Optional[str] = None

class AppointmentUpdate(BaseModel):
    status: Optional[AppointmentStatus] = None
    notes: Optional[str] = None
    appointment_date: Optional[str] = None
    appointment_time: Optional[str] = None

class ChatMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    appointment_id: str
    sender_id: str
    sender_role: UserRole
    message: str
    message_type: str = "text"  # text, image, file
    file_url: Optional[str] = None
    is_read: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ChatMessageCreate(BaseModel):
    message: str
    message_type: str = "text"
    file_url: Optional[str] = None

class Review(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    doctor_id: str
    patient_id: str
    appointment_id: str
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ReviewCreate(BaseModel):
    doctor_id: str
    appointment_id: str
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = None

class RoleUpdate(BaseModel):
    role: str

class BlogPost(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    slug: str
    content: str
    excerpt: Optional[str] = None
    author_id: str
    author_name: Optional[str] = None
    cover_image: Optional[str] = None
    category: Optional[str] = None
    tags: List[str] = []
    is_published: bool = False
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    view_count: int = 0
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class BlogPostCreate(BaseModel):
    title: str
    content: str
    excerpt: Optional[str] = None
    cover_image: Optional[str] = None
    category: Optional[str] = None
    tags: List[str] = []
    is_published: bool = False
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None

class Ad(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    image_url: str
    redirect_url: str
    placement: str  # home, clinic, blog
    is_active: bool = True
    start_date: str
    end_date: str
    impressions: int = 0
    clicks: int = 0
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class AdCreate(BaseModel):
    title: str
    image_url: str
    redirect_url: str
    placement: str
    start_date: str
    end_date: str

class Notification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    message: str
    type: str  # appointment, message, system, blog
    is_read: bool = False
    data: Dict[str, Any] = {}
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class DoctorAvailability(BaseModel):
    model_config = ConfigDict(extra="ignore")
    doctor_id: str
    date: str
    slots: List[Dict[str, Any]] = []  # [{time: "09:00", is_available: true}]

class DoctorAvailabilityCreate(BaseModel):
    date: str
    slots: List[Dict[str, Any]]

# ============== AUTH HELPERS ==============
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        # Debug logging for troubleshooting 401s
        raw_token = credentials.credentials
        if not raw_token or raw_token == "undefined" or raw_token == "null":
            logger.warning(f"AUTH_FAILURE: Empty or invalid token string provided: '{raw_token}'")
            raise HTTPException(status_code=401, detail="Invalid token format")
            
        payload = jwt.decode(raw_token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            logger.warning("AUTH_FAILURE: Token payload missing 'sub'")
            raise HTTPException(status_code=401, detail="Invalid token payload")
            
        user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
        if user is None:
            logger.warning(f"AUTH_FAILURE: User {user_id} not found in database")
            raise HTTPException(status_code=401, detail="User session not found")
            
        # Ensure we always return absolute URLs for profile_image if relative
        user["profile_image"] = normalize_image_url(user.get("profile_image"))
        return user
    except JWTError as e:
        logger.error(f"AUTH_FAILURE: JWT decoding error: {str(e)}")
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")
    except Exception as e:
        logger.error(f"AUTH_FAILURE: Unexpected error: {str(e)}")
        raise HTTPException(status_code=401, detail="Authentication system error")

async def get_admin_user(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

async def get_doctor_user(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != UserRole.DOCTOR:
        raise HTTPException(status_code=403, detail="Doctor access required")
    return current_user

# ============== AUTH ROUTES ==============
@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    username = user_data.username.lower().strip()
    phone = user_data.phone.strip()
    
    # 1. Verify Firebase Token
    try:
        decoded_token = auth.verify_id_token(user_data.firebase_token)
        # Ensure the phone number in the token matches the one provided
        firebase_phone = decoded_token.get('phone_number')
        
        # Phone numbers from Firebase are typically E.164. 
        # We should be careful about formatting, but simple equality check for now.
        if firebase_phone and firebase_phone.replace('+', '') != phone.replace('+', ''):
             logger.warning(f"Phone mismatch: token={firebase_phone}, provided={phone}")
             # We might want to allow it if it's just a formatting difference, 
             # but for security we should ideally use the phone FROM the token.
             phone = firebase_phone
    except Exception as e:
        logger.error(f"Firebase token verification failed: {e}")
        raise HTTPException(status_code=400, detail="Invalid or expired verification session")

    # 2. Check if username or phone already exists
    existing_username = await db.users.find_one({"username": {"$regex": f"^{re.escape(username)}$", "$options": "i"}})
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")
        
    existing_phone = await db.users.find_one({"phone": phone})
    if existing_phone:
        raise HTTPException(status_code=400, detail="Phone number already registered")
    
    # 3. Create User
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "username": username,
        "password": hash_password(user_data.password),
        "full_name": user_data.full_name,
        "phone": phone,
        "role": user_data.role,
        "is_verified": True, # Verified via Firebase
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    # Create role-specific profile
    if user_data.role == UserRole.PATIENT:
        patient_profile = {"user_id": user_id, "preferred_language": "English"}
        await db.patients.insert_one(patient_profile)
    elif user_data.role == UserRole.DOCTOR:
        default_working_hours = {
            "monday": {"active": True, "slots": [{"start": "09:00", "end": "17:00"}]},
            "tuesday": {"active": True, "slots": [{"start": "09:00", "end": "17:00"}]},
            "wednesday": {"active": True, "slots": [{"start": "09:00", "end": "17:00"}]},
            "thursday": {"active": True, "slots": [{"start": "09:00", "end": "17:00"}]},
            "friday": {"active": True, "slots": [{"start": "09:00", "end": "17:00"}]},
            "saturday": {"active": False, "slots": [{"start": "10:00", "end": "14:00"}]},
            "sunday": {"active": False, "slots": [{"start": "10:00", "end": "14:00"}]},
        }
        doctor_profile = {
            "user_id": user_id,
            "full_name": user_data.full_name,
            "profile_image": None,
            "title": "Dr.",
            "specialties": [],
            "years_experience": 0,
            "consultation_fee": 500.0,
            "is_verified": False,
            "is_active": False,
            "working_hours": default_working_hours,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.doctors.insert_one(doctor_profile)
    
    token = create_access_token({"sub": user_id, "role": user_data.role})
    user_response = UserResponse(
        id=user_id, username=username, full_name=user_data.full_name,
        phone=phone, role=user_data.role, is_verified=True,
        created_at=user_doc["created_at"],
        profile_image=normalize_image_url(user_doc.get("profile_image"))
    )
    return TokenResponse(access_token=token, user=user_response)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    identifier = credentials.identifier.lower().strip()
    logger.info(f"Login attempt for: {identifier}")
    
    # Check by username or phone
    user = await db.users.find_one({
        "$or": [
            {"username": {"$regex": f"^{re.escape(identifier)}$", "$options": "i"}},
            {"phone": identifier}
        ]
    }, {"_id": 0})
    
    if not user:
        logger.warning(f"AUTH_FAILURE: User not found: {identifier}")
        raise HTTPException(status_code=401, detail="User not found")
        
    pwd_in_db = user.get("password")
    if not verify_password(credentials.password, pwd_in_db):
        logger.warning(f"AUTH_FAILURE: Password mismatch for user {identifier}")
        raise HTTPException(status_code=401, detail="Invalid password")
    
    if not user.get("is_verified", False):
        raise HTTPException(status_code=403, detail="Account not verified. Please register again to receive OTP.")

    logger.info(f"AUTH_SUCCESS: Login verified for user {identifier}")
    token = create_access_token({"sub": user["id"], "role": user["role"]})
    user_response = UserResponse(
        id=user["id"], username=user["username"], full_name=user["full_name"],
        phone=user.get("phone"), role=user["role"], is_verified=user.get("is_verified", False),
        created_at=user["created_at"],
        profile_image=normalize_image_url(user.get("profile_image"))
    )
    return TokenResponse(access_token=token, user=user_response)

# --- Forgot / Reset Password ---
class ForgotPasswordRequest(BaseModel):
    phone: str

class ResetPasswordRequest(BaseModel):
    phone: str
    firebase_token: str
    new_password: str

@api_router.post("/auth/forgot-password")
async def forgot_password(data: ForgotPasswordRequest):
    """Check if a phone number is registered."""
    phone = data.phone.strip()
    user = await db.users.find_one({"phone": phone}, {"id": 1})
    if not user:
        raise HTTPException(status_code=404, detail="User with this phone number not found")
    
    return {"message": "User found. Please verify phone to reset password."}

@api_router.post("/auth/reset-password")
async def reset_password(data: ResetPasswordRequest):
    """Verify Firebase token and update user password."""
    phone = data.phone.strip()
    
    # 1. Verify Firebase Token
    try:
        decoded_token = auth.verify_id_token(data.firebase_token)
        firebase_phone = decoded_token.get('phone_number')
        
        if firebase_phone and firebase_phone.replace('+', '') != phone.replace('+', ''):
             logger.warning(f"Reset phone mismatch: token={firebase_phone}, provided={phone}")
             phone = firebase_phone
    except Exception as e:
        logger.error(f"Firebase token verification failed for reset: {e}")
        raise HTTPException(status_code=400, detail="Invalid verification session")

    # 2. Update Password
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    user = await db.users.find_one({"phone": phone})
    if not user:
        raise HTTPException(status_code=404, detail="User with this phone number not found")
        
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"password": hash_password(data.new_password)}}
    )
    
    return {"message": "Password updated successfully"}

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(**current_user)

@api_router.put("/auth/profile")
async def update_auth_profile(update: ProfileUpdate, current_user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if update_data:
        await db.users.update_one({"id": current_user["id"]}, {"$set": update_data})
        # Keep specialized collections in sync
        if current_user["role"] == UserRole.PATIENT:
            await db.patients.update_one({"user_id": current_user["id"]}, {"$set": update_data})
        elif current_user["role"] == UserRole.DOCTOR:
            await db.doctors.update_one({"user_id": current_user["id"]}, {"$set": update_data})
    return {"message": "Profile updated"}

@api_router.post("/auth/profile/picture")
async def upload_profile_picture(
    file: UploadFile = File(...), 
    current_user: dict = Depends(get_current_user)
):
    logger.info(f"Upload profile picture attempt for user: {current_user['id']}, role: {current_user.get('role')}")
    logger.info(f"Filename: {file.filename}, Content-Type: {file.content_type}")
    
    if not file.content_type.startswith('image/'):
        logger.error(f"Upload failed: File is not an image ({file.content_type})")
        raise HTTPException(status_code=400, detail="File must be an image")
        
    try:
        ext = file.filename.split('.')[-1] if '.' in file.filename else 'png'
        filename = f"{current_user['id']}_{uuid.uuid4().hex[:8]}.{ext}"
        file_path = UPLOADS_DIR / filename
        
        logger.info(f"Saving file to: {file_path}")
        
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
            
        # PERSIST: Save to MongoDB fallback
        await save_image_to_db(filename, content, file.content_type)
            
        file_url = f"/uploads/{filename}"
        logger.info(f"File saved successfully. URL: {file_url}")
        
        # Update user record
        await db.users.update_one({"id": current_user["id"]}, {"$set": {"profile_image": file_url}})
        
        # Update role-specific records
        if current_user["role"] == UserRole.PATIENT:
            await db.patients.update_one({"user_id": current_user["id"]}, {"$set": {"profile_image": file_url}})
        elif current_user["role"] == UserRole.DOCTOR:
            result = await db.doctors.update_one({"user_id": current_user["id"]}, {"$set": {"profile_image": file_url}})
            logger.info(f"Doctor profile update result: matched={result.matched_count}, modified={result.modified_count}")
            
        return {"message": "Profile picture updated", "url": file_url}
    except Exception as e:
        logger.error(f"Error in upload_profile_picture: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error during upload: {str(e)}")

@api_router.post("/users/push-token")
async def register_push_token(data: RegisterPushTokenRequest, current_user: dict = Depends(get_current_user)):
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"push_token": data.token}}
    )
    return {"message": "Push token registered"}

# ============== DOCTOR ROUTES ==============
@api_router.post("/doctors/profile")
async def create_doctor_profile(profile: DoctorCreate, current_user: dict = Depends(get_doctor_user)):
    existing = await db.doctors.find_one({"user_id": current_user["id"]})
    profile_doc = profile.model_dump()
    profile_doc["user_id"] = current_user["id"]
    
    # Preserve existing verification status and rating
    if existing:
        profile_doc["is_verified"] = existing.get("is_verified", False)
        profile_doc["is_active"] = existing.get("is_active", False)
        profile_doc["rating"] = existing.get("rating", 0.0)
        profile_doc["review_count"] = existing.get("review_count", 0)
    else:
        profile_doc["is_verified"] = False
        profile_doc["is_active"] = False
        profile_doc["rating"] = 0.0
        profile_doc["review_count"] = 0
    
    profile_doc["full_name"] = profile.full_name if profile.full_name else current_user["full_name"]
    profile_doc["email"] = current_user["email"]
    profile_doc["phone"] = profile.phone if hasattr(profile, 'phone') and profile.phone else current_user.get("phone")
    
    # Update user record with name if changed
    if profile.full_name:
        await db.users.update_one({"id": current_user["id"]}, {"$set": {"full_name": profile.full_name}})
    
    if existing:
        await db.doctors.update_one({"user_id": current_user["id"]}, {"$set": profile_doc})
    else:
        await db.doctors.insert_one(profile_doc)
    profile_doc.pop("_id", None)
    
    return {"message": "Profile created/updated successfully", "profile": profile_doc}

@api_router.put("/doctors/profile")
async def update_doctor_profile(profile: DoctorUpdate, current_user: dict = Depends(get_doctor_user)):
    existing = await db.doctors.find_one({"user_id": current_user["id"]})
    if not existing:
        raise HTTPException(status_code=404, detail="Doctor profile not found")

    update_data = {k: v for k, v in profile.model_dump().items() if v is not None}
    
    if update_data:
        # If common user fields are updated, sync with the canonical Users collection
        user_update = {}
        if "full_name" in update_data:
            user_update["full_name"] = update_data["full_name"]
        if "phone" in update_data:
            user_update["phone"] = update_data["phone"]
        if "profile_image" in update_data:
            user_update["profile_image"] = update_data["profile_image"]
            
        if user_update:
            await db.users.update_one({"id": current_user["id"]}, {"$set": user_update})

        await db.doctors.update_one({"user_id": current_user["id"]}, {"$set": update_data})

    return {"message": "Profile updated successfully"}

@api_router.get("/doctors/profile")
async def get_my_doctor_profile_endpoint(current_user: dict = Depends(get_doctor_user)):
    """Fetch the authenticated doctor's full profile"""
    profile = await db.doctors.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
        
    # Enrich with user info
    if not profile.get("full_name"):
        profile["full_name"] = current_user.get("full_name")
    if not profile.get("profile_image"):
        profile["profile_image"] = current_user.get("profile_image")
    profile["email"] = current_user.get("email")
    profile["phone"] = current_user.get("phone")
    
    return profile

@api_router.get("/doctors")
async def list_doctors(
    specialty: Optional[str] = None,
    location: Optional[str] = None,
    consultation_type: Optional[ConsultationType] = None,
    min_fee: Optional[float] = None,
    max_fee: Optional[float] = None,
    language: Optional[str] = None,
    insurance: Optional[str] = None,
    search: Optional[str] = None,
    is_home_visit: Optional[bool] = None,
    page: int = 1,
    limit: int = 20
):
    """List doctors with advanced filters and enrichment from Users collection"""
    query = {"is_verified": True, "is_active": True}
    
    if specialty:
        query["specialties"] = {"$in": [specialty]}
    if consultation_type:
        query["consultation_types"] = {"$in": [consultation_type]}
    if is_home_visit is not None:
        query["consultation_types"] = {"$in": [ConsultationType.HOME_VISIT]}
    if language:
        query["languages"] = {"$in": [language]}
    if insurance:
        query["accepted_insurances"] = {"$in": [insurance]}
    if min_fee is not None:
        query["consultation_fee"] = {"$gte": min_fee}
    if max_fee is not None:
        query.setdefault("consultation_fee", {})["$lte"] = max_fee
    
    # Combined text search for name, clinic, and specialty
    text_search = search or None
    if text_search:
        query["$or"] = [
            {"full_name": {"$regex": text_search, "$options": "i"}},
            {"clinic_name": {"$regex": text_search, "$options": "i"}},
            {"specialties": {"$in": [text_search]}}
        ]
    
    if location:
        query["clinic_address"] = {"$regex": location, "$options": "i"}
    
    skip = (page - 1) * limit
    doctors = await db.doctors.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.doctors.count_documents(query)
    
    # Enrichment from Users collection (for profile_image and full_name if missing in doctor record)
    for doc in doctors:
        user_info = await db.users.find_one({"id": doc["user_id"]}, {"_id": 0, "full_name": 1, "profile_image": 1})
        if user_info:
            if not doc.get("full_name"):
                doc["full_name"] = user_info.get("full_name")
            
            raw_img = user_info.get("profile_image") or doc.get("profile_image")
            normalized = normalize_image_url(raw_img)
            doc["profile_image"] = normalized
            # logger.info(f"Doctor {doc.get('user_id')} image: raw={raw_img} -> normalized={normalized}")
        else:
            doc["profile_image"] = normalize_image_url(doc.get("profile_image"))
    
    return {"doctors": doctors, "total": total, "page": page, "pages": (total + limit - 1) // limit}

@api_router.get("/doctors/top-rated")
async def get_top_rated_doctors(limit: int = 6):
    """Get highest rated doctors with user enrichment"""
    query = {"is_verified": True, "is_active": True}
    # Sort by rating (desc) and reviews (desc)
    doctors = await db.doctors.find(query, {"_id": 0}).sort([("rating", -1), ("review_count", -1)]).limit(limit).to_list(limit)
    
    for doc in doctors:
        user_info = await db.users.find_one({"id": doc["user_id"]}, {"_id": 0, "full_name": 1, "profile_image": 1})
        if user_info:
            if not doc.get("full_name"):
                doc["full_name"] = user_info.get("full_name")
            
            raw_img = user_info.get("profile_image") or doc.get("profile_image")
            normalized = normalize_image_url(raw_img)
            doc["profile_image"] = normalized
            logger.info(f"Top Doctor {doc.get('user_id')} image: raw={raw_img} -> normalized={normalized}")
        else:
            doc["profile_image"] = normalize_image_url(doc.get("profile_image"))
            
    return {"doctors": doctors}

@api_router.get("/doctors/holidays")
async def get_doctor_holidays(current_user: dict = Depends(get_current_user)):
    """Fetch the authenticated doctor's registered holidays (unavailable dates)"""
    if current_user["role"] != UserRole.DOCTOR:
        raise HTTPException(status_code=403, detail="Only doctors can access their holiday schedule")
    
    doctor = await db.doctors.find_one({"user_id": current_user["id"]}, {"_id": 0, "holidays": 1})
    if not doctor:
        return {"holidays": []}
        
    return {"holidays": doctor.get("holidays", [])}

class HolidayRequest(BaseModel):
    holidays: List[str]

@api_router.put("/doctors/holidays")
async def update_doctor_holidays_single(
    data: HolidayRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update the authenticated doctor's registered holidays"""
    if current_user["role"] != UserRole.DOCTOR:
        raise HTTPException(status_code=403, detail="Only doctors can modify their holidays")
        
    result = await db.doctors.update_one(
        {"user_id": current_user["id"]},
        {"$set": {"holidays": data.holidays}}
    )
    
    # Also block these dates in availability
    for date in data.holidays:
        await db.availability.update_one(
            {"doctor_id": current_user["id"], "date": date},
            {"$set": {"doctor_id": current_user["id"], "date": date, "slots": [], "is_blocked": True}},
            upsert=True
        )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
        
    return {"message": "Holidays updated successfully", "holidays": data.holidays}

class BlockDatesRequest(BaseModel):
    dates: List[str]

@api_router.post("/doctors/availability/block")
async def block_doctor_dates(
    data: BlockDatesRequest,
    current_user: dict = Depends(get_current_user)
):
    """Block specific dates for the authenticated doctor (used by mobile)"""
    if current_user["role"] != UserRole.DOCTOR:
        raise HTTPException(status_code=403, detail="Only doctors can block dates")
    
    # Update holidays list in doctor profile
    await db.doctors.update_one(
        {"user_id": current_user["id"]},
        {"$addToSet": {"holidays": {"$each": data.dates}}}
    )
    
    # Block these dates in availability collection
    for date in data.dates:
        await db.availability.update_one(
            {"doctor_id": current_user["id"], "date": date},
            {"$set": {"doctor_id": current_user["id"], "date": date, "slots": [], "is_blocked": True}},
            upsert=True
        )
        
    return {"message": f"Successfully blocked {len(data.dates)} dates"}

@api_router.get("/doctors/working-hours")
async def get_doctor_working_hours(current_user: dict = Depends(get_current_user)):
    """Fetch the authenticated doctor's weekly working hours"""
    if current_user["role"] != UserRole.DOCTOR:
        raise HTTPException(status_code=403, detail="Only doctors can access their schedule")
    
    doctor = await db.doctors.find_one({"user_id": current_user["id"]}, {"_id": 0, "working_hours": 1})
    
    default_working_hours = {
        "monday": {"active": True, "slots": [{"start": "09:00", "end": "17:00"}]},
        "tuesday": {"active": True, "slots": [{"start": "09:00", "end": "17:00"}]},
        "wednesday": {"active": True, "slots": [{"start": "09:00", "end": "17:00"}]},
        "thursday": {"active": True, "slots": [{"start": "09:00", "end": "17:00"}]},
        "friday": {"active": True, "slots": [{"start": "09:00", "end": "17:00"}]},
        "saturday": {"active": False, "slots": [{"start": "10:00", "end": "14:00"}]},
        "sunday": {"active": False, "slots": [{"start": "10:00", "end": "14:00"}]},
    }
    
    if not doctor:
        return {"working_hours": default_working_hours}
    
    wh = doctor.get("working_hours", {})
    if not wh or not isinstance(wh, dict) or len(wh) == 0:
        return {"working_hours": default_working_hours}
        
    return {"working_hours": wh}

class WorkingHoursRequest(BaseModel):
    working_hours: Dict[str, Any]

@api_router.put("/doctors/working-hours")
async def update_doctor_working_hours_single(
    data: WorkingHoursRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update the authenticated doctor's weekly working hours"""
    if current_user["role"] != UserRole.DOCTOR:
        raise HTTPException(status_code=403, detail="Only doctors can modify their schedule")
    
    result = await db.doctors.update_one(
        {"user_id": current_user["id"]},
        {"$set": {"working_hours": data.working_hours}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
        
    return {"message": "Working hours updated successfully"}

@api_router.get("/doctors/{doctor_id}")
async def get_doctor(doctor_id: str):
    doctor = await db.doctors.find_one({"user_id": doctor_id}, {"_id": 0})
    if not doctor:
        # Fallback to search by user_id if needed
        doctor = await db.doctors.find_one({"user_id": doctor_id}, {"_id": 0})
        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor not found")
    
    # Normalization
    user = await db.users.find_one({"id": doctor_id}, {"profile_image": 1})
    doc_img = doctor.get("profile_image")
    user_img = user.get("profile_image") if user else None
    doctor["profile_image"] = normalize_image_url(user_img or doc_img)
    return doctor

@api_router.get("/doctors/{doctor_id}/reviews")
async def get_doctor_reviews(doctor_id: str):
    reviews = await db.reviews.find({"doctor_id": doctor_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"reviews": reviews}

@api_router.get("/doctors/{doctor_id}/can-review")
async def can_review_doctor(doctor_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != UserRole.PATIENT:
        return {"can_review": False}
        
    completed_appt = await db.appointments.find_one({
        "doctor_id": doctor_id,
        "patient_id": current_user["id"],
        "status": AppointmentStatus.COMPLETED
    })
    
    already_reviewed = await db.reviews.find_one({
        "doctor_id": doctor_id,
        "patient_id": current_user["id"]
    })
    
    can_review = (completed_appt is not None) and (already_reviewed is None)
    return {
        "can_review": can_review, 
        "appointment_id": completed_appt["id"] if can_review else None
    }

@api_router.post("/doctors/{doctor_id}/reviews")
async def create_doctor_review(
    doctor_id: str, 
    review: ReviewCreate, 
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != UserRole.PATIENT:
        raise HTTPException(status_code=403, detail="Only patients can leave reviews")
        
    # Verify completed appointment
    completed_appt = await db.appointments.find_one({
        "doctor_id": doctor_id,
        "patient_id": current_user["id"],
        "status": AppointmentStatus.COMPLETED
    })
    
    if not completed_appt:
        raise HTTPException(status_code=403, detail="You can only review doctors after a completed appointment")
        
    # Verify not already reviewed
    already_reviewed = await db.reviews.find_one({
        "doctor_id": doctor_id,
        "patient_id": current_user["id"]
    })
    
    if already_reviewed:
        raise HTTPException(status_code=400, detail="You have already reviewed this doctor")
        
    review_doc = {
        "id": str(uuid.uuid4()),
        "doctor_id": doctor_id,
        "patient_id": current_user["id"],
        "appointment_id": completed_appt["id"],
        "patient_name": current_user.get("full_name", "Anonymous"),
        "rating": review.rating,
        "comment": review.comment,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.reviews.insert_one(review_doc)
    
    # Update doctor rating
    all_reviews = await db.reviews.find({"doctor_id": doctor_id}).to_list(None)
    new_count = len(all_reviews)
    new_rating = sum(r["rating"] for r in all_reviews) / new_count if new_count > 0 else 0.0
    
    await db.doctors.update_one(
        {"user_id": doctor_id},
        {"$set": {"rating": round(new_rating, 1), "review_count": new_count}}
    )
    
    review_doc.pop("_id", None)
    return {"message": "Review submitted successfully", "review": review_doc}

@api_router.post("/doctors/availability")
async def set_availability(availability: DoctorAvailabilityCreate, current_user: dict = Depends(get_doctor_user)):
    doc = {
        "doctor_id": current_user["id"],
        "date": availability.date,
        "slots": availability.slots
    }
    await db.availability.update_one(
        {"doctor_id": current_user["id"], "date": availability.date},
        {"$set": doc},
        upsert=True
    )
    return {"message": "Availability updated"}

@api_router.get("/doctors/{doctor_id}/availability")
async def get_doctor_availability(doctor_id: str, start_date: Optional[str] = None, end_date: Optional[str] = None):
    query = {"doctor_id": doctor_id}
    if start_date:
        query["date"] = {"$gte": start_date}
    if end_date:
        query.setdefault("date", {})["$lte"] = end_date
    
    availability = await db.availability.find(query, {"_id": 0}).to_list(100)
    return {"availability": availability}

@api_router.get("/doctors/{doctor_id}/booked-slots")
async def get_doctor_booked_slots(doctor_id: str, date: str):
    query = {
        "doctor_id": doctor_id,
        "appointment_date": date,
        "status": {"$in": [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]}
    }
    
    appointments = await db.appointments.find(query, {"_id": 0, "appointment_time": 1}).to_list(100)
    booked_times = [apt.get("appointment_time") for apt in appointments if apt.get("appointment_time")]
    return {"booked_slots": booked_times}

# ============== PATIENT ROUTES ==============
@api_router.get("/patients/profile")
async def get_patient_profile(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != UserRole.PATIENT:
        raise HTTPException(status_code=403, detail="Patient access required")
    profile = await db.patients.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not profile:
        profile = {"user_id": current_user["id"]}
    profile["full_name"] = current_user["full_name"]
    profile["email"] = current_user["email"]
    profile["phone"] = current_user.get("phone")
    return profile

@api_router.put("/patients/profile")
async def update_patient_profile(update: PatientUpdate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != UserRole.PATIENT:
        raise HTTPException(status_code=403, detail="Patient access required")
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    
    # Update user record for full_name and phone
    user_update = {}
    if "full_name" in update_data:
        user_update["full_name"] = update_data.pop("full_name")
    if "phone" in update_data:
        user_update["phone"] = update_data.pop("phone")
    
    if user_update:
        await db.users.update_one({"id": current_user["id"]}, {"$set": user_update})
    
    if update_data:
        await db.patients.update_one(
            {"user_id": current_user["id"]},
            {"$set": update_data},
            upsert=True
        )
    return {"message": "Profile updated"}

# ============== FAMILY MEMBERS ROUTES ==============
@api_router.get("/family-members")
async def get_family_members(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != UserRole.PATIENT:
        raise HTTPException(status_code=403, detail="Patient access required")
    members = await db.family_members.find({"patient_id": current_user["id"]}, {"_id": 0}).to_list(4)
    return {"members": members, "count": len(members), "max": 4}

@api_router.post("/family-members")
async def add_family_member(member: FamilyMemberCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != UserRole.PATIENT:
        raise HTTPException(status_code=403, detail="Patient access required")
    
    count = await db.family_members.count_documents({"patient_id": current_user["id"]})
    if count >= 4:
        raise HTTPException(status_code=400, detail="Maximum 4 family members allowed")
    
    member_doc = member.model_dump()
    member_doc["id"] = str(uuid.uuid4())
    member_doc["patient_id"] = current_user["id"]
    
    await db.family_members.insert_one(member_doc)
    # Remove MongoDB's _id field to avoid serialization issues
    member_doc.pop("_id", None)
    return {"message": "Family member added", "member": member_doc}

@api_router.delete("/family-members/{member_id}")
async def delete_family_member(member_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != UserRole.PATIENT:
        raise HTTPException(status_code=403, detail="Patient access required")
    
    result = await db.family_members.delete_one({"id": member_id, "patient_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Family member not found")
    return {"message": "Family member deleted"}

# ============== APPOINTMENT ROUTES ==============
@api_router.post("/appointments")
async def create_appointment(appointment: AppointmentCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != UserRole.PATIENT:
        raise HTTPException(status_code=403, detail="Patient access required")
    
    doctor = await db.doctors.find_one({"user_id": appointment.doctor_id}, {"_id": 0})
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
        
    # Comprehensive Availability Check (Schedules, Holidays, Overlaps, Breaks)
    logger.info(f"Checking availability for doctor {appointment.doctor_id} on {appointment.appointment_date} at {appointment.appointment_time}")
    availability = await get_available_slots(appointment.doctor_id, str(appointment.appointment_date))
    is_valid_slot = False
    for slot in availability.get("slots", []):
        if slot["time"] == appointment.appointment_time and slot["is_available"]:
            is_valid_slot = True
            break
            
    if not is_valid_slot:
        logger.warning(f"Slot {appointment.appointment_time} on {appointment.appointment_date} is UNAVAILABLE for doctor {appointment.doctor_id}")
        raise HTTPException(status_code=400, detail="The selected time slot is unavailable or outside working hours")
        
    # Home Visit Validation
    if appointment.consultation_type == ConsultationType.HOME_VISIT:
        if not appointment.home_address:
            raise HTTPException(status_code=400, detail="Home address is required for Home Visit consultations")
            
        appointment.is_home_visit = True
    
    appointment_doc = appointment.model_dump()
    appointment_doc["id"] = str(uuid.uuid4())
    appointment_doc["hex_reference"] = secrets.token_hex(4).upper()
    appointment_doc["patient_id"] = current_user["id"]
    appointment_doc["status"] = AppointmentStatus.PENDING
    appointment_doc["payment_status"] = PaymentStatus.PENDING
    appointment_doc["payment_amount"] = doctor.get("consultation_fee", 0)
    appointment_doc["created_at"] = datetime.now(timezone.utc).isoformat()
    appointment_doc["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    try:
        await db.appointments.insert_one(appointment_doc)
        logger.info(f"Appointment {appointment_doc['id']} created successfully")
    except Exception as e:
        logger.error(f"Failed to insert appointment: {e}")
        raise HTTPException(status_code=500, detail="Failed to create appointment in database")

    # Remove MongoDB's _id field to avoid serialization issues
    appointment_doc.pop("_id", None)
    
    # Create notification for doctor
    await create_notification(
        user_id=appointment.doctor_id,
        title="New Appointment Request",
        message=f"New appointment request from {current_user['full_name']}",
        type="appointment",
        data={"appointment_id": appointment_doc["id"]}
    )
    
    return {"message": "Appointment created", "appointment": appointment_doc}

@api_router.get("/appointments")
async def get_appointments(
    status: Optional[AppointmentStatus] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] == UserRole.PATIENT:
        query = {"patient_id": current_user["id"]}
    elif current_user["role"] == UserRole.DOCTOR:
        query = {"doctor_id": current_user["id"]}
    else:
        query = {}
    
    if status:
        query["status"] = status
    if start_date:
        query["appointment_date"] = {"$gte": start_date}
    if end_date:
        query.setdefault("appointment_date", {})["$lte"] = end_date
    
    appointments = await db.appointments.find(query, {"_id": 0}).sort("appointment_date", -1).to_list(100)
    
    # Enrich with doctor/patient info
    for apt in appointments:
        if current_user["role"] == UserRole.PATIENT:
            doctor = await db.doctors.find_one({"user_id": apt["doctor_id"]}, {"_id": 0, "full_name": 1, "profile_image": 1, "specialties": 1})
            if doctor:
                doctor["profile_image"] = normalize_image_url(doctor.get("profile_image"))
            apt["doctor"] = doctor
        else:
            patient = await db.users.find_one({"id": apt["patient_id"]}, {"_id": 0, "full_name": 1, "email": 1})
            apt["patient"] = patient
    
    return {"appointments": appointments}

@api_router.get("/appointments/{appointment_id}")
async def get_appointment(appointment_id: str, current_user: dict = Depends(get_current_user)):
    try:
        appointment = await db.appointments.find_one({"id": appointment_id}, {"_id": 0})
        if not appointment:
            raise HTTPException(status_code=404, detail="Appointment not found")
        
        # Check access
        if current_user["role"] == UserRole.PATIENT and appointment.get("patient_id") != current_user["id"]:
            raise HTTPException(status_code=403, detail="Access denied")
        if current_user["role"] == UserRole.DOCTOR and appointment.get("doctor_id") != current_user["id"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Enrich data
        doctor = await db.doctors.find_one({"user_id": appointment.get("doctor_id")}, {"_id": 0})
        patient = await db.users.find_one({"id": appointment.get("patient_id")}, {"_id": 0, "password": 0})
        if doctor:
            doctor["profile_image"] = normalize_image_url(doctor.get("profile_image"))
        if patient:
            patient["profile_image"] = normalize_image_url(patient.get("profile_image"))
        appointment["doctor"] = doctor
        appointment["patient"] = patient
        
        if appointment.get("family_member_id"):
            family_member = await db.family_members.find_one({"id": appointment["family_member_id"]}, {"_id": 0})
            appointment["family_member"] = family_member
        
        return appointment
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"ERROR: Fetching appointment {appointment_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@api_router.put("/appointments/{appointment_id}")
async def update_appointment(appointment_id: str, update: AppointmentUpdate, current_user: dict = Depends(get_current_user)):
    appointment = await db.appointments.find_one({"id": appointment_id}, {"_id": 0})
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.appointments.update_one({"id": appointment_id}, {"$set": update_data})
    
    # Create notification
    if update.status:
        recipient_id = appointment["patient_id"] if current_user["role"] == UserRole.DOCTOR else appointment["doctor_id"]
        await create_notification(
            user_id=recipient_id,
            title=f"Appointment {update.status.value.title()}",
            message=f"Your appointment has been {update.status.value}",
            type="appointment",
            data={"appointment_id": appointment_id}
        )
    
    return {"message": "Appointment updated"}

@api_router.post("/appointments/{appointment_id}/cancel")
async def cancel_appointment(appointment_id: str, current_user: dict = Depends(get_current_user)):
    appointment = await db.appointments.find_one({"id": appointment_id}, {"_id": 0})
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    if appointment["status"] in [AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED]:
        raise HTTPException(status_code=400, detail="Cannot cancel this appointment")
    
    await db.appointments.update_one(
        {"id": appointment_id},
        {"$set": {"status": AppointmentStatus.CANCELLED, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Appointment cancelled"}

# ============== CALL NOTIFICATIONS ==============
class CallInitiateRequest(BaseModel):
    is_video: bool = True

@api_router.post("/appointments/{appointment_id}/call")
async def initiate_call(
    appointment_id: str,
    data: CallInitiateRequest,
    current_user: dict = Depends(get_current_user)
):
    """Trigger a push notification to the other party that a call is starting."""
    appointment = await db.appointments.find_one({"id": appointment_id}, {"_id": 0})
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
        
    recipient_id = appointment["patient_id"] if current_user["id"] == appointment["doctor_id"] else appointment["doctor_id"]
    
    # Send Push Notification
    import asyncio
    asyncio.create_task(send_call_notification(
        app,
        recipient_id,
        current_user["full_name"],
        appointment_id,
        data.is_video
    ))
    
    return {"message": "Call notification sent"}

# ============== CHAT ROUTES ==============
@api_router.get("/appointments/{appointment_id}/messages")
async def get_messages(appointment_id: str, current_user: dict = Depends(get_current_user)):
    appointment = await db.appointments.find_one({"id": appointment_id}, {"_id": 0})
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    messages = await db.appointment_messages.find(
        {"appointment_id": appointment_id}, {"_id": 0}
    ).sort("created_at", 1).to_list(500)
    
    # Mark messages as read
    await db.appointment_messages.update_many(
        {"appointment_id": appointment_id, "sender_id": {"$ne": current_user["id"]}},
        {"$set": {"is_read": True}}
    )
    
    return {"messages": messages}

@api_router.post("/appointments/{appointment_id}/messages")
async def send_message(appointment_id: str, message: ChatMessageCreate, current_user: dict = Depends(get_current_user)):
    appointment = await db.appointments.find_one({"id": appointment_id}, {"_id": 0})
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    message_doc = {
        "id": str(uuid.uuid4()),
        "appointment_id": appointment_id,
        "sender_id": current_user["id"],
        "sender_role": current_user["role"],
        "sender_name": current_user["full_name"],
        "message": message.message,
        "message_type": message.message_type,
        "file_url": message.file_url,
        "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.appointment_messages.insert_one(message_doc)
    message_doc.pop("_id", None)  # Remove MongoDB _id
    
    # Create notification (DB and Push)
    recipient_id = appointment["patient_id"] if current_user["id"] == appointment["doctor_id"] else appointment["doctor_id"]
    await create_notification(
        user_id=recipient_id,
        title="New Message",
        message=f"{current_user['full_name']}: {message.message[:50]}...",
        type="chat",
        data={"appointment_id": appointment_id}
    )
    
    return {"message": "Message sent", "data": message_doc}

# ============== REVIEWS ROUTES ==============
@api_router.post("/reviews")
async def create_review(review: ReviewCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != UserRole.PATIENT:
        raise HTTPException(status_code=403, detail="Only patients can leave reviews")
    
    existing = await db.reviews.find_one({
        "patient_id": current_user["id"],
        "appointment_id": review.appointment_id
    })
    if existing:
        raise HTTPException(status_code=400, detail="Review already exists for this appointment")
    
    review_doc = review.model_dump()
    review_doc["id"] = str(uuid.uuid4())
    review_doc["patient_id"] = current_user["id"]
    review_doc["patient_name"] = current_user["full_name"]
    review_doc["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.reviews.insert_one(review_doc)
    # Remove MongoDB's _id field to avoid serialization issues
    review_doc.pop("_id", None)
    
    # Update doctor rating
    pipeline = [
        {"$match": {"doctor_id": review.doctor_id}},
        {"$group": {"_id": None, "avg_rating": {"$avg": "$rating"}, "count": {"$sum": 1}}}
    ]
    result = await db.reviews.aggregate(pipeline).to_list(1)
    if result:
        await db.doctors.update_one(
            {"user_id": review.doctor_id},
            {"$set": {"rating": round(result[0]["avg_rating"], 1), "review_count": result[0]["count"]}}
        )
    
    return {"message": "Review created", "review": review_doc}

@api_router.get("/doctors/{doctor_id}/reviews")
async def get_doctor_reviews(doctor_id: str, page: int = 1, limit: int = 10):
    skip = (page - 1) * limit
    reviews = await db.reviews.find({"doctor_id": doctor_id}, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.reviews.count_documents({"doctor_id": doctor_id})
    return {"reviews": reviews, "total": total, "page": page}

# ============== BLOG ROUTES ==============
@api_router.get("/blog")
async def list_blog_posts(category: Optional[str] = None, tag: Optional[str] = None, page: int = 1, limit: int = 10):
    query = {"is_published": True}
    if category:
        query["category"] = category
    if tag:
        query["tags"] = {"$in": [tag]}
    
    skip = (page - 1) * limit
    posts = await db.blog_posts.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.blog_posts.count_documents(query)
    
    return {"posts": posts, "total": total, "page": page, "pages": (total + limit - 1) // limit}

@api_router.get("/blog/{slug_or_id}")
async def get_blog_post(slug_or_id: str):
    # Try finding by ID first
    post = await db.blog_posts.find_one({"id": slug_or_id}, {"_id": 0})
    if not post:
        # Then try by slug
        post = await db.blog_posts.find_one({"slug": slug_or_id, "is_published": True}, {"_id": 0})
    
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Increment view count
    await db.blog_posts.update_one({"id": post["id"]}, {"$inc": {"view_count": 1}})
    
    return post

@api_router.post("/blog")
async def create_blog_post(post: BlogPostCreate, current_user: dict = Depends(get_admin_user)):
    slug = post.title.lower().replace(" ", "-").replace("'", "")[:50]
    existing = await db.blog_posts.find_one({"slug": slug})
    if existing:
        slug = f"{slug}-{str(uuid.uuid4())[:8]}"
    
    post_doc = post.model_dump()
    post_doc["id"] = str(uuid.uuid4())
    post_doc["slug"] = slug
    post_doc["author_id"] = current_user["id"]
    post_doc["author_name"] = current_user["full_name"]
    post_doc["view_count"] = 0
    post_doc["created_at"] = datetime.now(timezone.utc).isoformat()
    post_doc["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.blog_posts.insert_one(post_doc)
    return {"message": "Post created", "post": post_doc}

@api_router.put("/blog/{post_id}")
async def update_blog_post(post_id: str, post: BlogPostCreate, current_user: dict = Depends(get_admin_user)):
    update_data = post.model_dump()
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.blog_posts.update_one({"id": post_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    
    return {"message": "Post updated"}

@api_router.delete("/blog/{post_id}")
async def delete_blog_post(post_id: str, current_user: dict = Depends(get_admin_user)):
    result = await db.blog_posts.delete_one({"id": post_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    return {"message": "Post deleted"}

# ============== ADS ROUTES ==============
@api_router.get("/campaigns")
async def get_active_ads(placement: Optional[str] = None):
    now = datetime.now(timezone.utc).isoformat()
    query = {"is_active": True, "start_date": {"$lte": now}, "end_date": {"$gte": now}}
    if placement:
        query["placement"] = placement
    
    ads = await db.ads.find(query, {"_id": 0}).to_list(10)
    
    # Increment impressions
    for ad in ads:
        await db.ads.update_one({"id": ad["id"]}, {"$inc": {"impressions": 1}})
    
    return {"ads": ads}

@api_router.post("/campaigns/{ad_id}/click")
async def track_ad_click(ad_id: str):
    await db.ads.update_one({"id": ad_id}, {"$inc": {"clicks": 1}})
    return {"message": "Click tracked"}


# ============== NOTIFICATIONS ROUTES ==============
async def create_notification(user_id: str, title: str, message: str, type: str = "general", data: Optional[Dict[str, Any]] = None):
    """Helper to create a notification in DB and send push if possible."""
    notification = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "title": title,
        "message": message,
        "type": type,
        "is_read": False,
        "data": data or {},
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.notifications.insert_one(notification)
    
    # Trigger push notification in background
    asyncio.create_task(send_push_notification_to_user(app, user_id, title, message, data))
    return notification

@api_router.get("/notifications")
async def get_notifications(current_user: dict = Depends(get_current_user)):
    notifications = await db.notifications.find(
        {"user_id": current_user["id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    unread_count = await db.notifications.count_documents({"user_id": current_user["id"], "is_read": False})
    
    return {"notifications": notifications, "unread_count": unread_count}

@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    await db.notifications.update_one(
        {"id": notification_id, "user_id": current_user["id"]},
        {"$set": {"is_read": True}}
    )
    return {"message": "Notification marked as read"}

@api_router.put("/notifications/read-all")
async def mark_all_notifications_read(current_user: dict = Depends(get_current_user)):
    await db.notifications.update_many(
        {"user_id": current_user["id"]},
        {"$set": {"is_read": True}}
    )
    return {"message": "All notifications marked as read"}

# ============== PAYMENT ROUTES (STRIPE) ==============
@api_router.post("/payments/create-checkout")
async def create_checkout_session(request: Request, current_user: dict = Depends(get_current_user)):
    try:
        import stripe
    except ImportError:
        raise HTTPException(status_code=500, detail="Stripe SDK not installed. Run: pip install stripe")
    
    body = await request.json()
    appointment_id = body.get("appointment_id")
    origin_url = body.get("origin_url")
    
    if not appointment_id or not origin_url:
        raise HTTPException(status_code=400, detail="appointment_id and origin_url required")
    
    appointment = await db.appointments.find_one({"id": appointment_id}, {"_id": 0})
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    if appointment["patient_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    api_key = os.environ.get("STRIPE_API_KEY")
    if not api_key or api_key == "sk_test_placeholder":
        raise HTTPException(status_code=500, detail="Stripe not configured")
    
    stripe.api_key = api_key
    
    success_url = f"{origin_url}/appointments/{appointment_id}?payment=success&session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin_url}/appointments/{appointment_id}?payment=cancelled"
    
    try:
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'product_data': {
                        'name': f'Appointment #{appointment.get("hex_reference", "N/A")}',
                    },
                    'unit_amount': int(float(appointment["payment_amount"]) * 100),
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "appointment_id": appointment_id,
                "patient_id": current_user["id"],
                "doctor_id": appointment["doctor_id"]
            }
        )
    except Exception as e:
        logger.error(f"Stripe checkout error: {e}")
        raise HTTPException(status_code=500, detail=f"Payment gateway error: {str(e)}")
    
    # Save payment transaction
    await db.payment_transactions.insert_one({
        "id": str(uuid.uuid4()),
        "session_id": session.id,
        "appointment_id": appointment_id,
        "user_id": current_user["id"],
        "amount": appointment["payment_amount"],
        "currency": "usd",
        "payment_method": "stripe",
        "payment_status": "initiated",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Update appointment with session ID
    await db.appointments.update_one(
        {"id": appointment_id},
        {"$set": {"payment_session_id": session.id}}
    )
    
    return {"url": session.url, "session_id": session.id}

@api_router.get("/payments/status/{session_id}")
async def get_payment_status(session_id: str, current_user: dict = Depends(get_current_user)):
    try:
        import stripe
    except ImportError:
        raise HTTPException(status_code=500, detail="Stripe SDK not installed")
    
    api_key = os.environ.get("STRIPE_API_KEY")
    if not api_key or api_key == "sk_test_placeholder":
        raise HTTPException(status_code=500, detail="Stripe not configured")
    
    stripe.api_key = api_key
    
    try:
        session = stripe.checkout.Session.retrieve(session_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving session: {str(e)}")
    
    # Update transaction and appointment if paid
    if session.payment_status == "paid":
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {"payment_status": "paid"}}
        )
        
        transaction = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
        if transaction:
            await db.appointments.update_one(
                {"id": transaction["appointment_id"]},
                {"$set": {"payment_status": PaymentStatus.PAID, "status": AppointmentStatus.CONFIRMED}}
            )
    
    return {
        "status": session.status,
        "payment_status": session.payment_status,
        "amount_total": session.amount_total,
        "currency": session.currency
    }

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    try:
        import stripe
    except ImportError:
        return {"status": "error", "message": "Stripe not installed"}
    
    api_key = os.environ.get("STRIPE_API_KEY")
    if not api_key:
        return {"status": "error", "message": "Stripe not configured"}
    
    stripe.api_key = api_key
    payload = await request.body()
    
    try:
        event = stripe.Event.construct_from(
            stripe.util.convert_to_stripe_object(payload), stripe.api_key
        )
        
        if event.type == 'checkout.session.completed':
            session = event.data.object
            if session.payment_status == "paid":
                await db.payment_transactions.update_one(
                    {"session_id": session.id},
                    {"$set": {"payment_status": "paid"}}
                )
                
                appointment_id = session.metadata.get("appointment_id")
                if appointment_id:
                    await db.appointments.update_one(
                        {"id": appointment_id},
                        {"$set": {"payment_status": PaymentStatus.PAID, "status": AppointmentStatus.CONFIRMED}}
                    )
        
        return {"status": "processed"}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"status": "error", "message": str(e)}

# ============== RAZORPAY PAYMENT ROUTES ==============
class RazorpayOrderCreate(BaseModel):
    appointment_id: str

class RazorpayVerifyPayment(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

@api_router.post("/payments/razorpay/create-order")
async def create_razorpay_order(
    data: RazorpayOrderCreate,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Create Razorpay order for payment"""
    appointment_id = data.appointment_id
    appointment = await db.appointments.find_one({"id": appointment_id}, {"_id": 0})
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    razorpay_key_id = os.environ.get("RAZORPAY_KEY_ID")
    razorpay_key_secret = os.environ.get("RAZORPAY_KEY_SECRET")
    
    # Check if Razorpay is configured (not placeholder values)
    if not razorpay_key_id or razorpay_key_id == "rzp_test_your_key_here":
        # MOCK MODE: Return mock order for testing
        mock_order_id = f"order_mock_{str(uuid.uuid4())[:12]}"
        
        # Save mock payment transaction
        await db.payment_transactions.insert_one({
            "id": str(uuid.uuid4()),
            "appointment_id": appointment_id,
            "order_id": mock_order_id,
            "amount": appointment["payment_amount"],
            "currency": "INR",
            "payment_method": "razorpay",
            "payment_status": "mock_created",
            "is_mock": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        # Update appointment with order ID
        await db.appointments.update_one(
            {"id": appointment_id},
            {"$set": {"payment_session_id": mock_order_id, "payment_method": "razorpay"}}
        )
        
        return {
            "order_id": mock_order_id,
            "amount": int(appointment["payment_amount"] * 100),  # In paise
            "currency": "INR",
            "key_id": "rzp_test_mock",
            "is_mock": True,
            "message": "MOCK MODE: Replace RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env for real payments"
        }
    
    # REAL MODE: Create actual Razorpay order
    try:
        import razorpay
        client = razorpay.Client(auth=(razorpay_key_id, razorpay_key_secret))
        
        # Amount in paise (multiply by 100)
        amount_in_paise = int(appointment["payment_amount"] * 100)
        
        order_data = {
            "amount": amount_in_paise,
            "currency": "INR",
            "receipt": f"apt_{appointment_id[:20]}",
            "payment_capture": 1
        }
        
        order = client.order.create(data=order_data)
        
        # Save payment transaction
        await db.payment_transactions.insert_one({
            "id": str(uuid.uuid4()),
            "appointment_id": appointment_id,
            "order_id": order["id"],
            "amount": appointment["payment_amount"],
            "currency": "INR",
            "payment_method": "razorpay",
            "payment_status": "created",
            "is_mock": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        # Update appointment with order ID
        await db.appointments.update_one(
            {"id": appointment_id},
            {"$set": {"payment_session_id": order["id"], "payment_method": "razorpay"}}
        )
        
        return {
            "order_id": order["id"],
            "amount": amount_in_paise,
            "currency": "INR",
            "key_id": razorpay_key_id,
            "is_mock": False
        }
        
    except Exception as e:
        logger.error(f"Razorpay order creation error: {e}")
        raise HTTPException(status_code=500, detail=f"Payment gateway error: {str(e)}")

@api_router.post("/payments/razorpay/verify")
async def verify_razorpay_payment(
    data: RazorpayVerifyPayment,
    current_user: dict = Depends(get_current_user)
):
    """Verify Razorpay payment signature and update appointment"""
    razorpay_key_id = os.environ.get("RAZORPAY_KEY_ID")
    razorpay_key_secret = os.environ.get("RAZORPAY_KEY_SECRET")
    
    # Check if this is a mock order
    if data.razorpay_order_id.startswith("order_mock_"):
        # MOCK MODE: Auto-verify mock payments
        transaction = await db.payment_transactions.find_one(
            {"order_id": data.razorpay_order_id},
            {"_id": 0}
        )
        
        if not transaction:
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        # Update transaction status
        await db.payment_transactions.update_one(
            {"order_id": data.razorpay_order_id},
            {"$set": {
                "payment_status": "paid",
                "payment_id": data.razorpay_payment_id,
                "verified_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        # Update appointment status
        await db.appointments.update_one(
            {"id": transaction["appointment_id"]},
            {"$set": {
                "payment_status": PaymentStatus.PAID,
                "status": AppointmentStatus.CONFIRMED
            }}
        )
        
        # Create notification for doctor
        appointment = await db.appointments.find_one(
            {"id": transaction["appointment_id"]},
            {"_id": 0}
        )
        if appointment:
            await create_notification(
                user_id=appointment["doctor_id"],
                title="New Appointment",
                message=f"You have a new confirmed appointment",
                type="appointment",
                data={"appointment_id": appointment["id"]}
            )
        
        return {
            "status": "success",
            "message": "MOCK payment verified successfully",
            "is_mock": True
        }
    
    # REAL MODE: Verify actual Razorpay payment
    if not razorpay_key_id or razorpay_key_id == "rzp_test_your_key_here":
        raise HTTPException(status_code=500, detail="Razorpay not configured for real payments")
    
    try:
        import razorpay
        import hmac
        import hashlib
        
        # Verify signature
        message = f"{data.razorpay_order_id}|{data.razorpay_payment_id}"
        generated_signature = hmac.new(
            razorpay_key_secret.encode('utf-8'),
            message.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        if generated_signature != data.razorpay_signature:
            raise HTTPException(status_code=400, detail="Invalid payment signature")
        
        # Find transaction and update
        transaction = await db.payment_transactions.find_one(
            {"order_id": data.razorpay_order_id},
            {"_id": 0}
        )
        
        if not transaction:
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        # Update transaction status
        await db.payment_transactions.update_one(
            {"order_id": data.razorpay_order_id},
            {"$set": {
                "payment_status": "paid",
                "payment_id": data.razorpay_payment_id,
                "signature": data.razorpay_signature,
                "verified_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        # Update appointment status
        await db.appointments.update_one(
            {"id": transaction["appointment_id"]},
            {"$set": {
                "payment_status": PaymentStatus.PAID,
                "status": AppointmentStatus.CONFIRMED
            }}
        )
        
        # Create notification for doctor
        appointment = await db.appointments.find_one(
            {"id": transaction["appointment_id"]},
            {"_id": 0}
        )
        if appointment:
            await create_notification(
                user_id=appointment["doctor_id"],
                title="New Appointment",
                message=f"You have a new confirmed appointment",
                type="appointment",
                data={"appointment_id": appointment["id"]}
            )
        
        return {
            "status": "success",
            "message": "Payment verified successfully",
            "is_mock": False
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Razorpay verification error: {e}")
        raise HTTPException(status_code=500, detail=f"Payment verification failed: {str(e)}")

@api_router.get("/payments/razorpay/status/{order_id}")
async def get_razorpay_payment_status(
    order_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get Razorpay payment status"""
    transaction = await db.payment_transactions.find_one(
        {"order_id": order_id},
        {"_id": 0}
    )
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    return {
        "order_id": order_id,
        "payment_status": transaction.get("payment_status", "unknown"),
        "amount": transaction.get("amount", 0),
        "is_mock": transaction.get("is_mock", False)
    }

# ============== CONSOLIDATED ADMIN & DOCTOR MANAGEMENT ==============

class SingleDoctorCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    specialties: List[str]
    years_experience: int
    clinic_name: str
    clinic_address: str
    consultation_fee: float
    bio: str
    title: str = "Dr."

class BulkUploadRequest(BaseModel):
    data: str # CSV format: name, email, specialty, fee

@api_router.post("/admin/doctors")
async def admin_create_single_doctor(data: SingleDoctorCreate, current_user: dict = Depends(get_admin_user)):
    """Explicitly create a single doctor with full profile from admin dashboard"""
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists.")
        
    user_id = str(uuid.uuid4())
    hashed_password = hash_password(data.password)
    
    # Create User
    await db.users.insert_one({
        "id": user_id,
        "email": data.email,
        "full_name": data.full_name,
        "password": hashed_password,
        "phone": "0000000000",
        "role": UserRole.DOCTOR,
        "is_verified": True,
        "is_suspended": False,
        "profile_image": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Create Doctor Profile
    await db.doctors.insert_one({
        "user_id": user_id,
        "full_name": data.full_name, # Critical for display in discovery
        "title": data.title,
        "bio": data.bio,
        "specialties": data.specialties,
        "years_experience": data.years_experience,
        "consultation_fee": data.consultation_fee,
        "clinic_name": data.clinic_name,
        "clinic_address": data.clinic_address,
        "affiliation_type": "clinic",
        "is_verified": True,
        "is_active": True,
        "rating": 5.0, # Start with a good rating for admin-created docs
        "review_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    return {"message": "Doctor profile created successfully."}

@api_router.post("/admin/doctors/bulk-upload")
async def admin_bulk_doctors_upload(bulk_doc: BulkUploadRequest, current_user: dict = Depends(get_admin_user)):
    """Bulk create doctors from CSV input: name, email, specialty, fee"""
    lines = [line.strip() for line in bulk_doc.data.splitlines() if line.strip()]
    if not lines:
        raise HTTPException(status_code=400, detail="Empty data provided")
        
    created_count = 0
    errors = []
    
    for index, line in enumerate(lines):
        try:
            parts = [p.strip() for p in line.split(",")]
            # Format: Email, Password, Full Name, Title, Specialties (pipe |), Experience, Fee, Clinic Name, Clinic Address, Bio
            if len(parts) < 10:
                # Fallback to simple format if fewer fields
                if len(parts) >= 4:
                    full_name, email, specialty, fee = parts[0], parts[1], parts[2], float(parts[3])
                    password, title, exp, c_name, c_addr, bio = "password123", "Dr.", 5, "HiDoctor Clinic", "City Center", "Verified Specialist"
                else:
                    errors.append(f"Line {index+1}: Expected at least Name, Email, Specialty, Fee")
                    continue
            else:
                email, password, full_name, title, specialties_raw, exp, fee, c_name, c_addr, bio = parts
                exp = int(exp)
                fee = float(fee)
                specialty_list = [s.strip() for s in specialties_raw.split("|")]

            existing = await db.users.find_one({"email": email})
            if existing:
                errors.append(f"Line {index+1}: Email {email} already exists")
                continue
                
            user_id = str(uuid.uuid4())
            pwd = hash_password(password)
            
            await db.users.insert_one({
                "id": user_id, "email": email, "full_name": full_name, "password": pwd,
                "role": UserRole.DOCTOR, "is_verified": True, "created_at": datetime.now(timezone.utc).isoformat()
            })
            
            await db.doctors.insert_one({
                "user_id": user_id, "full_name": full_name, "title": title, 
                "specialties": [parts[2]] if len(parts) < 10 else specialty_list,
                "consultation_fee": fee, "years_experience": exp, "bio": bio,
                "clinic_name": c_name, "clinic_address": c_addr,
                "is_verified": True, "is_active": True,
                "rating": 5.0, "review_count": 0, "created_at": datetime.now(timezone.utc).isoformat()
            })
            created_count += 1
        except Exception as e:
            errors.append(f"Line {index+1}: {str(e)}")
            
    return {"message": f"Successfully created {created_count} doctors.", "errors": errors if errors else None}

@api_router.put("/admin/doctors/{doctor_id}")
async def admin_force_update_doctor(doctor_id: str, update: AdminDoctorUpdate, current_user: dict = Depends(get_admin_user)):
    """Admin endpoint to forcefully update any doctor's profile and verification status"""
    doctor = await db.doctors.find_one({"user_id": doctor_id})
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
        
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    
    # Sync core user fields if provided
    user_updates = {}
    if "full_name" in update_data: user_updates["full_name"] = update_data["full_name"]
    if "phone" in update_data: user_updates["phone"] = update_data["phone"]
    if "is_verified" in update_data: user_updates["is_verified"] = update_data["is_verified"]
    
    if user_updates:
        await db.users.update_one({"id": doctor_id}, {"$set": user_updates})
        
    await db.doctors.update_one({"user_id": doctor_id}, {"$set": update_data})
    return {"message": "Doctor profile forcefully updated by admin"}



@api_router.delete("/admin/doctors/{doctor_id}")
async def admin_delete_doctor(doctor_id: str, current_user: dict = Depends(get_admin_user)):
    """Admin endpoint to delete a doctor completely"""
    await db.users.delete_one({"id": doctor_id})
    await db.doctors.delete_one({"user_id": doctor_id})
    # Remove associated appointments/reviews if needed (optional cleanup)
    await db.appointments.delete_many({"doctor_id": doctor_id})
    await db.reviews.delete_many({"doctor_id": doctor_id})
    return {"message": "Doctor and all associated records deleted"}

@api_router.post("/admin/doctors/{doctor_id}/profile-picture")
async def admin_upload_doctor_profile_picture(doctor_id: str, file: UploadFile = File(...), current_user: dict = Depends(get_admin_user)):
    """Admin endpoint to upload/replace a doctor's profile picture"""
    logger.info(f"Admin {current_user['id']} uploading profile picture for doctor: {doctor_id}")
    
    if not file.content_type.startswith('image/'):
        logger.error(f"Admin upload failed: File is not an image ({file.content_type})")
        raise HTTPException(status_code=400, detail="File must be an image")
        
    try:
        ext = file.filename.split('.')[-1] if '.' in file.filename else 'png'
        filename = f"admin_upload_{doctor_id}_{uuid.uuid4().hex[:6]}.{ext}"
        file_path = UPLOADS_DIR / filename
        
        logger.info(f"Admin saving file to: {file_path}")
        
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
            
        # PERSIST: Save to MongoDB fallback
        await save_image_to_db(filename, content, file.content_type)
        
        file_url = f"/uploads/{filename}"
        
        await db.users.update_one({"id": doctor_id}, {"$set": {"profile_image": file_url}})
        result = await db.doctors.update_one({"user_id": doctor_id}, {"$set": {"profile_image": file_url}})
        
        logger.info(f"Admin upload successful. URL: {file_url}. Doctor update: matched={result.matched_count}")
        
        return {"message": "Doctor profile picture updated by admin", "url": file_url}
    except Exception as e:
        logger.error(f"Error in admin_upload_doctor_profile_picture: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@api_router.get("/admin/users")
async def admin_get_users(
    role: Optional[UserRole] = None,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 50,
    current_user: dict = Depends(get_admin_user)
):
    """Admin endpoint to list all users with role/search filters"""
    query = {}
    if role:
        query["role"] = role
    if search:
        query["$or"] = [
            {"full_name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}}
        ]
    
    skip = (page - 1) * limit
    users = await db.users.find(query, {"_id": 0, "password": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.users.count_documents(query)
    
    # Enrichment for doctors to allow pre-filling admin edit forms
    for user in users:
        user["profile_image"] = normalize_image_url(user.get("profile_image"))
        if user.get("role") == UserRole.DOCTOR:
            doctor_profile = await db.doctors.find_one({"user_id": user["id"]}, {"_id": 0})
            if doctor_profile:
                user.update(doctor_profile)
                # Re-normalize if doctor record has its own profile_image
                user["profile_image"] = normalize_image_url(user.get("profile_image"))
    
    return {"users": users, "total": total, "page": page, "pages": (total + limit - 1) // limit}

@api_router.get("/admin/doctors/pending")
async def admin_get_pending_doctors(current_user: dict = Depends(get_admin_user)):
    """Fetch all doctors awaiting verification"""
    doctors = await db.doctors.find({"is_verified": False}, {"_id": 0}).to_list(100)
    for doc in doctors:
        u = await db.users.find_one({"id": doc["user_id"]})
        if u:
            doc["email"] = u.get("email")
            doc["phone"] = u.get("phone")
            doc["profile_image"] = normalize_image_url(u.get("profile_image") or doc.get("profile_image"))
        else:
            doc["profile_image"] = normalize_image_url(doc.get("profile_image"))
    return {"doctors": doctors}

@api_router.post("/admin/doctors/{doctor_id}/verify")
async def admin_verify_doctor(doctor_id: str, current_user: dict = Depends(get_admin_user)):
    """Approve a doctor profile"""
    result = await db.doctors.update_one(
        {"user_id": doctor_id},
        {"$set": {"is_verified": True, "is_active": True}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    await db.users.update_one({"id": doctor_id}, {"$set": {"is_verified": True}})
    
    # Notify doctor
    await create_notification(
        user_id=doctor_id,
        title="Profile Verified",
        message="Congratulations! Your profile has been verified and is now live.",
        type="system"
    )
    return {"message": "Doctor verified successfully"}

@api_router.post("/admin/doctors/{doctor_id}/reject")
async def admin_reject_doctor(doctor_id: str, current_user: dict = Depends(get_admin_user)):
    """Reject a doctor profile"""
    await db.doctors.update_one(
        {"user_id": doctor_id},
        {"$set": {"is_verified": False, "is_active": False}}
    )
    return {"message": "Doctor profile rejected"}

@api_router.post("/admin/users/{user_id}/suspend")
async def admin_suspend_user(user_id: str, current_user: dict = Depends(get_admin_user)):
    """Suspend a user account"""
    await db.users.update_one({"id": user_id}, {"$set": {"is_suspended": True, "is_active": False}})
    return {"message": "User suspended"}

@api_router.post("/admin/users/{user_id}/unsuspend")
async def admin_unsuspend_user(user_id: str, current_user: dict = Depends(get_admin_user)):
    """Unsuspend a user account"""
    await db.users.update_one({"id": user_id}, {"$set": {"is_suspended": False, "is_active": True}})
    
    # If they are a doctor, activate them too
    user = await db.users.find_one({"id": user_id})
    if user and user.get("role") == UserRole.DOCTOR:
        await db.doctors.update_one({"user_id": user_id}, {"$set": {"is_active": True}})
        
    return {"message": "User unsuspended"}

@api_router.delete("/admin/users/{user_id}")
async def admin_delete_user(user_id: str, current_user: dict = Depends(get_admin_user)):
    """Permanently delete a user and all associated records"""
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    await db.users.delete_one({"id": user_id})
    await db.patients.delete_one({"user_id": user_id})
    await db.doctors.delete_one({"user_id": user_id})
    await db.notifications.delete_many({"user_id": user_id})
    return {"message": "User and all associated data deleted"}

@api_router.put("/admin/users/{user_id}/role")
async def admin_change_user_role(user_id: str, role_update: RoleUpdate, current_user: dict = Depends(get_admin_user)):
    """Update a user's role"""
    await db.users.update_one({"id": user_id}, {"$set": {"role": role_update.role}})
    return {"message": f"User role updated to {role_update.role}"}

@api_router.get("/admin/appointments")
async def admin_get_appointments(
    status: Optional[AppointmentStatus] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    current_user: dict = Depends(get_admin_user)
):
    query = {}
    if status:
        query["status"] = status
    if start_date:
        query["appointment_date"] = {"$gte": start_date}
    if end_date:
        query.setdefault("appointment_date", {})["$lte"] = end_date
    
    skip = (page - 1) * limit
    appointments = await db.appointments.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.appointments.count_documents(query)
    
    # Enrich with user info
    for apt in appointments:
        doctor = await db.doctors.find_one({"user_id": apt["doctor_id"]}, {"_id": 0, "full_name": 1})
        patient = await db.users.find_one({"id": apt["patient_id"]}, {"_id": 0, "full_name": 1})
        apt["doctor"] = doctor
        apt["patient"] = patient
    
    return {"appointments": appointments, "total": total, "page": page}

@api_router.get("/admin/analytics")
async def admin_get_analytics(current_user: dict = Depends(get_admin_user)):
    total_users = await db.users.count_documents({})
    total_patients = await db.users.count_documents({"role": UserRole.PATIENT})
    total_doctors = await db.users.count_documents({"role": UserRole.DOCTOR})
    verified_doctors = await db.doctors.count_documents({"is_verified": True})
    pending_doctors = await db.doctors.count_documents({"is_verified": False})
    
    total_appointments = await db.appointments.count_documents({})
    completed_appointments = await db.appointments.count_documents({"status": AppointmentStatus.COMPLETED})
    cancelled_appointments = await db.appointments.count_documents({"status": AppointmentStatus.CANCELLED})
    telehealth_appointments = await db.appointments.count_documents({"consultation_type": ConsultationType.TELEHEALTH})
    
    total_revenue_pipeline = [
        {"$match": {"payment_status": PaymentStatus.PAID}},
        {"$group": {"_id": None, "total": {"$sum": "$payment_amount"}}}
    ]
    revenue_result = await db.appointments.aggregate(total_revenue_pipeline).to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0
    
    blog_views = await db.blog_posts.aggregate([
        {"$group": {"_id": None, "total": {"$sum": "$view_count"}}}
    ]).to_list(1)
    total_blog_views = blog_views[0]["total"] if blog_views else 0
    
    ad_clicks = await db.ads.aggregate([
        {"$group": {"_id": None, "total": {"$sum": "$clicks"}}}
    ]).to_list(1)
    total_ad_clicks = ad_clicks[0]["total"] if ad_clicks else 0
    
    return {
        "users": {
            "total": total_users,
            "patients": total_patients,
            "doctors": total_doctors,
            "verified_doctors": verified_doctors,
            "pending_doctors": pending_doctors
        },
        "appointments": {
            "total": total_appointments,
            "completed": completed_appointments,
            "cancelled": cancelled_appointments,
            "telehealth": telehealth_appointments
        },
        "revenue": total_revenue,
        "blog_views": total_blog_views,
        "ad_clicks": total_ad_clicks
    }

@api_router.get("/admin/campaigns")
async def admin_get_ads(current_user: dict = Depends(get_admin_user)):
    ads = await db.ads.find({}, {"_id": 0}).to_list(50)
    return {"ads": ads}

@api_router.put("/admin/campaigns/{ad_id}")
async def admin_update_ad(ad_id: str, ad: AdCreate, current_user: dict = Depends(get_admin_user)):
    update_data = ad.model_dump()
    result = await db.ads.update_one({"id": ad_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Ad not found")
    return {"message": "Ad updated"}

@api_router.delete("/admin/campaigns/{ad_id}")
async def admin_delete_ad(ad_id: str, current_user: dict = Depends(get_admin_user)):
    result = await db.ads.delete_one({"id": ad_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Ad not found")
    return {"message": "Ad deleted"}

@api_router.get("/admin/blog")
async def admin_get_blog_posts(current_user: dict = Depends(get_admin_user)):
    posts = await db.blog_posts.find({}, {"_id": 0}).to_list(100)
    return {"posts": posts}

@api_router.post("/admin/campaigns")
async def create_ad(ad: AdCreate, current_user: dict = Depends(get_admin_user)):
    doc = ad.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    doc["is_active"] = True
    doc["impressions"] = 0
    doc["clicks"] = 0
    await db.ads.insert_one(doc)
    return {"message": "Ad created"}

# ============== SPECIALTIES & CONFIG ROUTES ==============
@api_router.get("/specialties")
async def get_specialties():
    return {
        "specialties": [
            "General Medicine", "Cardiology", "Dermatology", "Pediatrics",
            "Orthopedics", "Gynecology", "Neurology", "Psychiatry",
            "Ophthalmology", "ENT", "Dentistry", "Urology",
            "Gastroenterology", "Pulmonology", "Endocrinology", "Oncology",
            "Nephrology", "Rheumatology", "Hematology", "Allergy & Immunology",
            "Infectious Disease", "Sports Medicine", "Pain Management",
            "Geriatrics", "Neonatology", "Plastic Surgery", "Vascular Surgery",
            "Radiology", "Pathology", "Anesthesiology", "Emergency Medicine",
            "Family Medicine", "Internal Medicine", "Physiotherapy",
            "Ayurveda", "Homeopathy", "Nutrition & Dietetics"
        ]
    }

@api_router.get("/languages")
async def get_languages():
    return {
        "languages": [
            "English", "Hindi", "Arabic", "Spanish", "French",
            "Mandarin", "Tamil", "Telugu", "Malayalam", "Urdu"
        ]
    }

@api_router.get("/debug/config")
async def get_debug_config():
    """Diagnostic endpoint to check environment settings and file persistence"""
    files = []
    if UPLOADS_DIR.exists():
        files = [f.name for f in UPLOADS_DIR.iterdir() if f.is_file()][:50]
        
    return {
        "BACKEND_URL": BACKEND_URL,
        "IS_RAILWAY": os.environ.get('RAILWAY_ENVIRONMENT') is not None,
        "UPLOADS_DIR_EXISTS": UPLOADS_DIR.exists(),
        "FILES_IN_UPLOADS_COUNT": len(files),
        "FILES_IN_UPLOADS_SAMPLE": files[:10],
        "DATABASE_HEALTH": "OK" if db is not None else "FAILED",
        "ROOT_DIR": str(ROOT_DIR)
    }

@api_router.get("/insurances")
async def get_insurances():
    return {
        "insurances": [
            "Aetna", "BlueCross BlueShield", "Cigna", "UnitedHealthcare",
            "Humana", "Kaiser Permanente", "Medicare", "Medicaid",
            "Daman", "AXA", "MetLife", "HDFC ERGO", "ICICI Lombard"
        ]
    }

# ============== ENHANCED AVAILABILITY CALENDAR ==============
class WeeklySchedule(BaseModel):
    day_of_week: int  # 0=Monday, 6=Sunday
    start_time: str  # "09:00"
    end_time: str    # "17:00"
    slot_duration: int = 30  # minutes
    is_active: bool = True

class DoctorScheduleCreate(BaseModel):
    weekly_schedule: List[WeeklySchedule]
    break_times: List[Dict[str, str]] = []  # [{"start": "12:00", "end": "13:00"}]

@api_router.post("/doctors/schedule")
async def set_doctor_schedule(schedule: DoctorScheduleCreate, current_user: dict = Depends(get_doctor_user)):
    schedule_doc = {
        "doctor_id": current_user["id"],
        "weekly_schedule": [s.model_dump() for s in schedule.weekly_schedule],
        "break_times": schedule.break_times,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.doctor_schedules.update_one(
        {"doctor_id": current_user["id"]},
        {"$set": schedule_doc},
        upsert=True
    )
    return {"message": "Schedule updated", "schedule": schedule_doc}

@api_router.get("/doctors/{doctor_id}/schedule")
async def get_doctor_schedule(doctor_id: str):
    schedule = await db.doctor_schedules.find_one({"doctor_id": doctor_id}, {"_id": 0})
    if not schedule:
        schedule = {}
        
    doctor = await db.doctors.find_one({"user_id": doctor_id}, {"_id": 0, "holidays": 1})
    holidays = doctor.get("holidays", []) if doctor else []
    
    overrides = await db.availability.find({"doctor_id": doctor_id, "is_blocked": True}, {"_id": 0, "date": 1}).to_list(None)
    blocked_dates = list(set(holidays + [o.get("date") for o in overrides if o.get("date")]))
    
    schedule["blocked_dates"] = blocked_dates
    return {"schedule": schedule}

@api_router.get("/doctors/{doctor_id}/available-slots")
async def get_available_slots(doctor_id: str, date: str):
    """Get available time slots for a specific date"""
    from datetime import datetime as dt
    
    # 1. Check if the date is explicitly marked as a holiday
    doctor = await db.doctors.find_one({"user_id": doctor_id}, {"_id": 0, "holidays": 1, "working_hours": 1})
    if not doctor:
        return {"date": date, "slots": []}
        
    if date in doctor.get("holidays", []):
        return {"date": date, "slots": []}
        
    override = await db.availability.find_one({"doctor_id": doctor_id, "date": date}, {"_id": 0})
    if override and override.get("is_blocked"):
        return {"date": date, "slots": []}
    
    # 2. Parse date to get day of week
    try:
        parsed_date = dt.strptime(date, "%Y-%m-%d")
        day_str = parsed_date.strftime("%A").lower()  # "monday", "tuesday", etc.
        day_of_week_int = parsed_date.weekday()      # 0=Monday, 6=Sunday
    except:
        return {"date": date, "slots": []}
        
    working_hours = doctor.get("working_hours", {})
    
    # Check if a mobile-style schedule exists for this doctor
    mobile_schedule_doc = await db.doctor_schedules.find_one({"doctor_id": doctor_id}, {"_id": 0})
    
    slots = []
    
    if mobile_schedule_doc and mobile_schedule_doc.get("weekly_schedule"):
        # Mobile app style schedule prevails if present
        weekly_schedule = mobile_schedule_doc["weekly_schedule"]
        day_config = next((s for s in weekly_schedule if s["day_of_week"] == day_of_week_int), None)
        
        if day_config and day_config.get("is_active", True):
            try:
                start_h, start_m = map(int, day_config["start_time"].split(":"))
                end_h, end_m = map(int, day_config["end_time"].split(":"))
                slot_duration_mins = day_config.get("slot_duration", 30)
                
                current_time = start_h * 60 + start_m
                end_time = end_h * 60 + end_m
                
                # Parse break times to exclude
                break_ranges = []
                for b in mobile_schedule_doc.get("break_times", []):
                    b_start_h, b_start_m = map(int, b["start"].split(":"))
                    b_end_h, b_end_m = map(int, b["end"].split(":"))
                    break_ranges.append({
                        "start": b_start_h * 60 + b_start_m,
                        "end": b_end_h * 60 + b_end_m
                    })
                
                while current_time + slot_duration_mins <= end_time:
                    slot_end = current_time + slot_duration_mins
                    
                    # Check if slot overlaps with any break time
                    in_break = False
                    for b in break_ranges:
                        if (current_time < b["end"] and slot_end > b["start"]):
                            in_break = True
                            break
                            
                    if not in_break:
                        hour = current_time // 60
                        minute = current_time % 60
                        slots.append({"time": f"{hour:02d}:{minute:02d}", "is_available": True})
                        
                    current_time += slot_duration_mins
            except Exception as e:
                pass

    elif not working_hours:
        # Fallback to default 9-17 Mon-Fri slots:
        if parsed_date.weekday() >= 5: # Sat/Sun
            return {"date": date, "slots": []}
            
        for hour in range(9, 17):
            for minute in [0, 30]:
                time_str = f"{hour:02d}:{minute:02d}"
                slots.append({"time": time_str, "is_available": True})
    else:
        # Generate slots based on legacy web working_hours config
        day_config = working_hours.get(day_str, {})
        if not day_config or not day_config.get("active", False):
            return {"date": date, "slots": []}
            
        slots_list = day_config.get("slots", [])
        
        break_ranges = []
        if mobile_schedule_doc:
            for b in mobile_schedule_doc.get("break_times", []):
                try:
                    b_start_h, b_start_m = map(int, b["start"].split(":"))
                    b_end_h, b_end_m = map(int, b["end"].split(":"))
                    break_ranges.append({
                        "start": b_start_h * 60 + b_start_m,
                        "end": b_end_h * 60 + b_end_m
                    })
                except:
                    pass
        
        for slot_block in slots_list:
            try:
                start_h, start_m = map(int, slot_block["start"].split(":"))
                end_h, end_m = map(int, slot_block["end"].split(":"))
                current_time = start_h * 60 + start_m
                end_time = end_h * 60 + end_m
                
                while current_time < end_time:
                    slot_end = current_time + 30
                    in_break = False
                    for b in break_ranges:
                        if current_time < b["end"] and slot_end > b["start"]:
                            in_break = True
                            break
                    if not in_break:
                        hour = current_time // 60
                        minute = current_time % 60
                        slots.append({"time": f"{hour:02d}:{minute:02d}", "is_available": True})
                    current_time += 30 # default 30 min duration
            except:
                continue

    # 4. Check existing appointments for the date
    existing_appointments = await db.appointments.find(
        {"doctor_id": doctor_id, "appointment_date": date, "status": {"$in": ["pending", "confirmed"]}},
        {"_id": 0, "appointment_time": 1}
    ).to_list(100)
    
    booked_times = {apt["appointment_time"] for apt in existing_appointments}
    
    for slot in slots:
        if slot["time"] in booked_times:
            slot["is_available"] = False
            
    return {"date": date, "slots": slots}

@api_router.post("/doctors/availability/block")
async def block_availability(dates: List[str], current_user: dict = Depends(get_doctor_user)):
    """Block specific dates (vacation, etc.)"""
    for date in dates:
        await db.availability.update_one(
            {"doctor_id": current_user["id"], "date": date},
            {"$set": {"doctor_id": current_user["id"], "date": date, "slots": [], "is_blocked": True}},
            upsert=True
        )
    return {"message": f"Blocked {len(dates)} dates"}

@api_router.get("/doctors/my-schedule")
async def get_my_schedule(current_user: dict = Depends(get_doctor_user)):
    schedule = await db.doctor_schedules.find_one({"doctor_id": current_user["id"]}, {"_id": 0})
    blocked_dates = await db.availability.find(
        {"doctor_id": current_user["id"], "is_blocked": True},
        {"_id": 0}
    ).to_list(100)
    return {"schedule": schedule, "blocked_dates": blocked_dates}

# ============== ENHANCED REVIEWS ==============
@api_router.get("/reviews/can-review/{appointment_id}")
async def can_review_appointment(appointment_id: str, current_user: dict = Depends(get_current_user)):
    """Check if user can leave a review for an appointment"""
    if current_user["role"] != UserRole.PATIENT:
        return {"can_review": False, "reason": "Only patients can leave reviews"}
    
    appointment = await db.appointments.find_one({"id": appointment_id}, {"_id": 0})
    if not appointment:
        return {"can_review": False, "reason": "Appointment not found"}
    
    if appointment["patient_id"] != current_user["id"]:
        return {"can_review": False, "reason": "Not your appointment"}
    
    if appointment["status"] != "completed":
        return {"can_review": False, "reason": "Appointment not completed"}
    
    existing = await db.reviews.find_one({
        "patient_id": current_user["id"],
        "appointment_id": appointment_id
    })
    
    if existing:
        return {"can_review": False, "reason": "Already reviewed"}
    
    return {"can_review": True, "doctor_id": appointment["doctor_id"]}

@api_router.get("/reviews/my-reviews")
async def get_my_reviews(current_user: dict = Depends(get_current_user)):
    """Get reviews written by the current user or for the current doctor"""
    if current_user["role"] == UserRole.PATIENT:
        reviews = await db.reviews.find({"patient_id": current_user["id"]}, {"_id": 0}).to_list(50)
    elif current_user["role"] == UserRole.DOCTOR:
        reviews = await db.reviews.find({"doctor_id": current_user["id"]}, {"_id": 0}).to_list(100)
    else:
        reviews = []
    return {"reviews": reviews}

# ============== APPOINTMENT REMINDERS ==============
@api_router.get("/reminders/upcoming")
async def get_upcoming_reminders(current_user: dict = Depends(get_current_user)):
    """Get upcoming appointment reminders"""
    now = datetime.now(timezone.utc)
    today = now.strftime("%Y-%m-%d")
    tomorrow = (now + timedelta(days=1)).strftime("%Y-%m-%d")
    
    if current_user["role"] == UserRole.PATIENT:
        query = {"patient_id": current_user["id"]}
    elif current_user["role"] == UserRole.DOCTOR:
        query = {"doctor_id": current_user["id"]}
    else:
        return {"reminders": []}
    
    query["status"] = {"$in": ["pending", "confirmed"]}
    query["appointment_date"] = {"$in": [today, tomorrow]}
    
    appointments = await db.appointments.find(query, {"_id": 0}).sort("appointment_date", 1).to_list(10)
    
    reminders = []
    for apt in appointments:
        # Enrich with details
        if current_user["role"] == UserRole.PATIENT:
            doctor = await db.doctors.find_one({"user_id": apt["doctor_id"]}, {"_id": 0, "full_name": 1, "profile_image": 1})
            apt["doctor"] = doctor
        else:
            patient = await db.users.find_one({"id": apt["patient_id"]}, {"_id": 0, "full_name": 1})
            apt["patient"] = patient
        
        # Calculate reminder type
        is_today = apt["appointment_date"] == today
        reminder_type = "today" if is_today else "tomorrow"
        
        reminders.append({
            "appointment": apt,
            "reminder_type": reminder_type,
            "message": f"{'Today' if is_today else 'Tomorrow'} at {apt['appointment_time']}"
        })
    
    return {"reminders": reminders}

@api_router.post("/reminders/send-test")
async def send_test_reminder(current_user: dict = Depends(get_current_user)):
    """Send a test reminder notification"""
    notification = await create_notification(
        user_id=current_user["id"],
        title="Test Reminder",
        message="This is a test appointment reminder notification.",
        type="reminder"
    )
    return {"message": "Test reminder sent", "notification": notification}

# Background task to create reminder notifications
async def create_reminder_notifications():
    """Create reminder notifications for upcoming appointments (to be run periodically)"""
    now = datetime.now(timezone.utc)
    tomorrow = (now + timedelta(days=1)).strftime("%Y-%m-%d")
    
    # Find appointments for tomorrow that haven't been reminded
    appointments = await db.appointments.find({
        "appointment_date": tomorrow,
        "status": {"$in": ["pending", "confirmed"]},
        "reminder_sent": {"$ne": True}
    }, {"_id": 0}).to_list(100)
    
    for apt in appointments:
        # Create reminder for patient
        await create_notification(
            user_id=apt["patient_id"],
            title="Appointment Reminder",
            message=f"You have an appointment tomorrow at {apt['appointment_time']}",
            type="reminder",
            data={"appointment_id": apt["id"]}
        )
        
        # Create reminder for doctor
        await create_notification(
            user_id=apt["doctor_id"],
            title="Appointment Reminder",
            message=f"You have an appointment tomorrow at {apt['appointment_time']}",
            type="reminder",
            data={"appointment_id": apt["id"]}
        )
        
        # Mark as reminded
        await db.appointments.update_one({"id": apt["id"]}, {"$set": {"reminder_sent": True}})

@api_router.post("/admin/trigger-reminders")
async def trigger_reminders(current_user: dict = Depends(get_admin_user)):
    """Manually trigger reminder notifications"""
    await create_reminder_notifications()
    return {"message": "Reminders triggered"}

# ============== USER PROFILE EDIT ==============
class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None

@api_router.put("/auth/profile")
async def update_user_profile(update: UserProfileUpdate, current_user: dict = Depends(get_current_user)):
    """Update user profile (all roles)"""
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    # Check email uniqueness if changing
    if "email" in update_data and update_data["email"] != current_user.get("email"):
        existing = await db.users.find_one({"email": update_data["email"]})
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
    
    await db.users.update_one({"id": current_user["id"]}, {"$set": update_data})
    
    # Also update name in role-specific profile
    if "full_name" in update_data:
        if current_user["role"] == UserRole.DOCTOR:
            await db.doctors.update_one({"user_id": current_user["id"]}, {"$set": {"full_name": update_data["full_name"]}})
    
    return {"message": "Profile updated successfully"}

# ============== DOCTOR HOLIDAYS (OTHER ROUTES) ==============

@api_router.get("/doctors/{doctor_id}/holidays")
async def get_doctor_holidays(doctor_id: str):
    """Get doctor's holidays"""
    doctor = await db.doctors.find_one({"user_id": doctor_id}, {"_id": 0, "holidays": 1})
    return {"holidays": doctor.get("holidays", []) if doctor else []}

# ============== FILE UPLOAD ==============
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

@api_router.post("/chat/upload")
async def upload_chat_file(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    """Upload a file for chat (max 5MB)"""
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File size exceeds 5MB limit")
    
    # Generate unique filename
    ext = file.filename.split(".")[-1] if "." in file.filename else "bin"
    filename = f"{uuid.uuid4().hex[:12]}.{ext}"
    filepath = UPLOADS_DIR / filename
    
    with open(filepath, "wb") as f:
        f.write(contents)
    
    file_url = normalize_image_url(f"/uploads/{filename}")
    return {"file_url": file_url, "filename": file.filename, "size": len(contents)}

# ============== AI DOCTOR RECOMMENDATION ==============
class AIRecommendRequest(BaseModel):
    symptoms: str
    budget: Optional[float] = None

@api_router.post("/ai/recommend")
async def ai_recommend_doctor(data: AIRecommendRequest, current_user: dict = Depends(get_current_user)):
    """AI-powered doctor recommendation based on symptoms and budget"""
    # Query internal doctor database
    query = {"is_verified": True, "is_active": True}
    if data.budget:
        query["consultation_fee"] = {"$lte": data.budget}
    
    doctors = await db.doctors.find(query, {"_id": 0}).limit(20).to_list(20)
    
    if not doctors:
        return {"recommendation": "No doctors found matching your criteria.", "doctors": []}
    
    # Build context for AI
    doctor_list = []
    for d in doctors:
        doctor_list.append({
            "name": d.get("full_name", "Unknown"),
            "specialties": d.get("specialties", []),
            "fee": d.get("consultation_fee", 0),
            "rating": d.get("rating", 0),
            "experience": d.get("years_experience", 0),
            "user_id": d.get("user_id"),
            "affiliation": d.get("affiliation_type", "clinic"),
            "clinic": d.get("clinic_name", "")
        })
    
    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        # Fallback: simple matching without AI
        return _simple_recommend(data.symptoms, doctor_list)
    
    prompt = f"""You are a medical assistant for HiDoctor app. Based on the patient's symptoms, recommend the best doctor from the available list.

Patient Symptoms: {data.symptoms}
Budget: {"₹" + str(data.budget) if data.budget else "No budget constraint"}

Available Doctors:
{chr(10).join([f"- Dr. {d['name']}: {', '.join(d['specialties'])}, Fee: ₹{d['fee']}, Rating: {d['rating']}/5, Experience: {d['experience']}yrs, {d['affiliation'].title()}: {d['clinic']}" for d in doctor_list])}

Respond in JSON format:
{{"recommendation": "Your recommendation text explaining why this doctor is best", "recommended_doctor_ids": ["user_id1"], "specialties_needed": ["specialty1"]}}"""

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://hidoctor.app",
                    "X-Title": "HiDoctor"
                },
                json={
                    "model": "openrouter/auto",
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 500
                }
            )
            
            if response.status_code == 200:
                result = response.json()
                ai_text = result.get("choices", [{}])[0].get("message", {}).get("content", "")
                
                # Try to parse JSON from AI response
                import json
                try:
                    # Find JSON in the response
                    json_start = ai_text.find("{")
                    json_end = ai_text.rfind("}") + 1
                    if json_start >= 0 and json_end > json_start:
                        ai_data = json.loads(ai_text[json_start:json_end])
                        recommended_ids = ai_data.get("recommended_doctor_ids", [])
                        recommended_doctors = [d for d in doctor_list if d["user_id"] in recommended_ids]
                        return {
                            "recommendation": ai_data.get("recommendation", ai_text),
                            "doctors": recommended_doctors if recommended_doctors else doctor_list[:3],
                            "specialties_needed": ai_data.get("specialties_needed", [])
                        }
                except json.JSONDecodeError:
                    pass
                
            else:
                failure_reason = f"OpenRouter API error: {response.status_code} - {response.text}"
                logger.error(failure_reason)
                error_dict = _simple_recommend(data.symptoms, doctor_list)
                error_dict["recommendation"] = f"(AI Sync Failed: {failure_reason}) \n\n{error_dict['recommendation']}"
                return error_dict
    except Exception as e:
        failure_reason = str(e)
        logger.error(f"AI recommendation error: {e}")
        error_dict = _simple_recommend(data.symptoms, doctor_list)
        error_dict["recommendation"] = f"(AI Exception Error: {failure_reason}) \n\n{error_dict['recommendation']}"
        return error_dict

def _simple_recommend(symptoms: str, doctors: list) -> dict:
    """Simple keyword-based recommendation fallback"""
    symptom_specialty_map = {
        "heart": "Cardiology", "chest pain": "Cardiology", "blood pressure": "Cardiology",
        "skin": "Dermatology", "rash": "Dermatology", "acne": "Dermatology",
        "child": "Pediatrics", "baby": "Pediatrics", "infant": "Pediatrics",
        "bone": "Orthopedics", "joint": "Orthopedics", "fracture": "Orthopedics",
        "eye": "Ophthalmology", "vision": "Ophthalmology",
        "teeth": "Dentistry", "dental": "Dentistry", "tooth": "Dentistry",
        "stomach": "Gastroenterology", "digestion": "Gastroenterology",
        "brain": "Neurology", "headache": "Neurology", "nerve": "Neurology",
        "mental": "Psychiatry", "anxiety": "Psychiatry", "depression": "Psychiatry",
        "lung": "Pulmonology", "breathing": "Pulmonology", "cough": "Pulmonology",
        "ear": "ENT", "throat": "ENT", "nose": "ENT",
        "kidney": "Nephrology", "urine": "Urology",
        "sugar": "Endocrinology", "diabetes": "Endocrinology", "thyroid": "Endocrinology",
    }
    
    symptoms_lower = symptoms.lower()
    matched_specialty = None
    for keyword, specialty in symptom_specialty_map.items():
        if keyword in symptoms_lower:
            matched_specialty = specialty
            break
    
    if matched_specialty:
        matched = [d for d in doctors if matched_specialty in d.get("specialties", [])]
        if matched:
            matched.sort(key=lambda x: (-x.get("rating", 0), x.get("fee", 0)))
            return {
                "recommendation": f"Based on your symptoms, we recommend seeing a {matched_specialty} specialist.",
                "doctors": matched[:3],
                "specialties_needed": [matched_specialty]
            }
    
    # Default: return top-rated doctors
    doctors.sort(key=lambda x: (-x.get("rating", 0), x.get("fee", 0)))
    return {
        "recommendation": "Based on your symptoms, here are our top-rated available doctors.",
        "doctors": doctors[:3],
        "specialties_needed": ["General Medicine"]
    }


# ============== SUBSCRIPTIONS PLACEHOLDER ==============
@api_router.get("/subscriptions")
async def get_subscriptions(current_user: dict = Depends(get_current_user)):
    return {
        "status": "coming_soon",
        "message": "Subscription plans are coming soon!",
        "plans": [
            {"name": "Basic", "price": 0, "features": ["5 appointments/month", "Chat support"], "status": "coming_soon"},
            {"name": "Premium", "price": 499, "features": ["Unlimited appointments", "Priority booking", "Video calls", "AI assistant"], "status": "coming_soon"},
            {"name": "Family", "price": 799, "features": ["All Premium features", "Up to 6 family members", "Health reports"], "status": "coming_soon"}
        ]
    }

@api_router.get("/test-connection")
async def test_connection():
    return {"message": "Mobile connection successful!", "timestamp": datetime.now(timezone.utc).isoformat()}

# ============== HEALTH CHECK ==============
# Include router - moved to end
# app.include_router(api_router)

# Mount uploads directory for static file serving
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

# CORS handled at the top of the file

# ============== BACKGROUND NOTIFICATION SCHEDULER ==============
scheduler = AsyncIOScheduler()

async def trigger_appointment_reminders():
    """
    Cron job evaluating all confirmed appointments in DB. 
    Triggers 24h, 6h, 1h, and 20m reminders based on current UTC time.
    """
    now = datetime.now(timezone.utc)
    
    # 1. Fetch confirmed appointments occurring in the future
    upcoming_appointments = await db.appointments.find({
        "status": AppointmentStatus.CONFIRMED
    }).to_list(1000)
    
    for apt in upcoming_appointments:
        try:
            # Parse appointment date and time into UTC
            apt_datetime_str = f"{apt['appointment_date']}T{apt['appointment_time']}"
            if len(apt_datetime_str) == 16: # HH:MM
                apt_datetime_str += ":00"
            
            apt_date = datetime.fromisoformat(apt_datetime_str)
            if apt_date.tzinfo is None:
                # Assume local schema implicitly meant UTC for appointments if naive
                apt_date = apt_date.replace(tzinfo=timezone.utc)
                
            time_diff = apt_date - now
            minutes_to_apt = time_diff.total_seconds() / 60
            
            # Map of threshold brackets to alert states
            thresholds = {
                "24h": (24 * 60 - 5, 24 * 60 + 5),
                "6h": (6 * 60 - 5, 6 * 60 + 5),
                "1h": (60 - 5, 60 + 5),
                "20m": (20 - 5, 20 + 5)
            }
            
            for threshold_name, (min_m, max_m) in thresholds.items():
                if min_m <= minutes_to_apt <= max_m:
                    # Check if we already notified them for this threshold
                    existing = await db.notifications.find_one({
                        "user_id": apt["patient_id"],
                        "data.appointment_id": apt["id"],
                        "data.threshold": threshold_name
                    })
                    
                    if not existing:
                        logger.info(f"Triggering {threshold_name} reminder for Appointment {apt['id']}")
                        # Fire Push Notification
                        await create_notification(
                            user_id=apt["patient_id"],
                            title="Appointment Reminder",
                            message=f"Your appointment is in exactly {threshold_name}!",
                            type="appointment_reminder",
                            data={
                                "appointment_id": apt["id"],
                                "threshold": threshold_name
                            }
                        )

        except Exception as e:
            logger.error(f"Error evaluating appointment {apt.get('id')} for reminders: {e}")

# ============== WEBSOCKET SIGNALING ==============
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room_id: str):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)

    def disconnect(self, websocket: WebSocket, room_id: str):
        if room_id in self.active_connections:
            if websocket in self.active_connections[room_id]:
                self.active_connections[room_id].remove(websocket)
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]

    async def broadcast(self, message: str, room_id: str, sender: WebSocket):
        if room_id in self.active_connections:
            for connection in self.active_connections[room_id]:
                if connection != sender:
                    await connection.send_text(message)

manager = ConnectionManager()

@app.websocket("/api/ws/audio/{appointment_id}")
async def audio_websocket_endpoint(websocket: WebSocket, appointment_id: str):
    await manager.connect(websocket, appointment_id)
    try:
        while True:
            data = await websocket.receive_text()
            await manager.broadcast(data, appointment_id, websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket, appointment_id)


# Attach global API Router
app.include_router(api_router)

@app.on_event("startup")
async def startup_event():
    logger.info(f"Allowed CORS origins: {origins}")
    
    # --- SELF-HEALING ADMIN ENSURANCE ---
    try:
        admin_email = "admin@admin.com"
        admin_user = await db.users.find_one({"email": admin_email})
        if not admin_user:
            logger.info("Creating default admin account (admin@admin.com / admin)...")
            user_id = str(uuid.uuid4())
            await db.users.insert_one({
                "id": user_id,
                "email": admin_email,
                "password": hash_password("admin"),
                "full_name": "System Administrator",
                "phone": "+10000000000",
                "role": "admin",
                "is_verified": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            })
            await db.admins.insert_one({"user_id": user_id, "permissions": ["all"]})
        else:
            logger.info("Admin account already exists.")
    except Exception as e:
        logger.error(f"CRITICAL: Failed to ensure admin user on startup: {e}")

    # Use a file lock to ensure only one gunicorn worker starts the scheduler
    lock_file = "/tmp/scheduler.lock"
    try:
        # Open the file and attempt to get an exclusive lock
        f = open(lock_file, "w")
        import fcntl
        fcntl.flock(f, fcntl.LOCK_EX | fcntl.LOCK_NB)
        
        # If we got here, we are the worker that owns the lock
        logger.info("Starting background reminder scheduler (Production Mode)...")
        scheduler.add_job(trigger_appointment_reminders, 'interval', minutes=1)
        scheduler.start()
        
        # Keep the file handle open to maintain the lock
        app.state.scheduler_lock_file = f
    except (IOError, ImportError):
        logger.info("Scheduler already running in another worker or lock skipped")

@app.on_event("shutdown")
async def shutdown_db_client():
    scheduler.shutdown()
    client.close()
