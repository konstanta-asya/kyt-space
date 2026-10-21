import room1 from './assets/room-1.jpg'
import room2 from './assets/room-2.jpg'
import room3 from './assets/room-3.jpg'

// Локальні фото, поки в API немає photo_url
const roomImages = {
  1: room1,
  2: room2,
  3: room3,
}

export function getRoomImage(room) {
  return room.photo_url || roomImages[room.id] || null
}

export function formatHours(room) {
  return room.open_from.slice(0, 5) + ' – ' + room.open_to.slice(0, 5)
}
