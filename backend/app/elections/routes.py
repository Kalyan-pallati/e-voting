from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from bson import ObjectId
import time

# Database Imports
from app.database.mongodb import users_collection, db
from app.core.security import verify_password, create_access_token, hash_password
from app.auth.dependencies import get_current_user, require_admin

router = APIRouter()

# Collections
candidates_collection = db["candidates"]
elections_collection = db["elections"]
politicians_collection = db["politicians"] # <--- The Global Bank

# ==========================================
#              PYDANTIC MODELS
# ==========================================

# --- Auth Models ---
class Register(BaseModel):
    email: EmailStr
    password: str
    role: str

class Login(BaseModel):
    email: EmailStr
    password: str

# --- Election & Candidate Models ---
class CandidateCreate(BaseModel):
    name: str
    party: str
    candidate_id: int  # Blockchain ID

class ElectionCreate(BaseModel):
    title: str
    description: str
    start_time: float  # Unix timestamp
    end_time: float    # Unix timestamp
    blockchain_id: int # Link to Blockchain ID

class PoliticianCreate(BaseModel):
    name: str
    party: str
    image_url: str = ""

# ==========================================
#            HELPER FUNCTIONS
# ==========================================

def get_election_status(start, end):
    now = time.time()
    if now < start:
        return "draft"     # Waiting to start (Editable)
    elif start <= now <= end:
        return "active"    # Currently voting (Live)
    else:
        return "closed"    # Finished (ReadOnly)

# ==========================================
#            AUTHENTICATION ROUTES
# ==========================================

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(user: Register):
    if user.role not in ["admin", "voter"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    if users_collection.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already exists")

    hashed_pwd = hash_password(user.password)

    users_collection.insert_one({
        "email": user.email,
        "password": hashed_pwd,
        "role": user.role,
        "created_at": time.time()
    })

    return {"message": "User registered successfully"}

@router.post("/login")
def login(user: Login):
    db_user = users_collection.find_one({"email": user.email})

    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_access_token({
        "user_id": str(db_user["_id"]),
        "email": db_user["email"],
        "role": db_user["role"]
    })
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": db_user["role"]
    }

@router.get("/me")
def read_current_user(current_user = Depends(get_current_user)):
    return current_user

# ==========================================
#        GLOBAL POLITICIAN BANK (NEW)
# ==========================================

@router.get("/admin/politicians")
def list_global_politicians(admin=Depends(require_admin)):
    """
    Returns the global list of all politicians ever created.
    Used by the frontend to populate the 'Select Existing' dropdown.
    """
    people = []
    for p in politicians_collection.find():
        people.append({
            "id": str(p["_id"]),
            "name": p["name"],
            "party": p["party"]
        })
    return people

@router.post("/admin/politicians", status_code=status.HTTP_201_CREATED)
def create_global_politician(data: PoliticianCreate, admin=Depends(require_admin)):
    """
    Creates a politician in the Global Bank INDEPENDENTLY.
    They are not linked to any election yet.
    """
    # Check if they already exist
    if politicians_collection.find_one({"name": data.name, "party": data.party}):
        raise HTTPException(400, "Politician already exists in the bank")

    politician = {
        "name": data.name,
        "party": data.party,
        "image_url": data.image_url,
        "created_at": time.time()
    }
    
    result = politicians_collection.insert_one(politician)
    return {"id": str(result.inserted_id), "message": "Politician added to Global Bank"}

# ==========================================
#             ELECTION ROUTES
# ==========================================

@router.get("/admin/elections")
def list_all_elections(admin=Depends(require_admin)):
    elections = []
    for e in elections_collection.find():
        # Calculate status dynamically based on current time
        status = get_election_status(e["start_time"], e["end_time"])
        
        elections.append({
            "id": str(e["_id"]),
            "blockchain_id": e.get("blockchain_id"),
            "title": e["title"],
            "description": e.get("description", ""),
            "start_time": e["start_time"],
            "end_time": e["end_time"],
            "status": status, 
        })
    return elections

@router.get("/elections-details")
def list_active_elections(user=Depends(get_current_user)):
    now = time.time()
    elections = []
    
    # Filter for elections that are currently happening (Active by time)
    for e in elections_collection.find({
        "start_time": {"$lte": now}, 
        "end_time": {"$gte": now},
    }):
        elections.append({
            "id": str(e["_id"]),
            "blockchain_id": e.get("blockchain_id"),
            "title": e["title"],
            "description": e.get("description", ""),
            "start_time": e["start_time"],
            "end_time": e["end_time"],
            "status": "active"
        })

    return elections

@router.post("/elections", status_code=status.HTTP_201_CREATED)
def create_election(
    data: ElectionCreate,
    admin=Depends(require_admin),
):
    if data.end_time <= data.start_time:
        raise HTTPException(
            status_code=400,
            detail="End time must be after start time",
        )

    election = {
        "title": data.title,
        "description": data.description,
        "start_time": data.start_time,
        "end_time": data.end_time,
        "blockchain_id": data.blockchain_id,
        "created_by": ObjectId(admin["user_id"]),
        "created_at": time.time(),
    }

    result = elections_collection.insert_one(election)

    return {"id": str(result.inserted_id)}

# ==========================================
#            CANDIDATE ROUTES
# ==========================================

@router.post("/elections/{election_id}/candidates", status_code=status.HTTP_201_CREATED)
def add_candidate(
    election_id: str,
    data: CandidateCreate,
    admin=Depends(require_admin),
):
    election = elections_collection.find_one({"_id": ObjectId(election_id)})
    if not election:
        raise HTTPException(404, "Election not found")

    # 1. Add Candidate to this specific election
    candidate = {
        "election_id": ObjectId(election_id),
        "name": data.name,
        "party": data.party,
        "candidate_id": data.candidate_id, 
        "created_at": time.time(),
    }
    result = candidates_collection.insert_one(candidate)

    # 2. AUTO-SAVE to Global Bank (The Magic Step)
    # Check if this person exists globally. If not, add them.
    existing_politician = politicians_collection.find_one({
        "name": data.name, 
        "party": data.party
    })
    
    if not existing_politician:
        politicians_collection.insert_one({
            "name": data.name,
            "party": data.party,
            "created_at": time.time()
        })

    return {"id": str(result.inserted_id)}

@router.get("/elections/{election_id}/candidates")
def list_candidates(
    election_id: str,
    user=Depends(get_current_user),
):
    if not elections_collection.find_one({"_id": ObjectId(election_id)}):
        raise HTTPException(404, "Election not found")

    candidates = []
    for c in candidates_collection.find({"election_id": ObjectId(election_id)}):
        candidates.append({
            "id": str(c["_id"]),
            "candidate_id": c.get("candidate_id"),
            "name": c["name"],
            "party": c["party"],
        })

    return candidates