"""Contract tests for the API consumed by the dashboard."""

from __future__ import annotations

import os

import pytest
from fastapi.testclient import TestClient


@pytest.fixture(scope="module")
def api_client(tmp_path_factory: pytest.TempPathFactory):
    database_path = tmp_path_factory.mktemp("patient360-api") / "patients.db"
    original_database_url = os.environ.get("DATABASE_URL")
    original_api_key = os.environ.pop("OPENAI_API_KEY", None)
    os.environ["DATABASE_URL"] = f"sqlite:///{database_path.as_posix()}"

    from app.main import app

    try:
        with TestClient(app) as client:
            yield client
    finally:
        if original_database_url is None:
            os.environ.pop("DATABASE_URL", None)
        else:
            os.environ["DATABASE_URL"] = original_database_url
        if original_api_key is not None:
            os.environ["OPENAI_API_KEY"] = original_api_key


def test_patient_profile_includes_labs_encounters_and_claims(api_client: TestClient) -> None:
    patient = api_client.get("/patients/P-1001").json()

    assert patient["patient_id"] == "P-1001"
    assert patient["lab_results"][0]["test_name"]
    assert patient["encounters"][0]["encounter_date"]
    assert patient["claims"][0]["service_date"]


def test_dashboard_evidence_endpoints_return_cited_records(api_client: TestClient) -> None:
    timeline = api_client.get("/patients/P-1001/timeline").json()["timeline"]
    risks = api_client.get("/patients/P-1001/risks").json()["risks"]
    documents = api_client.get("/patients/P-1001/documents").json()["documents"]

    assert {event["type"] for event in timeline} >= {"lab", "encounter", "claim"}
    assert all(event["citation"]["excerpt"] for event in timeline)
    assert risks and risks[0]["factors"]
    assert all(factor["citation"]["id"] for risk in risks for factor in risk["factors"])
    assert documents and documents[0]["chunks"]


def test_copilot_remains_deterministic_without_api_key(api_client: TestClient) -> None:
    response = api_client.post(
        "/copilot/query",
        json={"patient_id": "P-1001", "question": "Summarize recent clinical history"},
    )

    assert response.status_code == 200
    answer = response.json()
    assert answer["mode"] == "deterministic_fallback"
    assert answer["generation_mode"] == "deterministic_grounded_fallback"
    assert answer["facts"]
    assert answer["citations"]


def test_unknown_patient_returns_not_found(api_client: TestClient) -> None:
    assert api_client.get("/patients/P-9999").status_code == 404