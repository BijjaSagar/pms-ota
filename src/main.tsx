import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { BookingProvider } from './context/BookingProvider'
import { TripsProvider } from './context/TripsProvider'
import { WishlistProvider } from './context/WishlistProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <BookingProvider>
        <WishlistProvider>
          <TripsProvider>
            <App />
          </TripsProvider>
        </WishlistProvider>
      </BookingProvider>
    </BrowserRouter>
  </StrictMode>,
)
