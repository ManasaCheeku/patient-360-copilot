"""Explainable, deterministic risk-review rules for the synthetic demo."""

from __future__ import annotations

from datetime import date, timedelta
from typing import Any

from ..config import RISK_AS_OF_DATE
from ..models import Encounter, LabResult, Medication, Patient
from .serializers import structured_citation


def _latest_lab(patient: Patient, test_name: str) -> LabResult | None:
    matching = [lab for lab in patient.labs if lab.test_name.casefold() == test_name.casefold()]
    return max(matching, key=lambda lab: lab.collected_on) if matching else None


def _add_factor(
    factors: list[dict[str, Any]],
    *,
    factor: str,
    severity: str,
    points: int,
    rule_id: str,
    evidence: str,
    citation: dict[str, Any],
) -> None:
    factors.append(
        {
            "risk_factor": factor,
            "evidence": evidence,
            "severity": severity,
            "points": points,
            "rule_id": rule_id,
            "source": citation["source"],
            "citation": citation,
        }
    )


def calculate_risks(patient: Patient) -> dict[str, Any]:
    """Return transparent review signals, never a diagnosis or probability score."""
    factors: list[dict[str, Any]] = []
    active_conditions = {item.name.casefold(): item for item in patient.conditions if item.status.casefold() == "active"}

    hypertension = active_conditions.get("hypertension")
    if hypertension:
        citation = structured_citation("condition", hypertension, patient.patient_id)
        _add_factor(
            factors,
            factor="Documented hypertension",
            severity="moderate",
            points=1,
            rule_id="RISK-HTN-01",
            evidence="An active synthetic hypertension condition is documented.",
            citation=citation,
        )

    ldl = _latest_lab(patient, "LDL Cholesterol")
    if ldl and ldl.numeric_value is not None and ldl.numeric_value >= 160:
        citation = structured_citation("lab", ldl, patient.patient_id)
        _add_factor(
            factors,
            factor="Elevated LDL cholesterol",
            severity="high",
            points=2,
            rule_id="RISK-LDL-160",
            evidence=f"Latest recorded LDL is {ldl.value} {ldl.unit}, meeting the demo threshold of 160 mg/dL.",
            citation=citation,
        )

    a1c = _latest_lab(patient, "Hemoglobin A1c")
    if a1c and a1c.numeric_value is not None and a1c.numeric_value >= 8:
        citation = structured_citation("lab", a1c, patient.patient_id)
        _add_factor(
            factors,
            factor="Elevated hemoglobin A1c",
            severity="high",
            points=2,
            rule_id="RISK-A1C-8",
            evidence=f"Latest recorded A1c is {a1c.value}{a1c.unit}, meeting the demo threshold of 8.0%.",
            citation=citation,
        )

    egfr = _latest_lab(patient, "eGFR")
    if egfr and egfr.numeric_value is not None and egfr.numeric_value < 60:
        citation = structured_citation("lab", egfr, patient.patient_id)
        _add_factor(
            factors,
            factor="Reduced eGFR",
            severity="high",
            points=2,
            rule_id="RISK-EGFR-60",
            evidence=f"Latest recorded eGFR is {egfr.value} {egfr.unit}, below the demo threshold of 60.",
            citation=citation,
        )

    oxygen = _latest_lab(patient, "Oxygen saturation")
    if oxygen and oxygen.numeric_value is not None and oxygen.numeric_value < 94:
        citation = structured_citation("lab", oxygen, patient.patient_id)
        _add_factor(
            factors,
            factor="Low recorded oxygen saturation",
            severity="moderate",
            points=2,
            rule_id="RISK-SPO2-94",
            evidence=f"Latest recorded oxygen saturation is {oxygen.value}{oxygen.unit}, below the demo threshold of 94%.",
            citation=citation,
        )

    as_of = date.fromisoformat(RISK_AS_OF_DATE)
    cutoff = (as_of - timedelta(days=180)).isoformat()
    acute_encounters = [
        item
        for item in patient.encounters
        if item.encounter_date >= cutoff and item.encounter_type.casefold() in {"inpatient", "emergency department"}
    ]
    if acute_encounters:
        latest = max(acute_encounters, key=lambda item: item.encounter_date)
        citation = structured_citation("encounter", latest, patient.patient_id)
        _add_factor(
            factors,
            factor="Recent acute-care utilization",
            severity="moderate",
            points=2,
            rule_id="RISK-ACUTE-180D",
            evidence=(
                f"A synthetic {latest.encounter_type.lower()} record exists on {latest.encounter_date}, "
                "within the fixed 180-day demo window."
            ),
            citation=citation,
        )

    high_alert_names = {"apixaban", "insulin glargine", "insulin lispro", "methotrexate"}
    high_alert_meds = [
        item for item in patient.medications if item.status.casefold() == "active" and item.name.casefold() in high_alert_names
    ]
    if high_alert_meds:
        medication = high_alert_meds[0]
        citation = structured_citation("medication", medication, patient.patient_id)
        _add_factor(
            factors,
            factor="Medication review priority",
            severity="moderate",
            points=1,
            rule_id="RISK-MED-REVIEW",
            evidence=(
                f"{medication.name} appears on the active synthetic medication list; "
                "the prototype flags it for review, not as an adverse event."
            ),
            citation=citation,
        )

    score = sum(item["points"] for item in factors)
    if score >= 5:
        level = "high"
    elif score >= 2:
        level = "moderate"
    else:
        level = "low"

    return {
        "patient_id": patient.patient_id,
        "risk_level": level,
        "risk_score": score,
        "label": f"{level.title()} rule-based review tier",
        "factors": factors,
        "methodology": {
            "type": "transparent deterministic rules",
            "rule_version": "2026-demo-v1",
            "as_of_date": RISK_AS_OF_DATE,
            "disclaimer": (
                "This evidence-based prototype is not a medical diagnosis, clinical prediction, "
                "or treatment recommendation. It is a synthetic-data review aid."
            ),
        },
    }
