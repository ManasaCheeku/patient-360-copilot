"""Pydantic request contracts exposed by the API."""

from __future__ import annotations

from pydantic import BaseModel, Field


class CopilotQueryRequest(BaseModel):
    patient_id: str = Field(min_length=1, max_length=32, examples=["P-1001"])
    question: str = Field(min_length=2, max_length=2000)
    include_documents: bool = True
    document_limit: int = Field(default=4, ge=1, le=8)
