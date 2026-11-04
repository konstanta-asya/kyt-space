# bookings — Booking Engine (фаза 2)

## Зроблено (ядро)
- Таблиця `bookings`, `POST /bookings`, `GET /bookings`, `GET /bookings/{id}` (лише з токеном).
- Захист від подвійного бронювання в БД: EXCLUDE-констрейнт `bookings_no_overlap`
  (`room_id WITH =`, `tstzrange(start_time, end_time, '[)') WITH &&`, потребує `btree_gist`).
  Межі `[start, end)` — стикові слоти не конфліктують. Скасовані/відхилені броні слот не тримають.
  Перетин → HTTP 409.

## Далі
5-хв lock слота (`hold_expires_at`), дедлайни запису/скасування, скасування/редагування,
блокування слотів менеджером, обмеження за ролями та кабінетами.
