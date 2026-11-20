// Partner Hub routes in one place (pages link to each other; avoids page <-> page imports).
export const PARTNER_PATHS = {
  landing: '/list-property',                 // pitch + sign in / create account
  properties: '/list-property/properties',   // Your properties (home after sign-in)
  newProperty: '/list-property/new',         // Add a property (type picker, then details)
};

// Modules that are not built yet open /list-property/module/<id> ("Coming soon").
export const moduleSoonPath = (id) => `/list-property/module/${id}`;

export const IN_PROGRESS_TAB = 'in-progress';
export const propertiesTab = (tab) => `${PARTNER_PATHS.properties}${tab ? `?tab=${tab}` : ''}`;
