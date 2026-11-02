from sqlalchemy import func

from app.models.fine import Fine


def get_kpis(db):

    total_fines = db.query(Fine).count()

    total_amount = (
        db.query(
            func.coalesce(
                func.sum(Fine.fine_amount),
                0
            )
        )
        .scalar()
    )

    pending_cases = (
        db.query(Fine)
        .filter(Fine.status == "Pending")
        .count()
    )

    pending_amount = (
        db.query(
            func.coalesce(
                func.sum(Fine.fine_amount),
                0
            )
        )
        .filter(Fine.status == "Pending")
        .scalar()
    )

    return {
        "totalFines": total_fines,
        "totalAmount": float(total_amount),
        "pendingCases": pending_cases,
        "pendingAmount": float(pending_amount)
    }