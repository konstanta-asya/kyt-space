import { useState } from 'react'
import { Alert, Button, PasswordInput, Stack, TextInput } from '@mantine/core'
import { IconAlertCircle, IconAt, IconLock, IconPhone, IconUser, IconUserPlus } from '@tabler/icons-react'
import { registerUser } from '../api.js'

export default function RegisterForm({ onRegistered }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    if (loading) return

    const fields = new FormData(event.currentTarget)
    const fullName = fields.get('full_name').trim()
    const email = fields.get('email').trim()

    if (!fullName) {
      setError('Введіть ім’я.')
      return
    }

    setLoading(true)
    setError('')

    try {
      await registerUser({
        full_name: fullName,
        email,
        password: fields.get('password'),
        phone: fields.get('phone').trim() || null,
      })

      onRegistered(email)
    } catch (err) {
      setError(
        err.status === 400
          ? 'Цей email уже зареєстровано.'
          : err.message
      )
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="md">
        <TextInput
          label="Ім’я"
          name="full_name"
          autoComplete="name"
          placeholder="Ім’я та прізвище"
          leftSection={<IconUser size={16} />}
          size="md"
          maxLength={255}
          required
        />

        <TextInput
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="name@example.com"
          leftSection={<IconAt size={16} />}
          size="md"
          required
        />

        <PasswordInput
          label="Пароль"
          name="password"
          autoComplete="new-password"
          description="Від 8 до 72 символів"
          leftSection={<IconLock size={16} />}
          size="md"
          minLength={8}
          maxLength={72}
          required
        />

        <TextInput
          label="Телефон"
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="+380"
          description="Необов’язково"
          leftSection={<IconPhone size={16} />}
          size="md"
          maxLength={30}
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
          leftSection={<IconUserPlus size={18} />}
          fullWidth
        >
          Зареєструватися
        </Button>
      </Stack>
    </form>
  )
}
