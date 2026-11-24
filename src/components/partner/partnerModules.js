// Partner Hub modules shown in the row under the top bar (PartnerModuleNav), in display order.
// `to`   — a built page; without it the module opens the "Coming soon" page (/list-property/module/<id>).
// `also` — extra paths that keep the module highlighted (e.g. Add a property belongs to Properties).
// Add / remove / rename modules here only. More modules come later, e.g.
//   { id: 'bookings', label: 'Bookings', Icon: CalendarCheck },   // -> "Coming soon" until it has a page
import { Building2, Inbox } from 'lucide-react';
import { PARTNER_PATHS, moduleSoonPath } from './paths.js';

export const PARTNER_MODULES = [
  { id: 'properties', label: 'Properties', Icon: Building2, to: PARTNER_PATHS.properties, also: [PARTNER_PATHS.newProperty] },
  { id: 'inbox', label: 'Group inbox', Icon: Inbox },
].map((m) => ({ also: [], ...m, href: m.to ?? moduleSoonPath(m.id), soon: !m.to }));

export const moduleById = (id) => PARTNER_MODULES.find((m) => m.id === id);
