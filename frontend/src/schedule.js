// Демонстраційні дані розкладу, поки бронювання не підключене до API.
// day — число місяця (показується в будь-якому місяці), roomId — id кімнати з API.
export const demoEvents = [
  { id: 1, day: 3, roomId: 1, time: '12:00' },
  { id: 2, day: 5, roomId: 2, time: '18:00' },
  { id: 3, day: 10, roomId: 3, time: '15:00' },
  { id: 4, day: 10, roomId: 1, time: '19:00' },
  { id: 5, day: 15, roomId: 1, time: '16:00' },
  { id: 6, day: 18, roomId: 3, time: '20:00' },
  { id: 7, day: 22, roomId: 2, time: '13:00' },
  { id: 8, day: 24, roomId: 1, time: '18:30' },
  { id: 9, day: 27, roomId: 3, time: '15:00' },
]

const ROOM_COLORS = ['kut', 'yellow', 'teal', 'blue', 'grape', 'orange']

// Колір кімнати однаковий у місячному календарі, легенді та перегляді дня
export function getRoomColor(rooms, roomId) {
  const index = rooms.findIndex((room) => room.id === roomId)
  return ROOM_COLORS[(index === -1 ? roomId : index) % ROOM_COLORS.length]
}

export function getRoomName(rooms, roomId) {
  return rooms.find((room) => room.id === roomId)?.name || 'Кімната ' + roomId
}

export function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function toMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1)
}
