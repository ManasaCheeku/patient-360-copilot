# Patient 360 & Clinical Evidence Copilot

> **Demo environment — synthetic/de-identified data only.**

Patient 360 & Clinical Evidence Copilot is a hackathon MVP for healthcare and life-sciences teams that need a clear, unified view of member data and supporting clinical evidence. It brings synthetic structured records and locally stored synthetic documents into one evidence-first experience: users can explore a Patient 360 profile, inspect transparent risk drivers, and ask grounded questions with clickable supporting records.

This application is a demonstration tool, **not a clinical decision-support system or medical device**. It never uses real patient data and must not be used to diagnose, treat, or make care decisions.

## Hackathon Demo Brief

**Problem.** Patient records, utilization data, and supporting evidence are often fragmented across separate systems, making it difficult to see what a review prompt is based on.

**Solution.** Patient 360 brings fictional structured records and local evidence documents into one dashboard, with transparent rules and source-linked Copilot answers.

**Key features.** Four views cover the patient profile and timeline, evidence-grounded questions, source documents, and explainable risk factors. The app includes patient selection, labs, encounters, claims, clickable citations, and deterministic responses without an API key.

**Architecture.** The React/Vite frontend calls a FastAPI JSON API. FastAPI reads seeded synthetic records from SQLite and retrieves sections from local Markdown documents. Deterministic services produce risk factors, answers, and citations; no external model is called.

**Technology stack.** React 18, Vite, Tailwind CSS tooling, and Lucide icons; Python, FastAPI, Pydantic, and SQLAlchemy; SQLite and a local Markdown evidence corpus.

**Run locally.** Requires Python 3.10+ and Node.js 18+.

Backend terminal:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python seed.py
uvicorn app.main:app --reload --port 8000
```

Frontend terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL (normally `http://localhost:5173`). The API is at `http://localhost:8000`; its interactive docs are at `/docs`. No API key or external service is required.

**Demo flow (3–5 minutes).** Select a synthetic patient and scan the profile, labs, encounters, and claims; open Risk & Insights and inspect a factor citation; ask Copilot, “What are the major risk factors for this patient and what evidence supports them?”; inspect a cited source; finish in Documents / Evidence by searching for a relevant passage.

**Limitations.** All content is fictional. Risk logic is a small demonstration rule set, not clinically validated; document retrieval uses local lexical matching, not a production search or embedding service. The app has no authentication, audit controls, or production deployment hardening and must not be used with real patient data.

## The problem

EHR and claims records tend to be structured but fragmented; clinical notes, safety bulletins, guidelines, and regulatory material are rich in context but difficult to search alongside the patient record. This makes it hard to quickly answer important questions such as:

- What factors place this member at elevated risk?
- What medications are active, and are there relevant safety considerations?
- Which specific records support this conclusion?

## The solution

The MVP provides a single dashboard with four connected views:

- **Patient 360** — demographics, conditions, medications, allergies, labs, encounters, claims/utilization, and a chronological clinical timeline.
- **Evidence Copilot** — an evidence-grounded question interface that combines retrieved patient facts with relevant synthetic document excerpts.
- **Documents / Evidence** — inspect the underlying synthetic notes, safety bulletins, guidelines, and regulatory references.
- **Risk & Insights** — rule-based, explainable risk flags showing the factor, source evidence, and severity.

Every patient-specific assertion in a copilot answer is returned with evidence citations. The interface distinguishes **retrieved facts** from **inferences** and does not fabricate missing facts.

## Key features

- 8–10+ varied, entirely synthetic patient profiles, seeded into SQLite
- Patient search and selector, including clear synthetic-data labelling throughout the UI
- Structured clinical, laboratory, encounter, medication, allergy, and utilization retrieval
- Local synthetic document corpus, split into sections and ranked with lightweight lexical matching
- Hybrid evidence assembly: structured patient records + relevant document passages
- Transparent rule-based risk stratification instead of opaque prediction
- Deterministic grounded copilot with no API key requirement
- Source cards and citation links that open the corresponding underlying record or document section
- Responsive React dashboard with a professional healthcare/life-sciences visual system

## Architecture

```text
      React + Vite UI  -- HTTP/JSON -->  FastAPI application
                                    |             |
                                    v             v
                              SQLite records   Local Markdown
                                    \             /
                                     v           v
                               Deterministic risk and
                               evidence-answer services
                              facts + citations
```

## Technology stack

| Layer | Technology | Purpose |
| --- | --- | --- |
| Web application | React, Vite, Tailwind CSS, Lucide icons | Responsive dashboard and evidence inspection |
| API | Python, FastAPI, Pydantic | Typed local REST API and OpenAPI documentation |
| Data | SQLite, SQLAlchemy/simple SQL | Reproducible structured synthetic patient data |
| Retrieval | Local document chunks + lightweight relevance matching | Evidence retrieval without external infrastructure |
| Copilot | Deterministic answer engine and local evidence retrieval | Cited responses without external model calls |

## Data flow and citations

```text
Question + selected patient
          |
          v
Retrieve patient records from SQLite
          +------------------------------+
          |                              |
          v                              v
Apply question-aware filters      Retrieve relevant document chunks
          |                              |
          +--------------+---------------+
                         v
          Build evidence context and evaluate risk rules
                         |
                         v
          Return answer, fact/inference labels, and source citations
```

Citations identify a concrete source such as an encounter date, laboratory result, medication record, or document section. Selecting a citation reveals the exact synthetic evidence used. If a fact is unavailable, the copilot says so instead of inferring it.

## Risk stratification

Risk insights use explicit, inspectable rules rather than ML predictions. For example, an elevated cardiovascular-risk flag can be raised by a documented hypertension condition together with an elevated LDL result. Each resulting flag includes:

| Field | Meaning |
| --- | --- |
| Risk factor | The explainable category, such as cardiovascular or medication safety |
| Evidence | The underlying condition, lab, medication, or encounter record |
| Severity | A human-readable tier used only for this demo |
| Source | A navigable citation to the relevant synthetic record/document |

These flags are prototype insights—not diagnoses, risk scores, or recommendations for treatment.

## Project layout

```text
Patient360-Copilot/
├── backend/
│   └── app/                 # FastAPI routes, models, services, utilities
├── frontend/                # React + Vite dashboard
├── data/                    # Seeded SQLite database (generated locally)
├── documents/               # Versioned synthetic evidence documents
├── .env.example             # Reference settings (not loaded automatically)
└── README.md
```

## Local setup

### Prerequisites

- Python 3.10+ (3.11 recommended)
- Node.js 18+ and npm

### Environment

No environment file or API key is needed for the default demo. The root `.env.example` is a reference, not automatically loaded by the backend or frontend. `OPENAI_API_KEY` and `OPENAI_MODEL` are not used; the deterministic Copilot always runs from local synthetic records and evidence.

### 1. Start the backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python seed.py
uvicorn app.main:app --reload --port 8000
```

The API is available at `http://localhost:8000`; interactive API documentation is at `http://localhost:8000/docs`.

### 2. Start the frontend

In a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal (normally `http://localhost:5173`).

### 3. Production frontend check

```powershell
cd frontend
npm run build
```

## API surface

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/patients` | List synthetic patients for search/selection |
| `GET` | `/patients/{patient_id}` | Return the selected patient’s Patient 360 profile |
| `GET` | `/patients/{patient_id}/timeline` | Return chronological clinical events |
| `GET` | `/patients/{patient_id}/risks` | Return explainable rule-based risk factors |
| `GET` | `/patients/{patient_id}/documents` | Return patient-relevant synthetic evidence documents |
| `POST` | `/copilot/query` | Return grounded answer, retrieved facts/inferences, and citations |

## Recommended 3–5 minute demo

1. Open **Patient 360** and select a profile labelled synthetic.
2. Walk through the longitudinal timeline, active medications, recent labs, and utilization records.
3. Open **Risk & Insights** and show the displayed factor, severity, and linked evidence.
4. Go to **Evidence Copilot** and ask: *“What are the major risk factors for this patient and what evidence supports them?”*
5. Inspect the answer’s fact/inference labels and click a citation to reveal the exact source record.
6. Open **Documents / Evidence** to view the cited synthetic safety or clinical document section.
7. Ask: *“Are there any medication safety concerns?”* and show the combined medication record and safety-document evidence.

## Safety and privacy

- All patients, encounters, locations, documents, medication scenarios, and evidence are fictional and synthetic.
- Do not enter, import, upload, or connect any real PHI/PII to this demo.
- Answers are constrained to retrieved data and clearly label inferences.
- Copilot answers use deterministic local logic; no external LLM integration is currently implemented.
- The application is educational/hackathon software only and is not a substitute for professional clinical judgment.

## Validation checklist

Before a demo or submission, run:

```powershell
# Backend (with its virtual environment active)
cd backend
python seed.py
python -m pytest

# Frontend
cd ..\frontend
npm run build
```

Also verify the listed API endpoints in `/docs`, try the two recommended copilot questions with no API key present, and confirm every displayed citation opens a matching synthetic source.

## Future enhancements

- Better local embedding/vector retrieval and document-scoped filtering
- FHIR/OMOP-shaped adapters for controlled enterprise integrations
- User authentication, RBAC, audit logs, and data-governance controls
- Richer evidence ranking and confidence calibration
- Test fixtures and end-to-end browser coverage
- Clinical review workflows that preserve the synthetic-data boundary
