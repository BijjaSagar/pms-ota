// Public hotel catalogue: approved Partner Hub properties (GET /hotels). No sign-in needed.
// The API sends hotels in the same shape as the demo hotels (lib/data/hotels.js); only the
// photo fields are API paths, turned into full URLs here.
import { API_BASE, publicApi } from './client.js';

const toUrl = (path) => (path ? `${API_BASE}${path}` : null);

function withUrls(hotel) {
  const images = hotel.images.map(toUrl);
  return {
    ...hotel,
    images,
    rooms: hotel.rooms.map((room) => ({ ...room, image: toUrl(room.image) ?? images[0] ?? null })),
  };
}

export async function fetchHotels(signal) {
  const hotels = await publicApi.get('/hotels', { signal });
  return hotels.map(withUrls);
}

export async function fetchHotel(slug, signal) {
  return withUrls(await publicApi.get(`/hotels/${encodeURIComponent(slug)}`, { signal }));
}
