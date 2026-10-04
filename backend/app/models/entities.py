"""Normalized SQLAlchemy models for fully synthetic patient records."""

from __future__ import annotations

from sqlalchemy import Boolean, Date, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base


class Patient(Base):
    __tablename__ = "patients"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    patient_id: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120))
    age: Mapped[int] = mapped_column(Integer)
    gender: Mapped[str] = mapped_column(String(40))
    location: Mapped[str] = mapped_column(String(120))
    synthetic_profile: Mapped[str | None] = mapped_column(Text, nullable=True)

    conditions: Mapped[list["Condition"]] = relationship(
        back_populates="patient", cascade="all, delete-orphan", order_by="Condition.diagnosed_on"
    )
    medications: Mapped[list["Medication"]] = relationship(
        back_populates="patient", cascade="all, delete-orphan", order_by="Medication.started_on"
    )
    allergies: Mapped[list["Allergy"]] = relationship(
        back_populates="patient", cascade="all, delete-orphan"
    )
    labs: Mapped[list["LabResult"]] = relationship(
        back_populates="patient", cascade="all, delete-orphan", order_by="LabResult.collected_on"
    )
    encounters: Mapped[list["Encounter"]] = relationship(
        back_populates="patient", cascade="all, delete-orphan", order_by="Encounter.encounter_date"
    )
    claims: Mapped[list["Claim"]] = relationship(
        back_populates="patient", cascade="all, delete-orphan", order_by="Claim.service_date"
    )


class Condition(Base):
    __tablename__ = "conditions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"), index=True)
    name: Mapped[str] = mapped_column(String(160))
    status: Mapped[str] = mapped_column(String(40), default="active")
    diagnosed_on: Mapped[str] = mapped_column(String(10))
    code: Mapped[str | None] = mapped_column(String(32), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    patient: Mapped[Patient] = relationship(back_populates="conditions")


class Medication(Base):
    __tablename__ = "medications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"), index=True)
    name: Mapped[str] = mapped_column(String(160))
    dose: Mapped[str] = mapped_column(String(80))
    route: Mapped[str] = mapped_column(String(40), default="oral")
    frequency: Mapped[str] = mapped_column(String(80))
    status: Mapped[str] = mapped_column(String(40), default="active")
    started_on: Mapped[str] = mapped_column(String(10))
    indication: Mapped[str | None] = mapped_column(String(160), nullable=True)

    patient: Mapped[Patient] = relationship(back_populates="medications")


class Allergy(Base):
    __tablename__ = "allergies"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"), index=True)
    substance: Mapped[str] = mapped_column(String(160))
    reaction: Mapped[str] = mapped_column(String(160))
    severity: Mapped[str] = mapped_column(String(40))

    patient: Mapped[Patient] = relationship(back_populates="allergies")


class LabResult(Base):
    __tablename__ = "lab_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"), index=True)
    test_name: Mapped[str] = mapped_column(String(160))
    value: Mapped[str] = mapped_column(String(80))
    numeric_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    unit: Mapped[str] = mapped_column(String(40))
    reference_range: Mapped[str] = mapped_column(String(80))
    flag: Mapped[str] = mapped_column(String(24), default="normal")
    collected_on: Mapped[str] = mapped_column(String(10))

    patient: Mapped[Patient] = relationship(back_populates="labs")


class Encounter(Base):
    __tablename__ = "encounters"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"), index=True)
    encounter_date: Mapped[str] = mapped_column(String(10))
    encounter_type: Mapped[str] = mapped_column(String(80))
    facility: Mapped[str] = mapped_column(String(160))
    summary: Mapped[str] = mapped_column(Text)
    disposition: Mapped[str | None] = mapped_column(String(80), nullable=True)

    patient: Mapped[Patient] = relationship(back_populates="encounters")


class Claim(Base):
    __tablename__ = "claims"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"), index=True)
    service_date: Mapped[str] = mapped_column(String(10))
    category: Mapped[str] = mapped_column(String(100))
    description: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(40))
    amount: Mapped[float] = mapped_column(Float)

    patient: Mapped[Patient] = relationship(back_populates="claims")
