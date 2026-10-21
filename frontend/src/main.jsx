import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MantineProvider } from '@mantine/core'
import '@fontsource-variable/inter'
import '@fontsource/unbounded/cyrillic-700.css'
import '@fontsource/unbounded/latin-700.css'
import '@fontsource/unbounded/cyrillic-900.css'
import '@fontsource/unbounded/latin-900.css'
import '@mantine/core/styles.css'
import './index.css'
import { theme } from './theme.js'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MantineProvider theme={theme} forceColorScheme="dark">
      <App />
    </MantineProvider>
  </StrictMode>,
)
