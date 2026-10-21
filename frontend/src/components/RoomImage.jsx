import { Center, Image } from '@mantine/core'
import { IconMusic } from '@tabler/icons-react'
import { getRoomImage } from '../rooms.js'

// Фото кімнати або заглушка з іконкою, якщо фото немає
export default function RoomImage({ room, w, h, radius, iconSize, alt = room.name }) {
  const image = getRoomImage(room)

  if (image) {
    return <Image src={image} alt={alt} w={w} h={h} radius={radius} />
  }

  return (
    <Center
      w={w}
      h={h}
      bg="dark.6"
      style={{ borderRadius: radius && `var(--mantine-radius-${radius})`, flexShrink: 0 }}
    >
      <IconMusic size={iconSize} stroke={1.2} color="var(--mantine-color-dark-3)" />
    </Center>
  )
}
