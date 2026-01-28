from fastapi import FastAPI
from app.auth.routes import router as auth_router
from app.elections.routes import router as elections_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="E-voting System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])

app.include_router(elections_router, tags=["Elections"])

@app.get("/")
def home():
    return {"message": "Welcome to the E-voting System API"}