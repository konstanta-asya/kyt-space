# Контракт API — KYT Space

Домовленість між фронтендом і бекендом про формат спілкування.
Джерело істини — Swagger: http://localhost:8000/docs

---

## Загальне

- **Базовий URL (локально):** `http://localhost:8000`
- **Формат обміну:** JSON (`Content-Type: application/json`)
- **Версія:** 0.1.0 (OpenAPI 3.1)

### Авторизація
- Захищені ендпоінти вимагають заголовок:
  ```
  Authorization: Bearer <access_token>
  ```
- Токен отримується через `POST /auth/login` (поле `access_token`).
- Термін дії токена: **1 година**. Після протухання запити дадуть `401` —
  фронт має обробити це (попросити перелогінитись).
- Приклад захищеного ендпоінта: `GET /auth/me`.

### CORS
- Бекенд дозволяє запити з `http://localhost:5173` і `http://127.0.0.1:5173`
  (Vite dev-сервер). Інший порт/домен — додати в `CORS_ORIGINS` у `backend/.env`
  (JSON-список).
- Токен передається лише заголовком `Authorization`, cookies не використовуються,
  тож `credentials: 'include'` у `fetch` не потрібен.

### Формат дати/часу
- ISO з `Z`, напр. `"2026-09-27T10:17:03.565391Z"` (поле `created_at`) та
  `"13:18:08.777Z"` (поля `open_from`, `open_to`). Фронт має парсити цей формат.

### Формат помилок
- Проста помилка (FastAPI):
  ```json
  { "detail": "текст помилки" }
  ```
- Помилка валідації (`422`, схема `HTTPValidationError`):
  ```json
  { "detail": [ { "loc": ["body","password"], "msg": "...", "type": "..." } ] }
  ```
  Фронт може показувати користувачу `detail[].msg`.
- Коди: `200` успіх, `201` створено, `400` (напр. зайнятий email), `401` (немає/
  невірний/протухлий токен або невірний логін), `403` (немає прав за роллю),
  `404` (не знайдено), `422` (валідація).

---

## Ендпоінти

### auth
| Метод | Шлях | Опис | Токен? | Запит | Відповідь |
| --- | --- | --- | --- | --- | --- |
| POST | `/auth/register` | Реєстрація | ні | `RegisterRequest` | `201` → `UserResponse` |
| POST | `/auth/login` | Логін | ні | `LoginRequest` | `200` → `TokenResponse` |
| GET | `/auth/me` | Поточний користувач | **так** | — | `200` → `UserResponse` |

### rooms (усі публічні — токен не потрібен)
| Метод | Шлях | Опис | Токен? | Відповідь |
| --- | --- | --- | --- | --- |
| GET | `/rooms` | Список кімнат | ні | `200` → `RoomResponse[]` |
| GET | `/rooms/{room_id}` | Одна кімната | ні | `200` → `RoomResponse`, `404` якщо нема |
| GET | `/rooms/{room_id}/equipment` | Апаратура кімнати | ні | `200` → `EquipmentResponse[]` |

### equipment (публічний)
| Метод | Шлях | Опис | Токен? | Відповідь |
| --- | --- | --- | --- | --- |
| GET | `/equipment` | Список апаратури | ні | `200` → `EquipmentResponse[]` |

### bookings
Флоу клієнта: сітка → `POST /bookings` (слот тримається 5 хв, `holding`) → `submit` (`pending`)
→ менеджер `confirm`/`reject`. Новий hold скасовує попередній hold цього ж користувача.

| Метод | Шлях | Опис | Токен? | Запит | Відповідь |
| --- | --- | --- | --- | --- | --- |
| GET | `/bookings/slots?room_id=&date=YYYY-MM-DD` | Сітка 30-хв слотів на день | ні | — | `200` → `SlotResponse[]` |
| POST | `/bookings` | Тримати слот 5 хв | **так** | `HoldRequest` | `201` → `BookingResponse` |
| POST | `/bookings/{id}/submit` | Подати заявку | **так** (власник) | `SubmitRequest` | `200` → `BookingResponse` |
| GET | `/bookings/me` | Мої бронювання | **так** | — | `200` → `BookingResponse[]` |
| POST | `/bookings/{id}/cancel` | Скасувати | **так** (власник) | — | `200` → `BookingResponse` |
| GET | `/bookings?status=&room_id=&date=` | Inbox / календар | manager, superadmin | — | `200` → `ManagerBookingResponse[]` |
| POST | `/bookings/{id}/confirm` | Підтвердити | manager, superadmin | — | `200` → `ManagerBookingResponse` |
| POST | `/bookings/{id}/reject` | Відхилити | manager, superadmin | — | `200` → `ManagerBookingResponse` |

Помилки (`detail` — текст): `400` час не на сітці / поза режимом роботи / минув дедлайн 20:00,
`403` кімната лише для кутівців, `404` кімнату/бронювання не знайдено (чуже бронювання теж `404`),
`409` слот зайнятий або заблокований, hold протух, апаратури не вистачає, неможливий перехід статусу.

### blocked-slots (manager, superadmin)
| Метод | Шлях | Опис | Запит | Відповідь |
| --- | --- | --- | --- | --- |
| POST | `/blocked-slots` | Заблокувати (`room_ids: null` = усі кімнати) | `BlockRequest` | `201` → `BlockedSlotResponse[]` |
| GET | `/blocked-slots?room_id=&date=` | Список блокувань | — | `200` → `BlockedSlotResponse[]` |
| DELETE | `/blocked-slots/{id}` | Зняти блокування | — | `204` |

### інше
| Метод | Шлях | Опис |
| --- | --- | --- |
| GET | `/health` | Сервер живий → `{"status":"ok"}` |

---

## Обʼєкти (схеми) — звірено наживо

### RegisterRequest (тіло `POST /auth/register`)
```json
{
  "full_name": "string",   // обовʼязкове, 1–255 символів
  "email": "string",       // обовʼязкове, формат email
  "password": "string",    // обовʼязкове, 8–72 символи
  "phone": "string|null"   // НЕобовʼязкове, ≤ 30 символів
}
```
> Фронт валідує у формі: пароль 8–72, email-формат, імʼя не порожнє — щоб
> показати помилку одразу, не чекаючи 422 від бекенду.

Приклад відповіді (`201`):
```json
{
  "id": 2,
  "full_name": "Test User",
  "email": "test@test.com",
  "role": "client",
  "phone": null,
  "created_at": "2026-10-02T12:13:46.866296Z"
}
```

### LoginRequest (тіло `POST /auth/login`)
```json
{
  "email": "string",     // обовʼязкове
  "password": "string"   // обовʼязкове
}
```

### TokenResponse (відповідь `POST /auth/login`)
```json
{
  "access_token": "string",
  "token_type": "bearer"
}
```

### UserResponse (відповідь `/auth/register`, `/auth/me`)
```json
{
  "id": 1,
  "full_name": "string",
  "email": "string",
  "role": "client",            // enum, див. нижче
  "phone": "string|null",
  "created_at": "datetime (ISO ...Z)"
}
```
> Пароль у відповіді НЕ повертається.

### RoomResponse (відповідь `/rooms`, `/rooms/{id}`)
```json
{
  "id": 0,                       // integer, обовʼязкове
  "name": "string",              // обовʼязкове
  "description": "string|null",
  "capacity": "integer|null",
  "area": "number|null",         // саме number (не рядок!)
  "photo_url": "string|null",
  "is_members_only": true,       // boolean
  "open_from": "time (ISO ...Z)",
  "open_to": "time (ISO ...Z)"
}
```
> Багато полів nullable — фронт має бути готовий до `null` і не ламатись.

### EquipmentResponse (відповідь `/equipment`, `/rooms/{id}/equipment`)
```json
{
  "id": 0,                          // integer, обовʼязкове
  "room_id": "integer|null",        // null для переносного обладнання
  "name": "string",
  "type": "string",                 // значення: stationary | portable
  "status": "string",               // значення: ok | repair | written_off
  "total_quantity": "integer|null"  // null для стаціонарного
}
```

### Бронювання: час
- У запитах — ISO **з часовою зоною**: `"2026-12-02T18:00:00+02:00"` (без зони → `422`).
- Крок 30 хв (`:00`/`:30`), у межах `open_from`–`open_to` кімнати, в один день.
- Дедлайн: на день D бронювати можна до **20:00 (Київ) дня D-1**; на сьогодні — не можна.
- Скасування менш ніж за 24 год до початку дозволене, але `late_cancel = true` (штрафне).

### SlotResponse (відповідь `/bookings/slots`)
```json
{ "start_time": "datetime", "end_time": "datetime", "status": "free" }  // без даних клієнта
```

### HoldRequest (тіло `POST /bookings`)
```json
{ "room_id": 1, "start_time": "datetime+zone", "end_time": "datetime+zone" }
```

### SubmitRequest (тіло `POST /bookings/{id}/submit`)
```json
{
  "type": "rehearsal",                               // за замовчуванням rehearsal
  "comment": "string|null",                          // ≤ 1000 символів
  "equipment": [{ "equipment_id": 5, "quantity": 2 }] // лише portable + ok; можна []
}
```
> Переносна апаратура спільна для всіх кімнат: на той самий час сума по всіх
> бронюваннях ≤ `total_quantity`, інакше `409`.

### BookingResponse
```json
{
  "id": 1,
  "room_id": 1,
  "start_time": "datetime",
  "end_time": "datetime",
  "type": "rehearsal",
  "status": "holding",
  "hold_expires_at": "datetime|null",   // лише для holding — показати таймер
  "comment": "string|null",
  "created_at": "datetime",
  "cancelled_at": "datetime|null",
  "late_cancel": false,
  "equipment": [{ "equipment_id": 5, "quantity": 2 }]
}
```
`ManagerBookingResponse` = `BookingResponse` + `"user": { "id", "full_name", "email", "phone" }`.

### BlockRequest / BlockedSlotResponse
```json
{ "room_ids": [1, 2] /* або null = усі */, "start_time": "datetime+zone", "end_time": "datetime+zone", "reason": "string|null" }
{ "id": 1, "room_id": 1, "start_time": "datetime", "end_time": "datetime", "reason": "string|null", "created_by": 3 }
```

---

## Значення (не суворий enum у схемі, але фронт має їх знати)

- **role:** `client` | `kutivets` | `admin` | `manager` | `superadmin`
- **equipment.type:** `stationary` | `portable`
- **equipment.status:** `ok` | `repair` | `written_off`
- **booking.type:** `rehearsal` | `podcast` | `event`
- **booking.status:** `holding` | `pending` | `confirmed` | `cancelled` | `rejected`
- **slot.status:** `free` | `busy` | `blocked`
