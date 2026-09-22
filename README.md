# KYT Space

Веб-система автоматизованого бронювання та обліку ресурсів СО «КУТ».

## Стек
- **Backend:** FastAPI + SQLAlchemy (+ Alembic для міграцій)
- **DB:** PostgreSQL 16
- **Frontend:** _не визначено — обирається командою_ (тека `frontend/` — плейсхолдер)
- **Інфраструктура:** Docker Compose

## Запуск (backend + db)
```bash
cp backend/.env.example backend/.env
docker compose up --build
```
- API:     http://localhost:8000/health
- Swagger: http://localhost:8000/docs

## Структура
- `backend/app/core/`    — конфіг, підключення до БД, безпека
- `backend/app/modules/` — код за доменами (= за зонами відповідальності команди)
  - `auth/`      — авторизація, користувачі, ролі (Ольга)
  - `rooms/`     — каталог кімнат (Володимир)
  - `equipment/` — облік апаратури (Володимир)
  - `bookings/`  — движок бронювання (фаза 2)
- `docs/`     — документація, ER-діаграма
- `frontend/` — фронтенд (стек TBD)

## Правила роботи
- Гілка `main` захищена: тільки через Pull Request + review.
- У базу не лізьмо руками — тільки через міграції (Alembic).
