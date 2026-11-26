// Loads the hotel catalogue once for the whole app.
// hotels = approved Partner Hub properties (from the API, newest first), then the demo hotels
// (lib/data/hotels.js). If the API can't be reached, the demo hotels are still shown.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchHotels } from '../api/catalogue.js';
import { hotels as demoHotels } from '../data/hotels.js';
import { CatalogueContext } from './catalogue-context.js';

export function CatalogueProvider({ children }) {
  const [live, setLive] = useState([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    fetchHotels(controller.signal)
      .then((found) => setLive(found))
      .catch((problem) => {
        if (problem?.name !== 'AbortError') setError(problem.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setReady(true);
      });
    return () => controller.abort();
  }, []);

  const hotels = useMemo(() => [...live, ...demoHotels], [live]);
  const getHotelBySlug = useCallback((slug) => hotels.find((hotel) => hotel.slug === slug), [hotels]);
  const getHotelById = useCallback((id) => hotels.find((hotel) => hotel.id === id), [hotels]);

  const value = useMemo(
    () => ({ hotels, liveHotels: live, ready, error, getHotelBySlug, getHotelById }),
    [hotels, live, ready, error, getHotelBySlug, getHotelById],
  );
  return <CatalogueContext.Provider value={value}>{children}</CatalogueContext.Provider>;
}
