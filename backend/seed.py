"""Recreate the local SQLite demo database using only synthetic records.

Run from the repository root:
    python backend/seed.py
"""

from app.services.seeding import seed_database


if __name__ == "__main__":
    total = seed_database(reset=True)
    print(f"Seeded {total} fully synthetic patients.")
