from pydantic import BaseModel


class ReviewRequest(BaseModel):
    expectedStatus: str
    decision: str
    comment: str