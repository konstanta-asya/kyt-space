import { useState } from 'react'
import { Alert, Button, PasswordInput, Stack, TextInput } from '@mantine/core'
import { IconAlertCircle, IconAt, IconCircleCheck, IconLock, IconLogin2 } from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'
import { clearToken, getCurrentUser, loginUser, setToken } from '../api.js'

export default function LoginForm({ onLogin, initialEmail = '' }) {
  const justRegistered = Boolean(initialEmail)
  const navigate = useNavigate()
  const [email, setEmail] = useState(initialEmail)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    if (loading) return

    setLoading(true)
    setError('')

    try {
      const { access_token } = await loginUser(email.trim(), password)
      // /auth/me бере токен зі сховища, тож зберігаємо його до запиту
      setToken(access_token)
      const user = await getCurrentUser().catch((err) => {
        clearToken()
        throw err
      })

      onLogin(user)
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

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="md">
        {justRegistered && !error && (
          <Alert color="teal" variant="light" icon={<IconCircleCheck />} role="status">
            Обліковий запис створено. Тепер увійдіть.
          </Alert>
        )}

        <TextInput
          label="Email"
          type="email"
          autoComplete="username"
          placeholder="name@example.com"
          leftSection={<IconAt size={16} />}
          size="md"
          value={email}
          onChange={(event) => setEmail(event.currentTarget.value)}
          required
        />

        <PasswordInput
          label="Пароль"
          autoComplete="current-password"
          placeholder="Ваш пароль"
          leftSection={<IconLock size={16} />}
          size="md"
          value={password}
          onChange={(event) => setPassword(event.currentTarget.value)}
          required
        />

        {error && (
          <Alert color="kut" variant="light" icon={<IconAlertCircle />} role="alert">
            {error}
          </Alert>
        )}

        <Button
          type="submit"
          size="md"
          mt="xs"
          loading={loading}
          leftSection={<IconLogin2 size={18} />}
          fullWidth
        >
          Увійти
        </Button>
      </Stack>
    </form>
  )
}
