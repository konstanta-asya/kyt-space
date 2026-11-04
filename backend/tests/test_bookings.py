import pytest
from sqlalchemy.exc import IntegrityError

from app.modules.bookings.models import Booking
from app.modules.rooms.models import Room

USER = {"full_name": "Booker", "email": "booker@example.com", "password": "secret123"}


def slot(start, end, room_id, type="rehearsal"):
    return {
        "room_id": room_id,
        "start_time": f"2026-11-10T{start}:00+02:00",
        "end_time": f"2026-11-10T{end}:00+02:00",
        "type": type,
    }


@pytest.fixture
def auth(client):
    client.post("/auth/register", json=USER)
    token = client.post("/auth/login", json={"email": USER["email"], "password": USER["password"]}).json()
    return {"Authorization": f"Bearer {token['access_token']}"}


@pytest.fixture
def rooms(db):
    a, b = Room(name="Студія"), Room(name="Лаунж")
    db.add_all([a, b])
    db.flush()
    return a.id, b.id


def book(client, auth, **kwargs):
    return client.post("/bookings", json=slot(**kwargs), headers=auth)


# --- створення


def test_create_booking(client, auth, rooms):
    resp = book(client, auth, start="10:00", end="11:00", room_id=rooms[0], type="podcast")

    assert resp.status_code == 201
    body = resp.json()
    assert body["room_id"] == rooms[0]
    assert body["type"] == "podcast"
    assert body["status"] == "pending"
    assert body["user_id"] == client.get("/auth/me", headers=auth).json()["id"]

    assert client.get(f"/bookings/{body['id']}", headers=auth).json() == body
    assert client.get("/bookings", headers=auth).json() == [body]


def test_create_booking_requires_auth(client, rooms):
    assert client.post("/bookings", json=slot("10:00", "11:00", rooms[0])).status_code == 401


def test_list_and_get_require_auth(client):
    assert client.get("/bookings").status_code == 401
    assert client.get("/bookings/1").status_code == 401


def test_get_missing_booking_returns_404(client, auth):
    assert client.get("/bookings/999999", headers=auth).status_code == 404


def test_create_booking_unknown_room_returns_404(client, auth):
    assert book(client, auth, start="10:00", end="11:00", room_id=999999).status_code == 404


@pytest.mark.parametrize(
    "payload",
    [
        slot("11:00", "10:00", 1),  # кінець раніше за початок
        slot("10:00", "10:00", 1),  # порожній діапазон
        {**slot("10:00", "11:00", 1), "type": "party"},
        {**slot("10:00", "11:00", 1), "start_time": "2026-11-10T10:00:00"},  # без часового поясу
    ],
    ids=["end-before-start", "empty", "bad-type", "naive-datetime"],
)
def test_create_booking_validation(client, auth, payload):
    assert client.post("/bookings", json=payload, headers=auth).status_code == 422


# --- захист від подвійного бронювання


@pytest.mark.parametrize(
    "start, end",
    [("10:00", "11:00"), ("10:30", "11:30"), ("09:30", "10:30"), ("10:15", "10:45"), ("09:00", "12:00")],
    ids=["same", "overlaps-end", "overlaps-start", "inside", "covers"],
)
def test_overlapping_booking_returns_409(client, auth, rooms, start, end):
    assert book(client, auth, start="10:00", end="11:00", room_id=rooms[0]).status_code == 201

    resp = book(client, auth, start=start, end=end, room_id=rooms[0])

    assert resp.status_code == 409
    assert resp.json()["detail"] == "This time slot is already booked for this room"
    assert len(client.get("/bookings", headers=auth).json()) == 1


def test_overlap_detected_across_timezones(client, auth, rooms):
    # 10:00+02:00 == 08:00Z — це той самий момент часу
    book(client, auth, start="10:00", end="11:00", room_id=rooms[0])
    utc = {"start_time": "2026-11-10T08:30:00Z", "end_time": "2026-11-10T09:30:00Z"}
    resp = client.post("/bookings", json={**slot("10:00", "11:00", rooms[0]), **utc}, headers=auth)

    assert resp.status_code == 409


def test_adjacent_bookings_allowed(client, auth, rooms):
    # [start, end) — кінець одного слоту може збігатися з початком іншого
    assert book(client, auth, start="10:00", end="11:00", room_id=rooms[0]).status_code == 201
    assert book(client, auth, start="11:00", end="12:00", room_id=rooms[0]).status_code == 201
    assert book(client, auth, start="09:00", end="10:00", room_id=rooms[0]).status_code == 201


def test_same_time_in_different_rooms_allowed(client, auth, rooms):
    assert book(client, auth, start="10:00", end="11:00", room_id=rooms[0]).status_code == 201
    assert book(client, auth, start="10:00", end="11:00", room_id=rooms[1]).status_code == 201


def test_cancelled_booking_does_not_hold_slot(client, db, auth, rooms):
    booking_id = book(client, auth, start="10:00", end="11:00", room_id=rooms[0]).json()["id"]
    db.get(Booking, booking_id).status = "cancelled"
    db.flush()

    assert book(client, auth, start="10:00", end="11:00", room_id=rooms[0]).status_code == 201


def test_overlap_rejected_by_db_constraint_itself(db, auth, client, rooms):
    # Захист має бути саме в БД: пряма вставка в обхід сервісу теж падає.
    user_id = client.get("/auth/me", headers=auth).json()["id"]
    common = {"user_id": user_id, "room_id": rooms[0], "type": "event", "status": "pending"}
    db.add(Booking(start_time="2026-11-10T10:00+02:00", end_time="2026-11-10T11:00+02:00", **common))
    db.flush()

    db.add(Booking(start_time="2026-11-10T10:59+02:00", end_time="2026-11-10T12:00+02:00", **common))
    with pytest.raises(IntegrityError, match="bookings_no_overlap"):
        db.flush()
