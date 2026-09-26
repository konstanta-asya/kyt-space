import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import './App.css'
function Home() { return <h1>Головна сторінка</h1> }
function Rooms() { return <h1>Перелік кімнат</h1> }
function Room() { return <h1>Сторінка кімнати</h1> }
function Contacts() { return <h1>Контакти</h1> }
function App() { return ( <BrowserRouter> <header> <Link to="/" className="logo">КУТ Space</Link>
    <nav>
      <Link to="/">Головна</Link>
      <Link to="/rooms">Кімнати</Link>
      <Link to="/contacts">Контакти</Link>
    </nav>
  </header>

  <main>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/rooms" element={<Rooms />} />
      <Route path="/rooms/:id" element={<Room />} />
      <Route path="/contacts" element={<Contacts />} />
    </Routes>
  </main>

  <footer>
    <p>© 2026 КУТ Space</p>
  </footer>
</BrowserRouter>
) }
export default App