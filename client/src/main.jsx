import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import './lib/i18n'
import { queryClient } from './lib/queryClient'
import { Toaster } from './components/ui/sonner'
import AppRoutes from './routes/AppRoutes.jsx'
import { useUIStore } from './store/useUIStore'

// Component to handle resize listener
function ResizeHandler() {
  useEffect(() => {
    const handleResize = () => {
      useUIStore.getState().handleResize()
    }

    // Initial check
    handleResize()

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return null
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ResizeHandler />
      <AppRoutes />
      <Toaster position="top-right" richColors closeButton />
    </QueryClientProvider>
  </StrictMode>,
)