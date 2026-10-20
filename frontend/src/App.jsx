import { 
 BrowserRouter, 
 Link, 
 Route,
 Routes,
 useParams,
 } from 'react-router-dom'
 
 import { useEffect, useState } from 'react'
 import { 
   getRooms, 
   getEquipment,
   getRoom,
   getRoomEquipment,
   getCurrentUser,
 } from './api.js'
 import logo from './assets/logo.png'
 import room1 from './assets/room-1.jpg' 
 import room2 from './assets/room-2.jpg'
 import room3 from './assets/room-3.jpg' 
 import './App.css'
 import LoginPage from './LoginPage.jsx'
 import RegisterPage from './RegisterPage.jsx'
 import SchedulePage from './SchedulePage.jsx'

const roomImages = {
  1: room1,
  2: room2,
  3: room3,
}

function Home( { showHero = true }) {
  const [rooms, setRooms] = useState([]) 
  const [equipment, setEquipment] = useState([]) 
  const [loading, setLoading] = useState(true) 
  const [error, setError] = useState('')
useEffect(() => { const controller = new AbortController()
async function loadData() {
  try {
    const [roomsData, equipmentData] = await Promise.all([
      getRooms(controller.signal),
      getEquipment(controller.signal),
    ])

    if (!controller.signal.aborted) {
      setRooms(roomsData)
      setEquipment(equipmentData)
    }
  } catch (err) {
    if (!controller.signal.aborted) {
      setError(err.message)
    }
  } finally {
    if (!controller.signal.aborted) {
      setLoading(false)
    }
  }
}

loadData()

return () => controller.abort()
}, [])
  return ( 
    <> 
     {showHero && (
     <section className="hero"> 
         <div className="hero-content"> 
         <h1>КУТ</h1> 
         <p className="hero-slogan"> 
          ТВІЙ МУЗИЧНИЙ ПРОСТІР 
          </p>
       
       <div className="hero-actions">
        <Link
          to="/schedule"
          className="button button-primary"
        >
          ЗАБРОНЮВАТИ
        </Link>

        <div className="hero-secondary-actions">
          <a href="#rooms" className="button">
            КІМНАТИ
          </a>
          <a href="#hours" className="button">
            ГРАФІК РОБОТИ
          </a>
        </div>
      </div>
    </div>
  </section>
     )}

  <section id="rooms" className="rooms-section">
    <h2>НАШІ РЕПЕТИЦІЙНІ КІМНАТИ</h2>
{loading && <p role="status">Завантаження кімнат…</p>}
{error && <p role="alert">{error}</p>}
{!loading && !error && rooms.length === 0 && (
  <p>Кімнат поки немає.</p>
)}
    <div className="rooms-grid">
      {rooms.map((room) => (
        <Link
  key={room.id}
  to={'/rooms/' + room.id}
  className="room-card"
>
  {(room.photo_url || roomImages[room.id]) && (
    <img
      src={room.photo_url || roomImages[room.id]}
      alt={room.name}
    />
  )}
        <div className="room-card-content">

  <h3>{room.name}</h3>
  <p>
    {equipment
      .filter((item) => item.room_id === room.id)
      .map((item) =>
        item.name +
        (item.status === 'repair' ? ' (на ремонті)' : '')
      )
      .join(', ') || 'Апаратуру не зазначено'}
  </p>
</div>
</Link>
    ))}
</div>

<Link
   to="/schedule"
   className="button rooms-book-button"
    >
      ЗАБРОНЮВАТИ
    </Link>
  </section>
</>
)
 }
 function RoomPage() { const { id } = useParams() 
 const [room, setRoom] = useState(null) 
 const [equipment, setEquipment] = useState([]) 
 const [loading, setLoading] = useState(true) 
 const [error, setError] = useState('')
useEffect(() => { const controller = new AbortController()
  async function loadRoom() {
  setLoading(true)
  setError('')
  setRoom(null)

  try {
    const [roomData, equipmentData] = await Promise.all([
      getRoom(id, controller.signal),
      getRoomEquipment(id, controller.signal),
    ])

    if (!controller.signal.aborted) {
      setRoom(roomData)
      setEquipment(equipmentData)
    }
  } catch (err) {
    if (!controller.signal.aborted) {
      setError(err.message)
    }
  } finally {
    if (!controller.signal.aborted) {
      setLoading(false)
    }
  }
}

loadRoom()
return () => controller.abort()
}, [id])
if (loading) { return <p role="status">Завантаження кімнати…</p> }
if (error) { return ( <section className="room-detail"> <p role="alert">{error}</p> <Link to="/">На головну</Link> </section> ) }
if (!room) { return <p>Кімнату не знайдено.</p> }
const image = room.photo_url || roomImages[room.id]
return ( <section className="room-detail"> <Link to="/">← На головну</Link> <h1>{room.name}</h1>
  {image && (
    <img
      src={image}
      alt={room.name}
      className="room-detail-image"
    />
  )}

  <p>{room.description}</p>
  <p>Місткість: {room.capacity} осіб</p>
  <p>Площа: {room.area} м²</p>
  <p>
    Години роботи: {room.open_from.slice(0, 5)}
    {' — '}
    {room.open_to.slice(0, 5)}
  </p>

  {room.is_members_only && (
    <p>Ця кімната доступна лише для кутівців.</p>
  )}

  <h2>Апаратура</h2>

  {equipment.length === 0 ? (
    <p>Апаратуру не зазначено.</p>
  ) : (
    <ul>
      {equipment.map((item) => (
        <li key={item.id}>
          {item.name}
          {item.status === 'repair' && ' (на ремонті)'}
        </li>
      ))}
    </ul>
  )}

  <Link to="/schedule" className="button button-primary">
    Перейти до розкладу
  </Link>
</section>
)}
function Placeholder({ title }) { 
  return ( 
  <section className="placeholder-page">
  <h1>{title}</h1> 
  <Link to="/">На головну</Link>
 </section> 
 )
  }

  function Layout() { 
    const [user, setUser] = useState(null) 
    const [authLoading, setAuthLoading] = useState( () => Boolean(sessionStorage.getItem('access_token')) )
useEffect(() => { const token = sessionStorage.getItem('access_token')
   if (!token) return
  const controller = new AbortController()

getCurrentUser(token, controller.signal)
  .then((currentUser) => {
    if (!controller.signal.aborted) {
      setUser(currentUser)
    }
  })
  .catch((err) => {
    if (!controller.signal.aborted && err.status === 401) {
      sessionStorage.removeItem('access_token')
    }
  })
  .finally(() => {
    if (!controller.signal.aborted) {
      setAuthLoading(false)
    }
  })

return () => controller.abort()
}, [])
function handleLogin(token, currentUser) { sessionStorage.setItem('access_token', token) 
  setUser(currentUser) }
function handleLogout() { sessionStorage.removeItem('access_token') 
  setUser(null) }
   const [menuOpen, setMenuOpen] = useState(false)
 
   function closeMenu()
    { setMenuOpen(false) 

    }
return ( <>
  <header className="site-header"> 
    <Link
to="/"
className="site-logo"
aria-label="КУТ — головна"
onClick={closeMenu}
> <img src={logo} alt="КУТ" /> 
</Link>

    <nav className="desktop-nav" aria-label="Навігація">
      <Link to="/">Головна</Link>
      <a href="/#rooms">Кімнати</a>
      <Link to="/schedule">Розклад</Link>
      <Link to="/rules">Правила</Link>
      <Link to="/contacts">Контакти</Link>
    </nav>

    {authLoading ? ( 
      <span role="status">Завантаження…</span>
     ) : user ? ( 
     <button 
     type="button" 
     className="button login-button" 
     onClick={handleLogout}
    >
Вийти
</button>
     ) : (
      <Link
       to="/login"
       className="button login-button"
       onClick={closeMenu}
    >
      Увійти
    </Link>
     )}


    <button
      type="button"
      className="menu-toggle"
      aria-label={menuOpen ? 'Закрити меню' : 'Відкрити меню'}
      aria-expanded={menuOpen}
      aria-controls="mobile-menu"
      onClick={() => setMenuOpen(!menuOpen)}
      onKeyDown={(event) => {
        if (event.key === 'Escape') closeMenu()
      }}
    >
      <span />
      <span />
      <span />
    </button>

    {menuOpen && (
      <>
        <button
          type="button"
          className="menu-backdrop"
          aria-label="Закрити меню"
          onClick={closeMenu}
        />

        <nav
          id="mobile-menu"
          className="mobile-menu"
          aria-label="Мобільна навігація"
          onKeyDown={(event) => {
            if (event.key === 'Escape') closeMenu()
          }}
        >
          <Link to="/" onClick={closeMenu}>Головна</Link>
          <a href="/#rooms" onClick={closeMenu}>Кімнати</a>
          <Link to="/schedule" onClick={closeMenu}>Розклад</Link>
          <Link to="/rules" onClick={closeMenu}>Правила</Link>
          <Link to="/contacts" onClick={closeMenu}>Контакти</Link>
        </nav>
      </>
    )}
  </header>

  <main className="site-main">
    <Routes>
      <Route path="/" element={<Home />} />
      <Route
        path="rooms"
        element={<Home showHero={false} />}
      />
      <Route
  path="/register"
  element={<RegisterPage />}
/>
      <Route
        path="/rooms/:id"
        element={<RoomPage />}
      />
      <Route
        path="/schedule"
        element={<SchedulePage />}
      />
      <Route
      path="/rules"
        element={<Placeholder title="Правила бронювання" />}
      />
      <Route
        path="/contacts"
        element={<Placeholder title="Контакти" />}
      />
      <Route
        path="/login"
        element={<LoginPage onLogin={handleLogin} />}
      />
    </Routes>
  </main>

  <footer id="hours" className="site-footer">
    <h2>ГРАФІК РОБОТИ</h2>
    <p>
      Пн-Нд: з 09:00 до 21:00
      <br />
      Бронювання онлайн або через Telegram.
      <br />
      Записи подкастів та проведення репетицій
      лише за попереднім записом.
    </p>
  </footer>
</>
) }
export default function App() 
{ return (
 <BrowserRouter> 
 <Layout />
</BrowserRouter> 
)
 }