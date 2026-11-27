
import { useCallback, useEffect, useRef, useState } from 'react';
import { partnerApi } from '../context/AuthProvider.jsx';

/** -> [{ code, label, description, types: [{ code, label, description }] }], in the order to show them. */
export async function fetchPropertyCategories() {
  const data = await partnerApi.get('/partner/property-types');
  if (!Array.isArray(data?.categories)) throw new Error('Unexpected response');
  return data.categories.filter((c) => c?.code && Array.isArray(c.types) && c.types.length);
}

export function usePropertyTypes() {
  const [state, setState] = useState({ categories: [], loading: true, error: '' });
  const latest = useRef(0); // only the newest request may update the screen

  const reload = useCallback(async () => {
    const request = ++latest.current;
    setState({ categories: [], loading: true, error: '' });
    try {
      const categories = await fetchPropertyCategories();
      if (request === latest.current) setState({ categories, loading: false, error: '' });
    } catch (err) {
      if (request !== latest.current) return;
      // 404 / 500 texts from the server are technical; offline and "too many requests" ones are useful.
      const error = err?.status === 0 || err?.status === 429 ? err.message : 'We couldn’t load the property types. Please try again.';
      setState({ categories: [], loading: false, error });
    }
  }, []);

  useEffect(() => {
    reload();
    return () => { latest.current += 1; };
  }, [reload]);

  return { ...state, reload };
}
