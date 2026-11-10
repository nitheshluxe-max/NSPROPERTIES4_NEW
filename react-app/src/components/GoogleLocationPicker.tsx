// Source: Google Maps Platform Code Assist
import React, { useState, useEffect, useCallback } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  useMap
} from '@vis.gl/react-google-maps';
import { Search, MapPin, Navigation, Crosshair, Check, Layers, Loader2 } from 'lucide-react';
import { resolveCoordinates, CITY_CENTROIDS } from '../utils/geoData';

const GOOGLE_MAPS_API_KEY =
  (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) ||
  'AIzaSyDmt2vOvK9uVb8lfuEihy5udxoCiReEq0U';

interface GoogleLocationPickerProps {
  city: string;
  locality: string;
  address: string;
  coords: { lat: number; lng: number };
  onCoordsChange: (coords: { lat: number; lng: number }) => void;
}

// Controller component to pan map when coordinates change
const MapPanner: React.FC<{
  coords: { lat: number; lng: number };
  mapType: 'roadmap' | 'satellite' | 'hybrid';
}> = ({ coords, mapType }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    map.setMapTypeId(mapType);
  }, [map, mapType]);

  useEffect(() => {
    if (!map) return;
    map.panTo({ lat: coords.lat, lng: coords.lng });
  }, [map, coords.lat, coords.lng]);

  return null;
};

export const GoogleLocationPicker: React.FC<GoogleLocationPickerProps> = ({
  city,
  locality,
  address,
  coords,
  onCoordsChange,
}) => {
  const [searchInput, setSearchInput] = useState(`${locality ? locality + ', ' : ''}${city || ''}`);
  const [isSearching, setIsSearching] = useState(false);
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid'>('roadmap');

  // Keep search input updated if user changes city or locality
  useEffect(() => {
    const combined = [locality, city].filter(Boolean).join(', ');
    if (combined && !searchInput) {
      setSearchInput(combined);
    }
  }, [city, locality]);

  // Geocode address using Google Maps Geocoder if available in window, or fallback to resolveCoordinates
  const handleSearchOnMap = useCallback(() => {
    const query = searchInput.trim() || `${locality} ${address} ${city}`.trim();
    if (!query) return;

    setIsSearching(true);
    setSearchFeedback(null);

    // If Google Maps JS API is loaded
    if (typeof window !== 'undefined' && (window as any).google?.maps?.Geocoder) {
      try {
        const geocoder = new (window as any).google.maps.Geocoder();
        geocoder.geocode(
          { address: `${query}, India` },
          (results: any[], status: string) => {
            setIsSearching(false);
            if (status === 'OK' && results && results[0]?.geometry?.location) {
              const loc = results[0].geometry.location;
              const newLat = Number(loc.lat().toFixed(6));
              const newLng = Number(loc.lng().toFixed(6));
              onCoordsChange({ lat: newLat, lng: newLng });
              setSearchFeedback(`Found: ${results[0].formatted_address.slice(0, 45)}...`);
              return;
            }

            // Fallback to local geo dictionary
            const resolved = resolveCoordinates(city, locality, query);
            onCoordsChange(resolved);
            setSearchFeedback(`Located near ${locality || city}`);
          }
        );
        return;
      } catch (err) {
        console.warn('Geocoder error:', err);
      }
    }

    // Fallback to local geo dictionary
    setIsSearching(false);
    const resolved = resolveCoordinates(city, locality, query);
    onCoordsChange(resolved);
    setSearchFeedback(`Located near ${locality || city}`);
  }, [searchInput, locality, address, city, onCoordsChange]);

  // Handle map click to reposition pin
  const handleMapClick = (e: any) => {
    if (e.detail?.latLng) {
      const lat = Number(e.detail.latLng.lat.toFixed(6));
      const lng = Number(e.detail.latLng.lng.toFixed(6));
      onCoordsChange({ lat, lng });
    }
  };

  // Handle pin drag end
  const handleMarkerDragEnd = (e: any) => {
    if (e.latLng) {
      const lat = Number(e.latLng.lat().toFixed(6));
      const lng = Number(e.latLng.lng().toFixed(6));
      onCoordsChange({ lat, lng });
    }
  };

  return (
    <div className="space-y-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span>Google Maps Location & Exact Coordinates</span>
          </label>
          <p className="text-[11px] text-slate-500">
            Search Google Maps or click/drag the pin to place property marker
          </p>
        </div>

        {/* View Switcher: Streets vs Satellite */}
        <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 text-[11px]">
          <button
            type="button"
            onClick={() => setMapType('roadmap')}
            className={`px-2 py-0.5 rounded font-bold transition-colors cursor-pointer ${
              mapType === 'roadmap' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Streets
          </button>
          <button
            type="button"
            onClick={() => setMapType('hybrid')}
            className={`px-2 py-0.5 rounded font-bold transition-colors cursor-pointer ${
              mapType === 'hybrid' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Satellite
          </button>
        </div>
      </div>

      {/* Google Maps Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSearchOnMap();
              }
            }}
            placeholder="Search locality, landmark, or address on Google Maps..."
            className="w-full px-3 py-2 pl-8 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 outline-hidden focus:border-blue-600"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
        </div>

        <button
          type="button"
          onClick={handleSearchOnMap}
          disabled={isSearching}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs shrink-0 disabled:opacity-50"
        >
          {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
          <span>Search Maps</span>
        </button>
      </div>

      {searchFeedback && (
        <p className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
          ✓ {searchFeedback}
        </p>
      )}

      {/* Interactive Google Map with Draggable Pin */}
      <div className="w-full h-52 sm:h-60 rounded-xl overflow-hidden border-2 border-slate-300 relative shadow-inner">
        <APIProvider apiKey={GOOGLE_MAPS_API_KEY} solutionChannel="GMP_visgl_reactgooglemaps_v1.0">
          <Map
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            mapId="DEMO_MAP_ID"
            defaultCenter={{ lat: coords.lat, lng: coords.lng }}
            defaultZoom={15}
            gestureHandling="greedy"
            disableDefaultUI={false}
            onClick={handleMapClick}
            style={{ width: '100%', height: '100%' }}
          >
            <MapPanner coords={coords} mapType={mapType} />

            <AdvancedMarker
              position={{ lat: coords.lat, lng: coords.lng }}
              gmpDraggable={true}
              onDragEnd={handleMarkerDragEnd}
              title="Drag or click map to adjust exact property location"
            >
              <div className="bg-blue-600 text-white px-2.5 py-1 rounded-full text-xs font-black shadow-xl ring-2 ring-white flex items-center gap-1 cursor-grab active:cursor-grabbing select-none transform -translate-y-2">
                <span>📍 Property Pin</span>
              </div>
            </AdvancedMarker>
          </Map>
        </APIProvider>

        <div className="absolute bottom-2 left-2 z-10 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-700 shadow-sm border border-slate-200 pointer-events-none">
          Click map or drag pin to fine-tune location
        </div>
      </div>

      {/* Manual Coordinates Input & Verification */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Latitude (Decimal)
          </label>
          <input
            type="number"
            step="0.000001"
            value={coords.lat}
            onChange={(e) => onCoordsChange({ ...coords, lat: Number(e.target.value) })}
            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Longitude (Decimal)
          </label>
          <input
            type="number"
            step="0.000001"
            value={coords.lng}
            onChange={(e) => onCoordsChange({ ...coords, lng: Number(e.target.value) })}
            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800"
          />
        </div>
      </div>
    </div>
  );
};
