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

## База даних: локально або Neon
За замовчуванням бекенд ходить у Postgres з `docker compose` (`DATABASE_URL` з `.env.example`).

Для спільного тестування є БД на [Neon](https://neon.com) (Free, регіон Frankfurt),
створена через Vercel → Storage → Neon. Щоб підключитись:
1. У Vercel відкрий базу → вкладка **.env.local** → скопіюй `DATABASE_URL_UNPOOLED`
   (пряма адреса, без `-pooler` у хості — з нею без сюрпризів працює Alembic).
2. Встав її в `backend/.env` як `DATABASE_URL=...` (локальну адресу закоментуй).
   `.env` у `.gitignore` — у чати й коміти пароль не кидаємо.
3. `docker compose up -d --force-recreate backend` — бекенд підхопить нову адресу.

> **pytest — тільки на локальній БД.** Тести створюють поруч базу `<db>_test` і
> видаляють у ній усі таблиці; на Neon це зайве навантаження на free-ліміти.

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
- `GET /bookings/slots`, `POST /bookings`, `POST /bookings/{id}/submit|cancel`, `GET /bookings/me` — бронювання
- `GET /bookings`, `POST /bookings/{id}/confirm|reject`, `/blocked-slots` — кабінет менеджера

Деталі запитів/відповідей — [docs/api-contract.md](docs/api-contract.md).

## Структура
- `backend/app/core/`    — конфіг, підключення до БД, безпека
- `backend/app/modules/` — код за доменами (= за зонами відповідальності команди)
  - `auth/`      — авторизація, користувачі, ролі (Володимир)
  - `rooms/`     — каталог кімнат (Ольга)
  - `equipment/` — облік апаратури (Ольга)
  - `bookings/`  — движок бронювання: слоти, 5-хв hold, заявки, блокування
- `docs/`     — документація, ER-діаграма
- `frontend/` — фронтенд 

## Правила роботи
- Гілка `main` захищена: тільки через Pull Request + review.
- У базу не лізьмо руками — тільки через міграції (Alembic).
