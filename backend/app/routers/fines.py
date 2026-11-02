from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.fine import Fine
from app.models.fine_review import FineReview
from app.schemas.fine import ReviewRequest

router = APIRouter(
    prefix="/api/fines",
    tags=["Fines"]
)


def map_fine(f):
    return {
        "fineId": f.fine_id,
        "customerId": f.customer_id,
        "customerName": f.customer_name,
        "orderReference": f.order_reference,
        "fineDate": (
            f.fine_date.isoformat()
            if f.fine_date
            else None
        ),
        "fineAmount": float(f.fine_amount),
        "currencyCode": f.currency_code,
        "status": f.status,
        "reasonCategory": f.reason_category,
        "reasonDescription": f.reason_description,
        "sourceArea": f.source_area,
        "expectedDeliveryDate": (
            f.expected_delivery_date.isoformat()
            if f.expected_delivery_date
            else None
        ),
        "actualDeliveryDate": (
            f.actual_delivery_date.isoformat()
            if f.actual_delivery_date
            else None
        ),
        "orderedQuantity": f.ordered_quantity,
        "deliveredQuantity": f.delivered_quantity,
        "sourceSystemReference": f.source_system_reference,
        "createdAt": (
            f.created_at.isoformat()
            if f.created_at
            else None
        ),
        "updatedAt": (
            f.updated_at.isoformat()
            if f.updated_at
            else None
        ),
    }


@router.get("")
def get_fines(
    status: str | None = None,
    customerId: str | None = None,
    reason: str | None = None,
    search: str | None = None,
    fromDate: str | None = None,
    toDate: str | None = None,
    db: Session = Depends(get_db)
):
    query = db.query(Fine)

    if status:
        query = query.filter(
            Fine.status == status
        )

    if customerId:
        query = query.filter(
            Fine.customer_id == customerId
        )

    if reason:
        query = query.filter(
            Fine.reason_category == reason
        )

    if search:
        query = query.filter(
            (Fine.fine_id.contains(search))
            | (Fine.customer_id.contains(search))
            | (Fine.customer_name.contains(search))
            | (Fine.order_reference.contains(search))
        )

    if fromDate:
        query = query.filter(
            Fine.fine_date >= datetime.fromisoformat(
                fromDate
            )
        )

    if toDate:
        query = query.filter(
            Fine.fine_date <= datetime.fromisoformat(
                toDate
            )
        )

    fines = query.all()

    return [
        map_fine(f)
        for f in fines
    ]


@router.get("/{fine_id}")
def get_fine(
    fine_id: str,
    db: Session = Depends(get_db)
):
    fine = (
        db.query(Fine)
        .filter(
            Fine.fine_id == fine_id
        )
        .first()
    )

    if not fine:
        raise HTTPException(
            status_code=404,
            detail="not-found"
        )

    return map_fine(fine)


@router.get("/{fine_id}/reviews")
def get_reviews(
    fine_id: str,
    db: Session = Depends(get_db)
):
    reviews = (
        db.query(FineReview)
        .filter(
            FineReview.fine_id == fine_id
        )
        .order_by(
            FineReview.reviewed_at.desc()
        )
        .all()
    )

    return [
        {
            "reviewId": r.review_id,
            "fineId": r.fine_id,
            "oldStatus": r.old_status,
            "newStatus": r.new_status,
            "reviewerId": r.reviewer_user_id,
            "reviewerName": r.reviewer_name,
            "comment": r.comment,
            "reviewedAt": (
                r.reviewed_at.isoformat()
                if r.reviewed_at
                else None
            ),
        }
        for r in reviews
    ]


@router.post("/{fine_id}/reviews")
def review_fine(
    fine_id: str,
    request: ReviewRequest,
    db: Session = Depends(get_db)
):
    fine = (
        db.query(Fine)
        .filter(
            Fine.fine_id == fine_id
        )
        .first()
    )

    if not fine:
        raise HTTPException(
            status_code=404,
            detail="not-found"
        )

    if fine.status != request.expectedStatus:
        raise HTTPException(
            status_code=409,
            detail="conflict"
        )

    review = FineReview(
        fine_id=fine_id,
        old_status=fine.status,
        new_status=request.decision,
        reviewer_user_id=1,
        reviewer_name="Vivek",
        comment=request.comment,
        reviewed_at=datetime.utcnow()
    )

    fine.status = request.decision

    db.add(review)

    db.commit()

    db.refresh(fine)

    return map_fine(fine)