import { useState } from 'react' 
import { Link } from 'react-router-dom' 
import { registerUser } from './api.js'
export default function RegisterPage() { const [loading, setLoading] = useState(false)
     const [error, setError] = useState('')
     const [success, setSuccess] = useState(false)
async function handleSubmit(event) { event.preventDefault() 
    if (loading) return
    const form = event.currentTarget
const fields = new FormData(form)
const fullName = fields.get('full_name').trim()

if (!fullName) {
  setError('Введіть ім’я.')
  return
}

setLoading(true)
setError('')

try {
  await registerUser({
    full_name: fullName,
    email: fields.get('email').trim(),
    password: fields.get('password'),
    phone: fields.get('phone').trim() || null,
  })

  form.reset()
  setSuccess(true)
} catch (err) {
  setError(err.message)
} finally {
  setLoading(false)
}
}
if (success) { return ( <section className="auth-page"> <h1>Реєстрація успішна</h1> <p role="status">Обліковий запис створено. Тепер увійдіть.</p> <Link to="/login" className="button button-primary"> Перейти до входу </Link> </section> ) }
return ( <section className="auth-page"> <h1>Реєстрація</h1>
  <form className="auth-form" onSubmit={handleSubmit}>
    <label htmlFor="register-name">Ім’я</label>
    <input
      id="register-name"
      name="full_name"
      type="text"
      autoComplete="name"
      maxLength={255}
      required
    />

    <label htmlFor="register-email">Email</label>
    <input
      id="register-email"
      name="email"
      type="email"
      autoComplete="email"
      required
    />

    <label htmlFor="register-password">Пароль (8–72 символи)</label>
    <input
      id="register-password"
      name="password"
      type="password"
      autoComplete="new-password"
      minLength={8}
      maxLength={72}
      required
    />

    <label htmlFor="register-phone">Телефон (необов’язково)</label>
    <input
      id="register-phone"
      name="phone"
      type="tel"
      autoComplete="tel"
      maxLength={30}
    />

    {error && <p role="alert">{error}</p>}

    <button
      type="submit"
      className="button button-primary"
      disabled={loading}
    >
      {loading ? 'Створюємо…' : 'Зареєструватися'}
    </button>
  </form>

  <p>
    Уже є обліковий запис? <Link to="/login">Увійти</Link>
  </p>
</section>
) }