import { Button, Container, Text, ThemeIcon, Title } from '@mantine/core'
import { IconArrowLeft, IconTools } from '@tabler/icons-react'
import { Link } from 'react-router-dom'

export default function PlaceholderPage({
  title,
  text = 'Цей розділ ще в розробці. Зазирніть трохи згодом.',
}) {
  return (
    <Container size="sm" py={120} ta="center">
      <ThemeIcon size={80} radius="xl" variant="light" mx="auto">
        <IconTools size={40} />
      </ThemeIcon>
      <Title order={1} mt="xl" fz={{ base: 28, md: 40 }}>
        {title}
      </Title>
      <Text c="dimmed" mt="md">
        {text}
      </Text>
      <Button
        component={Link}
        to="/"
        variant="default"
        mt="xl"
        leftSection={<IconArrowLeft size={16} />}
      >
        На головну
      </Button>
    </Container>
  )
}
