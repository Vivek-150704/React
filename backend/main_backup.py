
import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Literal

import jwt
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, EmailStr, Field
from pwdlib import PasswordHash

load_dotenv()

# --------------------------------------------------
# APPLICATION CONFIGURATION
# --------------------------------------------------

app = FastAPI(
    title="MARS Fines & Fees Management API",
    version="1.0.0",
    description="Backend APIs for MARS Fines & Fees Management",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8443",
        "http://127.0.0.1:8443",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()
password_hash = PasswordHash.recommended()

JWT_SECRET = os.getenv("JWT_SECRET")

if not JWT_SECRET:
    JWT_SECRET = secrets.token_urlsafe(48)
    print("WARNING: Temporary JWT secret generated.")

JWT_ALGORITHM = "HS256"

# --------------------------------------------------
# TEMPORARY IN-MEMORY STORAGE
# --------------------------------------------------

users = {}
registrations = {}
fines = {}
review_history = {}


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def clean_email(email):
    return email.strip().lower()


# --------------------------------------------------
# DEMO USERS
# --------------------------------------------------

def seed_user(user_id, name, email, password, role):
    users[email] = {
        "id": user_id,
        "fullName": name,
        "email": email,
        "passwordHash": password_hash.hash(password),
        "role": role,
        "status": "Approved",
    }


seed_user(
    "demo-admin",
    "Morgan Lee",
    "admin@mars.demo",
    "Admin123!",
    "Admin",
)

seed_user(
    "demo-super",
    "Alex Morgan",
    "reviewer@mars.demo",
    "Review123!",
    "Super User",
)

seed_user(
    "demo-viewer",
    "Taylor Reed",
    "viewer@mars.demo",
    "Viewer123!",
    "Viewer",
)


def public_user(user):
    return {
        "id": user["id"],
        "fullName": user["fullName"],
        "email": user["email"],
        "role": user["role"],
    }


def public_registration(registration):
    return {
        key: value
        for key, value in registration.items()
        if key != "passwordHash"
    }


# --------------------------------------------------
# CUSTOMER AND FINE DATA
# --------------------------------------------------

customers = [
    ("CUS-1042", "Northstar Retail"),
    ("CUS-1128", "Metro Market Group"),
    ("CUS-1195", "Continental Foods"),
    ("CUS-1251", "Harbor Wholesale"),
    ("CUS-1310", "Summit Stores"),
    ("CUS-1384", "Pioneer Distribution"),
    ("CUS-1422", "Oakline Grocers"),
    ("CUS-1508", "Central Commerce"),
]

reasons = [
    "Late delivery",
    "Incorrect quantity",
    "Short or over shipment",
    "Damaged goods",
    "Failure to meet agreed conditions",
    "Documentation issue",
    "Other",
]

comments = [
    "Delivery records support the customer classification.",
    "Quantity confirmed against signed receiving documentation.",
    "Supporting documents do not substantiate the fine.",
    "Reviewed against the order and delivery confirmation.",
]

reviewers = [
    "Jordan Lee",
    "Morgan Patel",
    "Casey Reed",
]


def generate_demo_data():
    today = datetime.now(timezone.utc)

    for i in range(216):
        customer_id, customer_name = customers[
            i % len(customers)
        ]

        reason = reasons[
            (i * 5 + (i // 7)) % len(reasons)
        ]

        if i % 6 == 0 or i % 11 == 0:
            status = "Pending"
        elif i % 3 == 0:
            status = "Invalid"
        else:
            status = "Valid"

        fine_date = today - timedelta(
            days=((i * 11 + (i % 9) * 3) % 355)
        )

        fine_date_iso = fine_date.isoformat()

        amount = round(
            (
                180
                + ((i * 317) % 11700)
                + (i % 5) * 0.37
            ) * 100
        ) / 100

        updated = fine_date + timedelta(
            days=1 if status == "Pending"
            else 4 + (i % 12)
        )

        reviewer = reviewers[i % len(reviewers)]
        comment = comments[i % len(comments)]

        fine_id = f"FIN-{240001 + i:06d}"

        ordered_quantity = 100 + (i % 15) * 20

        if "quantity" in reason or "shipment" in reason:
            delivered_quantity = (
                90 + (i % 15) * 20
            )
        else:
            delivered_quantity = ordered_quantity

        record = {
            "fineId": fine_id,
            "customerId": customer_id,
            "customerName": customer_name,
            "orderReference": (
                f"ORD-{780000 + i * 13:07d}"
            ),
            "fineDate": fine_date_iso,
            "fineAmount": amount,
            "currencyCode": "USD",
            "status": status,
            "reasonCategory": reason,
            "reasonDescription": (
                f"{reason} recorded against the supplied "
                "order documentation."
            ),
            "sourceArea": [
                "Logistics",
                "Warehouse",
                "Manufacturing",
            ][i % 3],
            "createdAt": fine_date_iso,
            "updatedAt": updated.isoformat(),
            "expectedDeliveryDate": (
                fine_date - timedelta(days=2)
            ).isoformat(),
            "actualDeliveryDate": (
                fine_date
                if reason == "Late delivery"
                else fine_date - timedelta(days=1)
            ).isoformat(),
            "orderedQuantity": ordered_quantity,
            "deliveredQuantity": delivered_quantity,
            "sourceSystemReference": f"SRC-{9000 + i}",
        }

        if status != "Pending":
            record["lastReviewedAt"] = updated.isoformat()
            record["lastReviewerName"] = reviewer
            record["lastReviewComment"] = comment

            review_history.setdefault(fine_id, []).append({
                "reviewId": f"REV-{i + 1}",
                "fineId": fine_id,
                "oldStatus": "Pending",
                "newStatus": status,
                "reviewerId": f"demo-{(i % 3) + 1}",
                "reviewerName": reviewer,
                "comment": comment,
                "reviewedAt": updated.isoformat(),
            })

        fines[fine_id] = record


generate_demo_data()


# --------------------------------------------------
# REQUEST MODELS
# --------------------------------------------------

Role = Literal["Admin", "Super User", "Viewer"]


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    requestedRole: Role


class RegisterRequest(BaseModel):
    fullName: str = Field(min_length=2, max_length=150)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    requestedRole: Literal["Super User", "Viewer"]


class DecisionRequest(BaseModel):
    decision: Literal["approve", "reject"]
    assignedRole: Role | None = None
    reason: str | None = None


class ReviewRequest(BaseModel):
    expectedStatus: Literal["Pending", "Valid", "Invalid"]
    decision: Literal["Pending", "Valid", "Invalid"]
    comment: str = Field(min_length=1, max_length=2000)


# --------------------------------------------------
# AUTHENTICATION
# --------------------------------------------------

def create_token(user):
    expiry = datetime.now(timezone.utc) + timedelta(hours=1)

    return jwt.encode(
        {
            "sub": user["id"],
            "exp": expiry,
        },
        JWT_SECRET,
        algorithm=JWT_ALGORITHM,
    )


def current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    try:
        payload = jwt.decode(
            credentials.credentials,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM],
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=401,
            detail="invalid-token",
        )

    user_id = payload.get("sub")

    user = next(
        (
            account
            for account in users.values()
            if account["id"] == user_id
        ),
        None,
    )

    if not user or user["status"] != "Approved":
        raise HTTPException(
            status_code=401,
            detail="account-unavailable",
        )

    return user


def require_roles(*allowed_roles):
    def check(user=Depends(current_user)):
        if user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail="forbidden",
            )
        return user

    return check


# --------------------------------------------------
# HEALTH APIs
# --------------------------------------------------

@app.get("/")
def root():
    return {
        "message": "MARS Fines & Fees API is running",
        "docs": "/docs",
    }


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/health/database")
def database_health():
    return {
        "status": "not-configured",
        "storage": "temporary in-memory",
    }


# --------------------------------------------------
# LOGIN API
# --------------------------------------------------

@app.post("/api/auth/login")
def login(request: LoginRequest):
    email = clean_email(request.email)
    user = users.get(email)

    if not user:
        registration = registrations.get(email)

        if registration:
            if not password_hash.verify(
                request.password,
                registration["passwordHash"],
            ):
                raise HTTPException(
                    status_code=401,
                    detail="invalid-credentials",
                )

            if registration["status"] == "Pending Approval":
                raise HTTPException(
                    status_code=403,
                    detail="pending",
                )

            if registration["status"] == "Rejected":
                raise HTTPException(
                    status_code=403,
                    detail="rejected",
                )

        raise HTTPException(
            status_code=401,
            detail="invalid-credentials",
        )

    if not password_hash.verify(
        request.password,
        user["passwordHash"],
    ):
        raise HTTPException(
            status_code=401,
            detail="invalid-credentials",
        )

    if user["status"] != "Approved":
        raise HTTPException(
            status_code=403,
            detail="pending",
        )

    if user["role"] != request.requestedRole:
        raise HTTPException(
            status_code=403,
            detail="wrong-role",
        )

    return {
        "access_token": create_token(user),
        "token_type": "bearer",
        "user": public_user(user),
    }


# --------------------------------------------------
# REGISTRATION API
# --------------------------------------------------

@app.post("/api/auth/register", status_code=201)
def register(request: RegisterRequest):
    email = clean_email(request.email)

    if email in users or email in registrations:
        raise HTTPException(
            status_code=409,
            detail="account-exists",
        )

    registration_id = (
        "REG-" + secrets.token_hex(5).upper()
    )

    registration = {
        "id": registration_id,
        "fullName": request.fullName.strip(),
        "email": email,
        "passwordHash": password_hash.hash(request.password),
        "requestedRole": request.requestedRole,
        "status": "Pending Approval",
        "registeredAt": now_iso(),
        "reason": None,
    }

    registrations[email] = registration

    return public_registration(registration)


# --------------------------------------------------
# CURRENT USER API
# --------------------------------------------------

@app.get("/api/auth/me")
def get_me(user=Depends(current_user)):
    return public_user(user)


# --------------------------------------------------
# ADMIN USER APPROVAL APIs
# --------------------------------------------------

@app.get("/api/auth/requests")
def get_requests(
    admin=Depends(require_roles("Admin")),
):
    return [
        public_registration(registration)
        for registration in registrations.values()
    ]


@app.patch("/api/auth/requests/{request_id}")
def decide_request(
    request_id: str,
    request: DecisionRequest,
    admin=Depends(require_roles("Admin")),
):
    registration = next(
        (
            r
            for r in registrations.values()
            if r["id"] == request_id
        ),
        None,
    )

    if not registration:
        raise HTTPException(
            status_code=404,
            detail="request-not-found",
        )

    if registration["status"] != "Pending Approval":
        raise HTTPException(
            status_code=409,
            detail="already-decided",
        )

    if request.decision == "approve":
        assigned_role = (
            request.assignedRole
            or registration["requestedRole"]
        )

        if assigned_role not in ("Super User", "Viewer"):
            raise HTTPException(
                status_code=400,
                detail="invalid-role",
            )

        users[registration["email"]] = {
            "id": registration["id"],
            "fullName": registration["fullName"],
            "email": registration["email"],
            "passwordHash": registration["passwordHash"],
            "role": assigned_role,
            "status": "Approved",
        }

        registration["status"] = "Approved"
        registration["assignedRole"] = assigned_role

    else:
        registration["status"] = "Rejected"

    registration["reason"] = request.reason

    return public_registration(registration)


# --------------------------------------------------
# FINES APIs
# --------------------------------------------------

@app.get("/api/fines")
def list_fines(user=Depends(current_user)):
    return list(fines.values())


@app.get("/api/fines/{fine_id}")
def get_fine(
    fine_id: str,
    user=Depends(current_user),
):
    fine = fines.get(fine_id)

    if not fine:
        raise HTTPException(
            status_code=404,
            detail="not-found",
        )

    return fine


# --------------------------------------------------
# FINE REVIEW HISTORY API
# --------------------------------------------------

@app.get("/api/fines/{fine_id}/reviews")
def get_reviews(
    fine_id: str,
    user=Depends(current_user),
):
    if fine_id not in fines:
        raise HTTPException(
            status_code=404,
            detail="not-found",
        )

    return review_history.get(fine_id, [])


# --------------------------------------------------
# FINE REVIEW / DECISION API
# --------------------------------------------------

@app.post("/api/fines/{fine_id}/reviews")
def review_fine(
    fine_id: str,
    request: ReviewRequest,
    user=Depends(require_roles("Admin", "Super User")),
):
    fine = fines.get(fine_id)

    if not fine:
        raise HTTPException(
            status_code=404,
            detail="not-found",
        )

    if fine["status"] != request.expectedStatus:
        raise HTTPException(
            status_code=409,
            detail="conflict",
        )

    if not request.comment.strip():
        raise HTTPException(
            status_code=400,
            detail="comment-required",
        )

    previous_status = fine["status"]
    timestamp = now_iso()

    fine["status"] = request.decision
    fine["updatedAt"] = timestamp
    fine["lastReviewedAt"] = timestamp
    fine["lastReviewerName"] = user["fullName"]
    fine["lastReviewComment"] = request.comment.strip()

    review = {
        "reviewId": "REV-" + secrets.token_hex(5).upper(),
        "fineId": fine_id,
        "oldStatus": previous_status,
        "newStatus": request.decision,
        "reviewerId": user["id"],
        "reviewerName": user["fullName"],
        "comment": request.comment.strip(),
        "reviewedAt": timestamp,
    }

    review_history.setdefault(fine_id, []).insert(0, review)

    return fine
