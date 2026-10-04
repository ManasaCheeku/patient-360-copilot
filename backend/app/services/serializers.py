"""JSON serializers and traceable evidence-citation builders."""

from __future__ import annotations

from typing import Any

from ..models import Allergy, Claim, Condition, Encounter, LabResult, Medication, Patient


def condition_dict(item: Condition) -> dict[str, Any]:
    return {
        "id": item.id,
        "name": item.name,
        "status": item.status,
        "diagnosed_on": item.diagnosed_on,
        "code": item.code,
        "notes": item.notes,
    }


def medication_dict(item: Medication) -> dict[str, Any]:
    return {
        "id": item.id,
        "name": item.name,
        "dose": item.dose,
        "route": item.route,
        "frequency": item.frequency,
        "status": item.status,
        "started_on": item.started_on,
        "indication": item.indication,
    }


def allergy_dict(item: Allergy) -> dict[str, Any]:
    return {
        "id": item.id,
        "substance": item.substance,
        "reaction": item.reaction,
        "severity": item.severity,
    }


def lab_dict(item: LabResult) -> dict[str, Any]:
    return {
        "id": item.id,
        "test_name": item.test_name,
        "value": item.value,
        "numeric_value": item.numeric_value,
        "unit": item.unit,
        "reference_range": item.reference_range,
        "flag": item.flag,
        "collected_on": item.collected_on,
    }


def encounter_dict(item: Encounter) -> dict[str, Any]:
    return {
        "id": item.id,
        "encounter_date": item.encounter_date,
        "encounter_type": item.encounter_type,
        "facility": item.facility,
        "summary": item.summary,
        "disposition": item.disposition,
    }


def claim_dict(item: Claim) -> dict[str, Any]:
    return {
        "id": item.id,
        "service_date": item.service_date,
        "category": item.category,
        "description": item.description,
        "status": item.status,
        "amount": item.amount,
    }


def structured_citation(record_type: str, record: Any, patient_id: str) -> dict[str, Any]:
    """Make a self-contained citation whose excerpt matches a displayed record."""
    record_id = str(record.id)
    if record_type == "condition":
        section = f"{record.name} — {record.diagnosed_on}"
        excerpt = f"{record.name} is listed as {record.status} (documented {record.diagnosed_on})."
        source = "Condition Record"
        date = record.diagnosed_on
    elif record_type == "medication":
        section = f"{record.name} — active medication list"
        excerpt = f"{record.name} {record.dose}, {record.route}, {record.frequency}; status: {record.status}."
        source = "Medication Record"
        date = record.started_on
    elif record_type == "lab":
        section = f"{record.test_name} — {record.collected_on}"
        excerpt = (
            f"{record.test_name}: {record.value} {record.unit} "
            f"(reference {record.reference_range}; flag: {record.flag})."
        )
        source = "Lab Result"
        date = record.collected_on
    elif record_type == "encounter":
        section = f"{record.encounter_type} — {record.encounter_date}"
        excerpt = record.summary
        source = "Encounter Record"
        date = record.encounter_date
    elif record_type == "claim":
        section = f"{record.category} — {record.service_date}"
        excerpt = f"{record.description}; status: {record.status}; amount: ${record.amount:,.2f}."
        source = "Claim Record"
        date = record.service_date
    elif record_type == "allergy":
        section = f"{record.substance} allergy record"
        excerpt = f"{record.substance}: {record.reaction}; severity: {record.severity}."
        source = "Allergy Record"
        date = None
    else:
        raise ValueError(f"Unsupported evidence record type: {record_type}")

    evidence_id = f"{record_type}:{patient_id}:{record_id}"
    return {
        "id": evidence_id,
        "source": source,
        "source_name": source,
        "title": source,
        "section": section,
        "excerpt": excerpt,
        "date": date,
        "record_type": record_type,
        "record_id": record_id,
        "patient_id": patient_id,
        "document_id": None,
        "evidence_url": f"/patients/{patient_id}",
    }


def patient_dict(patient: Patient) -> dict[str, Any]:
    return {
        "patient_id": patient.patient_id,
        "name": patient.name,
        "age": patient.age,
        "gender": patient.gender,
        "location": patient.location,
        "synthetic_profile": patient.synthetic_profile,
        "demographics": {
            "age": patient.age,
            "gender": patient.gender,
            "location": patient.location,
        },
        "conditions": [condition_dict(item) for item in sorted(patient.conditions, key=lambda x: x.diagnosed_on, reverse=True)],
        "medications": [medication_dict(item) for item in sorted(patient.medications, key=lambda x: x.started_on, reverse=True)],
        "allergies": [allergy_dict(item) for item in patient.allergies],
        "lab_results": [lab_dict(item) for item in sorted(patient.labs, key=lambda x: x.collected_on, reverse=True)],
        "encounters": [encounter_dict(item) for item in sorted(patient.encounters, key=lambda x: x.encounter_date, reverse=True)],
        "claims": [claim_dict(item) for item in sorted(patient.claims, key=lambda x: x.service_date, reverse=True)],
    }
