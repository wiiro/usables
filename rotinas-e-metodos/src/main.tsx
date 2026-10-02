import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { createStoreFromStorage, getBrowserStorage, syncWithOtherTabs } from './store/bootstrap'
import { StoreProvider } from './store/StoreProvider'

const storage = getBrowserStorage()
const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
const store = createStoreFromStorage({
  storage,
  initialTheme: prefersDark ? 'dark' : 'light',
  now: () => new Date(),
})
if (storage) syncWithOtherTabs(storage, store, window)

const root = document.getElementById('root')
if (!root) throw new Error('Elemento #root não encontrado em index.html.')

createRoot(root).render(
  <StrictMode>
    <StoreProvider store={store}>
      <App />
    </StoreProvider>
  </StrictMode>,
)
