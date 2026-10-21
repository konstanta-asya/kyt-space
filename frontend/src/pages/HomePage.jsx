import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Container,
  Group,
  Paper,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core'
import {
  IconAlertTriangle,
  IconArrowRight,
  IconCalendarPlus,
  IconClock,
  IconDeviceSpeaker,
  IconMicrophone2,
  IconMoodEmpty,
  IconPointer,
} from '@tabler/icons-react'
import { Link } from 'react-router-dom'
import { getEquipment, getRooms } from '../api.js'
import RoomCard from '../components/RoomCard.jsx'
import { useApi } from '../useApi.js'

const FEATURES = [
  {
    icon: IconDeviceSpeaker,
    title: 'Обладнані кімнати',
    text: 'Апаратура вже на місці — приходь з інструментом і грай.',
  },
  {
    icon: IconClock,
    title: 'Щодня 09:00–21:00',
    text: 'Репетиції та записи подкастів сім днів на тиждень.',
  },
  {
    icon: IconPointer,
    title: 'Онлайн-бронювання',
    text: 'Обери кімнату й вільний слот — без дзвінків і черг.',
  },
]

function Hero() {
  return (
    <Box className="hero" mt="calc(var(--app-shell-header-height) * -1)">
      <Container size="xl" pt={{ base: 140, md: 200 }} pb={{ base: 100, md: 160 }}>
        <Stack gap="xl" maw={680}>
          <Badge size="lg" variant="light" leftSection={<IconMicrophone2 size={14} />} w="fit-content">
            Репетиції · Подкасти · Записи
          </Badge>

          <div>
            <Title order={1} fz={{ base: 64, md: 112 }} fw={900} lh={1} c="white">
              КУТ
            </Title>
            <Title order={2} mt="md" fz={{ base: 22, md: 36 }} fw={700} lh={1.25} c="gray.2">
              Твій музичний простір
            </Title>
          </div>

          <Text fz={{ base: 'md', md: 'lg' }} c="gray.4" maw={520}>
            Репетиційні кімнати з апаратурою для гуртів, музикантів і подкастерів. Бронюй онлайн за
            кілька кліків.
          </Text>

          <Group gap="md">
            <Button
              component={Link}
              to="/schedule"
              size="lg"
              leftSection={<IconCalendarPlus size={20} />}
            >
              Забронювати
            </Button>
            <Button
              component="a"
              href="#rooms"
              size="lg"
              variant="default"
              rightSection={<IconArrowRight size={18} />}
            >
              Переглянути кімнати
            </Button>
          </Group>
        </Stack>
      </Container>
    </Box>
  )
}

function Features() {
  return (
    <Container size="xl" mt={{ base: 0, md: -40 }} pos="relative">
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
        {FEATURES.map((feature) => (
          <Paper key={feature.title} withBorder p={{ base: 'md', md: 'xl' }}>
            <Group gap="md" wrap="nowrap" align="flex-start">
              <ThemeIcon size={48} radius="md" variant="light">
                <feature.icon size={26} />
              </ThemeIcon>
              <div>
                <Text fw={700} fz="lg">
                  {feature.title}
                </Text>
                <Text c="dimmed" fz="sm" mt={4}>
                  {feature.text}
                </Text>
              </div>
            </Group>
          </Paper>
        ))}
      </SimpleGrid>
    </Container>
  )
}

function RoomsSkeleton() {
  return [1, 2, 3].map((key) => (
    <Card key={key} withBorder padding="lg">
      <Card.Section>
        <Skeleton h={220} radius={0} />
      </Card.Section>
      <Skeleton h={24} w="60%" mt="lg" />
      <Skeleton h={14} w="80%" mt="md" />
      <Skeleton h={22} w="90%" mt="md" />
      <Skeleton h={36} mt="lg" />
    </Card>
  ))
}

export function RoomsSection({ standalone }) {
  const { data, loading, error } = useApi(
    (signal) => Promise.all([getRooms(signal), getEquipment(signal)]),
    [],
  )
  const [rooms, equipment] = data || [[], []]

  return (
    <Container size="xl" id="rooms" mt={standalone ? 56 : 120}>
      <Group justify="space-between" align="flex-end" mb={40} gap="lg">
        <div>
          <Text c="kut.4" fw={700} tt="uppercase" fz="sm" lts={1}>
            Кімнати
          </Text>
          <Title order={standalone ? 1 : 2} fz={{ base: 26, md: 36 }} mt={8}>
            Наші репетиційні кімнати
          </Title>
          <Text c="dimmed" mt="sm" maw={560}>
            Обери простір під свій формат — від репетиції гурту до запису подкасту.
          </Text>
        </div>
        <Button
          component={Link}
          to="/schedule"
          variant="default"
          rightSection={<IconArrowRight size={16} />}
        >
          Перейти до розкладу
        </Button>
      </Group>

      {error && (
        <Alert
          color="kut"
          variant="light"
          icon={<IconAlertTriangle />}
          title="Не вдалося завантажити кімнати"
          mb="xl"
        >
          {error.message}
        </Alert>
      )}

      {!loading && !error && rooms.length === 0 && (
        <Paper withBorder p={48} ta="center">
          <ThemeIcon size={64} radius="xl" variant="light" color="gray" mx="auto">
            <IconMoodEmpty size={34} />
          </ThemeIcon>
          <Text fw={700} fz="lg" mt="md">
            Кімнат поки немає
          </Text>
          <Text c="dimmed" mt={4}>
            Скоро тут з’являться наші репетиційні простори.
          </Text>
        </Paper>
      )}

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="xl">
        {loading ? (
          <RoomsSkeleton />
        ) : (
          rooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              equipment={equipment.filter((item) => item.room_id === room.id)}
            />
          ))
        )}
      </SimpleGrid>
    </Container>
  )
}

function CallToAction() {
  return (
    <Container size="xl" mt={120}>
      <Paper
        p={{ base: 32, md: 56 }}
        bg="linear-gradient(135deg, var(--mantine-color-kut-8) 0%, var(--mantine-color-kut-9) 45%, var(--mantine-color-dark-7) 100%)"
      >
        <Group justify="space-between" gap="xl">
          <div>
            <Title order={2} fz={{ base: 24, md: 34 }} c="white">
              Готові до репетиції?
            </Title>
            <Text c="kut.1" mt="sm" maw={520}>
              Обери вільний час у розкладі та забронюй кімнату онлайн.
            </Text>
          </div>
          <Button
            component={Link}
            to="/schedule"
            size="lg"
            variant="white"
            color="dark"
            rightSection={<IconArrowRight size={18} />}
          >
            Забронювати
          </Button>
        </Group>
      </Paper>
    </Container>
  )
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <Features />
      <RoomsSection />
      <CallToAction />
    </>
  )
}
