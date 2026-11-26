# bookings — Booking Engine

Слоти, 5-хв lock, дедлайни запису/скасування, переносна апаратура, блокування слотів.

## Флоу клієнта
1. `GET /bookings/slots?room_id=&date=` — сітка 30-хв слотів: `free` / `busy` / `blocked` (публічно, без даних клієнтів).
2. `POST /bookings` `{room_id, start_time, end_time}` — hold на 5 хв (`holding`). Новий hold скасовує попередній hold цього ж користувача.
3. `POST /bookings/{id}/submit` `{type, comment, equipment: [{equipment_id, quantity}]}` — заявка (`pending`).
4. `GET /bookings/me` — історія; `POST /bookings/{id}/cancel` — скасування.

## Менеджер (`manager`, `superadmin`)
- `GET /bookings?status=pending` — inbox з контактами клієнтів; `?date=&room_id=` — календар.
- `POST /bookings/{id}/confirm` | `/reject`.
- `POST /blocked-slots` (`room_ids: null` = усі кімнати), `GET /blocked-slots`, `DELETE /blocked-slots/{id}`.

## Правила (`service.py`)
- Час — з часовою зоною; правила рахуються в `Europe/Kyiv`.
- Крок 30 хв, у межах `rooms.open_from`–`open_to`, в межах одного дня.
- Дедлайн: на день D — до 20:00 дня D-1 (на сьогодні забронювати не можна).
- `is_members_only` кімнати — лише `kutivets` і вище.
- Скасування — до початку; менш ніж за 24 год → `late_cancel = true`.
- Переносна апаратура: лише `portable` + `ok`; сума по всіх кімнатах на цей час ≤ `total_quantity`
  (рядки `equipment` блокуються `FOR UPDATE`).
- Подвійне бронювання неможливе на рівні БД: EXCLUDE `bookings_no_overlap`.

## Ще не зроблено
Призначення адмінів на слоти, `audit_logs`, перевірка блокувань при confirm.
