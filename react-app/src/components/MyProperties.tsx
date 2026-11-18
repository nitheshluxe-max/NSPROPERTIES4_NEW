import React, { useEffect, useState } from 'react';
import { Building2, X, Save, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { OpenStreetMapPinPicker } from './OpenStreetMapPinPicker';

type Owned = { id:string;title:string;description:string|null;city:string;locality:string;price:number;area_sqft:number|null;contact_phone:string|null;publish_contact:boolean;status:string;created_at:string;edit_pending:boolean;latitude:number|null;longitude:number|null;availability:'available'|'sold'|'rented'|'unavailable';purpose:'sale'|'rent'|'lease';property_type:'apartment'|'house'|'plot'|'commercial'|'pg';project_name:string;address:string };
const format = (n:number) => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n);
export function MyProperties({ refreshKey=0 }: { refreshKey?:number }) {
 const [items,setItems]=useState<Owned[]>([]);
 const [editing,setEditing]=useState<Owned|null>(null);
 const [form,setForm]=useState<Owned|null>(null);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState('');
 const [loading,setLoading]=useState(true);
 const [history,setHistory]=useState<Array<{id:string;property_id:string;changes:Record<string,unknown>;status:string;created_at:string;reviewed_at:string|null}>>([]);
 const [historyOpen,setHistoryOpen]=useState<string|null>(null);
 async function load() {
  setLoading(true);
  const {data,error}=await supabase.rpc('owner_list_properties');
  if(error) setMessage('My Properties unavailable: '+error.message+' (apply phase13_owner_property_edits.sql in Supabase)');
  else {setItems((data||[]) as Owned[]);setMessage('');}
  const historyResult=await supabase.rpc('owner_property_edit_history');
  if(!historyResult.error) setHistory((historyResult.data||[]) as typeof history);
  setLoading(false);
 }
 useEffect(()=>{void load();},[refreshKey]);
 async function submit(event:React.FormEvent) {
  event.preventDefault();
  if(!editing||!form||busy)return;
  const changes:Record<string,unknown>={};
  for(const key of ['title','description','city','locality','price','area_sqft','contact_phone','publish_contact','latitude','longitude','availability','purpose','property_type','project_name','address'] as const) {
   if(form[key]!==editing[key]) changes[key]=form[key];
  }
  if(!Object.keys(changes).length){setMessage('No changes to submit.');return;}
  if(form.title.trim().length<5||form.price<=0||!form.city.trim()||!form.locality.trim()){setMessage('Enter a valid title, city, locality and price.');return;}
  setBusy(true);setMessage('');
  const {error}=await supabase.rpc('owner_request_property_edit',{target_id:editing.id,changes});
  setBusy(false);
  if(error){setMessage(error.message);return;}
  setEditing(null);setForm(null);
  await load();
  setMessage('Changes submitted for admin approval. Your published listing remains unchanged until approved.');
 }
 const field=(label:string,key:'title'|'city'|'locality'|'contact_phone'|'project_name'|'address')=><label className="block text-sm font-medium">{label}<input className="mt-1 block w-full border rounded-lg p-2" value={form?.[key]||''} onChange={e=>setForm(v=>v?{...v,[key]:e.target.value}:v)} required={key!=='contact_phone'}/></label>;
 return <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 space-y-4" aria-label="My Properties">
  <div className="flex justify-between items-center"><h2 className="text-xl font-bold">My Properties</h2><button type="button" onClick={()=>void load()} className="text-blue-700 underline text-sm">Refresh</button></div>
  <p className="text-sm text-slate-600">Only listings uploaded from your signed-in account appear here. Edits require admin approval.</p>
  {message&&<p role="status" className="rounded-lg bg-blue-50 p-3 text-sm">{message}</p>}
  {loading?<p>Loading your properties…</p>:items.length===0?<p className="text-sm text-slate-600">You have not uploaded any properties using this account.</p>:<div className="space-y-3">{items.map(p=><article key={p.id} className="border rounded-xl p-4 flex flex-wrap justify-between gap-3">
   <div><strong>{p.title}</strong><p className="text-sm text-slate-600">{p.locality}, {p.city} · {format(p.price)}</p><p className="text-xs font-semibold">Availability: {p.availability||'available'}</p><p className="text-xs">Listing: {p.status} {p.edit_pending?'· Edit awaiting approval':''}</p></div>
   <div className="flex flex-col gap-2"><button type="button" disabled={p.edit_pending} onClick={()=>{setEditing(p);setForm({...p});setMessage('');}} className="self-center bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50">{p.edit_pending?'Review pending':'Edit Property'}</button><button type="button" onClick={()=>setHistoryOpen(old=>old===p.id?null:p.id)} className="border rounded-lg px-3 py-2 text-sm">Edit history</button></div>
   {historyOpen===p.id&&<div className="w-full border-t pt-3 space-y-2"><strong className="text-sm">Edit history</strong>{history.filter(h=>h.property_id===p.id).length===0?<p className="text-xs text-slate-500">No edits recorded yet. Apply phase14 migration if history is unavailable.</p>:history.filter(h=>h.property_id===p.id).map(h=><div key={h.id} className="bg-slate-50 rounded p-2 text-xs"><span className="font-semibold capitalize">{h.status}</span> · {new Date(h.created_at).toLocaleString('en-IN')}<pre className="whitespace-pre-wrap break-words mt-1">{JSON.stringify(h.changes,null,2)}</pre></div>)}</div>}
  </article>)}</div>}
  {editing&&form&&<div role="dialog" aria-modal="true" aria-label="Edit Property Listing" className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
  <div className="relative bg-white w-full max-w-2xl max-h-[94vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200">
  <div className="px-5 py-4 bg-slate-900 text-white flex justify-between items-center shrink-0"><div className="flex items-center gap-3"><Building2 className="w-5 h-5 text-blue-400"/><div><h3 className="font-bold">Edit Property Listing</h3><p className="text-[11px] text-slate-400 font-mono">ID: {editing.id}</p></div></div><button type="button" aria-label="Close editor" onClick={()=>{setEditing(null);setForm(null);}} className="p-2 text-slate-400 hover:text-white"><X className="w-5 h-5"/></button></div>
  <form onSubmit={e=>void submit(e)} className="flex-1 overflow-y-auto p-5 space-y-5 text-sm">
   <div className="grid sm:grid-cols-3 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
    <label className="block text-xs font-bold">Moderation Status<input readOnly value={editing.status==='approved'?'Approved (Live on Portal)':editing.status} className="mt-1 w-full border rounded-lg p-2 bg-slate-100"/></label>
    <label className="block text-xs font-bold">Listing Type<select className="mt-1 w-full border rounded-lg p-2 bg-white" value={form.purpose} onChange={e=>setForm(v=>v?{...v,purpose:e.target.value as Owned['purpose']}:v)}><option value="sale">For Sale / Purchase</option><option value="rent">For Rent</option><option value="lease">For Lease</option></select></label>
    <label className="block text-xs font-bold">Property Category<select className="mt-1 w-full border rounded-lg p-2 bg-white" value={form.property_type} onChange={e=>setForm(v=>v?{...v,property_type:e.target.value as Owned['property_type']}:v)}><option value="apartment">Apartment</option><option value="house">House / Villa</option><option value="plot">Land / Plot</option><option value="commercial">Commercial</option><option value="pg">PG</option></select></label>
   </div>
   {field('Listing Title *','title')}
   <div className="grid sm:grid-cols-3 gap-3">
    <label className="text-xs font-bold">Price in INR (₹) *<input type="number" min="1" required className="mt-1 w-full border rounded-lg p-2.5 bg-slate-50" value={form.price} onChange={e=>setForm(v=>v?{...v,price:Number(e.target.value)}:v)}/></label>
    <label className="text-xs font-bold">Price Display Tag<input readOnly value={format(form.price)} className="mt-1 w-full border rounded-lg p-2.5 bg-slate-50 text-blue-700 font-bold"/></label>
    <label className="text-xs font-bold">Super Area (sq.ft)<input type="number" min="1" className="mt-1 w-full border rounded-lg p-2.5 bg-slate-50" value={form.area_sqft??''} onChange={e=>setForm(v=>v?{...v,area_sqft:e.target.value?Number(e.target.value):null}:v)}/></label>
   </div>
   <div className="grid sm:grid-cols-2 gap-3">{field('Metro City *','city')}{field('Locality *','locality')}</div>
   {field('Project / Society Name','project_name')}{field('Address / Society Name','address')}
   <div className="border rounded-xl p-3 bg-slate-50 space-y-2"><div className="flex items-center gap-2 font-bold"><MapPin className="w-4 h-4 text-blue-600"/>Map Location & Exact Coordinates</div><p className="text-xs text-slate-500">Search or drag the map pin to update the property location.</p><OpenStreetMapPinPicker latitude={form.latitude===null?'':String(form.latitude)} longitude={form.longitude===null?'':String(form.longitude)} onChange={point=>setForm(v=>v?{...v,latitude:point.lat,longitude:point.lng}:v)}/></div>
   <label className="block text-xs font-bold">Property Description<textarea className="mt-1 w-full border rounded-lg p-2.5 bg-slate-50" rows={4} value={form.description??''} onChange={e=>setForm(v=>v?{...v,description:e.target.value}:v)}/></label>
   <div className="grid sm:grid-cols-2 gap-3">{field('Contact Phone','contact_phone')}<label className="text-xs font-bold">Listing Availability<select className="mt-1 w-full border rounded-lg p-2.5" value={form.availability||'available'} onChange={e=>setForm(v=>v?{...v,availability:e.target.value as Owned['availability']}:v)}><option value="available">Available</option><option value="sold">Sold</option><option value="rented">Rented</option><option value="unavailable">Temporarily unavailable</option></select></label></div>
   <label className="flex items-center gap-2"><input type="checkbox" checked={form.publish_contact} onChange={e=>setForm(v=>v?{...v,publish_contact:e.target.checked}:v)}/>Display contact number publicly</label>
   <p className="text-xs bg-amber-50 border border-amber-200 p-3 rounded-lg">All changes require admin approval. Your existing live listing remains unchanged until approved.</p>
   <div className="sticky bottom-0 bg-white border-t pt-3 flex justify-end gap-2"><button type="button" onClick={()=>{setEditing(null);setForm(null);}} className="border rounded-lg px-4 py-2">Cancel</button><button type="submit" disabled={busy||editing.edit_pending} className="flex items-center gap-2 bg-blue-700 text-white rounded-lg px-4 py-2 disabled:opacity-50"><Save className="w-4 h-4"/>{busy?'Submitting…':'Submit Changes for Approval'}</button></div>
  </form></div></div>}
 </section>;
}
