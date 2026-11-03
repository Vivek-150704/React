from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.auth import router as auth_router
from app.routers.dashboard import router as dashboard_router
from app.routers.fines import router as fines_router
from app.routers.users import router as users_router

app = FastAPI(
    title="MARS Fines & Fees API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(dashboard_router)
app.include_router(fines_router)
app.include_router(users_router)


@app.get("/")
def root():
    return {
        "message": "MARS API Running"
    }