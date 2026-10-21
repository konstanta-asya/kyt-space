import { toMinutes } from './schedule.js'
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

// Години роботи необов'язкові (open_from / open_to можуть бути null),
// тоді беремо типовий робочий день
const DEFAULT_OPEN_FROM = '09:00'
const DEFAULT_OPEN_TO = '21:00'

export function hasHours(room) {
  return Boolean(room.open_from && room.open_to)
}

// Години роботи кімнати у хвилинах від початку доби
export function getOpenRange(room) {
  return {
    from: toMinutes(hasHours(room) ? room.open_from : DEFAULT_OPEN_FROM),
    to: toMinutes(hasHours(room) ? room.open_to : DEFAULT_OPEN_TO),
  }
}

export function formatHours(room) {
  if (!hasHours(room)) return 'Не вказано'
  return room.open_from.slice(0, 5) + ' – ' + room.open_to.slice(0, 5)
}
