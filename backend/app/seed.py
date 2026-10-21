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
from app.modules.auth.service import hash_password
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

EQUIPMENT = [
    dict(
        room_name="Репетиційна №2",
        name="Барабанна установка",
        type=EquipmentType.STATIONARY,
        status=EquipmentStatus.OK,
        total_quantity=None,
    ),
    dict(
        room_name="Репетиційна №3",
        name="Гітарний підсилювач",
        type=EquipmentType.STATIONARY,
        status=EquipmentStatus.REPAIR,
        total_quantity=None,
    ),
    dict(
        room_name="Звукарська/Подкаст-студія",
        name="Аудіомікшер",
        type=EquipmentType.STATIONARY,
        status=EquipmentStatus.OK,
        total_quantity=None,
    ),
    dict(
        room_name="Репетиційна №2",
        name="Бас-комбо Ampeg",
        type=EquipmentType.STATIONARY,
        status=EquipmentStatus.OK,
        total_quantity=None,
    ),
    dict(
        room_name="Репетиційна №2",
        name="Вокальна система",
        type=EquipmentType.STATIONARY,
        status=EquipmentStatus.OK,
        total_quantity=None,
    ),
    dict(
        room_name="Репетиційна №3",
        name="Барабанна установка Gretsch",
        type=EquipmentType.STATIONARY,
        status=EquipmentStatus.OK,
        total_quantity=None,
    ),
    dict(
        room_name="Репетиційна №3",
        name="Клавішні Yamaha",
        type=EquipmentType.STATIONARY,
        status=EquipmentStatus.OK,
        total_quantity=None,
    ),
    dict(
        room_name="Репетиційна №3",
        name="Бас-комбо Fender",
        type=EquipmentType.STATIONARY,
        status=EquipmentStatus.OK,
        total_quantity=None,
    ),
    dict(
        room_name="Звукарська/Подкаст-студія",
        name="Мікрофони Rode PodMic",
        type=EquipmentType.STATIONARY,
        status=EquipmentStatus.OK,
        total_quantity=None,
    ),
    dict(
        room_name="Звукарська/Подкаст-студія",
        name="Студійні монітори",
        type=EquipmentType.STATIONARY,
        status=EquipmentStatus.REPAIR,
        total_quantity=None,
    ),
    dict(
        room_name="Лаунж",
        name="Проєктор",
        type=EquipmentType.STATIONARY,
        status=EquipmentStatus.OK,
        total_quantity=None,
    ),
    dict(
        room_name="Переговорка",
        name="Телевізор для презентацій",
        type=EquipmentType.STATIONARY,
        status=EquipmentStatus.OK,
        total_quantity=None,
    ),
    dict(
        room_name=None,
        name="Мікрофон",
        type=EquipmentType.PORTABLE,
        status=EquipmentStatus.OK,
        total_quantity=3,
    ),
    dict(
        room_name=None,
        name="Кабель XLR",
        type=EquipmentType.PORTABLE,
        status=EquipmentStatus.OK,
        total_quantity=5,
    ),
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
    for data in USERS:
        if db.query(User).filter(User.email == data["email"]).first():
            continue
        db.add(
            User(
                full_name=data["full_name"],
                email=data["email"],
                password_hash=hash_password(TEST_PASSWORD),
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
