"""Central configuration for the local, synthetic-data demo."""

from __future__ import annotations

import os
from pathlib import Path


BACKEND_ROOT = Path(__file__).resolve().parents[1]
PROJECT_ROOT = BACKEND_ROOT.parent
DATA_DIR = PROJECT_ROOT / "data"
DOCUMENTS_DIR = PROJECT_ROOT / "documents"
DEFAULT_DB_PATH = DATA_DIR / "patient360.db"


def _sqlite_url(path: Path) -> str:
    return f"sqlite:///{path.as_posix()}"


DATABASE_URL = os.getenv("DATABASE_URL", _sqlite_url(DEFAULT_DB_PATH))
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")
RISK_AS_OF_DATE = os.getenv("RISK_AS_OF_DATE", "2026-10-01")
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")
    if origin.strip()
]

SYNTHETIC_DATA_NOTICE = (
    "Demo environment — synthetic/de-identified data only. "
    "Not medical advice or a clinical decision-support system."
)
