import { Box, Center, Group, Paper, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core'
import { IconCalendarCheck, IconDeviceSpeaker, IconUsersGroup } from '@tabler/icons-react'

const PERKS = [
  { icon: IconCalendarCheck, text: 'Бронюй кімнати онлайн у кілька кліків' },
  { icon: IconDeviceSpeaker, text: 'Апаратура вже чекає на місці' },
  { icon: IconUsersGroup, text: 'Простір для гуртів, музикантів і подкастерів' },
]

export default function AuthLayout({ children }) {
  return (
    <SimpleGrid cols={{ base: 1, md: 2 }} spacing={0} mih="calc(100vh - var(--app-shell-header-height))">
      <Box className="auth-aside" visibleFrom="md" p={56}>
        <Stack justify="flex-end" h="100%" gap="xl">
          <Title order={2} fz={40} lh={1.15} c="white" maw={460}>
            Твій музичний простір
          </Title>
          <Stack gap="md">
            {PERKS.map((perk) => (
              <Group key={perk.text} gap="md" wrap="nowrap">
                <ThemeIcon size={40} radius="md" variant="light">
                  <perk.icon size={22} />
                </ThemeIcon>
                <Text c="gray.2">{perk.text}</Text>
              </Group>
            ))}
          </Stack>
        </Stack>
      </Box>

      <Center px="md" py={{ base: 40, md: 64 }}>
        <Paper withBorder w="100%" maw={440} p={{ base: 24, sm: 40 }} shadow="xl">
          {children}
        </Paper>
      </Center>
    </SimpleGrid>
  )
}
