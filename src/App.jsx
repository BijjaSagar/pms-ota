import { useEffect } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { Header, Footer } from './components/Layout.jsx';
import MobileNav from './components/MobileNav.jsx';
import Home from './pages/Home.jsx';
import HotelsPage from './pages/HotelsPage.jsx';
import HotelDetailsPage from './pages/HotelDetailsPage.jsx';
import HotelGalleryPage from './pages/HotelGalleryPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import PaymentPage from './pages/PaymentPage.jsx';
import ConfirmationPage from './pages/ConfirmationPage.jsx';
import MyTripsPage from './pages/MyTripsPage.jsx';
import WishlistPage from './pages/WishlistPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import MakeAPaymentPage from './pages/MakeAPaymentPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

// Scroll to a #section when the link has one, otherwise to the top (from pms-ota).
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const target = document.querySelector(hash);
      if (target) { target.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname, hash]);
  return null;
}

// Home draws its own overlay navbar and footer (one-screen sections); every other page uses these.
function AppLayout() {
  const { pathname } = useLocation();
  const isHome = pathname === '/';
  return (
    <div className="page">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <ScrollToTop />
      {!isHome && <Header />}
      <main id="main-content" key={pathname} className="page-main">
        <Outlet />
      </main>
      {!isHome && <Footer />}
      <MobileNav />
    </div>
  );
}

// Old TriponX URLs keep working.
function LegacySearch() {
  const [params] = useSearchParams();
  const where = params.get('where');
  return <Navigate replace to={where ? `/hotels?destination=${encodeURIComponent(where)}` : '/hotels'} />;
}
function LegacyStay() {
  const { id } = useParams();
  return <Navigate replace to={`/hotels/${id}`} />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Home />} />
        <Route path="hotels" element={<HotelsPage />} />
        <Route path="hotels/:slug" element={<HotelDetailsPage />} />
        <Route path="hotels/:slug/photos" element={<HotelGalleryPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="payment" element={<PaymentPage />} />
        <Route path="confirmation/:bookingId" element={<ConfirmationPage />} />
        <Route path="trips" element={<MyTripsPage />} />
        <Route path="wishlist" element={<WishlistPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="make-a-payment" element={<MakeAPaymentPage />} />
        <Route path="search" element={<LegacySearch />} />
        <Route path="stay/:id" element={<LegacyStay />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
