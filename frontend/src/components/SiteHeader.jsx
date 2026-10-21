import {
  Avatar,
  Badge,
  Burger,
  Button,
  Container,
  Divider,
  Drawer,
  Group,
  Image,
  Menu,
  NavLink as MantineNavLink,
  Skeleton,
  Stack,
  Text,
  UnstyledButton,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconChevronDown, IconLogin2, IconLogout, IconUserPlus } from '@tabler/icons-react'
import { Link, useLocation } from 'react-router-dom'
import logo from '../assets/logo.png'
import { NAV_LINKS } from '../navigation.js'

const ROLE_LABELS = {
  client: 'Клієнт',
  kutivets: 'Кутівець',
  admin: 'Адміністратор',
  manager: 'Менеджер',
  superadmin: 'Суперадмін',
}

function initials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}

function UserMenu({ user, onLogout }) {
  return (
    <Menu position="bottom-end" width={240} shadow="lg">
      <Menu.Target>
        <UnstyledButton aria-label="Меню користувача">
          <Group gap="xs">
            <Avatar color="kut" variant="filled" radius="xl" size={36}>
              {initials(user.full_name)}
            </Avatar>
            <Text fz="sm" fw={600} maw={140} truncate>
              {user.full_name}
            </Text>
            <IconChevronDown size={16} />
          </Group>
        </UnstyledButton>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>
          <Text fz="sm" fw={600} c="bright" truncate>
            {user.full_name}
          </Text>
          <Text fz="xs" c="dimmed" truncate>
            {user.email}
          </Text>
          <Badge mt={8} size="sm" variant="light">
            {ROLE_LABELS[user.role] || user.role}
          </Badge>
        </Menu.Label>
        <Menu.Divider />
        <Menu.Item leftSection={<IconLogout size={16} />} color="kut.4" onClick={onLogout}>
          Вийти
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}

export default function SiteHeader({ user, authLoading, onLogout }) {
  const [opened, { toggle, close }] = useDisclosure(false)
  const { pathname } = useLocation()

  function isActive(to) {
    return to === '/' ? pathname === '/' : pathname.startsWith(to)
  }

  return (
    <Container size="xl" h="100%">
      <Group h="100%" justify="space-between" wrap="nowrap">
        <Group component={Link} to="/" gap="sm" aria-label="КУТ — головна" style={{ textDecoration: 'none' }}>
          <Image src={logo} alt="" w={36} h={36} fit="contain" />
          <Text ff="heading" fw={900} fz="xl" c="white">
            КУТ
          </Text>
        </Group>

        <Group gap={4} visibleFrom="md" component="nav" aria-label="Навігація">
          {NAV_LINKS.map((link) => (
            <Button
              key={link.to}
              component={Link}
              to={link.to}
              variant={isActive(link.to) ? 'light' : 'subtle'}
              color={isActive(link.to) ? 'kut' : 'gray'}
              c={isActive(link.to) ? undefined : 'gray.3'}
              fw={500}
            >
              {link.label}
            </Button>
          ))}
        </Group>

        <Group gap="sm" visibleFrom="md" wrap="nowrap">
          {authLoading ? (
            <Skeleton h={36} w={160} radius="xl" />
          ) : user ? (
            <UserMenu user={user} onLogout={onLogout} />
          ) : (
            <>
              <Button component={Link} to="/register" variant="subtle" color="gray" c="gray.3">
                Реєстрація
              </Button>
              <Button component={Link} to="/login" leftSection={<IconLogin2 size={18} />}>
                Увійти
              </Button>
            </>
          )}
        </Group>

        <Burger
          opened={opened}
          onClick={toggle}
          hiddenFrom="md"
          aria-label={opened ? 'Закрити меню' : 'Відкрити меню'}
        />
      </Group>

      <Drawer
        opened={opened}
        onClose={close}
        position="right"
        size="xs"
        title={
          <Text ff="heading" fw={900} fz="lg">
            КУТ
          </Text>
        }
        hiddenFrom="md"
        overlayProps={{ backgroundOpacity: 0.6, blur: 4 }}
      >
        <Stack gap={4} component="nav" aria-label="Мобільна навігація">
          {NAV_LINKS.map((link) => (
            <MantineNavLink
              key={link.to}
              component={Link}
              to={link.to}
              label={link.label}
              active={isActive(link.to)}
              onClick={close}
              variant="light"
              style={{ borderRadius: 'var(--mantine-radius-md)' }}
            />
          ))}
        </Stack>

        <Divider my="lg" />

        {authLoading ? null : user ? (
          <Stack gap="sm">
            <Group gap="sm">
              <Avatar color="kut" variant="filled" radius="xl">
                {initials(user.full_name)}
              </Avatar>
              <div style={{ minWidth: 0 }}>
                <Text fz="sm" fw={600} truncate>
                  {user.full_name}
                </Text>
                <Text fz="xs" c="dimmed" truncate>
                  {user.email}
                </Text>
              </div>
            </Group>
            <Button
              variant="default"
              leftSection={<IconLogout size={18} />}
              onClick={() => {
                onLogout()
                close()
              }}
            >
              Вийти
            </Button>
          </Stack>
        ) : (
          <Stack gap="sm">
            <Button component={Link} to="/login" onClick={close} leftSection={<IconLogin2 size={18} />}>
              Увійти
            </Button>
            <Button
              component={Link}
              to="/register"
              onClick={close}
              variant="default"
              leftSection={<IconUserPlus size={18} />}
            >
              Зареєструватися
            </Button>
          </Stack>
        )}
      </Drawer>
    </Container>
  )
}
