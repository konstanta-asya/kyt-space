import { useState } from 'react' 
import { Link, useNavigate } from 'react-router-dom' 
import { loginUser, getCurrentUser } from './api.js'
export default function LoginPage({ onLogin }) { const navigate = useNavigate() 
    const [email, setEmail] = useState('') 
    const [password, setPassword] = useState('') 
    const [loading, setLoading] = useState(false) 
    const [error, setError] = useState('')
async function handleSubmit(event) { event.preventDefault()
     if (loading) return
    setLoading(true)
setError('')

try {
  const data = await loginUser(email.trim(), password)
  const user = await getCurrentUser(data.access_token)

  onLogin(data.access_token, user)
  navigate('/')
} catch (err) {
  setError(
    err.status === 401
      ? 'Неправильний email або пароль.'
      : err.message
  )
} finally {
  setLoading(false)
}
}
return ( <section className="auth-page"> <h1>Вхід</h1>
  <form className="auth-form" onSubmit={handleSubmit}>
    <label htmlFor="login-email">Email</label>
    <input
      id="login-email"
      type="email"
      autoComplete="username"
      value={email}
      onChange={(event) => setEmail(event.target.value)}
      required
    />

    <label htmlFor="login-password">Пароль</label>
    <input
      id="login-password"
      type="password"
      autoComplete="current-password"
      value={password}
      onChange={(event) => setPassword(event.target.value)}
      required
    />

    {error && <p role="alert">{error}</p>}

    <button
      type="submit"
      className="button button-primary"
      disabled={loading}
    >
      {loading ? 'Входимо…' : 'Увійти'}
    </button>
  </form>

  <p>
    Немає облікового запису?{' '}
    <Link to="/register">Зареєструватися</Link>
  </p>
</section>
)}