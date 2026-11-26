// Partner Hub routes in one place (pages link to each other; avoids page <-> page imports).
export const PARTNER_PATHS = {
  landing: '/list-property',                 // pitch + sign in / create account
  properties: '/list-property/properties',   // Your properties (home after sign-in)
  newProperty: '/list-property/new',         // Add a property (type picker, then details)
  payments: '/list-property/payments',       // Net earnings and payouts dashboard
};

// Modules that are not built yet open /list-property/module/<id> ("Coming soon").
export const moduleSoonPath = (id) => `/list-property/module/${id}`;

export const IN_PROGRESS_TAB = 'in-progress';
export const propertiesTab = (tab) => `${PARTNER_PATHS.properties}${tab ? `?tab=${tab}` : ''}`;

/** One property; view = overview | bookings | rates-inventory | check-ins | staying | check-outs | earnings | reviews */
export const propertyDetailsPath = (id, view = 'overview') => `${PARTNER_PATHS.properties}/${encodeURIComponent(id)}?view=${view}`;

/** Overview of one property — the Home icon in the partner module row. */
export const propertyOverviewPath = (id) => propertyDetailsPath(id, 'overview');

export const propertyRatesSectionPath = (id, section) => `${propertyDetailsPath(id, 'rates-inventory')}&section=${encodeURIComponent(section)}`;

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
