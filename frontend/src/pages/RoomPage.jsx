import {
  Alert,
  Anchor,
  Badge,
  Box,
  Breadcrumbs,
  Button,
  Container,
  Grid,
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
  IconArrowLeft,
  IconCalendarPlus,
  IconCheck,
  IconClock,
  IconLock,
  IconRuler2,
  IconTool,
  IconUsers,
} from '@tabler/icons-react'
import { Link, useParams } from 'react-router-dom'
import { getRoom, getRoomEquipment } from '../api.js'
import RoomImage from '../components/RoomImage.jsx'
import { formatHours } from '../rooms.js'
import { useApi } from '../useApi.js'

function Stat({ icon: Icon, label, value }) {
  return (
    <Paper withBorder p={{ base: 'sm', xs: 'md' }}>
      <ThemeIcon variant="light" size={36} radius="md">
        <Icon size={20} />
      </ThemeIcon>
      <Text c="dimmed" fz="xs" mt="sm">
        {label}
      </Text>
      <Text fw={700} fz={{ base: 'sm', xs: 'md' }}>
        {value}
      </Text>
    </Paper>
  )
}

function RoomSkeleton() {
  return (
    <Grid gutter={48}>
      <Grid.Col span={{ base: 12, md: 7 }}>
        <Skeleton h={420} radius="lg" />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 5 }}>
        <Skeleton h={40} w="70%" />
        <Skeleton h={16} mt="xl" />
        <Skeleton h={16} mt="sm" w="85%" />
        <Skeleton h={72} mt="xl" />
        <Skeleton h={200} mt="xl" />
      </Grid.Col>
    </Grid>
  )
}

export default function RoomPage() {
  const { id } = useParams()
  const { data, loading, error } = useApi(
    (signal) => Promise.all([getRoom(id, signal), getRoomEquipment(id, signal)]),
    [id],
  )
  const [room, equipment] = data || [null, []]

  return (
    <Container size="xl" pt={40}>
      <Breadcrumbs mb="xl" c="dimmed" fz="sm">
        <Anchor component={Link} to="/" c="dimmed">
          Головна
        </Anchor>
        <Anchor component={Link} to="/rooms" c="dimmed">
          Кімнати
        </Anchor>
        <Text fz="sm">{room ? room.name : '…'}</Text>
      </Breadcrumbs>

      {loading && <RoomSkeleton />}

      {error && (
        <Alert
          color="kut"
          variant="light"
          icon={<IconAlertTriangle />}
          title="Не вдалося відкрити кімнату"
        >
          <Text fz="sm">{error.status === 404 ? 'Такої кімнати не існує.' : error.message}</Text>
          <Button
            component={Link}
            to="/rooms"
            variant="default"
            size="xs"
            mt="md"
            leftSection={<IconArrowLeft size={14} />}
          >
            До списку кімнат
          </Button>
        </Alert>
      )}

      {room && (
        <Grid gutter={48}>
          <Grid.Col span={{ base: 12, md: 7 }}>
            <RoomImage room={room} h={{ base: 260, md: 480 }} radius="lg" iconSize={72} />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 5 }}>
            <Stack gap="xl">
              <div>
                {room.is_members_only && (
                  <Badge leftSection={<IconLock size={12} />} variant="light" mb="sm">
                    Лише для кутівців
                  </Badge>
                )}
                <Title order={1} fz={{ base: 28, md: 40 }}>
                  {room.name}
                </Title>
                {room.description && (
                  <Text c="gray.4" mt="md" lh={1.7}>
                    {room.description}
                  </Text>
                )}
              </div>

              <SimpleGrid cols={3} spacing="sm">
                <Stat icon={IconUsers} label="Місткість" value={room.capacity + ' осіб'} />
                <Stat icon={IconRuler2} label="Площа" value={room.area + ' м²'} />
                <Stat icon={IconClock} label="Години" value={formatHours(room)} />
              </SimpleGrid>

              <Box>
                <Title order={2} fz="lg" mb="md">
                  Апаратура
                </Title>
                {equipment.length === 0 ? (
                  <Text c="dimmed">Апаратуру не зазначено.</Text>
                ) : (
                  <Stack gap="xs">
                    {equipment.map((item) => (
                      <Group key={item.id} justify="space-between" wrap="nowrap">
                        <Group gap="sm" wrap="nowrap">
                          <ThemeIcon
                            size={24}
                            radius="xl"
                            variant="light"
                            color={item.status === 'repair' ? 'orange' : 'teal'}
                          >
                            {item.status === 'repair' ? <IconTool size={14} /> : <IconCheck size={14} />}
                          </ThemeIcon>
                          <Text>{item.name}</Text>
                        </Group>
                        {item.status === 'repair' && (
                          <Badge color="orange" variant="light" size="sm">
                            На ремонті
                          </Badge>
                        )}
                      </Group>
                    ))}
                  </Stack>
                )}
              </Box>

              <Button
                component={Link}
                to="/schedule"
                size="lg"
                leftSection={<IconCalendarPlus size={20} />}
                fullWidth
              >
                Забронювати цю кімнату
              </Button>
            </Stack>
          </Grid.Col>
        </Grid>
      )}
    </Container>
  )
}
