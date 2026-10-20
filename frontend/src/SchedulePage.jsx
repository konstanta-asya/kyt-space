import { useState } from 'react' 
import { Link } from 'react-router-dom'
import ScheduleDay from './ScheduleDay.jsx'
const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд']
const demoEvents = [
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
function getMonthDays(month) 
{ const firstDay = new Date( month.getFullYear(), month.getMonth(), 1 )
const offset = (firstDay.getDay() + 6) % 7
return Array.from({ length: 42 }, (_, index) => ( 
    new Date( month.getFullYear(), month.getMonth(), index - offset + 1 ) )) }
export default function SchedulePage() { 
    const [selectedDate, setSelectedDate] = useState(null)

function returnToMonth() {
  setMonth(new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    1
  ))
  setSelectedDate(null)
}
    const [month, setMonth] = useState( () => new Date(new Date().getFullYear(), new Date().getMonth(), 1) )
const today = new Date() 
const days = getMonthDays(month)
const monthTitle = month.toLocaleDateString('uk-UA', { month: 'long', year: 'numeric', })
function changeMonth(step) { setMonth((current) => new Date( current.getFullYear(), current.getMonth() + step, 1 )) }
function showToday() { const date = new Date() 
    setMonth(new Date(date.getFullYear(), date.getMonth(), 1)) }
return ( <section className="schedule-page"> <aside className="schedule-sidebar"> <h1>РОЗКЛАД</h1> <p> Обирай зручний час та кімнату для репетиції у твоєму музичному просторі КУТ. </p>
    <h2>КІМНАТИ:</h2>

    <nav className="schedule-rooms" aria-label="Кімнати">
      <Link to="/rooms/1">Друга репетиційна →</Link>
      <Link to="/rooms/2">Третя репетиційна →</Link>
      <Link to="/rooms/3">Звукозаписувальна →</Link>
    </nav>

    <div className="schedule-notice">
      <strong>Демонстраційний розклад</strong>
      <p>
        Зараз показуємо макет календаря.
        Справжню доступність і бронювання підключимо пізніше.
      </p>
    </div>
  </aside>

  <div className="schedule-calendar">
    {selectedDate ? (
  <ScheduleDay
    date={selectedDate}
    events={demoEvents}
    onBack={returnToMonth}
    onDateChange={setSelectedDate}
  />
) : (
  <>
    <div className="schedule-toolbar">
      <h2>{monthTitle}</h2>

      <button type="button" onClick={showToday}>
        Сьогодні
      </button>

      <div className="schedule-arrows">
        <button
          type="button"
          onClick={() => changeMonth(-1)}
          aria-label="Попередній місяць"
        >
          ‹
        </button>

        <button
          type="button"
          onClick={() => changeMonth(1)}
          aria-label="Наступний місяць"
        >
          ›
        </button>
      </div>
    </div>

    <div className="schedule-month">
      {weekDays.map((day) => (
        <div className="schedule-weekday" key={day}>
          {day}
        </div>
      ))}

      {days.map((date) => {
        const isToday =
          date.toDateString() === today.toDateString()

        const isOtherMonth =
          date.getMonth() !== month.getMonth()

        const className = [
          'schedule-day',
          isToday ? 'is-today' : '',
          isOtherMonth ? 'is-other-month' : '',
        ].filter(Boolean).join(' ')

        return (
          <div className={className} key={date.getTime()}>
            <button
  type="button"
  className="schedule-date-button"
  onClick={() => setSelectedDate(new Date(date))}
  aria-label={
    'Відкрити розклад на ' + date.toLocaleDateString('uk-UA')
  }
>
  {date.getDate()}
</button>
            {!isOtherMonth && demoEvents
  .filter((event) => event.day === date.getDate())
  .map((event) => (
    <div
      key={event.id}
      className={'schedule-event schedule-event-room-' + event.roomId}
    >
      <strong>{event.time}</strong>{' '}
      <span>Кімната {event.roomId}</span>
    </div>
  ))}
            {isToday && (
              <span className="schedule-today-label">
                Сьогодні
              </span>
            )}
          </div>
        )
      })}
    </div>
    </>
)}
  </div>
</section>
)}