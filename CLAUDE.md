# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

KYT Space — a booking and resource-tracking web system for the "КУТ" student organization (rooms, equipment, bookings). The team writes docs, code comments and commit messages in Ukrainian; keep that convention. Commits use Conventional Commit prefixes, e.g. `feat(auth): ...`.

Stack: FastAPI + SQLAlchemy 2.0 (legacy `Column` / `declarative_base` style) + Alembic, PostgreSQL 16, Docker Compose. `frontend/` is only a placeholder for now (React + Vite + React Router is planned).

## Commands

Everything runs through Docker Compose from the repo root:

```bash
cp backend/.env.example backend/.env      # first time only
docker compose up --build                 # db + backend (uvicorn --reload, ./backend mounted into /code)
docker compose exec backend alembic upgrade head
docker compose exec backend alembic revision --autogenerate -m "<message>"
```

- API: http://localhost:8000/health, Swagger: http://localhost:8000/docs
- `DATABASE_URL` in `.env` points at host `db`. To run the backend or Alembic outside Docker, change it to `localhost:5432`.
- There is no test suite, linter or formatter configured yet.

## Architecture

- `backend/app/main.py` creates the FastAPI app and mounts each module's router, e.g. `app.include_router(auth_router, prefix="/auth")`. A new module is not reachable until its router is added here.
- `backend/app/core/`: `config.py` has the pydantic-settings `Settings`, which reads `.env`. `db.py` has `engine`, `Base` and the `get_db` per-request session dependency.
- `backend/app/modules/<domain>/` holds code organized by domain, and the domains match the team's areas of ownership: `auth`, `rooms`, `equipment` and `bookings` (phase 2). Each module follows the layout `models.py` / `schemas.py` / `service.py` / `router.py`:
  - `service.py` holds the DB and business logic and raises domain exceptions (e.g. `EmailAlreadyRegistered`).
  - `router.py` translates those exceptions into `HTTPException`.
  - The module's `README.md` describes its intended scope.
- **Auth and permissions**: other modules protect endpoints with `get_current_user` and `require_role(...)` from `app/modules/auth/dependencies.py`. A missing or invalid token gives 401, and a wrong role gives 403. JWTs (PyJWT, HS256) carry `user_id` and `role`. Roles are the `Role` str-enum in `auth/models.py` (`client`, `kutivets`, `admin`, `manager`, `superadmin`), but `users.role` is stored as a plain string column, not a DB enum. Emails are lowercased on register and on lookup.
- **Migrations**: `alembic/env.py` takes the DB URL from `settings`, not from `alembic.ini`. It imports every module's `models` so they register on `Base.metadata`. **When you add a new models file, add its import to `env.py`**, or autogenerate won't see it. Never change the schema by hand; only through Alembic migrations.
- `docs/er-diagram.md` is the target data model (Mermaid ER), including tables that don't exist yet: `equipment`, `bookings`, `booking_equipment`, `blocked_slots`, `admin_shifts` and `audit_logs`. It also lists the planned enum values and field semantics. Follow it when implementing new models.
- The bookings engine (planned) needs slots, a 5-minute hold (`bookings.hold_expires_at`), and protection against race conditions using a PostgreSQL `EXCLUDE` constraint + `btree_gist`.

## Gotchas

- The dependency pins in `requirements.txt` are deliberate. `sqlalchemy<2.1` is needed because 2.1 defaults to the psycopg v3 driver and this project uses psycopg2. `bcrypt==4.0.1` is needed because passlib 1.7.4 breaks with newer bcrypt.
- Passwords are capped at 72 characters in `RegisterRequest` because bcrypt only uses the first 72 bytes.

## Workflow

`main` is protected, so changes go through a Pull Request with review.
