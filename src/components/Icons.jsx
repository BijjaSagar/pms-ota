import { useId } from 'react';
// Thin-stroke icon set. All decorative by default (aria-hidden).
const base = (size, stroke, width) => ({
  width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
  stroke, strokeWidth: width, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true,
});

const make = (paths) => ({ size = 20, color = 'currentColor', width = 1.8, ...rest }) => (
  <svg {...base(size, color, width)} {...rest}>{paths}</svg>
);

export const SearchIcon = make(<><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.2-4.2" /></>);
export const PinIcon = make(<><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></>);
export const CalendarIcon = make(<><rect x="3.5" y="5" width="17" height="15" rx="3" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>);
export const CalendarCheckIcon = make(<><rect x="3.5" y="5" width="17" height="15" rx="3" /><path d="M3.5 10h17M9 15l2 2 4-4" /></>);
export const UsersIcon = make(<><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5M16 4.8a3.3 3.3 0 0 1 0 6.4M18 14.8c1.9.6 3.1 2.3 3.5 5.2" /></>);
export const HeartIcon = make(<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />);
export const CheckIcon = make(<path d="M5 12l4 4L19 6" />);
export const StarIcon = make(<path d="M12 3l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.8z" />);
export const PriceIcon = make(<><path d="M4 7h16M4 12h10M4 17h7" /><circle cx="18" cy="16" r="3" /></>);
export const ArrowRight = make(<path d="M5 12h14M13 6l6 6-6 6" />);
export const ArrowLeft = make(<path d="M19 12H5M11 6l-6 6 6 6" />);
export const ChevronLeft = make(<path d="M15 6l-6 6 6 6" />);
export const ChevronRight = make(<path d="M9 6l6 6-6 6" />);
export const InfoIcon = make(<><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></>);
export const SparkIcon = make(<path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" />);
export const ShareIcon = make(<path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M12 3v12M7 8l5-5 5 5" />);
export const LockIcon = make(<><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>);
export const ChatIcon = make(<path d="M4 5h16v11H8l-4 4z" />);

// TriponX mark: rounded "app icon" tile with a paper plane (travel / getting there).
export function Logo({ size = 32 }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient id={`tx-bg-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5C9A82" />
          <stop offset="1" stopColor="#2F5447" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="32" height="32" rx="9.5" fill={`url(#tx-bg-${id})`} />
      <rect x="0.5" y="0.5" width="31" height="31" rx="9" fill="none" stroke="rgba(255,255,255,0.25)" />
      <path d="M7.5 15.2 24.5 8 19.6 24.6 15.6 17.6Z" fill="#fff" />
      <path d="M15.6 17.6 24.5 8" stroke="#2F5447" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M15.6 17.6 15.2 22.4 17.6 20.6" fill="#D6E2DA" />
    </svg>
  );
}
