import { NavLink } from 'react-router-dom';
import { BedDouble, House, UserRound } from 'lucide-react';
import { HeartIcon, CalendarIcon } from './Icons.jsx';

// Floating bottom tab bar, shown only on small screens (see .mobile-nav in styles.css).
export default function MobileNav() {
  const items = [
    { to: '/', label: 'Home', Icon: House, end: true },
    { to: '/hotels', label: 'Hotels', Icon: BedDouble },
    { to: '/wishlist', label: 'Saved', Icon: HeartIcon },
    { to: '/trips', label: 'Trips', Icon: CalendarIcon },
    { to: '/profile', label: 'Profile', Icon: UserRound },
  ];
  return (
    <nav aria-label="App" className="mobile-nav">
      {items.map(({ to, label, Icon, end }) => (
        <NavLink key={label} to={to} end={end} className={({ isActive }) => (isActive ? 'is-active' : '')}>
          <Icon size={22} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
