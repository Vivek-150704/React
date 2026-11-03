import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FileText,
  UserRound,
} from "lucide-react";

import { useState } from "react";

import {
  dateTime,
  exactMoney,
  shortDate,
} from "../utils/fines.js";

import {
  Button,
  Modal,
  StatusBadge,
} from "./ui.jsx";

export function FineDrawer({
  fine,
  role,
  history,
  onClose,
  onReview,
}) {
  const detail = (
    label,
    value
  ) => (
    <div>
      <dt>{label}</dt>
      <dd>{value ?? "Not available"}</dd>
    </div>
  );

  return (
    <div
      className="drawer-overlay"
      onMouseDown={(e) =>
        e.target === e.currentTarget &&
        onClose()
      }
    >
      <aside
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        <header>
          <div>
            <span>FINE RECORD</span>
            <h2 id="drawer-title">
              {fine.fineId}
            </h2>
          </div>

          <Button
            variant="ghost"
            onClick={onClose}
          >
            Close
          </Button>
        </header>

        <div className="drawer-summary">
          <div>
            <StatusBadge
              status={fine.status}
            />

            <strong>
              {exactMoney(
                fine.fineAmount
              )}
            </strong>

            <span>
              {fine.currencyCode}
            </span>
          </div>

          {(role === "Admin" ||
            role ===
              "Super User") && (
            <Button
              onClick={onReview}
            >
              Review Fine
            </Button>
          )}
        </div>

        <section>
          <h3>
            Fine information
          </h3>

          <dl className="details-grid">
            {detail(
              "Fine ID",
              fine.fineId
            )}

            {detail(
              "Customer",
              `${fine.customerName} (${fine.customerId})`
            )}

            {detail(
              "Order reference",
              fine.orderReference
            )}

            {detail(
              "Fine date",
              shortDate(
                fine.fineDate
              )
            )}

            {detail(
              "Fine amount",
              exactMoney(
                fine.fineAmount
              )
            )}

            {detail(
              "Currency",
              fine.currencyCode
            )}

            {detail(
              "Fine reason",
              fine.reasonCategory
            )}

            {detail(
              "Source area",
              fine.sourceArea
            )}

            <div className="full">
              <dt>
                Reason description
              </dt>
              <dd>
                {fine.reasonDescription ??
                  "Not available"}
              </dd>
            </div>

            {detail(
              "Created at",
              dateTime(
                fine.createdAt
              )
            )}

            {detail(
              "Last updated",
              dateTime(
                fine.updatedAt
              )
            )}
          </dl>
        </section>

        <section>
          <h3>
            Related information
          </h3>

          <dl className="details-grid">
            {detail(
              "Expected delivery",
              fine.expectedDeliveryDate &&
                shortDate(
                  fine.expectedDeliveryDate
                )
            )}

            {detail(
              "Actual delivery",
              fine.actualDeliveryDate &&
                shortDate(
                  fine.actualDeliveryDate
                )
            )}

            {detail(
              "Ordered quantity",
              fine.orderedQuantity
            )}

            {detail(
              "Delivered quantity",
              fine.deliveredQuantity
            )}

            {detail(
              "Source reference",
              fine.sourceSystemReference
            )}
          </dl>
        </section>

        <section>
          <h3>
            Review summary
          </h3>

          {fine.lastReviewedAt ? (
            <dl className="details-grid">
              {detail(
                "Last reviewer",
                fine.lastReviewerName
              )}

              {detail(
                "Review date",
                dateTime(
                  fine.lastReviewedAt
                )
              )}

              <div className="full">
                <dt>
                  Latest comment
                </dt>

                <dd>
                  {
                    fine.lastReviewComment
                  }
                </dd>
              </div>
            </dl>
          ) : (
            <div className="no-history">
              <Clock3 size={18} />
              No manual review
              recorded.
            </div>
          )}
        </section>

        <section>
          <h3>
            Review history{" "}
            <span>
              {history.length}
            </span>
          </h3>

          {!history.length ? (
            <div className="no-history">
              No manual review
              recorded.
            </div>
          ) : (
            <div className="timeline">
              {history.map(
                (item) => (
                  <div
                    key={
                      item.reviewId
                    }
                  >
                    <span
                      className={`timeline-dot ${item.newStatus.toLowerCase()}`}
                    />

                    <div>
                      <strong>
                        {
                          item.oldStatus
                        }{" "}
                        →{" "}
                        {
                          item.newStatus
                        }
                      </strong>

                      <span>
                        {dateTime(
                          item.reviewedAt
                        )}{" "}
                        ·{" "}
                        {
                          item.reviewerName
                        }
                      </span>

                      <p>
                        {
                          item.comment
                        }
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </section>
      </aside>
    </div>
  );
}

export function ReviewModal({
  fine,
  role,
  onClose,
  onSave,
}) {
  const [decision, setDecision] =
    useState("");

  const [comment, setComment] =
    useState("");

  const [errors, setErrors] =
    useState({});

  const [saving, setSaving] =
    useState(false);

  const [apiError, setApiError] =
    useState("");

  const submit = async () => {
    const next = {};

    if (!decision) {
      next.decision =
        "Select a target status.";
    }

    if (!comment.trim()) {
      next.comment =
        "Please enter a review comment.";
    }

    if (
      comment.length > 1000
    ) {
      next.comment =
        "Comment must be 1,000 characters or fewer.";
    }

    if (role === "Viewer") {
      next.permission =
        "You do not have permission to review fines.";
    }

    setErrors(next);

    if (
      Object.keys(next).length
    ) {
      return;
    }

    setSaving(true);
    setApiError("");

    try {
      await onSave({
        decision,
        comment:
          comment.trim(),
        expectedStatus:
          fine.status,
      });
    } catch (error) {
      setApiError(
        error instanceof
          Error &&
          error.message ===
            "conflict"
          ? "This fine was updated by another reviewer."
          : "Unable to save review."
      );

      setSaving(false);
    }
  };

  return (
    <Modal title="Review Fine Status" onClose={onClose} className="review-modal">
      <div className="modal-body review-form">
        <div className="review-record">
          <div><FileText/><span>Fine ID<strong>{fine.fineId}</strong></span></div>
          <div><CircleDollarSign/><span>Fine amount<strong>{exactMoney(fine.fineAmount)}</strong></span></div>
          <div><Calendar/><span>Fine date<strong>{shortDate(fine.fineDate)}</strong></span></div>
          <div><Clock3/><span>Current status<strong>{fine.status}</strong></span></div>
        </div>
        <fieldset className="decision">
          <legend>Change fine status <span>*</span></legend>
          <p>Select the status to apply to this fine.</p>
          <div className="decision-options">
            {["Valid", "Invalid"].map((status) => (
              <label key={status} className={decision === status ? "selected " + status.toLowerCase() : ""}>
                <input type="radio" name="fine-status" value={status} checked={decision === status} onChange={(e) => setDecision(e.target.value)}/>
                <span><strong>{status}</strong><small>{status === "Pending" ? "Return the fine to the review queue." : status === "Valid" ? "Confirm this fine is correct." : "Mark this fine as incorrect."}</small></span>
              </label>
            ))}
          </div>
          {errors.decision && <small className="field-error">{errors.decision}</small>}
        </fieldset>
        <label className="comment-field">
          <span>Review comment <b>*</b></span>
          <textarea value={comment} maxLength={1000} onChange={(e) => setComment(e.target.value)} placeholder="Explain why you are changing this fine status…"/>
          <div><span>{errors.comment || "A comment is required for audit history."}</span><span>{comment.length}/1000</span></div>
        </label>
        {errors.permission && <div className="alert error">{errors.permission}</div>}
        {apiError && <div className="alert error">{apiError}</div>}
        <div className="modal-actions">
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={submit} disabled={saving || role === "Viewer"}>{saving ? "Saving…" : "Save review"}</Button>
        </div>
      </div>
    </Modal>
  );
}

export function ExportModal({
  count,
  filters,
  onClose,
  onExport,
}) {
  const [loading, setLoading] =
    useState(false);

  return (
    <Modal
      title="Export Fine Records"
      onClose={onClose}
    >
      {/* Keep existing JSX exactly as-is */}
    </Modal>
  );
}