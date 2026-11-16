import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { CheckoutPage } from './pages/CheckoutPage'
import { ConfirmationPage } from './pages/ConfirmationPage'
import { HomePage } from './pages/HomePage'
import { HotelDetailsPage } from './pages/HotelDetailsPage'
import { HotelGalleryPage } from './pages/HotelGalleryPage'
import { HotelsPage } from './pages/HotelsPage'
import { MakeAPaymentPage } from './pages/MakeAPaymentPage'
import { MyTripsPage } from './pages/MyTripsPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { PaymentPage } from './pages/PaymentPage'
import { ProfilePage } from './pages/ProfilePage'
import { WishlistPage } from './pages/WishlistPage'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="hotels" element={<HotelsPage />} />
        <Route path="wishlist" element={<WishlistPage />} />
        <Route path="hotels/:slug/photos" element={<HotelGalleryPage />} />
        <Route path="hotels/:slug" element={<HotelDetailsPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="trips" element={<MyTripsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="make-a-payment" element={<MakeAPaymentPage />} />
        <Route path="payment" element={<PaymentPage />} />
        <Route path="confirmation/:bookingId" element={<ConfirmationPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App
