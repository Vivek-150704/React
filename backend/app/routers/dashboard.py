from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, extract
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.fine import Fine
from app.models.user import User
from app.services.dashboard_service import apply_fine_filters, get_kpis

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


def filtered_query(db, status=None, customerId=None, reason=None, search=None, fromDate=None, toDate=None):
    return apply_fine_filters(
        db.query(Fine),
        status=status,
        customerId=customerId,
        reason=reason,
        search=search,
        fromDate=fromDate,
        toDate=toDate,
    )


def filter_args(status, customerId, reason, search, fromDate, toDate):
    return dict(status=status, customerId=customerId, reason=reason, search=search, fromDate=fromDate, toDate=toDate)


@router.get("/kpis")
def dashboard_kpis(
    status: str | None = None,
    customerId: str | None = None,
    reason: list[str] | None = Query(default=None),
    search: str | None = None,
    fromDate: str | None = None,
    toDate: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_kpis(db, **filter_args(status, customerId, reason, search, fromDate, toDate))


@router.get("/status-distribution")
def status_distribution(
    status: str | None = None, customerId: str | None = None,
    reason: list[str] | None = Query(default=None), search: str | None = None,
    fromDate: str | None = None, toDate: str | None = None,
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    rows = filtered_query(db, **filter_args(status, customerId, reason, search, fromDate, toDate)).with_entities(
        Fine.status, func.count(Fine.fine_id).label("count"),
        func.sum(Fine.fine_amount).label("amount")
    ).group_by(Fine.status).all()
    return [{"status": row[0], "count": row[1], "amount": float(row[2] or 0)} for row in rows]


@router.get("/reasons")
def reasons(
    status: str | None = None, customerId: str | None = None,
    reason: list[str] | None = Query(default=None), search: str | None = None,
    fromDate: str | None = None, toDate: str | None = None,
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    rows = filtered_query(db, **filter_args(status, customerId, reason, search, fromDate, toDate)).with_entities(
        Fine.reason_category, func.count(Fine.fine_id).label("count"),
        func.sum(Fine.fine_amount).label("amount")
    ).group_by(Fine.reason_category).all()
    return [{"reason": row[0], "count": row[1], "amount": float(row[2] or 0)} for row in rows]


@router.get("/trend")
def trend(
    status: str | None = None, customerId: str | None = None,
    reason: list[str] | None = Query(default=None), search: str | None = None,
    fromDate: str | None = None, toDate: str | None = None,
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    year = extract("year", Fine.fine_date)
    month = extract("month", Fine.fine_date)
    rows = filtered_query(db, **filter_args(status, customerId, reason, search, fromDate, toDate)).with_entities(
        year, month, func.count(Fine.fine_id).label("count"),
        func.sum(Fine.fine_amount).label("amount")
    ).group_by(year, month).order_by(year, month).all()
    return [
        {"year": int(row[0]), "month": int(row[1]), "count": row[2], "amount": float(row[3] or 0)}
        for row in rows
    ]
