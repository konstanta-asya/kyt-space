import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { IconArrowLeft, IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import { capitalize, getRoomColor, toMinutes } from '../schedule.js'
import RoomImage from './RoomImage.jsx'

const SLOT_MINUTES = 30

// Слоти по 30 хв у межах годин роботи кімнати (open_from–open_to)
function getSlots(room) {
  const slots = []
  for (let minutes = toMinutes(room.open_from); minutes < toMinutes(room.open_to); minutes += SLOT_MINUTES) {
    const hour = String(Math.floor(minutes / 60)).padStart(2, '0')
    const minute = String(minutes % 60).padStart(2, '0')
    slots.push({ minutes, label: hour + ':' + minute })
  }
  return slots
}

function RoomColumn({ room, color, dayEvents }) {
  return (
    <Paper
      withBorder
      style={{ overflow: 'hidden', borderTop: `3px solid var(--mantine-color-${color}-6)` }}
    >
      <Group gap="sm" p="sm" wrap="nowrap" style={{ borderBottom: '1px solid var(--mantine-color-dark-5)' }}>
        <RoomImage room={room} alt="" w={44} h={44} radius="md" iconSize={20} />
        <Text fw={700} fz="sm" lh={1.3}>
          {room.name}
        </Text>
      </Group>

      <Stack gap={0}>
        {getSlots(room).map((slot) => {
          const occupied = dayEvents.some((event) => {
            const start = toMinutes(event.time)

            return event.roomId === room.id && slot.minutes >= start && slot.minutes < start + 60
          })

          return (
            <Group
              key={slot.minutes}
              justify="space-between"
              px="sm"
              h={34}
              bg={occupied ? `var(--mantine-color-${color}-light)` : undefined}
              style={{
                borderBottom: '1px solid var(--mantine-color-dark-6)',
                borderLeft: occupied ? `3px solid var(--mantine-color-${color}-6)` : '3px solid transparent',
              }}
            >
              <Text fz="xs" c={occupied ? undefined : 'dimmed'} ff="monospace">
                {slot.label}
              </Text>
              {occupied ? (
                <Badge size="xs" color={color} variant="filled">
                  Зайнято
                </Badge>
              ) : (
                <Text fz="xs" c="dark.3">
                  Вільно
                </Text>
              )}
            </Group>
          )
        })}
      </Stack>
    </Paper>
  )
}

export default function ScheduleDay({ date, events, rooms, onBack, onDateChange }) {
  function changeDay(step) {
    const next = new Date(date)
    next.setDate(next.getDate() + step)
    onDateChange(next)
  }

  const title = capitalize(
    date.toLocaleDateString('uk-UA', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
  )
  const dayEvents = events.filter((event) => event.day === date.getDate())

  return (
    <Box>
      <Group justify="space-between" mb="xs" gap="sm">
        <Button variant="default" size="sm" leftSection={<IconArrowLeft size={16} />} onClick={onBack}>
          До місяця
        </Button>
        <Group gap="xs">
          <ActionIcon variant="default" size="lg" onClick={() => changeDay(-1)} aria-label="Попередній день">
            <IconChevronLeft size={18} />
          </ActionIcon>
          <ActionIcon variant="default" size="lg" onClick={() => changeDay(1)} aria-label="Наступний день">
            <IconChevronRight size={18} />
          </ActionIcon>
        </Group>
      </Group>

      <Title order={2} fz={{ base: 'lg', sm: 'xl' }} mt="md">
        {title}
      </Title>
      <Text c="dimmed" fz="sm" mt={4} mb="lg">
        Демонстраційні дані. Кожна подія триває одну годину.
      </Text>

      {rooms.length === 0 ? (
        <Text c="dimmed">Кімнати не завантажилися.</Text>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
          {rooms.map((room) => (
            <RoomColumn
              key={room.id}
              room={room}
              color={getRoomColor(rooms, room.id)}
              dayEvents={dayEvents}
            />
          ))}
        </SimpleGrid>
      )}
    </Box>
  )
}
