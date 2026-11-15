import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Property } from '../types/property';
import { useProperty } from '../context/PropertyContext';
import { calculateDistanceKm } from '../utils/geoData';
import { Compass, Eye, LocateFixed, Loader2, Maximize2, Minimize2, X, ZoomIn, ZoomOut, Navigation, AlertCircle, Layers } from 'lucide-react';

interface PropertyMapProps {
  properties: Property[];
  onSelectProperty: (prop: Property) => void;
  onMarkerClick?: (prop: Property) => void;
  isFullScreenMode?: boolean;
  onCloseFullScreen?: () => void;
  focusTimestamp?: number;
}
const FALLBACK: L.LatLngExpression = [12.9716,77.5946];
const TILES = import.meta.env.VITE_OSM_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const isValid = (p:Property) => Number.isFinite(p.coordinates?.lat) && Number.isFinite(p.coordinates?.lng)
  && Math.abs(p.coordinates.lat)<=90 && Math.abs(p.coordinates.lng)<=180;
const esc = (s:string) => s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c));

export const PropertyMap: React.FC<PropertyMapProps> = ({properties,onSelectProperty,onMarkerClick,isFullScreenMode=false,onCloseFullScreen,focusTimestamp}) => {
  const {activeMapPropertyId,setActiveMapPropertyId,userLocation,isLocatingUser,locationError,requestUserLocation}=useProperty();
  const rootRef=useRef<HTMLDivElement>(null);
  const mapRef=useRef<L.Map|null>(null);
  const markerLayer=useRef<L.LayerGroup|null>(null);
  const userMarker=useRef<L.CircleMarker|null>(null);
  const markerById=useRef<Map<string,L.Marker>>(new Map());
  const [selected,setSelected]=useState<Property|null>(null);
  const [nearby,setNearby]=useState(false);
  const [localFullscreen,setLocalFullscreen]=useState(false);
  const [tileError,setTileError]=useState(false);
  const [mapReady,setMapReady]=useState(false);
  const valid=useMemo(()=>properties.filter(isValid),[properties]);
  const effectiveFullscreen=isFullScreenMode||localFullscreen;
  const selectedRef=useRef<Property|null>(null);
  selectedRef.current=selected;
  const handleMarkerSelect=useCallback((p:Property)=>{
    setSelected(p);setActiveMapPropertyId(p.id);
    if(onMarkerClick)onMarkerClick(p);
    else document.getElementById(`property-card-${p.id}`)?.scrollIntoView({behavior:'smooth',block:'center'});
  },[onMarkerClick,setActiveMapPropertyId]);
  const clickRef=useRef(handleMarkerSelect);
  clickRef.current=handleMarkerSelect;

  useEffect(()=>{
    if(!rootRef.current||mapRef.current)return;
    const map=L.map(rootRef.current,{zoomControl:false,attributionControl:true,scrollWheelZoom:false})
      .setView(FALLBACK,11);
    mapRef.current=map;
    L.tileLayer(TILES,{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',crossOrigin:true})
      .on('tileerror',()=>setTileError(true))
      .on('tileload',()=>setTileError(false))
      .addTo(map);
    markerLayer.current=L.layerGroup().addTo(map);
    setMapReady(true);
    return ()=>{map.remove();mapRef.current=null;markerLayer.current=null;markerById.current.clear();setMapReady(false);};
  },[]);

  useEffect(()=>{
    const map=mapRef.current,layer=markerLayer.current;
    if(!map||!layer)return;
    layer.clearLayers();markerById.current.clear();
    const bounds:L.LatLngExpression[]=[];
    valid.forEach(p=>{
      const {lat,lng}=p.coordinates;
      const active=p.id===activeMapPropertyId;
      const marker=L.marker([lat,lng],{
        icon:L.divIcon({className:'',iconSize:[90,32],iconAnchor:[45,32],
          html:`<div style="position:relative;display:flex;align-items:center;justify-content:center;padding:5px 8px;border:2px solid ${active?'#1d4ed8':'#cbd5e1'};background:${active?'#2563eb':'white'};color:${active?'white':'#0f172a'};font-size:12px;font-weight:800;border-radius:18px;white-space:nowrap;box-shadow:0 3px 12px #0002;max-width:125px;overflow:hidden;text-overflow:ellipsis">${esc(p.priceDisplay||'Property')}</div>`})
      }).addTo(layer);
      marker.on('click',()=>clickRef.current(p));
      markerById.current.set(p.id,marker);
      bounds.push([lat,lng]);
    });
    if(bounds.length && !activeMapPropertyId)map.fitBounds(L.latLngBounds(bounds),{padding:[35,35],maxZoom:13});
    else if(!bounds.length)map.setView(FALLBACK,11);
  },[valid,activeMapPropertyId,mapReady]);

  useEffect(()=>{
    const map=mapRef.current;
    if(!map||!activeMapPropertyId)return;
    const p=valid.find(item=>item.id===activeMapPropertyId);
    if(p)map.setView([p.coordinates.lat,p.coordinates.lng],Math.max(map.getZoom(),14),{animate:true});
  },[activeMapPropertyId,focusTimestamp,valid,mapReady]);

  useEffect(()=>{
    const map=mapRef.current;if(!map)return;
    userMarker.current?.remove();userMarker.current=null;
    if(userLocation){
      userMarker.current=L.circleMarker([userLocation.lat,userLocation.lng],{radius:8,color:'#fff',weight:3,fillColor:'#2563eb',fillOpacity:1})
        .addTo(map).bindTooltip('Your current location');
    }
  },[userLocation,mapReady]);

  useEffect(()=>{
    if(!mapRef.current)return;
    const timer=window.setTimeout(()=>mapRef.current?.invalidateSize({pan:false}),100);
    return ()=>window.clearTimeout(timer);
  },[effectiveFullscreen,isFullScreenMode,mapReady]);

  useEffect(()=>{
    const element=rootRef.current;
    if(!element || !mapRef.current)return;
    const resize=()=>mapRef.current?.invalidateSize({pan:false});
    const observer=new ResizeObserver(resize);
    observer.observe(element);
    window.addEventListener('orientationchange',resize);
    const timer=window.setTimeout(resize,300);
    return ()=>{observer.disconnect();window.removeEventListener('orientationchange',resize);window.clearTimeout(timer);};
  },[mapReady]);

  async function locate(){
    const coords=await requestUserLocation();
    if(coords)mapRef.current?.setView([coords.lat,coords.lng],15,{animate:true});
  }
  function toggleFullscreen(){
    if(isFullScreenMode&&onCloseFullScreen)onCloseFullScreen();
    else setLocalFullscreen(v=>!v);
  }
  const active=selected||valid.find(p=>p.id===activeMapPropertyId)||null;
  return <div className={`relative w-full bg-slate-100 overflow-hidden flex flex-col ${effectiveFullscreen?'h-full min-h-0':'rounded-2xl border border-slate-200 shadow-md min-h-[460px] h-full'}`}>
    <div ref={rootRef} className="absolute inset-0 z-0" aria-label="Interactive OpenStreetMap property map"/>
    <div className="absolute top-3 left-3 z-[500] flex flex-wrap gap-2 max-w-[calc(100%-120px)]">
      <span className="bg-white/95 border border-slate-200 shadow-sm rounded-lg px-2.5 py-2 text-xs font-extrabold text-slate-800 flex items-center gap-1.5"><Layers className="w-4 h-4 text-blue-600"/> OpenStreetMap</span>
      <button type="button" onClick={()=>setNearby(v=>!v)} className="bg-white/95 border border-slate-200 shadow-sm rounded-lg px-2.5 py-2 text-xs font-bold text-slate-800 flex items-center gap-1.5"><Compass className="w-4 h-4 text-blue-600"/> Nearby ({valid.length})</button>
    </div>
    <div className="absolute top-3 right-3 z-[500] flex items-center gap-1.5">
      <button type="button" onClick={()=>void locate()} disabled={isLocatingUser} title="Locate me" className="p-2.5 bg-white rounded-xl shadow-md border border-slate-200">{isLocatingUser?<Loader2 className="w-4 h-4 animate-spin"/>:<LocateFixed className="w-4 h-4"/>}</button>
      {!isFullScreenMode&&<button type="button" onClick={toggleFullscreen} title={effectiveFullscreen?'Close fullscreen':'Fullscreen map'} className="p-2.5 bg-white rounded-xl shadow-md border border-slate-200">{effectiveFullscreen?<Minimize2 className="w-4 h-4"/>:<Maximize2 className="w-4 h-4"/>}</button>}
      {!isFullScreenMode&&effectiveFullscreen&&<button type="button" onClick={toggleFullscreen} className="p-2.5 bg-white rounded-xl shadow-md border border-slate-200"><X className="w-4 h-4"/></button>}
    </div>
    <div className="absolute right-3 bottom-14 z-[500] flex flex-col gap-1">
      <button type="button" aria-label="Zoom in" onClick={()=>mapRef.current?.zoomIn()} className="p-2.5 bg-white rounded-xl shadow-md border border-slate-200"><ZoomIn className="w-4 h-4"/></button>
      <button type="button" aria-label="Zoom out" onClick={()=>mapRef.current?.zoomOut()} className="p-2.5 bg-white rounded-xl shadow-md border border-slate-200"><ZoomOut className="w-4 h-4"/></button>
    </div>
    {nearby&&<div className="absolute z-[600] top-14 right-3 bottom-16 w-80 max-w-[90vw] rounded-2xl border border-slate-200 bg-white shadow-2xl flex flex-col overflow-hidden">
      <div className="p-3 bg-slate-900 text-white flex justify-between items-center"><strong className="text-sm">Nearby Properties ({valid.length})</strong><button onClick={()=>setNearby(false)}><X className="w-4 h-4"/></button></div>
      <div className="overflow-y-auto p-2 space-y-2">{valid.map(p=><button type="button" key={p.id} onClick={()=>{handleMarkerSelect(p);setNearby(false);}} className="w-full text-left p-3 rounded-xl border border-slate-200 hover:bg-blue-50">
        <strong className="block text-xs text-slate-900">{p.title}</strong><span className="block text-xs text-slate-500">{p.locality}, {p.city} · {p.priceDisplay}</span>
        {userLocation&&<span className="block text-[11px] text-blue-700">{calculateDistanceKm(userLocation.lat,userLocation.lng,p.coordinates.lat,p.coordinates.lng)} km away</span>}
      </button>)}</div>
    </div>}
    {active&&<div className="absolute z-[500] bottom-12 left-3 max-w-[calc(100%-80px)] w-72 rounded-xl bg-white border border-slate-200 shadow-xl p-3">
      <div className="flex justify-between gap-2"><strong className="text-xs text-slate-900 line-clamp-2">{active.title}</strong><button type="button" onClick={()=>{setSelected(null);setActiveMapPropertyId(null);}} aria-label="Close property preview"><X className="w-4 h-4"/></button></div>
      <p className="text-xs text-slate-500 mt-1">{active.locality}, {active.city}</p><p className="text-sm font-black text-blue-700 mt-1">{active.priceDisplay}</p>
      <div className="flex gap-2 mt-2"><button type="button" onClick={()=>onSelectProperty(active)} className="flex-1 rounded-lg bg-blue-600 text-white py-2 text-xs font-bold flex justify-center items-center gap-1"><Eye className="w-3.5 h-3.5"/> Details</button>
      <a href={`https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=;${active.coordinates.lat}%2C${active.coordinates.lng}`} target="_blank" rel="noopener noreferrer" className="flex-1 rounded-lg bg-slate-100 text-slate-800 py-2 text-xs font-bold flex justify-center items-center gap-1"><Navigation className="w-3.5 h-3.5"/> Directions</a></div>
    </div>}
    {(locationError||tileError)&&<div className="absolute z-[600] top-16 left-3 max-w-xs bg-amber-50 text-amber-900 rounded-xl p-3 text-xs border border-amber-200 flex gap-2"><AlertCircle className="w-4 h-4 shrink-0"/>{locationError||'Map tiles could not load. Please try again later.'}</div>}
    <div className="absolute bottom-3 left-3 z-[500] bg-white/95 border border-slate-200 shadow-sm rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800">{valid.length} Properties Located · OpenStreetMap</div>
  </div>;
};
