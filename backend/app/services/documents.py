"""Small local document index with deterministic hybrid lexical retrieval.

The index deliberately stays local and transparent for a hackathon MVP: it chunks the
fictional Markdown documents by section, normalizes tokens, and ranks chunks with
cosine-like term overlap plus patient/tag boosts. Structured SQLite retrieval happens
alongside this index in the copilot service.
"""

from __future__ import annotations

import math
import re
from collections import Counter
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any

from ..config import DOCUMENTS_DIR


TOKEN_RE = re.compile(r"[a-zA-Z0-9][a-zA-Z0-9-]{1,}")
SECTION_RE = re.compile(r"^##\s+(.+?)\s*$", re.MULTILINE)

SYNONYM_EXPANSIONS = {
    "risk": {"risk", "hypertension", "ldl", "a1c", "evidence", "cardiometabolic"},
    "safety": {"safety", "monitoring", "medication", "review", "anticoagulant", "insulin"},
    "medications": {"medication", "medications", "drug", "apixaban", "insulin", "methotrexate"},
    "regulatory": {"regulatory", "traceability", "citation", "evidence", "review"},
    "history": {"encounter", "follow-up", "visit", "discharge", "record"},
}


@dataclass(frozen=True)
class DocumentChunk:
    id: str
    document_id: str
    title: str
    source_type: str
    date: str | None
    patient_ids: tuple[str, ...]
    tags: tuple[str, ...]
    section: str
    content: str
    path: str


def _tokens(text: str) -> list[str]:
    return [token.casefold() for token in TOKEN_RE.findall(text)]


def _parse_document(path: Path) -> list[DocumentChunk]:
    raw = path.read_text(encoding="utf-8")
    metadata: dict[str, str] = {}
    body = raw
    if raw.startswith("---\n"):
        _, frontmatter, body = raw.split("---\n", 2)
        for line in frontmatter.splitlines():
            if ":" in line:
                key, value = line.split(":", 1)
                metadata[key.strip()] = value.strip()

    document_id = metadata.get("document_id", path.stem)
    title = metadata.get("title", path.stem.replace("-", " ").title())
    source_type = metadata.get("source_type", "Synthetic document")
    date = metadata.get("date") or None
    patient_ids = tuple(part.strip() for part in metadata.get("patient_ids", "").split(",") if part.strip())
    tags = tuple(part.strip().casefold() for part in metadata.get("tags", "").split(",") if part.strip())

    matches = list(SECTION_RE.finditer(body))
    chunks: list[DocumentChunk] = []
    if not matches:
        content = body.strip()
        if content:
            chunks.append(
                DocumentChunk(
                    id=f"{document_id}#document",
                    document_id=document_id,
                    title=title,
                    source_type=source_type,
                    date=date,
                    patient_ids=patient_ids,
                    tags=tags,
                    section="Document",
                    content=content,
                    path=path.name,
                )
            )
        return chunks

    for index, match in enumerate(matches):
        next_start = matches[index + 1].start() if index + 1 < len(matches) else len(body)
        section = match.group(1).strip()
        content = body[match.end() : next_start].strip()
        slug = re.sub(r"[^a-z0-9]+", "-", section.casefold()).strip("-") or str(index + 1)
        if content:
            chunks.append(
                DocumentChunk(
                    id=f"{document_id}#{slug}",
                    document_id=document_id,
                    title=title,
                    source_type=source_type,
                    date=date,
                    patient_ids=patient_ids,
                    tags=tags,
                    section=section,
                    content=content,
                    path=path.name,
                )
            )
    return chunks


@lru_cache(maxsize=1)
def load_document_chunks() -> tuple[DocumentChunk, ...]:
    chunks: list[DocumentChunk] = []
    for path in sorted(DOCUMENTS_DIR.glob("*.md")):
        chunks.extend(_parse_document(path))
    return tuple(chunks)


def _expanded_query_tokens(question: str) -> Counter[str]:
    tokens = _tokens(question)
    expanded = list(tokens)
    for token in tokens:
        expanded.extend(SYNONYM_EXPANSIONS.get(token, ()))
    return Counter(expanded)


def _score(query: Counter[str], chunk: DocumentChunk, patient_id: str | None) -> float:
    source_tokens = Counter(_tokens(" ".join((chunk.title, chunk.section, chunk.content, " ".join(chunk.tags)))))
    if not source_tokens:
        return 0.0
    dot = sum(query[token] * source_tokens[token] for token in query)
    query_norm = math.sqrt(sum(value * value for value in query.values()))
    source_norm = math.sqrt(sum(value * value for value in source_tokens.values()))
    similarity = dot / (query_norm * source_norm) if dot and query_norm and source_norm else 0.0
    tag_overlap = sum(1 for token in query if token in chunk.tags)
    patient_boost = 0.22 if patient_id and patient_id in chunk.patient_ids else 0.0
    generic_boost = 0.04 if not chunk.patient_ids else 0.0
    return similarity + 0.06 * tag_overlap + patient_boost + generic_boost


def retrieve_document_chunks(question: str, patient_id: str | None = None, limit: int = 4) -> list[dict[str, Any]]:
    """Rank relevant sections and return excerpts plus a reproducible local score."""
    query = _expanded_query_tokens(question)
    scored = [(chunk, _score(query, chunk, patient_id)) for chunk in load_document_chunks()]
    scored.sort(key=lambda item: (-item[1], item[0].document_id, item[0].section))
    chosen = [(chunk, score) for chunk, score in scored if score > 0][:limit]
    if not chosen:
        chosen = [(chunk, 0.0) for chunk in load_document_chunks() if not chunk.patient_ids][:limit]
    return [document_chunk_dict(chunk, score) for chunk, score in chosen]


def document_chunk_dict(chunk: DocumentChunk, relevance_score: float | None = None) -> dict[str, Any]:
    return {
        "id": chunk.id,
        "document_id": chunk.document_id,
        "title": chunk.title,
        "source_type": chunk.source_type,
        "date": chunk.date,
        "patient_ids": list(chunk.patient_ids),
        "tags": list(chunk.tags),
        "section": chunk.section,
        "excerpt": chunk.content,
        "path": chunk.path,
        "relevance_score": round(relevance_score, 4) if relevance_score is not None else None,
    }


def document_citation(chunk_payload: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": f"document:{chunk_payload['id']}",
        "source": chunk_payload["source_type"],
        "source_name": chunk_payload["title"],
        "title": chunk_payload["title"],
        "section": chunk_payload["section"],
        "excerpt": chunk_payload["excerpt"],
        "date": chunk_payload["date"],
        "record_type": "document_chunk",
        "record_id": chunk_payload["id"],
        "patient_id": None,
        "document_id": chunk_payload["document_id"],
        "evidence_url": f"/documents/{chunk_payload['document_id']}",
    }


def list_documents(patient_id: str | None = None) -> list[dict[str, Any]]:
    """Return document-level data with all inspectable chunks, optionally scoped."""
    grouped: dict[str, dict[str, Any]] = {}
    for chunk in load_document_chunks():
        if patient_id and chunk.patient_ids and patient_id not in chunk.patient_ids:
            continue
        item = grouped.setdefault(
            chunk.document_id,
            {
                "document_id": chunk.document_id,
                "title": chunk.title,
                "source_type": chunk.source_type,
                "date": chunk.date,
                "patient_ids": list(chunk.patient_ids),
                "tags": list(chunk.tags),
                "path": chunk.path,
                "chunks": [],
            },
        )
        item["chunks"].append(document_chunk_dict(chunk))
    return sorted(grouped.values(), key=lambda item: (item["date"] or "", item["document_id"]), reverse=True)


def get_document(document_id: str) -> dict[str, Any] | None:
    return next((item for item in list_documents() if item["document_id"] == document_id), None)
