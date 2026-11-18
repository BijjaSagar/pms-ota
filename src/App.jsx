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
import { RequireAuth } from './components/auth/RequireAuth.jsx';

// Every page except Home needs an account; signed-out visitors get the register/login modal.
function Protected() {
  return (
    <RequireAuth>
      <Outlet />
    </RequireAuth>
  );
}

// Scroll to a #section when the link has one, otherwise to the top (from pms-ota).
function ScrollToTop() {
  const { pathname, hash, key } = useLocation();
  // New page: start at the top (unless the link points at a section).
  useEffect(() => {
    if (!hash) window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname, hash]);
  // Section links (/#offers): scroll every time they are clicked, even if the hash is unchanged.
  useEffect(() => {
    if (!hash) return;
    const target = document.querySelector(hash);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [hash, key]);
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
        <Route element={<Protected />}>
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
        </Route>
        <Route path="search" element={<LegacySearch />} />
        <Route path="stay/:id" element={<LegacyStay />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
