import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

type Coordinates = { lat: number; lng: number };
interface Props {
  latitude: string;
  longitude: string;
  onChange: (coords: Coordinates) => void;
}
const DEFAULT: Coordinates = { lat: 12.9716, lng: 77.5946 };
const TILES = import.meta.env.VITE_OSM_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

export const OpenStreetMapPinPicker: React.FC<Props> = ({ latitude, longitude, onChange }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{ place_id: number; display_name: string; lat: string; lon: string }>>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const lastSearch = useRef(0);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const pin = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const lat = Number(latitude), lng = Number(longitude);
  const hasCoords = latitude.trim() !== '' && longitude.trim() !== '' &&
    Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

  useEffect(() => {
    if (!container.current) return;
    const instance = L.map(container.current, { zoomControl: true }).setView([DEFAULT.lat, DEFAULT.lng], 12);
    map.current = instance;
    L.tileLayer(TILES, { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(instance);
    const marker = L.marker([DEFAULT.lat, DEFAULT.lng], {
      draggable: true,
      icon: L.divIcon({
        className: '',
        iconSize: [30, 42],
        iconAnchor: [15, 42],
        html: '<div style="width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#2563eb;border:3px solid white;box-shadow:0 2px 9px #0005"><div style="width:9px;height:9px;background:white;border-radius:50%;margin:8px"></div></div>'
      })
    }).addTo(instance);
    pin.current = marker;
    const update = (point: L.LatLng) => onChangeRef.current({
      lat: Number(point.lat.toFixed(6)), lng: Number(point.lng.toFixed(6))
    });
    instance.on('click', event => {
      marker.setLatLng(event.latlng);
      update(event.latlng);
    });
    marker.on('dragend', () => update(marker.getLatLng()));
    const observer = new ResizeObserver(() => instance.invalidateSize({ pan: false }));
    observer.observe(container.current);
    const timer = window.setTimeout(() => instance.invalidateSize({ pan: false }), 150);
    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
      instance.remove();
      map.current = null;
      pin.current = null;
    };
  }, []);

  useEffect(() => {
    if (!map.current || !pin.current) return;
    const point: L.LatLngExpression = hasCoords ? [lat, lng] : [DEFAULT.lat, DEFAULT.lng];
    pin.current.setLatLng(point);
    if (hasCoords) map.current.panTo(point);
  }, [latitude, longitude, hasCoords, lat, lng]);

  const searchLocation = async () => {
    const term = query.trim();
    if (searching) return;
    if (term.length < 3) {
      setSearchError('Enter at least 3 characters, for example Whitefield or Varthur.');
      return;
    }
    // Public Nominatim: explicit user-initiated searches only, no autocomplete.
    if (Date.now() - lastSearch.current < 1200) {
      setSearchError('Please wait a moment before searching again.');
      return;
    }
    lastSearch.current = Date.now();
    setSearching(true);
    setSearchError('');
    setResults([]);
    try {
      const url = new URL('https://nominatim.openstreetmap.org/search');
      url.searchParams.set('q', term);
      url.searchParams.set('format', 'jsonv2');
      url.searchParams.set('limit', '5');
      url.searchParams.set('countrycodes', 'in');
      const response = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`Location search service returned HTTP ${response.status}. Please try again later.`);
      const data: Array<{ place_id: number; display_name: string; lat: string; lon: string }> = await response.json();
      if (!mounted.current) return;
      setResults(data);
      if (data.length === 0) setSearchError('No matching Indian locations found. Try a locality, landmark or full address.');
    } catch (error) {
      if (mounted.current) setSearchError(error instanceof Error ? `${error.message} You can still select the location manually on the map.` : 'Location search failed. You can still select the location manually on the map.');
    } finally {
      if (mounted.current) setSearching(false);
    }
  };
  const selectLocation = (item: { lat: string; lon: string }) => {
    const point = L.latLng(Number(item.lat), Number(item.lon));
    if (!Number.isFinite(point.lat) || !Number.isFinite(point.lng)) return;
    map.current?.setView(point, 16, { animate: true });
    pin.current?.setLatLng(point);
    onChangeRef.current({ lat: Number(point.lat.toFixed(6)), lng: Number(point.lng.toFixed(6)) });
    setResults([]);
    setSearchError('');
  };

  return <div className="space-y-2">
    <div className="space-y-2">
      <label htmlFor="property-location-search" className="block text-xs font-semibold text-slate-700">Search location or landmark</label>
      <div className="flex gap-2">
        <input id="property-location-search" type="search" value={query} onChange={e => { setQuery(e.target.value); setResults([]); setSearchError(''); }} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); void searchLocation(); } }} placeholder="e.g. Varthur, Whitefield, Bengaluru" autoComplete="off" className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none" />
        <button type="button" onClick={event => { event.preventDefault(); event.stopPropagation(); void searchLocation(); }} disabled={searching} className="relative z-20 cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{searching ? 'Searching…' : 'Search'}</button>
      </div>
      {searchError && <p role="status" className="text-xs text-amber-700">{searchError}</p>}
      {results.length > 0 && <div aria-label="Location search results" className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white">
        {results.map(item => <button key={item.place_id} type="button" onClick={() => selectLocation(item)} className="block w-full border-b border-slate-100 px-3 py-2 text-left text-xs text-slate-700 hover:bg-blue-50">{item.display_name}</button>)}
      </div>}
      <p className="text-[11px] text-slate-500">Search results © OpenStreetMap contributors, powered by Nominatim. Search only when needed.</p>
    </div>
    <p className="text-xs text-slate-600">Select a search result, tap the map or drag the blue pin to choose the exact property location.</p>
    <div ref={container} className="relative z-0 w-full overflow-hidden rounded-xl border border-slate-200" style={{ height: 320, minHeight: 320 }} aria-label="Select property location on OpenStreetMap" />
    <p className="text-xs text-slate-500">{hasCoords ? `Selected: ${lat.toFixed(6)}, ${lng.toFixed(6)}` : 'Pin starts in Bengaluru. Tap or drag it to set your location.'}</p>
  </div>;
};
