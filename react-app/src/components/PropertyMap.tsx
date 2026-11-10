// Source: Google Maps Platform Code Assist
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  useMap
} from '@vis.gl/react-google-maps';
import { Property } from '../types/property';
import { useProperty } from '../context/PropertyContext';
import {
  Layers,
  Crosshair,
  ZoomIn,
  ZoomOut,
  Navigation,
  Compass,
  ChevronRight,
  Eye,
  X,
  Maximize2,
  Minimize2,
  MapPin,
  LocateFixed,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { calculateDistanceKm } from '../utils/geoData';

declare const google: any;

const GOOGLE_MAPS_API_KEY =
  (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) ||
  'AIzaSyDmt2vOvK9uVb8lfuEihy5udxoCiReEq0U';

interface PropertyMapProps {
  properties: Property[];
  onSelectProperty: (prop: Property) => void;
  onMarkerClick?: (prop: Property) => void;
  isFullScreenMode?: boolean;
  onCloseFullScreen?: () => void;
  focusTimestamp?: number;
}

// Map Controller for Camera sync, bounds auto-fitting, zoom, and live GPS pan
const MapController: React.FC<{
  properties: Property[];
  activePropertyId: string | null;
  mapType: 'roadmap' | 'satellite' | 'hybrid';
  userLocation: { lat: number; lng: number } | null;
  shouldPanToUser: boolean;
  onPannedToUser: () => void;
}> = ({
  properties,
  activePropertyId,
  mapType,
  userLocation,
  shouldPanToUser,
  onPannedToUser
}) => {
  const map = useMap();
  const lastActiveIdRef = useRef<string | null>(null);

  // Sync map type
  useEffect(() => {
    if (!map) return;
    map.setMapTypeId(mapType);
  }, [map, mapType]);

  // Center on User GPS location when requested
  useEffect(() => {
    if (!map || !userLocation || !shouldPanToUser) return;
    map.panTo(userLocation);
    map.setZoom(15);
    onPannedToUser();
  }, [map, userLocation, shouldPanToUser, onPannedToUser]);

  // Smoothly center and zoom when the active property changes
  useEffect(() => {
    if (!map || !activePropertyId) return;

    const target = properties.find((p) => p.id === activePropertyId);
    if (target?.coordinates?.lat && target?.coordinates?.lng) {
      map.panTo({ lat: target.coordinates.lat, lng: target.coordinates.lng });
      // Zoom into location as requested in specification
      map.setZoom(15);
    }
  }, [map, activePropertyId, properties]);

  // Fit bounds when property list changes and no single property is actively targeted
  useEffect(() => {
    if (!map || properties.length === 0 || activePropertyId) return;

    try {
      const bounds = new google.maps.LatLngBounds();
      let validCount = 0;
      properties.forEach((p) => {
        if (
          p.coordinates &&
          typeof p.coordinates.lat === 'number' &&
          typeof p.coordinates.lng === 'number' &&
          !isNaN(p.coordinates.lat) &&
          !isNaN(p.coordinates.lng)
        ) {
          bounds.extend({ lat: p.coordinates.lat, lng: p.coordinates.lng });
          validCount++;
        }
      });

      if (validCount > 0 && !bounds.isEmpty()) {
        map.fitBounds(bounds, {
          top: 60,
          right: 60,
          bottom: 60,
          left: 60,
        });

        const listener = google.maps.event.addListenerOnce(map, 'idle', () => {
          const currentZoom = map.getZoom();
          if (typeof currentZoom === 'number' && currentZoom > 15) {
            map.setZoom(14);
          }
        });
        return () => {
          google.maps.event.removeListener(listener);
        };
      }
    } catch (e) {
      console.warn('Map bounds fit notice:', e);
    }
  }, [map, properties, activePropertyId]);

  return null;
};

// Zoom and Pan Control Bridge inside Map
const MapActionsBridge: React.FC<{
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRecenter: () => void;
}> = () => {
  return null;
};

export const PropertyMap: React.FC<PropertyMapProps> = ({
  properties,
  onSelectProperty,
  onMarkerClick,
  isFullScreenMode = false,
  onCloseFullScreen,
  focusTimestamp
}) => {
  const {
    activeMapPropertyId,
    setActiveMapPropertyId,
    userLocation,
    isLocatingUser,
    locationError,
    requestUserLocation
  } = useProperty();

  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid'>('roadmap');
  const [selectedMarkerProp, setSelectedMarkerProp] = useState<Property | null>(null);
  const [isPopupDismissed, setIsPopupDismissed] = useState<boolean>(false);
  const [showNearbyDrawer, setShowNearbyDrawer] = useState<boolean>(false);
  const [isLocalFullScreen, setIsLocalFullScreen] = useState<boolean>(false);
  const [panToUserTrigger, setPanToUserTrigger] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevActiveIdRef = useRef<string | null>(null);
  const prevTimestampRef = useRef<number | undefined>(focusTimestamp);

  const effectiveFullScreen = isFullScreenMode || isLocalFullScreen;

  // Filter properties with valid saved coordinates
  const validProperties = useMemo(() => {
    return properties.filter(
      (p) =>
        p.coordinates &&
        typeof p.coordinates.lat === 'number' &&
        typeof p.coordinates.lng === 'number' &&
        !isNaN(p.coordinates.lat) &&
        !isNaN(p.coordinates.lng)
    );
  }, [properties]);

  // Default initial center
  const defaultCenter = useMemo(() => {
    if (validProperties.length > 0) {
      return { lat: validProperties[0].coordinates.lat, lng: validProperties[0].coordinates.lng };
    }
    return { lat: 12.9716, lng: 77.5946 }; // Bengaluru
  }, [validProperties]);

  // Automatically keep selected marker in sync when active property changes from scroll/buttons
  useEffect(() => {
    if (activeMapPropertyId) {
      const explicitFocus =
        focusTimestamp !== undefined &&
        focusTimestamp !== 0 &&
        focusTimestamp !== prevTimestampRef.current;

      prevActiveIdRef.current = activeMapPropertyId;
      prevTimestampRef.current = focusTimestamp;

      const found = validProperties.find((p) => p.id === activeMapPropertyId);
      if (found) {
        if (explicitFocus) {
          // Explicit click on "Show on Map" resets dismissal and reopens popup
          setIsPopupDismissed(false);
          setSelectedMarkerProp(found);
        } else if (!isPopupDismissed) {
          // Normal sync when user hasn't explicitly dismissed the popup
          setSelectedMarkerProp(found);
        }
      }
    }
  }, [activeMapPropertyId, validProperties, isPopupDismissed, focusTimestamp]);

  // Close popup cleanly: sets selected marker to null and keeps popup closed without navigating or changing post
  const handleCloseInfoWindow = useCallback((e?: React.MouseEvent | Event) => {
    if (e && 'stopPropagation' in e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setIsPopupDismissed(true);
    setSelectedMarkerProp(null);
  }, []);

  // Handle marker click: highlight, update counter, trigger scroll
  const handleMarkerSelect = useCallback(
    (prop: Property) => {
      setIsPopupDismissed(false);
      setSelectedMarkerProp(prop);
      setActiveMapPropertyId(prop.id);
      if (onMarkerClick) {
        onMarkerClick(prop);
      } else {
        const cardEl = document.getElementById(`property-card-${prop.id}`);
        if (cardEl) {
          cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    },
    [setActiveMapPropertyId, onMarkerClick]
  );

  // Trigger Current GPS Location
  const handleCurrentLocationClick = async () => {
    const coords = await requestUserLocation();
    if (coords) {
      setPanToUserTrigger(true);
    }
  };

  // Toggle fullscreen mode
  const toggleFullScreen = () => {
    if (onCloseFullScreen && isFullScreenMode) {
      onCloseFullScreen();
      return;
    }
    setIsLocalFullScreen((prev) => !prev);
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full bg-slate-100 overflow-hidden flex flex-col transition-all duration-200 ${
        effectiveFullScreen
          ? 'fixed inset-0 z-[100] rounded-none border-none'
          : 'rounded-2xl border border-slate-200 shadow-md min-h-[460px]'
      }`}
    >
      <APIProvider apiKey={GOOGLE_MAPS_API_KEY} solutionChannel="GMP_visgl_reactgooglemaps_v1.0">
        <Map
          id="nsp_main_map"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          mapId="DEMO_MAP_ID"
          defaultCenter={defaultCenter}
          defaultZoom={12}
          gestureHandling="greedy"
          disableDefaultUI={true}
          className="w-full h-full flex-1"
          style={{ width: '100%', height: '100%', minHeight: '440px' }}
        >
          <MapController
            properties={validProperties}
            activePropertyId={activeMapPropertyId}
            mapType={mapType}
            userLocation={userLocation}
            shouldPanToUser={panToUserTrigger}
            onPannedToUser={() => setPanToUserTrigger(false)}
          />

          {/* User Live GPS Location Blue Dot Marker */}
          {userLocation && (
            <AdvancedMarker
              position={userLocation}
              title="Your Current Location"
              zIndex={99999}
            >
              <div className="relative flex items-center justify-center">
                {/* Pulsing blue radar waves */}
                <div className="absolute w-8 h-8 rounded-full bg-blue-500/30 animate-ping" />
                <div className="absolute w-6 h-6 rounded-full bg-blue-500/50" />
                {/* Solid blue GPS dot */}
                <div className="relative w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-lg" />
              </div>
            </AdvancedMarker>
          )}

          {/* Verified Property Location Markers with Price Badges */}
          {validProperties.map((prop, idx) => {
            const isSelected = selectedMarkerProp?.id === prop.id;
            const isHovered = activeMapPropertyId === prop.id;
            const isHighlighted = isSelected || isHovered;

            return (
              <AdvancedMarker
                key={prop.id}
                position={{ lat: prop.coordinates.lat, lng: prop.coordinates.lng }}
                onClick={() => handleMarkerSelect(prop)}
                title={`${prop.title} - ${prop.priceDisplay}`}
                zIndex={isHighlighted ? 9990 : 100 + idx}
              >
                <div
                  onMouseEnter={() => setActiveMapPropertyId(prop.id)}
                  className={`relative px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-black transition-all transform duration-150 cursor-pointer shadow-lg flex items-center gap-1 select-none whitespace-nowrap ${
                    isHighlighted
                      ? 'bg-blue-600 text-white scale-110 ring-4 ring-blue-400/40 shadow-blue-500/50'
                      : 'bg-white text-slate-900 border border-slate-300 hover:bg-blue-50 hover:border-blue-500 hover:scale-105'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>{prop.priceDisplay}</span>
                  {/* Pin Pointer Tail */}
                  <div
                    className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent ${
                      isHighlighted ? 'border-t-[6px] border-t-blue-600' : 'border-t-[6px] border-t-white'
                    }`}
                  />
                </div>
              </AdvancedMarker>
            );
          })}

          {/* Rich Property InfoWindow Popup */}
          {selectedMarkerProp?.coordinates && (
            <InfoWindow
              key={`infowindow-${selectedMarkerProp.id}`}
              position={{
                lat: selectedMarkerProp.coordinates.lat,
                lng: selectedMarkerProp.coordinates.lng,
              }}
              onCloseClick={handleCloseInfoWindow}
              headerContent={
                <div className="flex items-center gap-1 text-[11px] font-bold text-blue-700 uppercase tracking-wider pr-4">
                  <MapPin className="w-3 h-3 text-blue-600 shrink-0" />
                  <span className="truncate">
                    {selectedMarkerProp.locality}, {selectedMarkerProp.city}
                  </span>
                </div>
              }
            >
              <div className="w-64 max-w-[270px] p-0.5 text-slate-800">
                {/* Thumbnail Image */}
                <div className="relative w-full h-32 rounded-lg overflow-hidden mb-2 bg-slate-100">
                  <img
                    src={(Array.isArray(selectedMarkerProp?.images) && selectedMarkerProp.images[0]) || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&auto=format&fit=crop&q=80'}
                    alt={selectedMarkerProp?.title || 'Property'}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&auto=format&fit=crop&q=80';
                    }}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-1.5 left-1.5 px-2 py-0.5 bg-black/70 backdrop-blur-xs text-white rounded text-[10px] font-bold">
                    {selectedMarkerProp.priceDisplay}
                  </div>
                  {selectedMarkerProp.reraId && (
                    <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-blue-600 text-white rounded text-[9px] font-extrabold uppercase">
                      RERA
                    </div>
                  )}
                </div>

                {/* Title */}
                <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug mb-1">
                  {selectedMarkerProp.title}
                </h4>

                {/* Specs */}
                <div className="flex items-center gap-1.5 text-[10px] text-slate-600 mb-2 pb-2 border-b border-slate-100 flex-wrap">
                  {selectedMarkerProp.bedrooms && (
                    <span className="font-semibold">{selectedMarkerProp.bedrooms} BHK</span>
                  )}
                  <span>·</span>
                  <span>{(selectedMarkerProp.superBuiltUpArea ?? 1000).toLocaleString('en-IN')} sq.ft</span>
                  {userLocation && (
                    <>
                      <span>·</span>
                      <span className="text-blue-700 font-bold">
                        {calculateDistanceKm(
                          userLocation.lat,
                          userLocation.lng,
                          selectedMarkerProp.coordinates.lat,
                          selectedMarkerProp.coordinates.lng
                        )}{' '}
                        km away
                      </span>
                    </>
                  )}
                </div>

                {/* Action CTAs */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onSelectProperty(selectedMarkerProp)}
                    className="flex-1 py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-xs"
                  >
                    <Eye className="w-3 h-3" />
                    <span>View Details</span>
                  </button>

                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${selectedMarkerProp.coordinates.lat},${selectedMarkerProp.coordinates.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer border border-slate-200"
                    title="Get directions to this property on Google Maps"
                  >
                    <Navigation className="w-3 h-3 text-blue-600" />
                    <span>Directions</span>
                  </a>
                </div>
              </div>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>

      {/* FLOATING TOP-LEFT CONTROLS: Layer Switcher & Nearby Properties Drawer */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 flex-wrap">
        <div className="bg-white/95 backdrop-blur-md p-1 rounded-xl shadow-md border border-slate-200 flex items-center gap-0.5 sm:gap-1">
          <button
            type="button"
            onClick={() => setMapType('roadmap')}
            className={`px-2.5 py-1 text-[11px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer ${
              mapType === 'roadmap'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
            title="Standard Streets Map View"
          >
            Streets
          </button>
          <button
            type="button"
            onClick={() => setMapType('satellite')}
            className={`px-2.5 py-1 text-[11px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer ${
              mapType === 'satellite'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
            title="Satellite Aerial View"
          >
            Satellite
          </button>
          <button
            type="button"
            onClick={() => setMapType('hybrid')}
            className={`px-2.5 py-1 text-[11px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer ${
              mapType === 'hybrid'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
            title="Detailed View with Roads & Landmarks"
          >
            Detailed
          </button>
        </div>

        {/* Nearby Properties Drawer Toggle */}
        <button
          type="button"
          onClick={() => setShowNearbyDrawer((prev) => !prev)}
          className={`px-2.5 py-1.5 rounded-xl shadow-md border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            showNearbyDrawer
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white/95 backdrop-blur-md text-slate-800 border-slate-200 hover:bg-slate-50'
          }`}
          title="Toggle nearby properties list"
        >
          <Compass className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Nearby ({validProperties.length})</span>
        </button>
      </div>

      {/* FLOATING TOP-RIGHT CONTROLS: Current Location, Full-Screen, and Close */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
        {/* Floating Blue GPS Location Button */}
        <button
          type="button"
          onClick={handleCurrentLocationClick}
          disabled={isLocatingUser}
          className={`w-9 h-9 rounded-xl shadow-md flex items-center justify-center transition-all cursor-pointer border ${
            userLocation
              ? 'bg-blue-600 text-white border-blue-700'
              : 'bg-white/95 text-slate-700 hover:text-blue-600 hover:bg-slate-50 border-slate-200'
          }`}
          title="Locate me: Center map on your current GPS position"
        >
          {isLocatingUser ? (
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          ) : (
            <LocateFixed className="w-4 h-4" />
          )}
        </button>

        {/* Full-Screen Toggle Button */}
        <button
          type="button"
          onClick={toggleFullScreen}
          className="w-9 h-9 bg-white/95 backdrop-blur-md text-slate-700 hover:text-blue-600 hover:bg-slate-50 rounded-xl shadow-md border border-slate-200 flex items-center justify-center transition-all cursor-pointer"
          title={effectiveFullScreen ? 'Exit Full-Screen' : 'Expand to Full-Screen'}
        >
          {effectiveFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        {effectiveFullScreen && (
          <button
            type="button"
            onClick={toggleFullScreen}
            className="px-3 py-1.5 bg-slate-900 text-white rounded-xl shadow-md text-xs font-bold flex items-center gap-1 hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>Close</span>
          </button>
        )}
      </div>

      {/* GPS Location Error Toast */}
      {locationError && (
        <div className="absolute top-14 right-3 z-30 max-w-xs bg-rose-50 border border-rose-200 text-rose-800 text-[11px] p-2.5 rounded-xl shadow-md flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{locationError}</span>
        </div>
      )}

      {/* Total Properties Count Badge (Bottom Left) */}
      <div className="absolute bottom-3 left-3 z-10 px-3 py-1.5 bg-white/95 backdrop-blur-md rounded-xl shadow-md border border-slate-200 text-xs text-slate-800 flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="font-extrabold">{validProperties.length} Properties Located</span>
        <span className="text-[10px] text-slate-500 font-medium hidden sm:inline">· Google Maps</span>
      </div>

      {/* Nearby Properties Slide-Over Panel */}
      {showNearbyDrawer && (
        <div className="absolute top-14 right-3 bottom-12 w-80 max-w-[88vw] bg-white/98 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 z-20 flex flex-col overflow-hidden animate-in slide-in-from-right duration-150">
          <div className="p-3 bg-slate-900 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold">Nearby Properties ({validProperties.length})</span>
            </div>
            <button
              onClick={() => setShowNearbyDrawer(false)}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {validProperties.map((prop, i) => {
              const dist =
                userLocation && prop.coordinates?.lat && prop.coordinates?.lng
                  ? calculateDistanceKm(
                      userLocation.lat,
                      userLocation.lng,
                      prop.coordinates.lat,
                      prop.coordinates.lng
                    )
                  : null;

              return (
                <div
                  key={prop.id}
                  onClick={() => handleMarkerSelect(prop)}
                  className={`p-2 rounded-xl border text-xs cursor-pointer transition-all flex items-center gap-2.5 ${
                    selectedMarkerProp?.id === prop.id
                      ? 'bg-blue-50 border-blue-500 shadow-sm'
                      : 'bg-white border-slate-100 hover:border-slate-300'
                  }`}
                >
                  <img
                    src={(Array.isArray(prop?.images) && prop.images[0]) || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&auto=format&fit=crop&q=80'}
                    alt={prop?.title || 'Property'}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&auto=format&fit=crop&q=80';
                    }}
                    className="w-14 h-14 rounded-lg object-cover shrink-0 bg-slate-100"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-blue-700 text-[11px] font-mono">
                        {prop.priceDisplay}
                      </span>
                      {dist !== null && (
                        <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded">
                          {dist} km
                        </span>
                      )}
                    </div>
                    <p className="font-semibold text-slate-900 truncate text-[11px]">{prop.title}</p>
                    <p className="text-[10px] text-slate-500 truncate">
                      {prop.locality}, {prop.city}
                    </p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
