import { Box, Container, Divider, Group, Image, SimpleGrid, Stack, Text, Title } from '@mantine/core'
import { IconBrandTelegram, IconCalendarEvent, IconClock } from '@tabler/icons-react'
import logo from '../assets/logo.png'

const SCHEDULE_INFO = [
  { icon: IconClock, text: 'Пн–Нд: з 09:00 до 21:00' },
  { icon: IconBrandTelegram, text: 'Бронювання онлайн або через Telegram' },
  { icon: IconCalendarEvent, text: 'Записи подкастів і репетиції — лише за попереднім записом' },
]

export default function SiteFooter() {
  return (
    <Box
      component="footer"
      id="hours"
      mt={120}
      style={{ borderTop: '1px solid var(--mantine-color-dark-5)' }}
      bg="dark.8"
    >
      <Container size="xl" py={64}>
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing={48}>
          <Stack gap="md">
            <Group gap="sm">
              <Image src={logo} alt="" w={32} h={32} fit="contain" />
              <Text ff="heading" fw={900} fz="lg">
                КУТ
              </Text>
            </Group>
            <Text c="dimmed" fz="sm" maw={320}>
              Репетиційні кімнати та студія для подкастів студентської організації «КУТ».
            </Text>
          </Stack>

          <Stack gap="md">
            <Title order={4} fz="sm" tt="uppercase" c="dimmed">
              Графік роботи
            </Title>
            {SCHEDULE_INFO.map((item) => (
              <Group key={item.text} gap="sm" wrap="nowrap" align="flex-start">
                <item.icon size={20} color="var(--mantine-color-kut-4)" />
                <Text fz="sm">{item.text}</Text>
              </Group>
            ))}
          </Stack>
        </SimpleGrid>

        <Divider my="xl" color="dark.5" />
        <Text c="dimmed" fz="xs">
          © {new Date().getFullYear()} КУТ. Твій музичний простір.
        </Text>
      </Container>
    </Box>
  )
}
