import { useContext } from 'react';
import { CatalogueContext } from './catalogue-context.js';

/** The hotel catalogue: approved properties from the API first, then the demo hotels. */
export function useCatalogue() {
  const context = useContext(CatalogueContext);
  if (!context) throw new Error('useCatalogue must be used within a CatalogueProvider');
  return context;
}
