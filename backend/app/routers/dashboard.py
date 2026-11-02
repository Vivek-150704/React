from fastapi import APIRouter, Depends
from sqlalchemy import func, extract
from sqlalchemy.orm import Session
from sqlalchemy import extract
from app.core.database import get_db
from app.models.fine import Fine
from app.services.dashboard_service import get_kpis

router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard"]
)


@router.get("/kpis")
def dashboard_kpis(
    db: Session = Depends(get_db)
):
    return get_kpis(db)


@router.get("/status-distribution")
def status_distribution(
    db: Session = Depends(get_db)
):
    rows = (
        db.query(
            Fine.status,
            func.count(Fine.fine_id).label("count")
        )
        .group_by(Fine.status)
        .all()
    )

    return [
        {
            "status": row[0],
            "count": row[1]
        }
        for row in rows
    ]


@router.get("/status-amount")
def status_amount(
    db: Session = Depends(get_db)
):
    rows = (
        db.query(
            Fine.status,
            func.sum(Fine.fine_amount).label("amount")
        )
        .group_by(Fine.status)
        .all()
    )

    return [
        {
            "status": row[0],
            "amount": float(row[1] or 0)
        }
        for row in rows
    ]


@router.get("/reasons")
def reasons(
    db: Session = Depends(get_db)
):
    rows = (
        db.query(
            Fine.reason_category,
            func.count(Fine.fine_id).label("count"),
            func.sum(Fine.fine_amount).label("amount")
        )
        .group_by(Fine.reason_category)
        .all()
    )

    return [
        {
            "reason": row[0],
            "count": row[1],
            "amount": float(row[2] or 0)
        }
        for row in rows
    ]


@router.get("/trend")
def trend(
    db: Session = Depends(get_db)
):
    rows = (
        db.query(
            extract("year", Fine.fine_date).label("year"),
            extract("month", Fine.fine_date).label("month"),
            func.count(Fine.fine_id).label("count"),
            func.sum(Fine.fine_amount).label("amount")
        )
        .group_by(
            extract("year", Fine.fine_date),
            extract("month", Fine.fine_date)
        )
        .order_by(
            extract("year", Fine.fine_date),
            extract("month", Fine.fine_date)
        )
        .all()
    )

    return [
        {
            "year": int(row[0]),
            "month": int(row[1]),
            "count": row[2],
            "amount": float(row[3] or 0)
        }
        for row in rows
    ]

@router.get("/trend")
def trend(
    db: Session = Depends(get_db)
):
    rows = (
        db.query(
            extract("year", Fine.fine_date).label("year"),
            extract("month", Fine.fine_date).label("month"),
            func.count(Fine.fine_id).label("count"),
            func.sum(Fine.fine_amount).label("amount")
        )
        .group_by(
            extract("year", Fine.fine_date),
            extract("month", Fine.fine_date)
        )
        .order_by(
            extract("year", Fine.fine_date),
            extract("month", Fine.fine_date)
        )
        .all()
    )

    return [
        {
            "year": int(row[0]),
            "month": int(row[1]),
            "count": row[2],
            "amount": float(row[3] or 0)
        }
        for row in rows
    ]