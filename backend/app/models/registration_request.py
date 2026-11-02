from sqlalchemy import Column, Integer, DateTime
from sqlalchemy import NVARCHAR

from app.core.database import Base


class RegistrationRequest(Base):
    __tablename__ = "mars_registration_requests"

    request_id = Column(Integer, primary_key=True, index=True)

    full_name = Column(NVARCHAR(200), nullable=False)

    email = Column(NVARCHAR(255), nullable=False)

    password_hash = Column(NVARCHAR(500), nullable=False)

    requested_role = Column(NVARCHAR(50), nullable=False)

    status = Column(NVARCHAR(50), nullable=False)

    rejection_reason = Column(NVARCHAR(1000))

    created_at = Column(DateTime)

    reviewed_at = Column(DateTime)