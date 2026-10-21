import { Badge, Box, Button, Card, Group, Stack, Text, Title } from '@mantine/core'
import { IconArrowRight, IconClock, IconLock, IconRuler2, IconUsers } from '@tabler/icons-react'
import { Link } from 'react-router-dom'
import { formatHours } from '../rooms.js'
import RoomImage from './RoomImage.jsx'

const MAX_BADGES = 4

export default function RoomCard({ room, equipment }) {
  const shown = equipment.slice(0, MAX_BADGES)
  const hidden = equipment.length - shown.length

  return (
    <Card
      component={Link}
      to={'/rooms/' + room.id}
      className="room-card"
      withBorder
      padding="lg"
      h="100%"
    >
      <Card.Section pos="relative" style={{ overflow: 'hidden' }}>
        <RoomImage room={room} h={220} iconSize={56} />
        {room.is_members_only && (
          <Badge
            pos="absolute"
            top={14}
            left={14}
            leftSection={<IconLock size={12} />}
            variant="filled"
            color="dark.8"
          >
            Лише для кутівців
          </Badge>
        )}
      </Card.Section>

      <Stack gap="md" mt="lg" style={{ flex: 1 }}>
        <Title order={3} fz="h4">
          {room.name}
        </Title>

        <Group gap="lg" c="dimmed" fz="sm">
          <Group gap={6}>
            <IconUsers size={16} />
            до {room.capacity} осіб
          </Group>
          <Group gap={6}>
            <IconRuler2 size={16} />
            {room.area} м²
          </Group>
          <Group gap={6}>
            <IconClock size={16} />
            {formatHours(room)}
          </Group>
        </Group>

        <Box style={{ flex: 1 }}>
          {equipment.length === 0 ? (
            <Text c="dimmed" fz="sm">
              Апаратуру не зазначено
            </Text>
          ) : (
            <Group gap={6}>
              {shown.map((item) => (
                <Badge
                  key={item.id}
                  variant="light"
                  color={item.status === 'repair' ? 'orange' : 'gray'}
                  tt="none"
                  fw={500}
                >
                  {item.name}
                  {item.status === 'repair' && ' · ремонт'}
                </Badge>
              ))}
              {hidden > 0 && (
                <Badge variant="outline" color="gray" tt="none" fw={500}>
                  +{hidden}
                </Badge>
              )}
            </Group>
          )}
        </Box>

        <Button
          component="span"
          variant="default"
          rightSection={<IconArrowRight size={16} />}
          fullWidth
        >
          Детальніше
        </Button>
      </Stack>
    </Card>
  )
}
