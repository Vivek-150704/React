from datetime import datetime, timedelta
from random import choice, randint, uniform

from app.core.database import SessionLocal
from app.models.fine import Fine

db = SessionLocal()

statuses = ["Valid", "Invalid", "Pending"]

reasons = [
    "Late delivery",
    "Incorrect quantity",
    "Short or over shipment",
    "Damaged goods",
    "Documentation issue",
]

for i in range(250):

    fine = Fine(
        fine_id=f"FIN-{240001 + i}",
        customer_id=f"CUS-{1000 + (i % 20)}",
        customer_name=f"Customer {i % 20}",
        order_reference=f"ORD-{700000 + i}",
        fine_date=datetime.now() - timedelta(days=randint(1, 365)),
        fine_amount=round(uniform(100, 10000), 2),
        currency_code="USD",
        status=choice(statuses),
        reason_category=choice(reasons),
        reason_description="Seeded demo data",
        source_area="Logistics",
        expected_delivery_date=datetime.now(),
        actual_delivery_date=datetime.now(),
        ordered_quantity=100,
        delivered_quantity=95,
        source_system_reference=f"SRC-{9000 + i}",
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )

    db.add(fine)

db.commit()

print("250 fines inserted")