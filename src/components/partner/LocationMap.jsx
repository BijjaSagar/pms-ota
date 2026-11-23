// Interactive property map (Leaflet + OpenStreetMap tiles).
//   - Drag the pin, or tap/click anywhere on the map, to move it -> onPick({ latitude, longitude }).
//   - When `latitude/longitude` change from outside (address typed, current location), the pin and map follow.
//   - No coordinates yet: map shows India and the first tap drops the pin.
// The page scroll is never hijacked: wheel-zoom only works after the map is clicked/focused.
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const DEFAULT_CENTER = [22.5, 79]; // India
const DEFAULT_ZOOM = 4;
const PIN_ZOOM = 16;

// Custom HTML pin: avoids Leaflet's default marker images (their paths break under Vite) and matches the UI.
const pinIcon = L.divIcon({
  className: 'pi-leaflet-pin',
  html: '<span class="pi-leaflet-pin-body"><span class="pi-leaflet-pin-dot"></span></span><span class="pi-leaflet-pin-shadow"></span>',
  iconSize: [36, 48],
  iconAnchor: [18, 46],
});

const samePlace = (a, b) => Math.abs(a.lat - b.lat) < 1e-6 && Math.abs(a.lng - b.lng) < 1e-6;

export function LocationMap({ latitude, longitude, onPick, disabled = false, children }) {
  const hostRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const onPickRef = useRef(onPick);
  const disabledRef = useRef(disabled);
  onPickRef.current = onPick;
  disabledRef.current = disabled;

  const hasPoint = Number.isFinite(latitude) && Number.isFinite(longitude);

  // Create the map once.
  useEffect(() => {
    const map = L.map(hostRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      scrollWheelZoom: false,
      zoomControl: true,
      attributionControl: true,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
    }).addTo(map);
    map.attributionControl.setPrefix(false);

    const place = (latlng) => {
      if (!markerRef.current) {
        markerRef.current = L.marker(latlng, { icon: pinIcon, draggable: true, keyboard: true, title: 'Property location — drag to adjust', autoPan: true })
          .addTo(map)
          .on('dragend', (event) => {
            const { lat, lng } = event.target.getLatLng();
            onPickRef.current?.({ latitude: lat, longitude: lng });
          });
      } else {
        markerRef.current.setLatLng(latlng);
      }
    };
    map.on('click', (event) => {
      if (disabledRef.current) return;
      place(event.latlng);
      if (map.getZoom() < 14) map.setView(event.latlng, PIN_ZOOM);
      onPickRef.current?.({ latitude: event.latlng.lat, longitude: event.latlng.lng });
    });
    // Wheel-zoom only once the person is working with the map; leaving it hands scrolling back to the page.
    map.on('focus click', () => map.scrollWheelZoom.enable());
    map.on('blur mouseout', () => map.scrollWheelZoom.disable());

    mapRef.current = map;
    mapRef.current._piPlace = place;

    // The card can change size (rail collapses, phone rotates): keep tiles filling it.
    const resize = new ResizeObserver(() => map.invalidateSize());
    resize.observe(hostRef.current);

    return () => {
      resize.disconnect();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Follow coordinates that change from outside (typed address, current location, saved draft).
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!hasPoint) {
      if (markerRef.current) { markerRef.current.remove(); markerRef.current = null; }
      return;
    }
    const next = L.latLng(latitude, longitude);
    const current = markerRef.current?.getLatLng();
    if (current && samePlace(current, next)) return; // came from our own drag/click
    map._piPlace(next);
    map.setView(next, Math.max(map.getZoom(), PIN_ZOOM), { animate: Boolean(current) });
  }, [hasPoint, latitude, longitude]);

  // Lock the pin while a lookup is running.
  useEffect(() => {
    const marker = markerRef.current;
    if (!marker?.dragging) return;
    if (disabled) marker.dragging.disable(); else marker.dragging.enable();
  }, [disabled, hasPoint]);

  return (
    <div className="pi-map-shell pi-map-live">
      <div ref={hostRef} className="pi-map-canvas" role="application" aria-label="Map. Drag the pin or tap the map to set your property's exact location." />
      <span className="pi-map-hint" aria-hidden="true">{hasPoint ? 'Drag the pin to the exact spot' : 'Tap the map to drop a pin'}</span>
      {children}
    </div>
  );
}
