import { createTheme } from '@mantine/core'

// Фірмовий червоний КУТ (#a32820) — 7-й відтінок палітри
const kut = [
  '#fdecea',
  '#f8d6d3',
  '#eeaaa4',
  '#e57b72',
  '#dd5449',
  '#d83c30',
  '#c43226',
  '#a32820',
  '#8a2019',
  '#701812',
]

// Нейтральна темна палітра без синього відтінку, як у макеті
const dark = [
  '#c9c9c9',
  '#b8b8b8',
  '#8a8a8a',
  '#666666',
  '#3a3a3a',
  '#2a2a2a',
  '#1c1c1c',
  '#121212',
  '#0c0c0c',
  '#080808',
]

export const theme = createTheme({
  colors: { kut, dark },
  primaryColor: 'kut',
  primaryShade: 7,
  defaultRadius: 'md',
  cursorType: 'pointer',
  fontFamily: "'Inter Variable', system-ui, sans-serif",
  headings: {
    fontFamily: "'Unbounded', 'Inter Variable', sans-serif",
    fontWeight: '700',
  },
  components: {
    Button: {
      defaultProps: { fw: 600 },
    },
    Card: {
      defaultProps: { radius: 'lg' },
    },
    Paper: {
      defaultProps: { radius: 'lg' },
    },
  },
})
