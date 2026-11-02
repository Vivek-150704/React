from pydantic import BaseModel, EmailStr
from typing import Optional

class RegisterRequest(BaseModel):
    fullName: str
    email: EmailStr
    password: str
    requestedRole: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class DecisionRequest(BaseModel):
    decision: str
    assignedRole: Optional[str] = None
    reason: Optional[str] = None

