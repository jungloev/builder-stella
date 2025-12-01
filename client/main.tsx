import { createRoot } from 'react-dom/client'
import App from './App.tsx'

const rootElement = document.getElementById("root")
if (!rootElement) throw new Error('Failed to find the root element')

const root = createRoot(rootElement)
root.render(<App />)

if (import.meta.hot) {
  import.meta.hot.accept('./App.tsx', () => {
    root.render(<App />)
  })
}
