# KYT Space

Веб-система автоматизованого бронювання та обліку ресурсів СО «КУТ».

## Стек
- **Backend:** FastAPI + SQLAlchemy (+ Alembic для міграцій)
- **DB:** PostgreSQL 16
- **Frontend:** React + Vite + React Router (CSS)
- **Інфраструктура:** Docker Compose

## Запуск (backend + db)
```bash
cp backend/.env.example backend/.env
docker compose up --build
```
- API:     http://localhost:8000/health
- Swagger: http://localhost:8000/docs

## Міграції та тестові дані
```bash
docker compose exec backend alembic upgrade head
docker compose exec backend python -m app.seed
```
Seed-скрипт наповнює `rooms` і `equipment` тестовими даними, ідемпотентний
(повторний запуск не створює дублів).

## Ендпоінти
- `GET /health` — health-check
- `POST /auth/register`, `POST /auth/login`, `GET /auth/me` — авторизація
- `GET /rooms`, `GET /rooms/{id}` — каталог кімнат
- `GET /rooms/{id}/equipment` — апаратура конкретної кімнати
- `GET /equipment` (опційно `?room_id=`) — список апаратури

## Структура
- `backend/app/core/`    — конфіг, підключення до БД, безпека
- `backend/app/modules/` — код за доменами (= за зонами відповідальності команди)
  - `auth/`      — авторизація, користувачі, ролі (Володимир)
  - `rooms/`     — каталог кімнат (Ольга)
  - `equipment/` — облік апаратури (Ольга)
  - `bookings/`  — движок бронювання (фаза 2)
- `docs/`     — документація, ER-діаграма
- `frontend/` — фронтенд 

## Правила роботи
- Гілка `main` захищена: тільки через Pull Request + review.
- У базу не лізьмо руками — тільки через міграції (Alembic).
