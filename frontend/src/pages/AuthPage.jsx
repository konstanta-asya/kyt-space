import { SegmentedControl, Text, Title } from '@mantine/core'
import { useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout.jsx'
import LoginForm from '../components/LoginForm.jsx'
import RegisterForm from '../components/RegisterForm.jsx'

const MODES = {
  login: {
    title: 'З поверненням',
    subtitle: 'Увійдіть, щоб бронювати кімнати та апаратуру.',
  },
  register: {
    title: 'Створіть акаунт',
    subtitle: 'Зареєструйтеся, щоб бронювати простір КУТ.',
  },
}

// Вхід і реєстрація — одна сторінка з перемикачем. Режим береться з адреси
// (/login або /register), тож посилання з хедера й закладки працюють як раніше.
export default function AuthPage({ onLogin }) {
  const navigate = useNavigate()
  const { pathname, state } = useLocation()
  const mode = pathname === '/register' ? 'register' : 'login'

  function switchMode(next) {
    navigate('/' + next, { replace: true })
  }

  function handleRegistered(email) {
    navigate('/login', { replace: true, state: { registeredEmail: email } })
  }

  return (
    <AuthLayout>
      <SegmentedControl
        value={mode}
        onChange={switchMode}
        data={[
          { value: 'login', label: 'Вхід' },
          { value: 'register', label: 'Реєстрація' },
        ]}
        fullWidth
        size="md"
        radius="md"
        color="kut"
        mb="xl"
      />

      <Title order={1} fz={{ base: 26, sm: 30 }}>
        {MODES[mode].title}
      </Title>
      <Text c="dimmed" mt="xs" mb="xl">
        {MODES[mode].subtitle}
      </Text>

      {mode === 'login' ? (
        <LoginForm onLogin={onLogin} initialEmail={state?.registeredEmail} />
      ) : (
        <RegisterForm onRegistered={handleRegistered} />
      )}
    </AuthLayout>
  )
}
