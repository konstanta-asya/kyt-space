import room1 from './assets/room-1.jpg' 
import room2 from './assets/room-2.jpg' 
import room3 from './assets/room-3.jpg'
const rooms = [ { id: 1, name: 'Друга репетиційна', image: room1 }, { id: 2, name: 'Третя репетиційна', image: room2 }, { id: 3, name: 'Звукозаписувальна', image: room3 }, ]
const slots = Array.from({ length: 24 }, (_, index) => { const minutes = 9 * 60 + index * 30 
    const hour = String(Math.floor(minutes / 60)).padStart(2, '0') 
    const minute = String(minutes % 60).padStart(2, '0')
return { minutes, label: hour + ':' + minute } })
function toMinutes(time) { const [hours, minutes] = time.split(':').map(Number) 
    return hours * 60 + minutes }
export default function ScheduleDay({ 
    date, events, onBack, onDateChange, }) {
         function changeDay(step) { 
            const next = new Date(date)
             next.setDate(next.getDate() + step) 
             onDateChange(next) }
const title = date.toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', })
const dayEvents = events.filter( (event) => event.day === date.getDate() )
return ( <div className="schedule-day-view"> <div className="schedule-toolbar"> <button type="button" onClick={onBack}> До місяця </button>
    <h2>{title}</h2>

    <div className="schedule-arrows">
      <button
        type="button"
        onClick={() => changeDay(-1)}
        aria-label="Попередній день"
      >
        ‹
      </button>
      <button
        type="button"
        onClick={() => changeDay(1)}
        aria-label="Наступний день"
      >
        ›
      </button>
    </div>
  </div>

  <p>Демонстраційні дані. Кожна подія триває одну годину.</p>

  <div className="schedule-day-rooms">
    {rooms.map((room) => (
      <section className="schedule-room-column" key={room.id}>
        <div className="schedule-room-heading">
          <img src={room.image} alt="" />
          <h3>{room.name}</h3>
        </div>

        <div className="schedule-slots">
          {slots.map((slot) => {
            const occupied = dayEvents.some((event) => {
              const start = toMinutes(event.time)

              return event.roomId === room.id
                && slot.minutes >= start
                && slot.minutes < start + 60
            })

            return (
              <div
                key={slot.minutes}
                className={
                  'schedule-slot' + (occupied ? ' is-occupied' : '')
                }
              >
                <span>{slot.label}</span>
                {occupied && <strong>Зайнято</strong>}
              </div>
            )
          })}
        </div>
      </section>
    ))}
  </div>
</div>
)}