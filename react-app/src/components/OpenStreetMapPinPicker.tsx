import React, { useEffect, useRef } from 'react';
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
    instance.on('click', event => update(event.latlng));
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

  return <div className="space-y-2">
    <p className="text-xs text-slate-600">Tap the map or drag the blue pin to select the exact property location.</p>
    <div ref={container} className="relative z-0 h-[300px] sm:h-[360px] w-full overflow-hidden rounded-xl border border-slate-200" aria-label="Select property location on OpenStreetMap" />
    <p className="text-xs text-slate-500">{hasCoords ? `Selected: ${lat.toFixed(6)}, ${lng.toFixed(6)}` : 'Pin starts in Bengaluru. Tap or drag it to set your location.'}</p>
  </div>;
};
