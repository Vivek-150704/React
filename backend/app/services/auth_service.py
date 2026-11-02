from sqlalchemy.orm import Session

from app.models.registration_request import (
    RegistrationRequest,
)


def get_registration_by_email(
    db: Session,
    email: str,
):
    return (
        db.query(RegistrationRequest)
        .filter(
            RegistrationRequest.email == email
        )
        .first()
    )


def create_registration(
    db: Session,
    full_name,
    email,
    password_hash,
    requested_role,
):
    request = RegistrationRequest(
        full_name=full_name,
        email=email,
        password_hash=password_hash,
        requested_role=requested_role,
        status="Pending"
    )

    db.add(request)
    db.commit()
    db.refresh(request)

    return request