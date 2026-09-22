# bookings — Booking Engine (фаза 2)
НЕ в перший тиждень. Найризикованіша частина: слоти, 5-хв lock,
дедлайни запису/скасування, захист від race condition
(PostgreSQL EXCLUDE constraint + btree_gist).
