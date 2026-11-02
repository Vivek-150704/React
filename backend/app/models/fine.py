from sqlalchemy import Column
from sqlalchemy import DateTime
from sqlalchemy import Integer
from sqlalchemy import Numeric
from sqlalchemy import String
from sqlalchemy import NVARCHAR

from app.core.database import Base


class Fine(Base):
    __tablename__ = "mars_fines"

    fine_id = Column(String(50), primary_key=True)

    customer_id = Column(String(50))

    customer_name = Column(NVARCHAR(250))

    order_reference = Column(String(100))

    fine_date = Column(DateTime)

    fine_amount = Column(Numeric(18, 2))

    currency_code = Column(String(10))

    status = Column(String(50))

    reason_category = Column(NVARCHAR(200))

    reason_description = Column(NVARCHAR)

    source_area = Column(NVARCHAR(100))

    expected_delivery_date = Column(DateTime)

    actual_delivery_date = Column(DateTime)

    ordered_quantity = Column(Integer)

    delivered_quantity = Column(Integer)

    source_system_reference = Column(String(100))

    created_at = Column(DateTime)

    updated_at = Column(DateTime)