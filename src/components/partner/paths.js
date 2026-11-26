// Partner Hub routes in one place (pages link to each other; avoids page <-> page imports).
export const PARTNER_PATHS = {
  landing: '/list-property',                 // pitch + sign in / create account
  properties: '/list-property/properties',   // Your properties (home after sign-in)
  newProperty: '/list-property/new',         // Add a property (type picker, then details)
  payments: '/list-property/payments',       // Net earnings and payouts dashboard
  marginOffers: '/list-property/margin-offers',
  reports: '/list-property/reports',
};

// Modules that are not built yet open /list-property/module/<id> ("Coming soon").
export const moduleSoonPath = (id) => `/list-property/module/${id}`;

export const IN_PROGRESS_TAB = 'in-progress';
export const propertiesTab = (tab) => `${PARTNER_PATHS.properties}${tab ? `?tab=${tab}` : ''}`;

/** One property; view = overview | bookings | rates-inventory | check-ins | staying | check-outs | earnings | reviews | analytics */
export const propertyDetailsPath = (id, view = 'overview') => `${PARTNER_PATHS.properties}/${encodeURIComponent(id)}?view=${view}`;

/** Overview of one property — the Home icon in the partner module row. */
export const propertyOverviewPath = (id) => propertyDetailsPath(id, 'overview');

// Pages without a property in the URL (Payments, More, …) link to the last property opened;
// before any is opened they use CURRENT_PROPERTY, which the property page swaps for the first property.
export const CURRENT_PROPERTY = 'current';
const LAST_PROPERTY_KEY = 'triponx.partner.lastProperty';
export function rememberProperty(id) {
  try {
    if (id) window.sessionStorage.setItem(LAST_PROPERTY_KEY, id);
    else window.sessionStorage.removeItem(LAST_PROPERTY_KEY);
  } catch { /* storage blocked */ }
}
export function currentPropertyId(id) {
  if (id) return id;
  try { return window.sessionStorage.getItem(LAST_PROPERTY_KEY) || CURRENT_PROPERTY; } catch { return CURRENT_PROPERTY; }
}

export const propertyRatesSectionPath = (id, section) => `${propertyDetailsPath(id, 'rates-inventory')}&section=${encodeURIComponent(section)}`;

export const propertyAnalyticsSectionPath = (id, section) => `${propertyDetailsPath(id, 'analytics')}&section=${encodeURIComponent(section)}`;

/** Payments dashboard; tab = earnings | payouts, view = old | new. */
export const paymentsPath = (tab, view) => {
  const params = new URLSearchParams();
  if (tab) params.set('tab', tab);
  if (view) params.set('view', view);
  const query = params.toString();
  return `${PARTNER_PATHS.payments}${query ? `?${query}` : ''}`;
};

/** The wizard for one property (draft or changes needed). */
export const propertyPath = (id) => `${PARTNER_PATHS.newProperty}?property=${encodeURIComponent(id)}`;
