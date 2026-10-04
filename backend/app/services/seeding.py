"""Idempotent database seeding from the versioned synthetic JSON fixture."""

from __future__ import annotations

import json

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import DATA_DIR
from ..database import Base, SessionLocal, engine
from ..models import Allergy, Claim, Condition, Encounter, LabResult, Medication, Patient


SEED_FILE = DATA_DIR / "synthetic_patients.json"


def _load_fixture() -> list[dict]:
    with SEED_FILE.open(encoding="utf-8") as source:
        payload = json.load(source)
    return payload["patients"]


def seed_database(reset: bool = True) -> int:
    """Create tables and seed the full synthetic fixture. Returns patient count."""
    # Importing mapped models above makes metadata complete before table operations.
    if reset:
        Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    with SessionLocal() as db:
        if not reset and db.scalar(select(Patient.id).limit(1)):
            return int(db.query(Patient).count())

        for item in _load_fixture():
            patient = Patient(
                patient_id=item["patient_id"],
                name=item["name"],
                age=item["age"],
                gender=item["gender"],
                location=item["location"],
                synthetic_profile=item.get("synthetic_profile"),
            )
            patient.conditions = [Condition(**record) for record in item.get("conditions", [])]
            patient.medications = [Medication(**record) for record in item.get("medications", [])]
            patient.allergies = [Allergy(**record) for record in item.get("allergies", [])]
            patient.labs = [LabResult(**record) for record in item.get("labs", [])]
            patient.encounters = [Encounter(**record) for record in item.get("encounters", [])]
            patient.claims = [Claim(**record) for record in item.get("claims", [])]
            db.add(patient)
        db.commit()
        return int(db.query(Patient).count())


def ensure_seeded() -> int:
    """Seed only when a fresh local SQLite file has no patients."""
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        has_patient = db.scalar(select(Patient.id).limit(1)) is not None
    return 0 if has_patient else seed_database(reset=False)
