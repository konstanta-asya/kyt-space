"""Тести ходять в окрему БД `<основна>_test` у тому ж Postgres.

Схема створюється один раз на сесію, а кожен тест працює всередині
транзакції, яку в кінці відкочуємо, тож тести не бачать дані один одного.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.db import Base, get_db
from app.main import app
from app.modules.auth import models as _auth_models  # noqa: F401 — реєструє таблиці в Base
from app.modules.rooms import models as _rooms_models  # noqa: F401

TEST_DB_URL = make_url(settings.database_url).set(
    database=f"{make_url(settings.database_url).database}_test"
)


@pytest.fixture(scope="session")
def engine():
    admin = create_engine(TEST_DB_URL.set(database="postgres"), isolation_level="AUTOCOMMIT")
    with admin.connect() as conn:
        exists = conn.execute(
            text("SELECT 1 FROM pg_database WHERE datname = :name"), {"name": TEST_DB_URL.database}
        ).scalar()
        if not exists:
            conn.execute(text(f'CREATE DATABASE "{TEST_DB_URL.database}"'))
    admin.dispose()

    engine = create_engine(TEST_DB_URL)
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    yield engine
    engine.dispose()


@pytest.fixture
def db(engine):
    with engine.connect() as conn:
        tx = conn.begin()
        # commit() у коді сервісу лише закриває savepoint — зовнішня транзакція лишається.
        session = Session(bind=conn, join_transaction_mode="create_savepoint")
        yield session
        session.close()
        tx.rollback()


@pytest.fixture
def client(db):
    app.dependency_overrides[get_db] = lambda: db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
