"""FastAPI routes for the synthetic Patient 360 demo."""

from __future__ import annotations

from contextlib import asynccontextmanager
from typing import Any

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session

from .config import CORS_ORIGINS, SYNTHETIC_DATA_NOTICE
from .database import get_db
from .models import Patient
from .schemas import CopilotQueryRequest
from .services.copilot import answer_question
from .services.documents import list_documents
from .services.risk import calculate_risks
from .services.serializers import patient_dict, structured_citation
from .services.seeding import ensure_seeded


@asynccontextmanager
async def lifespan(_: FastAPI):
    ensure_seeded()
    yield


app = FastAPI(
    title="Patient 360 Clinical Evidence Copilot",
    description=SYNTHETIC_DATA_NOTICE,
    version="0.1.0",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _patient_or_404(db: Session, patient_id: str) -> Patient:
    patient = db.scalar(select(Patient).where(Patient.patient_id == patient_id))
    if patient is None:
        raise HTTPException(status_code=404, detail="Synthetic patient not found")
    return patient


def _timeline(patient: Patient) -> list[dict[str, Any]]:
    events: list[dict[str, Any]] = []
    for lab in patient.labs:
        events.append(
            {
                "id": f"lab:{lab.id}",
                "date": lab.collected_on,
                "type": "lab",
                "title": f"{lab.test_name} resulted",
                "detail": f"{lab.test_name}: {lab.value} {lab.unit} (flag: {lab.flag}).",
                "citation": structured_citation("lab", lab, patient.patient_id),
            }
        )
    for encounter in patient.encounters:
        events.append(
            {
                "id": f"encounter:{encounter.id}",
                "date": encounter.encounter_date,
                "type": "encounter",
                "title": encounter.encounter_type,
                "detail": encounter.summary,
                "citation": structured_citation("encounter", encounter, patient.patient_id),
            }
        )
    for claim in patient.claims:
        events.append(
            {
                "id": f"claim:{claim.id}",
                "date": claim.service_date,
                "type": "claim",
                "title": claim.category,
                "detail": claim.description,
                "citation": structured_citation("claim", claim, patient.patient_id),
            }
        )
    return sorted(events, key=lambda event: (event["date"], event["id"]), reverse=True)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "data_notice": SYNTHETIC_DATA_NOTICE}


@app.get("/patients")
def patients(db: Session = Depends(get_db)) -> dict[str, list[dict[str, Any]]]:
    records = db.scalars(select(Patient).order_by(Patient.patient_id)).all()
    return {
        "patients": [
            {
                "patient_id": patient.patient_id,
                "name": patient.name,
                "age": patient.age,
                "gender": patient.gender,
                "location": patient.location,
                "risk_level": calculate_risks(patient)["risk_level"],
                "conditions_count": len(patient.conditions),
            }
            for patient in records
        ]
    }


@app.get("/patients/{patient_id}")
def patient_profile(patient_id: str, db: Session = Depends(get_db)) -> dict[str, Any]:
    patient = _patient_or_404(db, patient_id)
    result = patient_dict(patient)
    result["risk_level"] = calculate_risks(patient)["risk_level"]
    return result


@app.get("/patients/{patient_id}/timeline")
def patient_timeline(patient_id: str, db: Session = Depends(get_db)) -> dict[str, list[dict[str, Any]]]:
    return {"timeline": _timeline(_patient_or_404(db, patient_id))}


@app.get("/patients/{patient_id}/risks")
def patient_risks(patient_id: str, db: Session = Depends(get_db)) -> dict[str, list[dict[str, Any]]]:
    patient = _patient_or_404(db, patient_id)
    result = calculate_risks(patient)
    return {
        "risks": [
            {
                "id": f"risk:{patient.patient_id}",
                "title": result["label"],
                "severity": result["risk_level"],
                "summary": (
                    f"{len(result['factors'])} transparent rule factor(s) matched "
                    f"(demo score {result['risk_score']})."
                    if result["factors"]
                    else "No current synthetic record met an elevated prototype rule threshold."
                ),
                "risk_score": result["risk_score"],
                "methodology": result["methodology"],
                "factors": [
                    {
                        **factor,
                        "factor": factor["risk_factor"],
                    }
                    for factor in result["factors"]
                ],
            }
        ]
    }


@app.get("/patients/{patient_id}/documents")
def patient_documents(patient_id: str, db: Session = Depends(get_db)) -> dict[str, list[dict[str, Any]]]:
    _patient_or_404(db, patient_id)
    return {"documents": list_documents(patient_id)}


@app.post("/copilot/query")
def copilot_query(payload: CopilotQueryRequest, db: Session = Depends(get_db)) -> dict[str, Any]:
    patient = _patient_or_404(db, payload.patient_id)
    result = answer_question(
        patient,
        payload.question,
        include_documents=payload.include_documents,
        document_limit=payload.document_limit,
    )
    result["mode"] = "deterministic_fallback"
    return result