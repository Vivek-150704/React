from fastapi import APIRouter
from fastapi import Depends
from app.models.user import User
from app.schemas.auth import DecisionRequest
from sqlalchemy.orm import Session
from app.core.security import get_current_user, require_roles
from app.core.database import get_db
from app.schemas.auth import RegisterRequest

from fastapi import HTTPException

from app.core.security import hash_password
from app.services.auth_service import (
    create_registration,
    get_registration_by_email,
)


from app.schemas.auth import LoginRequest

from app.services.user_service import (
    get_user_by_email
)

from app.core.security import (
    verify_password,
    create_access_token
)

from app.models.registration_request import RegistrationRequest


router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)


@router.get("/test")
def test_auth():
    return {
        "message": "Auth Router Working"
    }


@router.post("/register")
def register(
    request: RegisterRequest,
    db: Session = Depends(get_db)
):

    existing = get_registration_by_email(
        db,
        request.email.lower()
    )

    if existing:
        raise HTTPException(
            status_code=409,
            detail="account-exists"
        )

    registration = create_registration(
        db=db,
        full_name=request.fullName,
        email=request.email.lower(),
        password_hash=hash_password(
            request.password
        ),
        requested_role=request.requestedRole,
    )

    return {
        "requestId":
            registration.request_id,
        "status":
            registration.status
    }

@router.post("/login")
def login(
    request: LoginRequest,
    db: Session = Depends(get_db)
):

    user = get_user_by_email(
        db,
        request.email.lower()
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="invalid-credentials"
        )

    if not verify_password(
        request.password,
        user.password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="invalid-credentials"
        )

    token = create_access_token(
        user.user_id,
        user.email,
        user.role
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.user_id,
            "fullName": user.full_name,
            "email": user.email,
            "role": user.role
        }
    }

@router.get("/requests")
def get_requests(
    current_user: User = Depends(require_roles('Admin')),
    db: Session = Depends(get_db)
):
    registrations = db.query(RegistrationRequest).order_by(RegistrationRequest.created_at.desc()).all()
    return [
        {
            "id": item.request_id,
            "fullName": item.full_name,
            "email": item.email,
            "requestedRole": item.requested_role,
            "assignedRole": item.requested_role if item.status == "Approved" else None,
            "registeredAt": item.created_at.isoformat() if item.created_at else None,
            "status": "Pending Approval" if item.status == "Pending" else item.status,
        }
        for item in registrations
    ]

@router.patch("/requests/{request_id}")
def approve_request(
    request_id: int,
    request: DecisionRequest,
    current_user: User = Depends(require_roles('Admin')),
    db: Session = Depends(get_db)
):
    registration = (
        db.query(RegistrationRequest)
        .filter(
            RegistrationRequest.request_id == request_id
        )
        .first()
    )

    if not registration:
        raise HTTPException(
            status_code=404,
            detail="request-not-found"
        )

    if request.decision == "approve":
        if request.assignedRole not in {"Super User", "Viewer"}:
            raise HTTPException(status_code=400, detail="invalid-role")

        user = User(
            full_name=registration.full_name,
            email=registration.email,
            password_hash=registration.password_hash,
            role=request.assignedRole,
            status="Approved"
        )

        db.add(user)

        registration.status = "Approved"

        db.commit()

        return {
            "message": "Approved"
        }

    if request.decision != "reject":
        raise HTTPException(status_code=400, detail="invalid-decision")

    registration.status = "Rejected"

    registration.rejection_reason = request.reason

    db.commit()

    return {
        "message": "Rejected"
    }

@router.get("/me")
def me(
    current_user: User = Depends(
        get_current_user
    )
):
    return {
        "id": current_user.user_id,
        "fullName": current_user.full_name,
        "email": current_user.email,
        "role": current_user.role
    }