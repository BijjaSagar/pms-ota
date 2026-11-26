// Partner Hub modules shown in the row under the top bar (PartnerModuleNav), in display order.
// `to`      — a built page; without it the module opens the "Coming soon" page (/list-property/module/<id>).
// `hrefFor` — builds a link from the current route (Home/Bookings point at the open property's views).
// `also`    — extra paths that keep the module highlighted (property pages belong to Home).
// Modules are static placeholders for now; each one gets its real page one by one.
import {
  BedDouble,
  Building2,
  CalendarCheck,
  ChartNoAxesCombined,
  ClipboardList,
  CreditCard,
  Ellipsis,
  House,
  Inbox,
  Star,
} from 'lucide-react';
import { PARTNER_PATHS, moduleSoonPath, propertyDetailsPath, propertyOverviewPath } from './paths.js';

export const PARTNER_MODULES = [
  {
    id: 'home', label: 'Home', Icon: House, to: PARTNER_PATHS.properties,
    hrefFor: ({ propertyId }) => propertyOverviewPath(propertyId ?? 'sample'),
    view: 'overview', also: [PARTNER_PATHS.properties],
  },
  {
    id: 'bookings', label: 'Bookings', Icon: CalendarCheck, to: PARTNER_PATHS.properties,
    hrefFor: ({ propertyId }) => propertyDetailsPath(propertyId ?? 'sample', 'bookings'),
    view: 'bookings',
  },
  {
    id: 'rates-inventory', label: 'Rates & Inventory', Icon: BedDouble, to: PARTNER_PATHS.properties,
    hrefFor: ({ propertyId }) => propertyDetailsPath(propertyId ?? 'sample', 'rates-inventory'),
    view: 'rates-inventory',
  },
  { id: 'payments', label: 'Payments', Icon: CreditCard, to: PARTNER_PATHS.payments },
  { id: 'property-information', label: 'Property Information', Icon: ClipboardList },
  {
    id: 'ratings-reviews', label: 'Ratings & Reviews', Icon: Star, to: PARTNER_PATHS.properties,
    hrefFor: ({ propertyId }) => propertyDetailsPath(propertyId ?? 'sample', 'reviews'),
    view: 'reviews',
  },
  {
    id: 'analytics', label: 'Analytics', Icon: ChartNoAxesCombined, to: PARTNER_PATHS.properties,
    hrefFor: ({ propertyId }) => propertyDetailsPath(propertyId ?? 'sample', 'analytics'),
    view: 'analytics',
  },
  { id: 'more', label: 'More', Icon: Ellipsis },
].map((m) => ({ also: [], ...m, href: m.to ?? moduleSoonPath(m.id), soon: !m.to }));

// The property list keeps its original two-item row; other partner pages use the modules above.
export const PROPERTY_LIST_MODULES = [
  { id: 'properties', label: 'Properties', Icon: Building2, to: PARTNER_PATHS.properties, also: [PARTNER_PATHS.newProperty] },
  { id: 'inbox', label: 'Group inbox', Icon: Inbox },
].map((m) => ({ also: [], ...m, href: m.to ?? moduleSoonPath(m.id), soon: !m.to }));

export const moduleById = (id) => [...PARTNER_MODULES, ...PROPERTY_LIST_MODULES].find((m) => m.id === id);
