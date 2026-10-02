from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import settings

engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Базовий клас для всіх моделей (моделі наслідуються від нього).
Base = declarative_base()


def get_db():
    """FastAPI-залежність: одна сесія БД на кожен запит."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
