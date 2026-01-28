from app.database.mongodb import users_collection
from app.core.security import verify_password, create_access_token, hash_password
from app.auth.dependencies import get_current_user, require_admin
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
import time

router = APIRouter()

class Register(BaseModel):
    email: EmailStr
    password: str
    role: str

class Login(BaseModel):
    email: EmailStr
    password: str

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