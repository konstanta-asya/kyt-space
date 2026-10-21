"""Наповнення БД тестовими даними для локальної розробки.

Запуск: docker compose exec backend python -m app.seed
Скрипт ідемпотентний — повторний запуск не створює дублів.

Тестові користувачі (пароль у всіх — password123):
    client@example.com    — клієнт
    kutivets@example.com  — кутівець
    admin@example.com     — адміністратор
"""

from datetime import time

from app.core.db import SessionLocal
from app.modules.auth.models import Role, User
from app.modules.auth.service import get_user_by_email, hash_password
from app.modules.equipment.models import Equipment, EquipmentStatus, EquipmentType
from app.modules.rooms.models import Room

TEST_PASSWORD = "password123"

USERS = [
    dict(full_name="Тестовий Клієнт", email="client@example.com", role=Role.CLIENT, phone="+380501234567"),
    dict(full_name="Тестова Кутівчиня", email="kutivets@example.com", role=Role.KUTIVETS, phone=None),
    dict(full_name="Тестовий Адмін", email="admin@example.com", role=Role.ADMIN, phone=None),
]

ROOMS = [
    dict(
        name="Репетиційна №2",
        description="Репетиційна кімната.",
        capacity=6,
        area=25,
        is_members_only=False,
        open_from=time(9, 0),
        open_to=time(21, 0),
    ),
    dict(
        name="Репетиційна №3",
        description="Репетиційна кімната.",
        capacity=10,
        area=40,
        is_members_only=False,
        open_from=time(9, 0),
        open_to=time(21, 0),
    ),
    dict(
        name="Звукарська/Подкаст-студія",
        description="Звукоізольована студія для запису подкастів.",
        capacity=4,
        area=15,
        is_members_only=False,
        open_from=time(9, 0),
        open_to=time(21, 0),
    ),
    dict(
        name="Лаунж",
        description="Зона відпочинку — лише для кутівців.",
        capacity=15,
        area=50,
        is_members_only=True,
        open_from=time(9, 0),
        open_to=time(21, 0),
    ),
    dict(
        name="Переговорка",
        description="Кімната для зустрічей — лише для кутівців.",
        capacity=8,
        area=20,
        is_members_only=True,
        open_from=time(9, 0),
        open_to=time(21, 0),
    ),
]


def stationary(room_name, name, status=EquipmentStatus.OK):
    return dict(room_name=room_name, name=name, type=EquipmentType.STATIONARY, status=status, total_quantity=None)


def portable(name, total_quantity):
    return dict(
        room_name=None,
        name=name,
        type=EquipmentType.PORTABLE,
        status=EquipmentStatus.OK,
        total_quantity=total_quantity,
    )


EQUIPMENT = [
    stationary("Репетиційна №2", "Барабанна установка"),
    stationary("Репетиційна №3", "Гітарний підсилювач", EquipmentStatus.REPAIR),
    stationary("Звукарська/Подкаст-студія", "Аудіомікшер"),
    stationary("Репетиційна №2", "Бас-комбо Ampeg"),
    stationary("Репетиційна №2", "Вокальна система"),
    stationary("Репетиційна №3", "Барабанна установка Gretsch"),
    stationary("Репетиційна №3", "Клавішні Yamaha"),
    stationary("Репетиційна №3", "Бас-комбо Fender"),
    stationary("Звукарська/Подкаст-студія", "Мікрофони Rode PodMic"),
    stationary("Звукарська/Подкаст-студія", "Студійні монітори", EquipmentStatus.REPAIR),
    stationary("Лаунж", "Проєктор"),
    stationary("Переговорка", "Телевізор для презентацій"),
    portable("Мікрофон", 3),
    portable("Кабель XLR", 5),
]


def seed_rooms(db) -> None:
    for data in ROOMS:
        if db.query(Room).filter(Room.name == data["name"]).first():
            continue
        db.add(Room(**data))


def seed_equipment(db) -> None:
    for data in EQUIPMENT:
        if db.query(Equipment).filter(Equipment.name == data["name"]).first():
            continue
        room_id = None
        if data["room_name"] is not None:
            room = db.query(Room).filter(Room.name == data["room_name"]).first()
            room_id = room.id if room else None
        db.add(
            Equipment(
                room_id=room_id,
                name=data["name"],
                type=data["type"].value,
                status=data["status"].value,
                total_quantity=data["total_quantity"],
            )
        )


def seed_users(db) -> None:
    missing = [data for data in USERS if not get_user_by_email(db, data["email"])]
    if not missing:
        return
    # bcrypt повільний, тож хешуємо спільний пароль один раз
    password_hash = hash_password(TEST_PASSWORD)
    for data in missing:
        db.add(
            User(
                full_name=data["full_name"],
                email=data["email"],
                password_hash=password_hash,
                role=data["role"].value,
                phone=data["phone"],
            )
        )


def main() -> None:
    db = SessionLocal()
    try:
        seed_rooms(db)
        db.flush()
        seed_equipment(db)
        seed_users(db)
        db.commit()
    finally:
        db.close()
    print("Готово.")


if __name__ == "__main__":
    main()
