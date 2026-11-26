# ER-діаграма — KYT Space

```mermaid
erDiagram
    users ||--o{ bookings : ""
    rooms ||--o{ bookings : ""
    rooms ||--o{ equipment : ""
    bookings ||--o{ booking_equipment : ""
    equipment ||--o{ booking_equipment : ""
    rooms ||--o{ blocked_slots : ""
    users ||--o{ blocked_slots : ""
    users ||--o{ admin_shifts : ""
    users ||--o{ audit_logs : ""

    users {
        int id PK
        string full_name
        string email UK
        string password_hash
        enum role
        string phone
        timestamp created_at
    }
    rooms {
        int id PK
        string name
        text description
        int capacity
        numeric area
        string photo_url
        bool is_members_only
        time open_from "NOT NULL, 09:00"
        time open_to "NOT NULL, 21:00"
    }
    equipment {
        int id PK
        int room_id FK
        string name
        enum type
        enum status
        int total_quantity
    }
    bookings {
        int id PK
        int user_id FK
        int room_id FK
        timestamptz start_time
        timestamptz end_time
        enum type
        enum status
        timestamptz hold_expires_at
        text comment
        timestamptz created_at
        timestamptz cancelled_at
        bool late_cancel
        int reviewed_by FK
    }
    booking_equipment {
        int booking_id PK,FK
        int equipment_id PK,FK
        int quantity
    }
    blocked_slots {
        int id PK
        int room_id FK
        timestamptz start_time
        timestamptz end_time
        string reason
        int created_by FK
        timestamptz created_at
    }
    admin_shifts {
        int id PK
        int user_id FK
        date shift_date
        time start_time
        time end_time
    }
    audit_logs {
        int id PK
        int user_id FK
        string action
        string entity
        timestamp created_at
        json details
    }
```

## Зв'язки (дії)
- **users → bookings** — користувач *робить* бронювання (1 : багато)
- **rooms → bookings** — кімната *приймає* бронювання
- **rooms → equipment** — за кімнатою *закріплено* стаціонарне обладнання
- **bookings ↔ equipment** (через `booking_equipment`) — бронювання *містить* переносне обладнання (багато-до-багатьох, з кількістю на слот)
- **rooms → blocked_slots** — кімнату *блокують* (форс-мажор, відключення світла)
- **users → blocked_slots** — менеджер *створює* блокування
- **users → admin_shifts** — адмін/звукар *призначає себе* на зміну
- **users → audit_logs** — користувач *виконує* дію (запис у лог)

## Легенда полів
- `users.role` — `client` | `kutivets` | `admin` | `manager` | `superadmin`
- `rooms.is_members_only` — `true` для Лаунжу та Переговорки (лише кутівцям)
- `equipment.room_id` — nullable; заповнене для стаціонарного, порожнє для переносного
- `equipment.type` — `stationary` | `portable`; `status` — `ok` | `repair` | `written_off`
- `equipment.total_quantity` — ліміт переносного (напр. 3 мікрофони)
- `bookings.type` — `rehearsal` | `podcast` | `event`
- `bookings.status` — `holding` | `pending` | `confirmed` | `cancelled` | `rejected`
- `bookings.hold_expires_at` — час протухання 5-хв lock
- `bookings` — `EXCLUDE USING gist (room_id WITH =, tstzrange(start_time, end_time) WITH &&) WHERE status IN ('holding','pending','confirmed')` (потрібне розширення `btree_gist`). Прострочені hold сервіс видаляє перед створенням нового
- `bookings.late_cancel` — скасовано менш ніж за 24 год до початку (штрафне)
- `bookings.reviewed_by` — менеджер, що підтвердив/відхилив заявку
- `blocked_slots.room_id` — NOT NULL; масове блокування = по рядку на кожну кімнату
- Усі часи — `timestamptz`; бізнес-правила (дедлайн 20:00, режим роботи) рахуються в `Europe/Kyiv`
