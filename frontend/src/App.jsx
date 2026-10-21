import { useEffect, useState } from 'react'
import { AppShell } from '@mantine/core'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { getCurrentUser } from './api.js'
import SiteFooter from './components/SiteFooter.jsx'
import SiteHeader from './components/SiteHeader.jsx'
import HomePage from './pages/HomePage.jsx'
import AuthPage from './pages/AuthPage.jsx'
import PlaceholderPage from './pages/PlaceholderPage.jsx'
import RoomPage from './pages/RoomPage.jsx'
import SchedulePage from './pages/SchedulePage.jsx'

// React Router не скидає прокрутку при зміні адреси, тож нова сторінка
// відкривалася б посередині — повертаємося на початок
function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  return null
}

function Layout() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(() => Boolean(sessionStorage.getItem('access_token')))

  useEffect(() => {
    const token = sessionStorage.getItem('access_token')
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

  function handleLogin(token, currentUser) {
    sessionStorage.setItem('access_token', token)
    setUser(currentUser)
  }

  function handleLogout() {
    sessionStorage.removeItem('access_token')
    setUser(null)
  }

  return (
    <AppShell header={{ height: 72 }}>
      <ScrollToTop />
      <AppShell.Header
        withBorder={false}
        style={{
          background: 'rgba(12, 12, 12, 0.72)',
          backdropFilter: 'blur(14px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <SiteHeader user={user} authLoading={authLoading} onLogout={handleLogout} />
      </AppShell.Header>

      <AppShell.Main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/rooms" element={<HomePage showHero={false} />} />
          <Route path="/rooms/:id" element={<RoomPage />} />
          <Route path="/login" element={<AuthPage onLogin={handleLogin} />} />
          <Route path="/register" element={<AuthPage onLogin={handleLogin} />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/rules" element={<PlaceholderPage title="Правила бронювання" />} />
          <Route path="/contacts" element={<PlaceholderPage title="Контакти" />} />
          <Route path="*" element={<PlaceholderPage title="Сторінку не знайдено" text="Можливо, посилання застаріло або містить помилку." />} />
        </Routes>

        <SiteFooter />
      </AppShell.Main>
    </AppShell>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  )
}
