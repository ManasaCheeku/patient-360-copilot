"""Grounded, deterministic Patient 360 answer pipeline.

The fallback deliberately answers from records and retrieved local document sections;
it never invents missing patient facts. An external model is intentionally not required
for the MVP, so every demo remains functional offline.
"""

from __future__ import annotations

from typing import Any

from ..models import Patient
from .documents import document_citation, retrieve_document_chunks
from .risk import calculate_risks
from .serializers import structured_citation


def _unique_citations() -> tuple[list[dict[str, Any]], Any]:
    citations: list[dict[str, Any]] = []
    positions: dict[str, int] = {}

    def cite(citation: dict[str, Any]) -> str:
        existing = positions.get(citation["id"])
        if existing is not None:
            return f"[{existing}]"
        number = len(citations) + 1
        positions[citation["id"]] = number
        payload = {**citation, "citation_number": number}
        payload["label"] = f"[{number}] {payload['source']} — {payload['section']}"
        citations.append(payload)
        return f"[{number}]"

    return citations, cite


def _active_medications(patient: Patient) -> list[Any]:
    return [medication for medication in patient.medications if medication.status.casefold() == "active"]


def _recent_records(patient: Patient, maximum: int = 3) -> list[tuple[str, Any]]:
    records: list[tuple[str, str, Any]] = []
    records.extend((encounter.encounter_date, "encounter", encounter) for encounter in patient.encounters)
    records.extend((lab.collected_on, "lab", lab) for lab in patient.labs)
    records.extend((claim.service_date, "claim", claim) for claim in patient.claims)
    records.sort(key=lambda item: item[0], reverse=True)
    return [(kind, record) for _, kind, record in records[:maximum]]


def _doc_facts(documents: list[dict[str, Any]], cite: Any, limit: int = 2) -> tuple[list[dict[str, Any]], list[str]]:
    facts: list[dict[str, Any]] = []
    lines: list[str] = []
    for document in documents[:limit]:
        citation = document_citation(document)
        marker = cite(citation)
        line = f"{document['title']} — {document['section']}: {document['excerpt']} {marker}"
        facts.append(
            {
                "type": "retrieved_document_evidence",
                "statement": f"{document['title']} — {document['section']}",
                "citation_ids": [citation["id"]],
            }
        )
        lines.append(line)
    return facts, lines


def _risk_answer(patient: Patient, documents: list[dict[str, Any]], cite: Any) -> tuple[str, list[dict[str, Any]], list[dict[str, Any]]]:
    risk = calculate_risks(patient)
    facts: list[dict[str, Any]] = []
    inferences: list[dict[str, Any]] = []
    factors = risk["factors"]
    lines = ["Recorded evidence:"]
    if factors:
        for factor in factors:
            marker = cite(factor["citation"])
            lines.append(f"- {factor['risk_factor']}: {factor['evidence']} {marker}")
            facts.append(
                {
                    "type": "recorded_fact",
                    "statement": factor["evidence"],
                    "citation_ids": [factor["citation"]["id"]],
                }
            )
    else:
        lines.append("- No current synthetic record met one of this prototype's elevated-rule thresholds.")

    doc_facts, doc_lines = _doc_facts(documents, cite, limit=1)
    if doc_lines:
        lines.append("\nRetrieved framework evidence:")
        lines.extend(f"- {line}" for line in doc_lines)
        facts.extend(doc_facts)

    tier = risk["label"]
    inference = (
        f"Under the transparent prototype rules, the recorded evidence produces a {tier}. "
        "This is a review signal, not a diagnosis or a prediction of an event."
    )
    lines.extend(["\nInference (clearly separated from recorded facts):", f"- {inference}"])
    inferences.append({"type": "rule_based_inference", "statement": inference, "rule_version": "2026-demo-v1"})
    return "\n".join(lines), facts, inferences


def _medication_answer(patient: Patient, cite: Any) -> tuple[str, list[dict[str, Any]], list[dict[str, Any]]]:
    medications = _active_medications(patient)
    facts: list[dict[str, Any]] = []
    lines = ["Recorded active medications:"]
    if not medications:
        lines.append("- No active medications are recorded in this synthetic chart.")
    for medication in medications:
        citation = structured_citation("medication", medication, patient.patient_id)
        marker = cite(citation)
        statement = f"{medication.name} {medication.dose}, {medication.route}, {medication.frequency} (for {medication.indication or 'recorded indication'})."
        lines.append(f"- {statement} {marker}")
        facts.append({"type": "recorded_fact", "statement": statement, "citation_ids": [citation["id"]]})
    return "\n".join(lines), facts, []


SAFETY_PROMPTS = {
    "apixaban": "The bulletin supports a medication-reconciliation and renal-function review prompt; it does not document a bleeding event.",
    "insulin glargine": "The bulletin supports checking that individualized administration and low-glucose education is documented; it does not establish hypoglycemia.",
    "insulin lispro": "The bulletin supports checking that individualized administration and low-glucose education is documented; it does not establish hypoglycemia.",
    "methotrexate": "The bulletin supports checking that routine treatment monitoring is documented; it does not determine treatment appropriateness.",
    "naproxen": "The bulletin supports a generic review of use, gastrointestinal history, and renal monitoring; it is not a patient-specific conclusion.",
}


def _safety_answer(patient: Patient, documents: list[dict[str, Any]], cite: Any) -> tuple[str, list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]]]:
    facts: list[dict[str, Any]] = []
    inferences: list[dict[str, Any]] = []
    evidence_documents = list(documents)
    lines = ["Recorded medication-safety evidence:"]
    matched = 0
    for medication in _active_medications(patient):
        prompt = SAFETY_PROMPTS.get(medication.name.casefold())
        if not prompt:
            continue
        matched += 1
        medication_citation = structured_citation("medication", medication, patient.patient_id)
        med_marker = cite(medication_citation)
        matching_docs = retrieve_document_chunks(
            f"{medication.name} medication safety monitoring", patient.patient_id, limit=1
        )
        if matching_docs:
            document = matching_docs[0]
            if document["id"] not in {item["id"] for item in evidence_documents}:
                evidence_documents.append(document)
            doc_citation = document_citation(document)
            doc_marker = cite(doc_citation)
            lines.append(f"- {medication.name} is active in the synthetic medication list {med_marker}. {prompt} {doc_marker}")
            facts.append(
                {
                    "type": "recorded_fact",
                    "statement": f"{medication.name} is active in the synthetic medication list.",
                    "citation_ids": [medication_citation["id"], doc_citation["id"]],
                }
            )
        else:
            lines.append(f"- {medication.name} is active in the synthetic medication list {med_marker}. {prompt}")
            facts.append({"type": "recorded_fact", "statement": f"{medication.name} is active in the synthetic medication list.", "citation_ids": [medication_citation["id"]]})

    if not matched:
        lines.append(
            "- No medication-specific safety rule from the current synthetic bulletin matched the active medication list. "
            "This does not establish that no safety issue exists."
        )
    inference = (
        "The items above are synthetic-data review prompts only. No adverse event or medication error is inferred unless it is explicitly recorded."
    )
    lines.extend(["\nInference boundary:", f"- {inference}"])
    inferences.append({"type": "safety_boundary", "statement": inference})
    return "\n".join(lines), facts, inferences, evidence_documents


def _history_answer(patient: Patient, cite: Any) -> tuple[str, list[dict[str, Any]], list[dict[str, Any]]]:
    facts: list[dict[str, Any]] = []
    lines = ["Recent recorded synthetic history:"]
    for kind, record in _recent_records(patient):
        citation = structured_citation(kind, record, patient.patient_id)
        marker = cite(citation)
        if kind == "encounter":
            statement = f"{record.encounter_date}: {record.encounter_type} at {record.facility} — {record.summary}"
        elif kind == "lab":
            statement = f"{record.collected_on}: {record.test_name} was {record.value} {record.unit} (flag: {record.flag})."
        else:
            statement = f"{record.service_date}: {record.category} claim — {record.description}."
        lines.append(f"- {statement} {marker}")
        facts.append({"type": "recorded_fact", "statement": statement, "citation_ids": [citation["id"]]})
    if len(lines) == 1:
        lines.append("- No recent structured records are available in this synthetic chart.")
    return "\n".join(lines), facts, []


def _evidence_answer(patient: Patient, documents: list[dict[str, Any]], cite: Any) -> tuple[str, list[dict[str, Any]], list[dict[str, Any]]]:
    facts: list[dict[str, Any]] = []
    lines = ["Retrieved evidence relevant to this synthetic record:"]
    # Include one high-signal structured fact when possible.
    risk = calculate_risks(patient)
    if risk["factors"]:
        factor = risk["factors"][0]
        marker = cite(factor["citation"])
        lines.append(f"- Structured record: {factor['evidence']} {marker}")
        facts.append({"type": "recorded_fact", "statement": factor["evidence"], "citation_ids": [factor["citation"]["id"]]})
    doc_facts, doc_lines = _doc_facts(documents, cite, limit=3)
    if doc_lines:
        lines.extend(f"- Document evidence: {line}" for line in doc_lines)
        facts.extend(doc_facts)
    else:
        lines.append("- No matching local document section was retrieved for this wording.")
    return "\n".join(lines), facts, []


def _general_answer(patient: Patient, cite: Any) -> tuple[str, list[dict[str, Any]], list[dict[str, Any]]]:
    facts: list[dict[str, Any]] = []
    lines = [
        f"I found a synthetic profile for {patient.name} ({patient.patient_id}) with "
        f"{len(patient.conditions)} conditions, {len(_active_medications(patient))} active medications, "
        f"{len(patient.labs)} lab results, and {len(patient.encounters)} encounters."
    ]
    if patient.conditions:
        condition = sorted(patient.conditions, key=lambda item: item.diagnosed_on, reverse=True)[0]
        citation = structured_citation("condition", condition, patient.patient_id)
        marker = cite(citation)
        lines.append(f"Most recently dated condition entry: {condition.name} ({condition.status}). {marker}")
        facts.append({"type": "recorded_fact", "statement": f"{condition.name} is recorded as {condition.status}.", "citation_ids": [citation["id"]]})
    lines.append("Ask about risk factors, current medications, recent history, medication safety, or clinical/regulatory evidence for a focused answer.")
    return "\n".join(lines), facts, []


def answer_question(patient: Patient, question: str, include_documents: bool = True, document_limit: int = 4) -> dict[str, Any]:
    """Retrieve structured facts and document chunks, then form a cited fallback answer."""
    normalized = question.casefold()
    documents = retrieve_document_chunks(question, patient.patient_id, document_limit) if include_documents else []
    citations, cite = _unique_citations()

    safety_terms = {"safety", "safe", "interaction", "adverse", "side effect", "side-effect", "contraindication"}
    risk_terms = {"risk", "risks", "risk factor", "risk factors", "elevated"}
    medication_terms = {"medication", "medications", "drug", "drugs", "taking", "current medicine"}
    history_terms = {"history", "recent", "timeline", "summarize", "summary"}
    evidence_terms = {"evidence", "clinical", "regulatory", "document", "guideline", "citation"}

    if any(term in normalized for term in safety_terms):
        answer, facts, inferences, documents = _safety_answer(patient, documents, cite)
        intent = "medication_safety"
    elif any(term in normalized for term in risk_terms):
        answer, facts, inferences = _risk_answer(patient, documents, cite)
        intent = "risk_review"
    elif any(term in normalized for term in medication_terms):
        answer, facts, inferences = _medication_answer(patient, cite)
        intent = "medication_list"
    elif any(term in normalized for term in history_terms):
        answer, facts, inferences = _history_answer(patient, cite)
        intent = "recent_history"
    elif any(term in normalized for term in evidence_terms):
        answer, facts, inferences = _evidence_answer(patient, documents, cite)
        intent = "evidence_retrieval"
    else:
        answer, facts, inferences = _general_answer(patient, cite)
        intent = "general_patient_context"

    return {
        "patient_id": patient.patient_id,
        "question": question,
        "intent": intent,
        "answer": answer,
        "generation_mode": "deterministic_grounded_fallback",
        "facts": facts,
        "inferences": inferences,
        "citations": citations,
        "sources": citations,
        "retrieved_documents": documents,
        "disclaimer": (
            "All evidence is synthetic demo data. The response is a traceable prototype summary, "
            "not medical advice, a diagnosis, or a treatment recommendation."
        ),
    }
