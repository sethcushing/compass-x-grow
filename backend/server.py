from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timezone, timedelta
import httpx
from emergentintegrations.llm.chat import LlmChat, UserMessage
from passlib.context import CryptContext
from jose import JWTError, jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# LLM Key
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'compassx-crm-secret-key-2026')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Default admin user - seeded on startup
DEFAULT_ADMIN = {"email": "seth.cushing@compassx.com", "name": "Seth Cushing", "role": "admin"}

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============== PYDANTIC MODELS ==============

class UserBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    role: str = "sales_lead"  # sales_lead, admin
    password_hash: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LoginRequest(BaseModel):
    email: str
    password: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class UserSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    session_id: str
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OrganizationBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    org_id: str = Field(default_factory=lambda: f"org_{uuid.uuid4().hex[:12]}")
    name: str
    industry: Optional[str] = None
    company_size: Optional[str] = None
    region: Optional[str] = None
    strategic_tier: str = "Active"  # Target, Active, Strategic
    primary_exec_sponsor: Optional[str] = None
    notes: Optional[str] = None  # Legacy single note field
    notes_history: Optional[List[dict]] = None  # Running tally of notes [{text, created_at, created_by}]
    google_drive_link: Optional[str] = None
    owner_id: str  # User who owns this organization
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OrganizationCreate(BaseModel):
    name: str
    industry: Optional[str] = None
    company_size: Optional[str] = None
    region: Optional[str] = None
    strategic_tier: str = "Active"
    primary_exec_sponsor: Optional[str] = None
    notes: Optional[str] = None
    google_drive_link: Optional[str] = None
    owner_id: Optional[str] = None  # Optional - defaults to current user

class ContactBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    contact_id: str = Field(default_factory=lambda: f"contact_{uuid.uuid4().hex[:12]}")
    name: str
    title: Optional[str] = None
    function: Optional[str] = None  # IT, Data, AI, Finance, Ops
    email: Optional[str] = None
    phone: Optional[str] = None
    buying_role: Optional[str] = None  # Decision Maker, Influencer, Champion
    org_id: str
    notes: Optional[str] = None
    owner_id: str  # User who owns this contact
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ContactCreate(BaseModel):
    name: str
    title: Optional[str] = None
    function: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    buying_role: Optional[str] = None
    org_id: str
    notes: Optional[str] = None
    owner_id: Optional[str] = None  # Optional - defaults to current user

class OpportunityBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    opp_id: str = Field(default_factory=lambda: f"opp_{uuid.uuid4().hex[:12]}")
    name: str
    org_id: str
    primary_contact_id: Optional[str] = None
    engagement_type: str  # Advisory, Strategy, AI Enablement, Data Modernization, Platform / Architecture, Transformation
    estimated_value: float = 0
    confidence_level: int = 50  # 0-100
    owner_id: str
    pipeline_id: str
    stage_id: str
    target_close_date: Optional[datetime] = None
    source: Optional[str] = None  # Inbound, Referral, Exec Intro, Expansion
    notes: Optional[str] = None
    value_hypothesis: Optional[str] = None
    is_at_risk: bool = False
    at_risk_reason: Optional[str] = None  # User-provided reason for at-risk status
    # Deal Builder fields
    deal_start_date: Optional[datetime] = None
    deal_end_date: Optional[datetime] = None
    num_consultants: Optional[int] = None
    blended_hourly_rate: Optional[float] = None
    calculated_value: Optional[float] = None  # Calculated from deal builder
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    stage_entered_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OpportunityCreate(BaseModel):
    name: str
    org_id: str
    primary_contact_id: Optional[str] = None
    engagement_type: str
    estimated_value: float = 0
    confidence_level: int = 50
    pipeline_id: str
    stage_id: str
    target_close_date: Optional[str] = None
    source: Optional[str] = None
    notes: Optional[str] = None
    value_hypothesis: Optional[str] = None
    owner_id: Optional[str] = None  # Required - owner of this opportunity
    # Deal Builder fields
    deal_start_date: Optional[str] = None
    deal_end_date: Optional[str] = None
    num_consultants: Optional[int] = None
    blended_hourly_rate: Optional[float] = None
    calculated_value: Optional[float] = None

class OpportunityUpdate(BaseModel):
    name: Optional[str] = None
    org_id: Optional[str] = None
    primary_contact_id: Optional[str] = None
    engagement_type: Optional[str] = None
    estimated_value: Optional[float] = None
    confidence_level: Optional[int] = None
    stage_id: Optional[str] = None
    target_close_date: Optional[str] = None
    source: Optional[str] = None
    notes: Optional[str] = None
    value_hypothesis: Optional[str] = None
    owner_id: Optional[str] = None  # Allow changing owner
    is_at_risk: Optional[bool] = None
    at_risk_reason: Optional[str] = None
    # Deal Builder fields
    deal_start_date: Optional[str] = None
    deal_end_date: Optional[str] = None
    num_consultants: Optional[int] = None
    blended_hourly_rate: Optional[float] = None
    calculated_value: Optional[float] = None

class OpportunityAtRiskUpdate(BaseModel):
    is_at_risk: bool
    at_risk_reason: Optional[str] = None

class ActivityBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    activity_id: str = Field(default_factory=lambda: f"act_{uuid.uuid4().hex[:12]}")
    activity_type: str  # Call, Meeting, Demo, Workshop, Follow-up, Exec Readout
    title: Optional[str] = None  # Activity title/subject
    opp_id: Optional[str] = None  # Optional - can be tied to opportunity
    org_id: Optional[str] = None  # Optional - can be tied to organization directly
    due_date: datetime
    owner_id: str
    status: str = "Planned"  # Planned, Completed, Overdue
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ActivityCreate(BaseModel):
    activity_type: str
    title: Optional[str] = None
    opp_id: Optional[str] = None
    org_id: Optional[str] = None
    due_date: str
    notes: Optional[str] = None
    status: Optional[str] = "Planned"

class ActivityUpdate(BaseModel):
    activity_type: Optional[str] = None
    title: Optional[str] = None
    due_date: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class PipelineBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    pipeline_id: str = Field(default_factory=lambda: f"pipe_{uuid.uuid4().hex[:12]}")
    name: str
    description: Optional[str] = None
    is_default: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StageBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    stage_id: str = Field(default_factory=lambda: f"stage_{uuid.uuid4().hex[:12]}")
    pipeline_id: str
    name: str
    order: int
    win_probability: int = 0
    auto_activity: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AICopilotRequest(BaseModel):
    action: str  # summarize, suggest_activity, draft_email, value_hypothesis
    opp_id: str
    context: Optional[str] = None

# ============== HELPER FUNCTIONS ==============

def serialize_datetime(obj):
    """Convert datetime to ISO string for MongoDB storage"""
    if isinstance(obj, datetime):
        return obj.isoformat()
    return obj

def parse_datetime(dt_str):
    """Parse ISO string to datetime"""
    if isinstance(dt_str, datetime):
        if dt_str.tzinfo is None:
            return dt_str.replace(tzinfo=timezone.utc)
        return dt_str
    if isinstance(dt_str, str):
        dt = datetime.fromisoformat(dt_str.replace('Z', '+00:00'))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    return dt_str

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)

def create_access_token(data: dict) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> dict:
    """Decode and verify JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

async def get_current_user(request: Request) -> dict:
    """Get current user from JWT token"""
    # Check cookie first
    token = request.cookies.get("session_token")
    
    # Fallback to Authorization header
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Decode JWT token
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    # Get user
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user

# ============== AUTH ENDPOINTS ==============

@api_router.post("/auth/login")
async def login(data: LoginRequest, response: Response):
    """Login with email and password"""
    email = data.email.lower().strip()
    
    # Check if user is in authorized list
    authorized = next((u for u in AUTHORIZED_USERS if u["email"].lower() == email), None)
    if not authorized:
        raise HTTPException(status_code=401, detail="Unauthorized user")
    
    # Get user from database
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials. Please contact admin to set up your account.")
    
    # Verify password
    if not user.get("password_hash") or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create JWT token
    token = create_access_token({"user_id": user["user_id"], "email": user["email"]})
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=ACCESS_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
    )
    
    # Return user without password hash
    return {
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
        "picture": user.get("picture")
    }

@api_router.post("/auth/setup-users")
async def setup_users():
    """Initialize authorized users with default password (run once)"""
    default_password = "CompassX2026!"
    created = []
    
    for auth_user in AUTHORIZED_USERS:
        existing = await db.users.find_one({"email": auth_user["email"].lower()}, {"_id": 0})
        if not existing:
            user_doc = {
                "user_id": f"user_{uuid.uuid4().hex[:12]}",
                "email": auth_user["email"].lower(),
                "name": auth_user["name"],
                "role": auth_user["role"],
                "password_hash": get_password_hash(default_password),
                "picture": None,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.users.insert_one(user_doc)
            created.append(auth_user["email"])
    
    return {"message": f"Created {len(created)} users", "users": created, "default_password": default_password}

@api_router.post("/auth/change-password")
async def change_password(data: ChangePasswordRequest, request: Request):
    """Change user password"""
    user = await get_current_user(request)
    
    # Get full user with password hash
    full_user = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    
    # Verify current password
    if not verify_password(data.current_password, full_user.get("password_hash", "")):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Update password
    new_hash = get_password_hash(data.new_password)
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"password_hash": new_hash}}
    )
    
    return {"message": "Password changed successfully"}

@api_router.get("/auth/me")
async def get_me(request: Request):
    """Get current authenticated user"""
    user = await get_current_user(request)
    return user

@api_router.get("/auth/users")
async def get_users(request: Request):
    """Get all users - only returns authorized users"""
    user = await get_current_user(request)
    # Only return users that are in the authorized list
    authorized_emails = [u["email"].lower() for u in AUTHORIZED_USERS]
    users = await db.users.find(
        {"email": {"$in": authorized_emails}},
        {"_id": 0, "password_hash": 0}
    ).to_list(100)
    return users

@api_router.delete("/auth/users/{user_id}")
async def delete_user(user_id: str, request: Request):
    """Delete a user (admin only)"""
    current_user = await get_current_user(request)
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Don't allow deleting yourself
    if current_user["user_id"] == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    # Check if user exists
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Don't allow deleting authorized users
    authorized_emails = [u["email"].lower() for u in AUTHORIZED_USERS]
    if user.get("email", "").lower() in authorized_emails:
        raise HTTPException(status_code=400, detail="Cannot delete authorized users")
    
    await db.users.delete_one({"user_id": user_id})
    return {"message": "User deleted"}

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout and clear session"""
    response.delete_cookie(
        key="session_token",
        path="/",
        secure=True,
        samesite="none"
    )
    return {"message": "Logged out"}

@api_router.post("/auth/google/session")
async def google_oauth_session(request: Request, response: Response):
    """
    Exchange Google OAuth session_id for app session
    REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    """
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    # Call Emergent Auth to get user data
    async with httpx.AsyncClient() as client:
        try:
            auth_response = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id}
            )
            
            if auth_response.status_code != 200:
                logger.error(f"Emergent Auth error: {auth_response.text}")
                raise HTTPException(status_code=401, detail="Invalid session")
            
            auth_data = auth_response.json()
        except httpx.RequestError as e:
            logger.error(f"Emergent Auth request error: {e}")
            raise HTTPException(status_code=500, detail="Authentication service unavailable")
    
    email = auth_data.get("email", "").lower().strip()
    name = auth_data.get("name", "")
    picture = auth_data.get("picture", "")
    # Note: emergent session_token is available but we create our own JWT for app consistency
    
    # Check if email is in authorized list
    authorized = next((u for u in AUTHORIZED_USERS if u["email"].lower() == email), None)
    if not authorized:
        raise HTTPException(status_code=403, detail="Email not authorized. Access is restricted to CompassX team members.")
    
    # Check if user exists, create if not
    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    
    if existing_user:
        # Update existing user with latest info from Google
        await db.users.update_one(
            {"email": email},
            {"$set": {
                "name": name or existing_user.get("name", authorized["name"]),
                "picture": picture,
                "role": authorized["role"],  # Sync role from authorized list
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        user_id = existing_user["user_id"]
    else:
        # Create new user
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user_doc = {
            "user_id": user_id,
            "email": email,
            "name": name or authorized["name"],
            "picture": picture,
            "role": authorized["role"],
            "password_hash": None,  # Google OAuth users don't have password
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user_doc)
    
    # Create JWT token for our app
    token = create_access_token({"user_id": user_id, "email": email})
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=ACCESS_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
    )
    
    # Get updated user
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    
    return {
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
        "picture": user.get("picture")
    }

# ============== ORGANIZATION ENDPOINTS ==============

@api_router.get("/organizations")
async def get_organizations(request: Request):
    user = await get_current_user(request)
    orgs = await db.organizations.find({}, {"_id": 0}).to_list(1000)
    
    # Calculate at-risk status based on no activity in 7 days
    now = datetime.now(timezone.utc)
    seven_days_ago = now - timedelta(days=7)
    
    for org in orgs:
        # Get all activities for this org (direct org activities + activities from org's opportunities)
        org_activities = await db.activities.find({"org_id": org["org_id"]}, {"_id": 0}).to_list(100)
        
        # Also get activities from opportunities linked to this org
        org_opps = await db.opportunities.find({"org_id": org["org_id"]}, {"opp_id": 1, "_id": 0}).to_list(100)
        opp_ids = [o["opp_id"] for o in org_opps]
        if opp_ids:
            opp_activities = await db.activities.find({"opp_id": {"$in": opp_ids}}, {"_id": 0}).to_list(100)
            org_activities.extend(opp_activities)
        
        # Check if any activity in the last 7 days
        has_recent_activity = False
        for act in org_activities:
            act_date = parse_datetime(act.get("due_date") or act.get("created_at", "2000-01-01"))
            if act_date >= seven_days_ago:
                has_recent_activity = True
                break
        
        # Mark as at-risk if no recent activity and org has been created more than 7 days ago
        org_created = parse_datetime(org.get("created_at", now.isoformat()))
        org["is_at_risk"] = not has_recent_activity and org_created < seven_days_ago
    
    return orgs

@api_router.get("/organizations/{org_id}")
async def get_organization(org_id: str, request: Request):
    user = await get_current_user(request)
    org = await db.organizations.find_one({"org_id": org_id}, {"_id": 0})
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    # Calculate at-risk status
    now = datetime.now(timezone.utc)
    seven_days_ago = now - timedelta(days=7)
    
    org_activities = await db.activities.find({"org_id": org_id}, {"_id": 0}).to_list(100)
    org_opps = await db.opportunities.find({"org_id": org_id}, {"opp_id": 1, "_id": 0}).to_list(100)
    opp_ids = [o["opp_id"] for o in org_opps]
    if opp_ids:
        opp_activities = await db.activities.find({"opp_id": {"$in": opp_ids}}, {"_id": 0}).to_list(100)
        org_activities.extend(opp_activities)
    
    has_recent_activity = False
    for act in org_activities:
        act_date = parse_datetime(act.get("due_date") or act.get("created_at", "2000-01-01"))
        if act_date >= seven_days_ago:
            has_recent_activity = True
            break
    
    org_created = parse_datetime(org.get("created_at", now.isoformat()))
    org["is_at_risk"] = not has_recent_activity and org_created < seven_days_ago
    
    return org

@api_router.post("/organizations")
async def create_organization(data: OrganizationCreate, request: Request):
    user = await get_current_user(request)
    owner_id = data.owner_id or user["user_id"]
    org = OrganizationBase(**data.model_dump(exclude={'owner_id'}), owner_id=owner_id, created_by=user["user_id"])
    doc = org.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    doc["updated_at"] = doc["updated_at"].isoformat()
    await db.organizations.insert_one(doc)
    return await db.organizations.find_one({"org_id": org.org_id}, {"_id": 0})

@api_router.put("/organizations/{org_id}")
async def update_organization(org_id: str, data: OrganizationCreate, request: Request):
    user = await get_current_user(request)
    update_data = data.model_dump(exclude_unset=True)
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.organizations.update_one({"org_id": org_id}, {"$set": update_data})
    return await db.organizations.find_one({"org_id": org_id}, {"_id": 0})

@api_router.delete("/organizations/{org_id}")
async def delete_organization(org_id: str, request: Request):
    user = await get_current_user(request)
    await db.organizations.delete_one({"org_id": org_id})
    return {"message": "Deleted"}

# ============== CONTACT ENDPOINTS ==============

@api_router.get("/contacts")
async def get_contacts(request: Request, org_id: Optional[str] = None):
    user = await get_current_user(request)
    query = {} if not org_id else {"org_id": org_id}
    contacts = await db.contacts.find(query, {"_id": 0}).to_list(1000)
    return contacts

@api_router.get("/contacts/{contact_id}")
async def get_contact(contact_id: str, request: Request):
    user = await get_current_user(request)
    contact = await db.contacts.find_one({"contact_id": contact_id}, {"_id": 0})
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    return contact

@api_router.post("/contacts")
async def create_contact(data: ContactCreate, request: Request):
    user = await get_current_user(request)
    owner_id = data.owner_id or user["user_id"]
    contact = ContactBase(**data.model_dump(exclude={'owner_id'}), owner_id=owner_id, created_by=user["user_id"])
    doc = contact.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    doc["updated_at"] = doc["updated_at"].isoformat()
    await db.contacts.insert_one(doc)
    return await db.contacts.find_one({"contact_id": contact.contact_id}, {"_id": 0})

@api_router.put("/contacts/{contact_id}")
async def update_contact(contact_id: str, data: ContactCreate, request: Request):
    user = await get_current_user(request)
    update_data = data.model_dump(exclude_unset=True)
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.contacts.update_one({"contact_id": contact_id}, {"$set": update_data})
    return await db.contacts.find_one({"contact_id": contact_id}, {"_id": 0})

@api_router.delete("/contacts/{contact_id}")
async def delete_contact(contact_id: str, request: Request):
    user = await get_current_user(request)
    await db.contacts.delete_one({"contact_id": contact_id})
    return {"message": "Deleted"}

@api_router.get("/organizations/{org_id}/summary")
async def get_organization_summary(org_id: str, request: Request):
    """Get summary data for an organization including buyer, opportunity totals, won/lost values, and separated pipeline/active opps"""
    user = await get_current_user(request)
    
    # Get buyer (contact with buying_role of Decision Maker or Champion)
    buyer = await db.contacts.find_one(
        {"org_id": org_id, "buying_role": {"$in": ["Decision Maker", "Champion"]}},
        {"_id": 0, "name": 1, "title": 1, "buying_role": 1, "contact_id": 1}
    )
    
    # Get all opportunities for this organization with full data for separation
    opps = await db.opportunities.find({"org_id": org_id}, {"_id": 0}).to_list(100)
    opp_count = len(opps)
    total_value = sum(o.get("estimated_value", 0) or 0 for o in opps)
    avg_confidence = round(sum(o.get("confidence_level", 0) or 0 for o in opps) / opp_count, 1) if opp_count > 0 else 0
    
    # Categorize opportunities
    won_opps = [o for o in opps if "won" in o.get("stage_id", "").lower()]
    lost_opps = [o for o in opps if "lost" in o.get("stage_id", "").lower()]
    pipeline_opps = [o for o in opps if "won" not in o.get("stage_id", "").lower() and "lost" not in o.get("stage_id", "").lower()]
    
    won_value = sum(o.get("estimated_value", 0) or 0 for o in won_opps)
    lost_value = sum(o.get("estimated_value", 0) or 0 for o in lost_opps)
    pipeline_value = sum(o.get("estimated_value", 0) or 0 for o in pipeline_opps)
    
    return {
        "buyer": buyer,
        "opportunities": {
            "count": opp_count,
            "total_value": total_value,
            "avg_confidence": avg_confidence,
            "won_count": len(won_opps),
            "won_value": won_value,
            "lost_count": len(lost_opps),
            "lost_value": lost_value,
            "pipeline_count": len(pipeline_opps),
            "pipeline_value": pipeline_value
        },
        "active_opportunities": won_opps,
        "pipeline_opportunities": pipeline_opps
    }

@api_router.post("/organizations/{org_id}/notes")
async def add_organization_note(org_id: str, request: Request):
    """Add a note to the organization's notes history"""
    user = await get_current_user(request)
    body = await request.json()
    note_text = body.get("text", "").strip()
    
    if not note_text:
        raise HTTPException(status_code=400, detail="Note text is required")
    
    note_entry = {
        "text": note_text,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": user["user_id"],
        "created_by_name": user.get("name", "Unknown")
    }
    
    await db.organizations.update_one(
        {"org_id": org_id},
        {
            "$push": {"notes_history": note_entry},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
        }
    )
    
    return note_entry

# ============== PIPELINE & STAGE ENDPOINTS ==============

@api_router.get("/pipelines")
async def get_pipelines(request: Request):
    user = await get_current_user(request)
    pipelines = await db.pipelines.find({}, {"_id": 0}).to_list(100)
    return pipelines

@api_router.get("/pipelines/{pipeline_id}/stages")
async def get_stages(pipeline_id: str, request: Request):
    user = await get_current_user(request)
    stages = await db.stages.find({"pipeline_id": pipeline_id}, {"_id": 0}).sort("order", 1).to_list(100)
    return stages

# ============== OPPORTUNITY ENDPOINTS ==============

@api_router.get("/opportunities")
async def get_opportunities(request: Request, pipeline_id: Optional[str] = None, owner_id: Optional[str] = None):
    user = await get_current_user(request)
    query = {}
    if pipeline_id:
        query["pipeline_id"] = pipeline_id
    if owner_id:
        query["owner_id"] = owner_id
    opps = await db.opportunities.find(query, {"_id": 0}).to_list(1000)
    return opps

@api_router.get("/opportunities/{opp_id}")
async def get_opportunity(opp_id: str, request: Request):
    user = await get_current_user(request)
    opp = await db.opportunities.find_one({"opp_id": opp_id}, {"_id": 0})
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    return opp

@api_router.post("/opportunities")
async def create_opportunity(data: OpportunityCreate, request: Request):
    user = await get_current_user(request)
    opp_data = data.model_dump()
    if opp_data.get("target_close_date"):
        opp_data["target_close_date"] = parse_datetime(opp_data["target_close_date"])
    else:
        opp_data["target_close_date"] = None
    
    # Use owner_id from request or default to current user
    owner_id = opp_data.pop("owner_id", None) or user["user_id"]
    opp = OpportunityBase(**opp_data, owner_id=owner_id)
    doc = opp.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    doc["updated_at"] = doc["updated_at"].isoformat()
    doc["stage_entered_at"] = doc["stage_entered_at"].isoformat()
    if doc["target_close_date"]:
        doc["target_close_date"] = doc["target_close_date"].isoformat()
    
    await db.opportunities.insert_one(doc)
    
    # Check stage automation
    stage = await db.stages.find_one({"stage_id": data.stage_id}, {"_id": 0})
    if stage and stage.get("auto_activity"):
        activity_doc = {
            "activity_id": f"act_{uuid.uuid4().hex[:12]}",
            "activity_type": "Follow-up",
            "opp_id": opp.opp_id,
            "due_date": (datetime.now(timezone.utc) + timedelta(days=3)).isoformat(),
            "owner_id": user["user_id"],
            "status": "Planned",
            "notes": stage["auto_activity"],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.activities.insert_one(activity_doc)
    
    return await db.opportunities.find_one({"opp_id": opp.opp_id}, {"_id": 0})

@api_router.put("/opportunities/{opp_id}")
async def update_opportunity(opp_id: str, data: OpportunityUpdate, request: Request):
    user = await get_current_user(request)
    update_data = data.model_dump(exclude_unset=True)
    
    # Handle stage change
    if "stage_id" in update_data:
        update_data["stage_entered_at"] = datetime.now(timezone.utc).isoformat()
        
        # Check stage automation
        stage = await db.stages.find_one({"stage_id": update_data["stage_id"]}, {"_id": 0})
        if stage and stage.get("auto_activity"):
            activity_doc = {
                "activity_id": f"act_{uuid.uuid4().hex[:12]}",
                "activity_type": "Follow-up",
                "opp_id": opp_id,
                "due_date": (datetime.now(timezone.utc) + timedelta(days=3)).isoformat(),
                "owner_id": user["user_id"],
                "status": "Planned",
                "notes": stage["auto_activity"],
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            await db.activities.insert_one(activity_doc)
    
    if "target_close_date" in update_data and update_data["target_close_date"]:
        update_data["target_close_date"] = parse_datetime(update_data["target_close_date"]).isoformat()
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.opportunities.update_one({"opp_id": opp_id}, {"$set": update_data})
    return await db.opportunities.find_one({"opp_id": opp_id}, {"_id": 0})

@api_router.delete("/opportunities/{opp_id}")
async def delete_opportunity(opp_id: str, request: Request):
    user = await get_current_user(request)
    await db.opportunities.delete_one({"opp_id": opp_id})
    await db.activities.delete_many({"opp_id": opp_id})
    return {"message": "Deleted"}

@api_router.put("/opportunities/{opp_id}/at-risk")
async def update_opportunity_at_risk(opp_id: str, data: OpportunityAtRiskUpdate, request: Request):
    """Update opportunity at-risk status with reason"""
    user = await get_current_user(request)
    
    # Verify opportunity exists
    opp = await db.opportunities.find_one({"opp_id": opp_id}, {"_id": 0})
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    update_data = {
        "is_at_risk": data.is_at_risk,
        "at_risk_reason": data.at_risk_reason if data.is_at_risk else None,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.opportunities.update_one({"opp_id": opp_id}, {"$set": update_data})
    return await db.opportunities.find_one({"opp_id": opp_id}, {"_id": 0})

# ============== ACTIVITY ENDPOINTS ==============

@api_router.get("/activities")
async def get_activities(request: Request, opp_id: Optional[str] = None, org_id: Optional[str] = None, owner_id: Optional[str] = None, status: Optional[str] = None):
    user = await get_current_user(request)
    query = {}
    if opp_id:
        query["opp_id"] = opp_id
    if org_id:
        # Get activities directly linked to org OR linked to org's opportunities
        org_opps = await db.opportunities.find({"org_id": org_id}, {"opp_id": 1, "_id": 0}).to_list(100)
        opp_ids = [o["opp_id"] for o in org_opps]
        query["$or"] = [{"org_id": org_id}]
        if opp_ids:
            query["$or"].append({"opp_id": {"$in": opp_ids}})
    if owner_id:
        query["owner_id"] = owner_id
    if status:
        query["status"] = status
    activities = await db.activities.find(query, {"_id": 0}).to_list(1000)
    return activities

@api_router.get("/activities/{activity_id}")
async def get_activity(activity_id: str, request: Request):
    user = await get_current_user(request)
    activity = await db.activities.find_one({"activity_id": activity_id}, {"_id": 0})
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    return activity

@api_router.post("/activities")
async def create_activity(data: ActivityCreate, request: Request):
    user = await get_current_user(request)
    activity_data = data.model_dump()
    activity_data["due_date"] = parse_datetime(activity_data["due_date"])
    
    activity = ActivityBase(**activity_data, owner_id=user["user_id"])
    doc = activity.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    doc["updated_at"] = doc["updated_at"].isoformat()
    doc["due_date"] = doc["due_date"].isoformat()
    
    await db.activities.insert_one(doc)
    
    # Update opportunity at-risk status if linked to opp
    if data.opp_id:
        await db.opportunities.update_one(
            {"opp_id": data.opp_id},
            {"$set": {"is_at_risk": False, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
    
    return await db.activities.find_one({"activity_id": activity.activity_id}, {"_id": 0})

@api_router.put("/activities/{activity_id}")
async def update_activity(activity_id: str, data: ActivityUpdate, request: Request):
    user = await get_current_user(request)
    update_data = data.model_dump(exclude_unset=True)
    
    if "due_date" in update_data and update_data["due_date"]:
        update_data["due_date"] = parse_datetime(update_data["due_date"]).isoformat()
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.activities.update_one({"activity_id": activity_id}, {"$set": update_data})
    return await db.activities.find_one({"activity_id": activity_id}, {"_id": 0})

@api_router.delete("/activities/{activity_id}")
async def delete_activity(activity_id: str, request: Request):
    user = await get_current_user(request)
    await db.activities.delete_one({"activity_id": activity_id})
    return {"message": "Deleted"}

# ============== DASHBOARD ENDPOINTS ==============

@api_router.get("/dashboard/sales")
async def get_sales_dashboard(request: Request):
    """Main dashboard - shows ALL opportunities and activities"""
    user = await get_current_user(request)
    
    # ALL opportunities (everyone sees everything)
    all_opps = await db.opportunities.find({}, {"_id": 0}).to_list(1000)
    
    # Stages for grouping
    pipelines = await db.pipelines.find({}, {"_id": 0}).to_list(10)
    default_pipeline = next((p for p in pipelines if p.get("is_default")), pipelines[0] if pipelines else None)
    
    stages = []
    if default_pipeline:
        stages = await db.stages.find(
            {"pipeline_id": default_pipeline["pipeline_id"]},
            {"_id": 0}
        ).sort("order", 1).to_list(20)
    
    # ALL activities
    all_activities = await db.activities.find({}, {"_id": 0}).to_list(500)
    
    # Get all users for owner names
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(100)
    
    # Calculate metrics
    total_value = sum(opp.get("estimated_value", 0) for opp in all_opps)
    weighted_value = sum(
        opp.get("estimated_value", 0) * opp.get("confidence_level", 0) / 100
        for opp in all_opps
    )
    
    overdue_activities = [
        a for a in all_activities
        if a.get("status") == "Planned" and parse_datetime(a.get("due_date", "2099-01-01")) < datetime.now(timezone.utc)
    ]
    
    at_risk_opps = [opp for opp in all_opps if opp.get("is_at_risk")]
    
    return {
        "opportunities": all_opps,
        "stages": stages,
        "activities": all_activities,
        "users": users,
        "current_user_id": user["user_id"],
        "metrics": {
            "total_opportunities": len(all_opps),
            "total_value": total_value,
            "weighted_forecast": weighted_value,
            "overdue_activities": len(overdue_activities),
            "at_risk_opportunities": len(at_risk_opps)
        }
    }

@api_router.get("/dashboard/my-pipeline")
async def get_my_pipeline(request: Request):
    """My Pipeline - shows only opportunities owned by current user"""
    user = await get_current_user(request)
    
    # My opportunities only
    my_opps = await db.opportunities.find(
        {"owner_id": user["user_id"]},
        {"_id": 0}
    ).to_list(1000)
    
    # Stages for grouping
    pipelines = await db.pipelines.find({}, {"_id": 0}).to_list(10)
    default_pipeline = next((p for p in pipelines if p.get("is_default")), pipelines[0] if pipelines else None)
    
    stages = []
    if default_pipeline:
        stages = await db.stages.find(
            {"pipeline_id": default_pipeline["pipeline_id"]},
            {"_id": 0}
        ).sort("order", 1).to_list(20)
    
    # My activities only
    my_activities = await db.activities.find(
        {"owner_id": user["user_id"]},
        {"_id": 0}
    ).to_list(500)
    
    # Calculate metrics
    total_value = sum(opp.get("estimated_value", 0) for opp in my_opps)
    weighted_value = sum(
        opp.get("estimated_value", 0) * opp.get("confidence_level", 0) / 100
        for opp in my_opps
    )
    
    overdue_activities = [
        a for a in my_activities
        if a.get("status") == "Planned" and parse_datetime(a.get("due_date", "2099-01-01")) < datetime.now(timezone.utc)
    ]
    
    at_risk_opps = [opp for opp in my_opps if opp.get("is_at_risk")]
    
    return {
        "opportunities": my_opps,
        "stages": stages,
        "activities": my_activities,
        "metrics": {
            "total_opportunities": len(my_opps),
            "total_value": total_value,
            "weighted_forecast": weighted_value,
            "overdue_activities": len(overdue_activities),
            "at_risk_opportunities": len(at_risk_opps)
        }
    }

@api_router.get("/dashboard/executive")
async def get_executive_dashboard(request: Request):
    """Executive dashboard data"""
    user = await get_current_user(request)
    
    # All opportunities
    all_opps = await db.opportunities.find({}, {"_id": 0}).to_list(2000)
    
    # Stages
    pipelines = await db.pipelines.find({}, {"_id": 0}).to_list(10)
    default_pipeline = next((p for p in pipelines if p.get("is_default")), pipelines[0] if pipelines else None)
    
    stages = []
    if default_pipeline:
        stages = await db.stages.find(
            {"pipeline_id": default_pipeline["pipeline_id"]},
            {"_id": 0}
        ).sort("order", 1).to_list(20)
    
    # All users
    users = await db.users.find({}, {"_id": 0}).to_list(100)
    
    # Calculate metrics
    total_value = sum(opp.get("estimated_value", 0) for opp in all_opps)
    weighted_value = sum(
        opp.get("estimated_value", 0) * opp.get("confidence_level", 0) / 100
        for opp in all_opps
    )
    
    # By stage
    by_stage = {}
    for opp in all_opps:
        stage_id = opp.get("stage_id", "unknown")
        if stage_id not in by_stage:
            by_stage[stage_id] = {"count": 0, "value": 0}
        by_stage[stage_id]["count"] += 1
        by_stage[stage_id]["value"] += opp.get("estimated_value", 0)
    
    # By owner
    by_owner = {}
    for opp in all_opps:
        owner_id = opp.get("owner_id", "unknown")
        if owner_id not in by_owner:
            by_owner[owner_id] = {"count": 0, "value": 0}
        by_owner[owner_id]["count"] += 1
        by_owner[owner_id]["value"] += opp.get("estimated_value", 0)
    
    # Win/Loss
    won = [opp for opp in all_opps if "won" in opp.get("stage_id", "").lower()]
    lost = [opp for opp in all_opps if "lost" in opp.get("stage_id", "").lower()]
    
    return {
        "opportunities": all_opps,
        "stages": stages,
        "users": users,
        "metrics": {
            "total_pipeline_value": total_value,
            "weighted_forecast": weighted_value,
            "total_deals": len(all_opps),
            "won_deals": len(won),
            "lost_deals": len(lost),
            "win_rate": round(len(won) / max(len(won) + len(lost), 1) * 100, 1)
        },
        "by_stage": by_stage,
        "by_owner": by_owner
    }

# ============== AI COPILOT ENDPOINTS ==============

@api_router.post("/ai/copilot")
async def ai_copilot(data: AICopilotRequest, request: Request):
    """AI-powered sales assistance"""
    user = await get_current_user(request)
    
    # Get opportunity data
    opp = await db.opportunities.find_one({"opp_id": data.opp_id}, {"_id": 0})
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    # Get related data
    org = await db.organizations.find_one({"org_id": opp.get("org_id")}, {"_id": 0})
    contact = None
    if opp.get("primary_contact_id"):
        contact = await db.contacts.find_one({"contact_id": opp["primary_contact_id"]}, {"_id": 0})
    activities = await db.activities.find({"opp_id": data.opp_id}, {"_id": 0}).to_list(50)
    
    # Build context
    context = f"""
Opportunity: {opp.get('name')}
Organization: {org.get('name') if org else 'Unknown'}
Engagement Type: {opp.get('engagement_type')}
Estimated Value: ${opp.get('estimated_value', 0):,.0f}
Confidence: {opp.get('confidence_level', 0)}%
Notes: {opp.get('notes', 'None')}
Value Hypothesis: {opp.get('value_hypothesis', 'None')}
Contact: {contact.get('name') if contact else 'None'} ({contact.get('title', '') if contact else ''})
Recent Activities: {len(activities)} activities logged
Additional Context: {data.context or 'None'}
"""
    
    prompts = {
        "summarize": f"""You are an executive sales advisor. Provide a concise, professional summary of this opportunity for a busy executive. Focus on key facts, current status, and what matters most.

{context}

Provide a 3-4 sentence executive summary.""",

        "suggest_activity": f"""You are a strategic sales advisor for a consulting firm. Based on this opportunity's current state, suggest the most impactful next activity.

{context}

Suggest ONE specific, actionable next step with a brief rationale. Be concrete (e.g., "Schedule discovery call with CFO to validate budget" not "Follow up with stakeholder").""",

        "draft_email": f"""You are a senior consulting sales professional. Draft a professional follow-up email for this opportunity.

{context}

Write a concise, executive-level email that moves the deal forward. Be warm but professional. Keep it under 150 words.""",

        "value_hypothesis": f"""You are a value engineering expert at a consulting firm. Based on this opportunity, craft a compelling value hypothesis.

{context}

Create a structured value hypothesis that includes:
1. Key business challenge being addressed
2. Proposed solution approach
3. Expected outcomes and ROI indicators

Keep it concise and compelling."""
    }
    
    prompt = prompts.get(data.action)
    if not prompt:
        raise HTTPException(status_code=400, detail=f"Unknown action: {data.action}")
    
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"copilot_{user['user_id']}_{data.opp_id}",
            system_message="You are an expert sales advisor for a Tech, Data, and AI Consulting firm. You provide concise, actionable, executive-level guidance."
        ).with_model("openai", "gpt-5.2")
        
        response = await chat.send_message(UserMessage(text=prompt))
        
        return {
            "action": data.action,
            "opp_id": data.opp_id,
            "result": response
        }
    except Exception as e:
        logger.error(f"AI Copilot error: {e}")
        raise HTTPException(status_code=500, detail="AI service temporarily unavailable")

# ============== SEED DATA ENDPOINT ==============

@api_router.post("/seed")
async def seed_data(request: Request):
    """Seed sample data for demo"""
    # Get current user if authenticated
    try:
        user = await get_current_user(request)
        default_owner = user["user_id"]
    except:
        # Fallback to first authorized user
        first_user = await db.users.find_one(
            {"email": {"$in": [u["email"].lower() for u in AUTHORIZED_USERS]}}, 
            {"_id": 0}
        )
        default_owner = first_user["user_id"] if first_user else "system"
    
    # Check if already seeded
    existing = await db.pipelines.find_one({}, {"_id": 0})
    if existing:
        return {"message": "Data already seeded"}
    
    # Create default pipeline
    pipeline = {
        "pipeline_id": "pipe_default",
        "name": "Consulting Sales Pipeline",
        "description": "Default sales pipeline for consulting engagements",
        "is_default": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.pipelines.insert_one(pipeline)
    
    # Create stages
    stages_data = [
        {"name": "Initial Conversation", "order": 1, "win_probability": 10, "auto_activity": None},
        {"name": "Discovery / Problem Framing", "order": 2, "win_probability": 20, "auto_activity": "Schedule discovery session"},
        {"name": "Value Hypothesis Defined", "order": 3, "win_probability": 40, "auto_activity": "Prepare value narrative"},
        {"name": "Solution Direction Aligned", "order": 4, "win_probability": 60, "auto_activity": "Draft solution approach"},
        {"name": "Commercials & Scope Discussion", "order": 5, "win_probability": 75, "auto_activity": "Draft SOW outline"},
        {"name": "SOW in Progress", "order": 6, "win_probability": 90, "auto_activity": "Finalize SOW terms"},
        {"name": "Closed – Won", "order": 7, "win_probability": 100, "auto_activity": None},
        {"name": "Closed – Lost", "order": 8, "win_probability": 0, "auto_activity": None},
    ]
    
    for s in stages_data:
        stage = {
            "stage_id": f"stage_{s['name'].lower().replace(' ', '_').replace('/', '_').replace('–', '')}",
            "pipeline_id": "pipe_default",
            "name": s["name"],
            "order": s["order"],
            "win_probability": s["win_probability"],
            "auto_activity": s["auto_activity"],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.stages.insert_one(stage)
    
    # Create sample organizations
    orgs_data = [
        {"org_id": "org_acme", "name": "Acme Financial Services", "industry": "Financial Services", "company_size": "Enterprise", "region": "North America", "strategic_tier": "Strategic"},
        {"org_id": "org_globex", "name": "Globex Manufacturing", "industry": "Manufacturing", "company_size": "Mid-Market", "region": "Europe", "strategic_tier": "Active"},
        {"org_id": "org_initech", "name": "Initech Healthcare", "industry": "Healthcare", "company_size": "Enterprise", "region": "North America", "strategic_tier": "Target"},
        {"org_id": "org_umbrella", "name": "Umbrella Retail Group", "industry": "Retail", "company_size": "Enterprise", "region": "APAC", "strategic_tier": "Strategic"},
        {"org_id": "org_wayne", "name": "Wayne Enterprises", "industry": "Technology", "company_size": "Enterprise", "region": "North America", "strategic_tier": "Active"},
    ]
    
    for org_data in orgs_data:
        org = {
            **org_data,
            "primary_exec_sponsor": None,
            "notes": None,
            "owner_id": default_owner,
            "created_by": default_owner,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.organizations.insert_one(org)
    
    # Create sample contacts
    contacts_data = [
        {"contact_id": "contact_1", "name": "Sarah Chen", "title": "Chief Data Officer", "function": "Data", "email": "schen@acme.com", "buying_role": "Decision Maker", "org_id": "org_acme"},
        {"contact_id": "contact_2", "name": "Michael Torres", "title": "VP of Engineering", "function": "IT", "email": "mtorres@acme.com", "buying_role": "Influencer", "org_id": "org_acme"},
        {"contact_id": "contact_3", "name": "Emily Watson", "title": "Director of AI Initiatives", "function": "AI", "email": "ewatson@globex.com", "buying_role": "Champion", "org_id": "org_globex"},
        {"contact_id": "contact_4", "name": "James Park", "title": "CTO", "function": "IT", "email": "jpark@initech.com", "buying_role": "Decision Maker", "org_id": "org_initech"},
        {"contact_id": "contact_5", "name": "Lisa Kumar", "title": "Head of Digital Transformation", "function": "Ops", "email": "lkumar@umbrella.com", "buying_role": "Champion", "org_id": "org_umbrella"},
    ]
    
    for contact_data in contacts_data:
        contact = {
            **contact_data,
            "phone": None,
            "notes": None,
            "owner_id": default_owner,
            "created_by": default_owner,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.contacts.insert_one(contact)
    
    # Create sample opportunities
    opps_data = [
        {
            "opp_id": "opp_1", "name": "Acme Data Platform Modernization", "org_id": "org_acme",
            "primary_contact_id": "contact_1", "engagement_type": "Data Modernization",
            "estimated_value": 450000, "confidence_level": 70,
            "stage_id": "stage_commercials__scope_discussion", "source": "Exec Intro",
            "value_hypothesis": "Modernize legacy data infrastructure to enable real-time analytics, reducing reporting time by 80% and enabling new revenue streams through data monetization."
        },
        {
            "opp_id": "opp_2", "name": "Globex AI-Powered Quality Control", "org_id": "org_globex",
            "primary_contact_id": "contact_3", "engagement_type": "AI Enablement",
            "estimated_value": 280000, "confidence_level": 50,
            "stage_id": "stage_value_hypothesis_defined", "source": "Inbound",
            "value_hypothesis": "Implement computer vision for defect detection, reducing quality control costs by 40% and improving defect detection rate to 99.5%."
        },
        {
            "opp_id": "opp_3", "name": "Initech Healthcare Analytics Strategy", "org_id": "org_initech",
            "primary_contact_id": "contact_4", "engagement_type": "Strategy",
            "estimated_value": 175000, "confidence_level": 30,
            "stage_id": "stage_discovery___problem_framing", "source": "Referral",
            "value_hypothesis": None
        },
        {
            "opp_id": "opp_4", "name": "Umbrella Retail Personalization Engine", "org_id": "org_umbrella",
            "primary_contact_id": "contact_5", "engagement_type": "AI Enablement",
            "estimated_value": 520000, "confidence_level": 85,
            "stage_id": "stage_sow_in_progress", "source": "Expansion",
            "value_hypothesis": "Build real-time personalization engine to increase conversion rates by 25% and average order value by 15%, generating estimated $12M additional annual revenue."
        },
        {
            "opp_id": "opp_5", "name": "Wayne Enterprise Architecture Review", "org_id": "org_wayne",
            "primary_contact_id": None, "engagement_type": "Platform / Architecture",
            "estimated_value": 95000, "confidence_level": 20,
            "stage_id": "stage_initial_conversation", "source": "Inbound",
            "value_hypothesis": None, "is_at_risk": True
        },
    ]
    
    for opp_data in opps_data:
        opp = {
            **opp_data,
            "owner_id": default_owner,
            "pipeline_id": "pipe_default",
            "target_close_date": (datetime.now(timezone.utc) + timedelta(days=60)).isoformat(),
            "notes": None,
            "is_at_risk": opp_data.get("is_at_risk", False),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "stage_entered_at": datetime.now(timezone.utc).isoformat()
        }
        await db.opportunities.insert_one(opp)
    
    # Create sample activities
    activities_data = [
        {"activity_id": "act_1", "activity_type": "Meeting", "opp_id": "opp_1", "due_date": (datetime.now(timezone.utc) + timedelta(days=2)).isoformat(), "status": "Planned", "notes": "SOW review meeting with legal"},
        {"activity_id": "act_2", "activity_type": "Call", "opp_id": "opp_2", "due_date": (datetime.now(timezone.utc) + timedelta(days=1)).isoformat(), "status": "Planned", "notes": "Follow up on value hypothesis feedback"},
        {"activity_id": "act_3", "activity_type": "Workshop", "opp_id": "opp_3", "due_date": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat(), "status": "Overdue", "notes": "Discovery workshop - needs rescheduling"},
        {"activity_id": "act_4", "activity_type": "Exec Readout", "opp_id": "opp_4", "due_date": (datetime.now(timezone.utc) + timedelta(days=5)).isoformat(), "status": "Planned", "notes": "Final presentation to CEO"},
        {"activity_id": "act_5", "activity_type": "Demo", "opp_id": "opp_2", "due_date": (datetime.now(timezone.utc) - timedelta(days=3)).isoformat(), "status": "Completed", "notes": "AI prototype demonstration - went well"},
    ]
    
    for act_data in activities_data:
        activity = {
            **act_data,
            "owner_id": default_owner,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.activities.insert_one(activity)
    
    return {"message": "Sample data seeded successfully", "owner_id": default_owner}

# ============== ANALYTICS ENDPOINTS ==============

@api_router.get("/analytics/pipeline")
async def get_pipeline_analytics(request: Request, owner_id: Optional[str] = None):
    """Pipeline value by stage"""
    user = await get_current_user(request)
    
    query = {} if not owner_id else {"owner_id": owner_id}
    opps = await db.opportunities.find(query, {"_id": 0}).to_list(2000)
    stages = await db.stages.find({}, {"_id": 0}).sort("order", 1).to_list(20)
    
    result = []
    for stage in stages:
        stage_opps = [o for o in opps if o.get("stage_id") == stage["stage_id"]]
        result.append({
            "stage": stage["name"],
            "stage_id": stage["stage_id"],
            "count": len(stage_opps),
            "value": sum(o.get("estimated_value", 0) for o in stage_opps),
            "weighted": sum(o.get("estimated_value", 0) * o.get("confidence_level", 0) / 100 for o in stage_opps)
        })
    
    return result

@api_router.get("/analytics/engagement-types")
async def get_engagement_analytics(request: Request, owner_id: Optional[str] = None):
    """Win rate by engagement type"""
    user = await get_current_user(request)
    
    query = {} if not owner_id else {"owner_id": owner_id}
    opps = await db.opportunities.find(query, {"_id": 0}).to_list(2000)
    
    by_type = {}
    for opp in opps:
        eng_type = opp.get("engagement_type", "Unknown")
        if eng_type not in by_type:
            by_type[eng_type] = {"total": 0, "won": 0, "value": 0}
        by_type[eng_type]["total"] += 1
        by_type[eng_type]["value"] += opp.get("estimated_value", 0)
        if "won" in opp.get("stage_id", "").lower():
            by_type[eng_type]["won"] += 1
    
    result = []
    for eng_type, data in by_type.items():
        result.append({
            "type": eng_type,
            "total": data["total"],
            "won": data["won"],
            "value": data["value"],
            "win_rate": round(data["won"] / max(data["total"], 1) * 100, 1)
        })
    
    return result

@api_router.get("/analytics/by-owner")
async def get_owner_analytics(request: Request):
    """Pipeline value by owner"""
    user = await get_current_user(request)
    
    opps = await db.opportunities.find({}, {"_id": 0}).to_list(2000)
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(100)
    
    # Create user lookup
    user_map = {u["user_id"]: u["name"] for u in users}
    
    by_owner = {}
    for opp in opps:
        owner_id = opp.get("owner_id", "unassigned")
        owner_name = user_map.get(owner_id, "Unknown")
        
        if owner_id not in by_owner:
            by_owner[owner_id] = {
                "owner_id": owner_id,
                "owner_name": owner_name,
                "total": 0,
                "won": 0,
                "lost": 0,
                "value": 0,
                "weighted": 0
            }
        
        by_owner[owner_id]["total"] += 1
        by_owner[owner_id]["value"] += opp.get("estimated_value", 0)
        by_owner[owner_id]["weighted"] += opp.get("estimated_value", 0) * opp.get("confidence_level", 0) / 100
        
        if "won" in opp.get("stage_id", "").lower():
            by_owner[owner_id]["won"] += 1
        elif "lost" in opp.get("stage_id", "").lower():
            by_owner[owner_id]["lost"] += 1
    
    result = []
    for owner_id, data in by_owner.items():
        completed = data["won"] + data["lost"]
        result.append({
            **data,
            "win_rate": round(data["won"] / max(completed, 1) * 100, 1)
        })
    
    # Sort by value descending
    result.sort(key=lambda x: x["value"], reverse=True)
    return result

@api_router.get("/reports/summary")
async def get_reports_summary(request: Request, owner_id: Optional[str] = None):
    """Dashboard reports summary - Won vs Lost, Active, Pipeline counts and values"""
    user = await get_current_user(request)
    
    query = {} if not owner_id else {"owner_id": owner_id}
    opps = await db.opportunities.find(query, {"_id": 0}).to_list(2000)
    
    # Categorize opportunities
    won_opps = [o for o in opps if "won" in o.get("stage_id", "").lower()]
    lost_opps = [o for o in opps if "lost" in o.get("stage_id", "").lower()]
    pipeline_opps = [o for o in opps if "won" not in o.get("stage_id", "").lower() and "lost" not in o.get("stage_id", "").lower()]
    
    # Calculate values
    won_value = sum(o.get("estimated_value", 0) or 0 for o in won_opps)
    lost_value = sum(o.get("estimated_value", 0) or 0 for o in lost_opps)
    pipeline_value = sum(o.get("estimated_value", 0) or 0 for o in pipeline_opps)
    total_value = sum(o.get("estimated_value", 0) or 0 for o in opps)
    
    return {
        "won": {
            "count": len(won_opps),
            "value": won_value
        },
        "lost": {
            "count": len(lost_opps),
            "value": lost_value
        },
        "active": {
            "count": len(won_opps),  # Active = Closed Won
            "value": won_value
        },
        "pipeline": {
            "count": len(pipeline_opps),
            "value": pipeline_value
        },
        "total": {
            "count": len(opps),
            "value": total_value
        }
    }

@api_router.get("/analytics/summary")
async def get_analytics_summary(request: Request, owner_id: Optional[str] = None):
    """Overall analytics summary"""
    user = await get_current_user(request)
    
    query = {} if not owner_id else {"owner_id": owner_id}
    opps = await db.opportunities.find(query, {"_id": 0}).to_list(2000)
    
    # For activities, filter by opp_ids if owner filter applied
    if owner_id:
        opp_ids = [o["opp_id"] for o in opps]
        activities = await db.activities.find({"opp_id": {"$in": opp_ids}}, {"_id": 0}).to_list(5000)
    else:
        activities = await db.activities.find({}, {"_id": 0}).to_list(5000)
    
    # Calculate summary metrics
    total_value = sum(opp.get("estimated_value", 0) for opp in opps)
    weighted_value = sum(opp.get("estimated_value", 0) * opp.get("confidence_level", 0) / 100 for opp in opps)
    
    won_opps = [o for o in opps if "won" in o.get("stage_id", "").lower()]
    lost_opps = [o for o in opps if "lost" in o.get("stage_id", "").lower()]
    active_opps = [o for o in opps if "won" not in o.get("stage_id", "").lower() and "lost" not in o.get("stage_id", "").lower()]
    at_risk_opps = [o for o in active_opps if o.get("is_at_risk")]
    
    # Activities metrics
    now = datetime.now(timezone.utc)
    completed_activities = [a for a in activities if a.get("status") == "Completed"]
    overdue_activities = [
        a for a in activities
        if a.get("status") == "Planned" and parse_datetime(a.get("due_date", "2099-01-01")) < now
    ]
    
    # Win rate
    completed_deals = len(won_opps) + len(lost_opps)
    win_rate = round(len(won_opps) / max(completed_deals, 1) * 100, 1)
    
    return {
        "total_deals": len(opps),
        "active_deals": len(active_opps),
        "won_deals": len(won_opps),
        "lost_deals": len(lost_opps),
        "at_risk_deals": len(at_risk_opps),
        "total_pipeline_value": total_value,
        "weighted_forecast": weighted_value,
        "won_value": sum(o.get("estimated_value", 0) for o in won_opps),
        "average_deal_size": total_value / max(len(opps), 1),
        "win_rate": win_rate,
        "total_activities": len(activities),
        "completed_activities": len(completed_activities),
        "overdue_activities": len(overdue_activities)
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
