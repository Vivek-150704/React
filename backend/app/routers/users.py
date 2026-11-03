from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import hash_password, require_roles
from app.models.user import User

router = APIRouter(prefix="/api/users", tags=["User Management"])


class UserRoleUpdateRequest(BaseModel):
    role: str = Field(pattern="^(Viewer|Super User|Admin)$")


class AdminCreateRequest(BaseModel):
    fullName: str = Field(min_length=2, max_length=200)
    email: EmailStr
    password: str = Field(min_length=12, max_length=128)


@router.get("")
def list_users(current_user: User = Depends(require_roles("Admin")), db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [{"id": u.user_id, "fullName": u.full_name, "email": u.email, "role": u.role, "status": u.status, "createdAt": u.created_at.isoformat() if u.created_at else None} for u in users]


@router.post("/admins", status_code=201)
def create_admin(request: AdminCreateRequest, current_user: User = Depends(require_roles("Admin")), db: Session = Depends(get_db)):
    email = str(request.email).strip().lower()
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=409, detail="email-already-exists")
    admin = User(full_name=request.fullName.strip(), email=email, password_hash=hash_password(request.password), role="Admin", status="Approved")
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return {"id": admin.user_id, "fullName": admin.full_name, "email": admin.email, "role": admin.role, "status": admin.status}


@router.patch("/{user_id}/role")
def update_user_role(
    user_id: int,
    request: UserRoleUpdateRequest,
    current_user: User = Depends(require_roles("Admin")),
    db: Session = Depends(get_db),
):
    if user_id == current_user.user_id:
        raise HTTPException(status_code=400, detail="cannot-change-own-role")
    target = db.query(User).filter(User.user_id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="user-not-found")
    if target.role == "Admin" and request.role != "Admin":
        active_admins = db.query(User).filter(User.role == "Admin", User.status == "Approved").count()
        if active_admins <= 1:
            raise HTTPException(status_code=409, detail="cannot-demote-last-admin")
    target.role = request.role
    db.commit()
    db.refresh(target)
    return {"id": target.user_id, "fullName": target.full_name, "email": target.email, "role": target.role, "status": target.status}


@router.delete("/{user_id}")
def delete_user(user_id: int, current_user: User = Depends(require_roles("Admin")), db: Session = Depends(get_db)):
    if user_id == current_user.user_id:
        raise HTTPException(status_code=400, detail="cannot-delete-own-account")
    target = db.query(User).filter(User.user_id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="user-not-found")
    if target.role == "Admin":
        count = db.query(User).filter(User.role == "Admin", User.status == "Approved").count()
        if count <= 1:
            raise HTTPException(status_code=409, detail="cannot-delete-last-admin")
    db.delete(target)
    db.commit()
    return {"message": "User deleted"}
