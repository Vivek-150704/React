from sqlalchemy import func
from app.models.fine import Fine


def apply_fine_filters(query, status=None, customerId=None, reason=None, search=None, fromDate=None, toDate=None):
    from datetime import datetime, timedelta

    if status:
        query = query.filter(Fine.status == status)
    if customerId:
        query = query.filter(Fine.customer_id == customerId)
    if reason:
        for item in reason if isinstance(reason, (list, tuple)) else [reason]:
            query = query.filter(Fine.reason_category == item)
    if search:
        query = query.filter(
            Fine.fine_id.contains(search)
            | Fine.customer_id.contains(search)
            | Fine.customer_name.contains(search)
            | Fine.order_reference.contains(search)
        )
    if fromDate:
        query = query.filter(Fine.fine_date >= datetime.fromisoformat(fromDate))
    if toDate:
        query = query.filter(Fine.fine_date < datetime.fromisoformat(toDate) + timedelta(days=1))
    return query


def get_kpis(db, **filters):
    query = apply_fine_filters(db.query(Fine), **filters)
    pending = query.filter(Fine.status == "Pending")
    total_fines = query.count()
    total_amount = query.with_entities(func.coalesce(func.sum(Fine.fine_amount), 0)).scalar()
    pending_cases = pending.count()
    pending_amount = pending.with_entities(func.coalesce(func.sum(Fine.fine_amount), 0)).scalar()
    return {
        "totalFines": total_fines,
        "totalAmount": float(total_amount or 0),
        "pendingCases": pending_cases,
        "pendingAmount": float(pending_amount or 0),
    }
