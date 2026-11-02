from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import DateTime
from sqlalchemy import String
from sqlalchemy import NVARCHAR

from app.core.database import Base


class FineReview(Base):
    __tablename__ = "mars_fine_reviews"

    review_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    fine_id = Column(String(50))

    old_status = Column(String(50))

    new_status = Column(String(50))

    reviewer_user_id = Column(Integer)

    reviewer_name = Column(NVARCHAR(100))

    comment = Column(NVARCHAR)

    reviewed_at = Column(DateTime)