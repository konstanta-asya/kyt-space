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

---

## Значення (не суворий enum у схемі, але фронт має їх знати)

- **role:** `client` | `kutivets` | `admin` | `manager` | `superadmin`
- **equipment.type:** `stationary` | `portable`
- **equipment.status:** `ok` | `repair` | `written_off`
- *(майбутнє, бронювання)* **booking.type:** `rehearsal` | `podcast` | `event`
- *(майбутнє)* **booking.status:** `holding` | `pending` | `confirmed` | `cancelled` | `rejected`

---

## Майбутнє
- Ендпоінти бронювання зʼявляться у спринті 3 — додати сюди, коли будуть.
- **CORS:** бекенд має дозволити origin фронту (`http://localhost:5173`),
  інакше браузер блокуватиме запити фронту — задача VOL-2.
