// Partner Hub routes in one place (pages link to each other; avoids page <-> page imports).
export const PARTNER_PATHS = {
  landing: '/list-property',                 // pitch + sign in / create account
  properties: '/list-property/properties',   // My Properties (home after sign-in)
  newProperty: '/list-property/new',         // List New Property form
};

export const IN_PROGRESS_TAB = 'in-progress';
export const propertiesTab = (tab) => `${PARTNER_PATHS.properties}${tab ? `?tab=${tab}` : ''}`;
