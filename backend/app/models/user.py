from sqlalchemy import Column
from sqlalchemy import DateTime
from sqlalchemy import Integer
from sqlalchemy import NVARCHAR

from app.core.database import Base


class User(Base):
    __tablename__ = "mars_users"

    user_id = Column(Integer, primary_key=True, index=True)

    full_name = Column(NVARCHAR(200), nullable=False)

    email = Column(NVARCHAR(255), unique=True, nullable=False)

    password_hash = Column(NVARCHAR(500), nullable=False)

    role = Column(NVARCHAR(50), nullable=False)

    status = Column(NVARCHAR(50), nullable=False)

    created_at = Column(DateTime)

    updated_at = Column(DateTime)