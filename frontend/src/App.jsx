import { useState } from 'react' 
import { 
 BrowserRouter, 
 Link, 
 Route,
 Routes,
 } from 'react-router-dom'

 import logo from './assets/logo.png'
 import room1 from './assets/room-1.jpg' 
 import room2 from './assets/room-2.jpg'
 import room3 from './assets/room-3.jpg' 
 import './App.css'

const rooms = [ 
  { id: 1, name: 'Друга репетиційна', image: room1 }, 
  { id: 2, name: 'Третя репетиційна', image: room2 }, 
  { id: 3, name: 'Звукозаписувальна', image: room3 }, 
]

const equipment = 
  'Барабани, 3 мікрофони, гітарний комбік, басовий комбік, синтезатор, колонки і т.д.'

function Home() { 
  return ( 
    <> 
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

  <section id="rooms" className="rooms-section">
    <h2>НАШІ РЕПЕТИЦІЙНІ КІМНАТИ</h2>

    <div className="rooms-grid">
      {rooms.map((room) => (
        <Link
          key={room.id}
          to={`/rooms/${room.id}`}
          className="room-card"
        >
          <img src={room.image} alt={room.name} />

          <div className="room-card-content">
            <h3>{room.name}</h3>
            <p>{equipment}</p>
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
function Placeholder({ title }) { 
  return ( 
  <section className="placeholder-page">
  <h1>{title}</h1> 
  <Link to="/">На головну</Link>
 </section> 
 )
  }

  function Layout() { 
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

    <Link to="/login" className="button login-button">
      Увійти
    </Link>

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
        path="/rooms"
        element={<Placeholder title="Перелік кімнат" />}
      />
      <Route
        path="/rooms/:id"
        element={<Placeholder title="Сторінка кімнати" />}
      />
      <Route
        path="/schedule"
        element={<Placeholder title="Розклад" />}
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
        element={<Placeholder title="Вхід" />}
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