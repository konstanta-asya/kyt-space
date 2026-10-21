import { useState } from 'react'
import {
  ActionIcon,
  Alert,
  Box,
  Button,
  Container,
  Grid,
  Group,
  Paper,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Title,
  UnstyledButton,
} from '@mantine/core'
import { IconArrowRight, IconChevronLeft, IconChevronRight, IconInfoCircle } from '@tabler/icons-react'
import { Link } from 'react-router-dom'
import { getRooms } from '../api.js'
import ScheduleDay from '../components/ScheduleDay.jsx'
import { capitalize, demoEvents, getRoomColor, getRoomName, startOfMonth } from '../schedule.js'
import { useApi } from '../useApi.js'

const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд']

function getMonthDays(month) {
  const offset = (startOfMonth(month).getDay() + 6) % 7

  return Array.from(
    { length: 42 },
    (_, index) => new Date(month.getFullYear(), month.getMonth(), index - offset + 1),
  )
}

function RoomsLegend({ rooms, loading }) {
  if (loading) {
    return [1, 2, 3].map((key) => <Skeleton key={key} h={44} />)
  }

  return rooms.map((room) => (
    <UnstyledButton
      key={room.id}
      component={Link}
      to={'/rooms/' + room.id}
      p="sm"
      style={{
        borderRadius: 'var(--mantine-radius-md)',
        border: '1px solid var(--mantine-color-dark-5)',
      }}
    >
      <Group justify="space-between" wrap="nowrap">
        <Group gap="sm" wrap="nowrap">
          <Box
            w={10}
            h={10}
            style={{ borderRadius: '50%', flexShrink: 0 }}
            bg={getRoomColor(rooms, room.id) + '.6'}
          />
          <Text fz="sm" fw={500}>
            {room.name}
          </Text>
        </Group>
        <IconArrowRight size={16} color="var(--mantine-color-dimmed)" />
      </Group>
    </UnstyledButton>
  ))
}

function DayCell({ date, isToday, isOtherMonth, events, rooms, onOpen }) {
  return (
    <UnstyledButton
      onClick={onOpen}
      aria-label={'Відкрити розклад на ' + date.toLocaleDateString('uk-UA')}
      mih={{ base: 56, sm: 112 }}
      p={{ base: 6, sm: 8 }}
      bg={isOtherMonth ? 'dark.8' : 'dark.7'}
      opacity={isOtherMonth ? 0.45 : 1}
      className="schedule-cell"
      data-today={isToday || undefined}
    >
      <Group justify="space-between" wrap="nowrap" gap={4}>
        <Text
          component="span"
          fz="sm"
          fw={isToday ? 700 : 500}
          w={26}
          h={26}
          ta="center"
          lh="26px"
          bg={isToday ? 'kut.7' : undefined}
          c={isToday ? 'white' : undefined}
          style={{ borderRadius: '50%' }}
        >
          {date.getDate()}
        </Text>
        {isToday && (
          <Text component="span" fz={10} c="kut.3" fw={600} visibleFrom="sm">
            Сьогодні
          </Text>
        )}
      </Group>

      {/* на мобільному — кольорові крапки, на ширших екранах — підписи */}
      <Group gap={3} hiddenFrom="sm">
        {events.map((event) => (
          <Box
            key={event.id}
            component="span"
            w={6}
            h={6}
            style={{ borderRadius: '50%' }}
            bg={getRoomColor(rooms, event.roomId) + '.6'}
          />
        ))}
      </Group>

      <Stack gap={3} visibleFrom="sm">
        {events.map((event) => {
          const color = getRoomColor(rooms, event.roomId)
          return (
            <Text
              key={event.id}
              component="span"
              title={event.time + ' — ' + getRoomName(rooms, event.roomId)}
              fz={11}
              px={6}
              py={2}
              truncate
              bg={`var(--mantine-color-${color}-light)`}
              style={{
                borderLeft: `3px solid var(--mantine-color-${color}-6)`,
                borderRadius: 4,
              }}
            >
              <b>{event.time}</b> {getRoomName(rooms, event.roomId)}
            </Text>
          )
        })}
      </Stack>
    </UnstyledButton>
  )
}

export default function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState(null)
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  // помилку ігноруємо: без кімнат календар однаково працює — назви будуть «Кімната N»
  const { data, loading: roomsLoading } = useApi(getRooms, [])
  const rooms = data || []

  const today = new Date()
  const days = getMonthDays(month)
  const monthTitle = capitalize(
    month.toLocaleDateString('uk-UA', { month: 'long', year: 'numeric' }),
  )

  function changeMonth(step) {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + step, 1))
  }

  function showToday() {
    setMonth(startOfMonth(new Date()))
  }

  function returnToMonth() {
    setMonth(startOfMonth(selectedDate))
    setSelectedDate(null)
  }

  return (
    <Container size="xl" pt={48}>
      <Grid gutter={40}>
        <Grid.Col span={{ base: 12, md: 3 }} order={{ base: 2, md: 1 }}>
          <Stack gap="lg">
            <div>
              <Text c="kut.4" fw={700} tt="uppercase" fz="sm" lts={1}>
                Бронювання
              </Text>
              <Title order={1} fz={{ base: 30, md: 36 }} mt={8}>
                Розклад
              </Title>
              <Text c="dimmed" mt="sm">
                Обирай зручний час та кімнату для репетиції у твоєму музичному просторі КУТ.
              </Text>
            </div>

            <Stack gap="xs">
              <Text fw={700} fz="sm" tt="uppercase" c="dimmed">
                Кімнати
              </Text>
              <RoomsLegend rooms={rooms} loading={roomsLoading} />
            </Stack>

            <Alert
              variant="light"
              color="gray"
              icon={<IconInfoCircle color="var(--mantine-color-yellow-5)" />}
              title="Демонстраційний розклад"
            >
              Зараз показуємо макет календаря. Справжню доступність і бронювання підключимо
              пізніше.
            </Alert>
          </Stack>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 9 }} order={{ base: 1, md: 2 }}>
          <Paper withBorder p={{ base: 'sm', sm: 'xl' }} bg="dark.8">
            {selectedDate ? (
              <ScheduleDay
                date={selectedDate}
                events={demoEvents}
                rooms={rooms}
                onBack={returnToMonth}
                onDateChange={setSelectedDate}
              />
            ) : (
              <>
                <Group justify="space-between" mb="lg">
                  <Title order={2} fz={{ base: 'lg', sm: 'xl' }}>
                    {monthTitle}
                  </Title>
                  <Group gap="xs">
                    <Button variant="default" size="sm" onClick={showToday}>
                      Сьогодні
                    </Button>
                    <ActionIcon
                      variant="default"
                      size="lg"
                      onClick={() => changeMonth(-1)}
                      aria-label="Попередній місяць"
                    >
                      <IconChevronLeft size={18} />
                    </ActionIcon>
                    <ActionIcon
                      variant="default"
                      size="lg"
                      onClick={() => changeMonth(1)}
                      aria-label="Наступний місяць"
                    >
                      <IconChevronRight size={18} />
                    </ActionIcon>
                  </Group>
                </Group>

                <SimpleGrid cols={7} spacing={{ base: 4, sm: 8 }} verticalSpacing={{ base: 4, sm: 8 }}>
                  {weekDays.map((day) => (
                    <Text key={day} ta="center" fz="xs" fw={700} c="dimmed" tt="uppercase" pb={4}>
                      {day}
                    </Text>
                  ))}

                  {days.map((date) => {
                    const isOtherMonth = date.getMonth() !== month.getMonth()

                    return (
                      <DayCell
                        key={date.getTime()}
                        date={date}
                        isToday={date.toDateString() === today.toDateString()}
                        isOtherMonth={isOtherMonth}
                        events={
                          isOtherMonth
                            ? []
                            : demoEvents.filter((event) => event.day === date.getDate())
                        }
                        rooms={rooms}
                        onOpen={() => setSelectedDate(new Date(date))}
                      />
                    )
                  })}
                </SimpleGrid>
              </>
            )}
          </Paper>
        </Grid.Col>
      </Grid>
    </Container>
  )
}
