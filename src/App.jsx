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
import ListPropertyPage from './pages/ListPropertyPage.jsx';
import PartnerPropertiesPage from './pages/PartnerPropertiesPage.jsx';
import PartnerNewPropertyPage from './pages/PartnerNewPropertyPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import { PARTNER_PATH } from './lib/context/AuthProvider.jsx';
import { RequireAuth } from './components/auth/RequireAuth.jsx';

// Booking and personal pages need an account; signed-out visitors see a sign-in card (no auto popup).
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
  // Partner Hub is a separate, standalone experience (own top bar, opened in a new tab).
  const isPartner = pathname.startsWith(PARTNER_PATH);
  const siteChrome = !isHome && !isPartner;
  return (
    <div className="page">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <ScrollToTop />
      {siteChrome && <Header />}
      <main id="main-content" key={pathname} className="page-main">
        <Outlet />
      </main>
      {siteChrome && <Footer />}
      {!isPartner && <MobileNav />}
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
        {/* Browsing is open to everyone — no sign-in prompt just for visiting */}
        <Route path="hotels" element={<HotelsPage />} />
        <Route path="hotels/:slug" element={<HotelDetailsPage />} />
        <Route path="hotels/:slug/photos" element={<HotelGalleryPage />} />
        <Route path="wishlist" element={<WishlistPage />} />
        <Route path="make-a-payment" element={<MakeAPaymentPage />} />
        {/* Booking + personal pages need an account (reached by clicking Reserve / account links) */}
        <Route element={<Protected />}>
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="payment" element={<PaymentPage />} />
          <Route path="confirmation/:bookingId" element={<ConfirmationPage />} />
          <Route path="trips" element={<MyTripsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
        {/* Partner Hub: public page with its own inline sign-in */}
        <Route path="list-property" element={<ListPropertyPage />} />
        {/* Partner Hub signed-in pages (PartnerShell checks sign-in and sends visitors back to /list-property) */}
        <Route path="list-property/properties" element={<PartnerPropertiesPage />} />
        <Route path="list-property/new" element={<PartnerNewPropertyPage />} />
        <Route path="list-property/dashboard" element={<Navigate replace to="/list-property/properties" />} />
        <Route path="search" element={<LegacySearch />} />
        <Route path="stay/:id" element={<LegacyStay />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
