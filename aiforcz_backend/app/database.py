from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
import pathlib

# Get database URL from environment, fallback to SQLite
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    # Use absolute path for SQLite to avoid working directory issues
    db_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    DATABASE_URL = f"sqlite:///{os.path.join(db_dir, 'aiforcz.db')}"

# Handle Render's PostgreSQL connection string (postgres:// -> postgresql://)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# For SQLite we need check_same_thread=False
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()