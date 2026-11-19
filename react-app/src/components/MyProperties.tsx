import React, { useEffect, useState } from 'react';
import { Building2, X, Save, MapPin, ImagePlus, FileText } from 'lucide-react';
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
 const [mediaEditing,setMediaEditing]=useState<Owned|null>(null);
 const [photos,setPhotos]=useState<File[]>([]);
 const [brochure,setBrochure]=useState<File|null>(null);
 const [floorPlan,setFloorPlan]=useState<File|null>(null);
 const [replacePhotos,setReplacePhotos]=useState(false);
 const [replaceBrochure,setReplaceBrochure]=useState(false);
 const [replaceFloorPlan,setReplaceFloorPlan]=useState(false);
 const [mediaProgress,setMediaProgress]=useState('');
 const [currentMedia,setCurrentMedia]=useState<{photos:string[];brochure:boolean;floorPlan:boolean}>({photos:[],brochure:false,floorPlan:false});
 const [mediaHistory,setMediaHistory]=useState<Array<{id:string;property_id:string;status:string;created_at:string}>>([]);
 const [history,setHistory]=useState<Array<{id:string;property_id:string;changes:Record<string,unknown>;status:string;created_at:string;reviewed_at:string|null}>>([]);
 const [historyOpen,setHistoryOpen]=useState<string|null>(null);
 async function load() {
  setLoading(true);
  const {data,error}=await supabase.rpc('owner_list_properties');
  if(error) setMessage('My Properties unavailable: '+error.message+' (apply phase13_owner_property_edits.sql in Supabase)');
  else {setItems((data||[]) as Owned[]);setMessage('');}
  const historyResult=await supabase.rpc('owner_property_edit_history');
  if(!historyResult.error) setHistory((historyResult.data||[]) as typeof history);
  const mediaResult=await supabase.from('property_media_edits').select('id,property_id,status,created_at').order('created_at',{ascending:false}).limit(100);
  if(!mediaResult.error) setMediaHistory((mediaResult.data||[]) as typeof mediaHistory);
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
 async function openMedia(p:Owned) {
  setMediaEditing(p);setPhotos([]);setBrochure(null);setFloorPlan(null);
  setReplacePhotos(false);setReplaceBrochure(false);setReplaceFloorPlan(false);setMediaProgress('');
  const [photoResult,docsResult,legacyResult]=await Promise.all([
   supabase.from('property_photos').select('storage_path').eq('property_id',p.id).order('sort_order'),
   supabase.from('property_documents').select('document_type').eq('property_id',p.id),
   supabase.from('property_brochures').select('id').eq('property_id',p.id)
  ]);
  if(photoResult.error||docsResult.error||legacyResult.error){setMediaProgress('Unable to load existing media: '+(photoResult.error||docsResult.error||legacyResult.error)?.message);return;}
  setCurrentMedia({photos:(photoResult.data||[]).map(x=>supabase.storage.from('property-photos').getPublicUrl(x.storage_path).data.publicUrl),brochure:!!legacyResult.data?.length||(docsResult.data||[]).some(x=>x.document_type==='brochure'),floorPlan:(docsResult.data||[]).some(x=>x.document_type==='floor-plan')});
 }
 async function submitMedia() {
  if(!mediaEditing||busy)return;
  if(!replacePhotos&&!replaceBrochure&&!replaceFloorPlan){setMediaProgress('Select at least one media section to change.');return;}
  if(replacePhotos&&(!photos.length||photos.length>12)){setMediaProgress('Choose 1 to 12 photos.');return;}
  const validPhoto=(f:File)=>['image/jpeg','image/png','image/webp'].includes(f.type)&&f.size<=5*1024*1024;
  if(photos.some(f=>!validPhoto(f))||(brochure&&(brochure.type!=='application/pdf'||brochure.size>60*1024*1024))||(floorPlan&&(floorPlan.type!=='application/pdf'||floorPlan.size>10*1024*1024))){setMediaProgress('Photos must be JPG/PNG/WebP under 5 MB; brochure PDFs up to 60 MB; floor-plan PDFs up to 10 MB.');return;}
  setBusy(true);setMediaProgress('Preparing secure media request…');
  try {
   const session=await supabase.auth.getUser();if(!session.data.user)throw new Error('Sign in again.');
   const userId=session.data.user.id;
   const created=await supabase.rpc('owner_start_media_edit',{target_id:mediaEditing.id});
   if(created.error||!created.data)throw created.error||new Error('Unable to create request');
   const requestId=String(created.data),prefix=`${userId}/${mediaEditing.id}/${requestId}/`;
   const upload=async(bucket:string,path:string,file:File)=>{
    const result=await supabase.storage.from(bucket).upload(path,file,{contentType:file.type,upsert:false});
    if(result.error)throw result.error;
    return path;
   };
   const photoPaths:string[]=[];
   if(replacePhotos)for(let i=0;i<photos.length;i++){setMediaProgress(`Uploading photo ${i+1}/${photos.length}…`);const file=photos[i];const ext=file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg';photoPaths.push(await upload('property-photos',prefix+`photo-${i}.${ext}`,file));}
   const brochurePath=replaceBrochure&&brochure?await upload('property-brochures',prefix+'brochure-new.pdf',brochure):null;
   const floorPlanPath=replaceFloorPlan&&floorPlan?await upload('property-brochures',prefix+'floor-plan-new.pdf',floorPlan):null;
   setMediaProgress('Submitting for admin approval…');
   const submitted=await supabase.rpc('owner_submit_media_edit',{request_id:requestId,replace_photos:replacePhotos,photo_paths:photoPaths,replace_brochure:replaceBrochure,brochure_path:brochurePath,replace_floor_plan:replaceFloorPlan,floor_plan_path:floorPlanPath});
   if(submitted.error)throw submitted.error;
   setMediaEditing(null);await load();setMessage('Media changes submitted for admin approval. Current published files remain unchanged.');
  }catch(err){setMediaProgress(err instanceof Error?err.message:'Unable to upload media.');}
  finally{setBusy(false);}
 }
 const field=(label:string,key:'title'|'city'|'locality'|'contact_phone'|'project_name'|'address')=><label className="block text-sm font-medium">{label}<input className="mt-1 block w-full border rounded-lg p-2" value={form?.[key]||''} onChange={e=>setForm(v=>v?{...v,[key]:e.target.value}:v)} required={key!=='contact_phone'}/></label>;
 return <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 space-y-4" aria-label="My Properties">
  <div className="flex justify-between items-center"><h2 className="text-xl font-bold">My Properties</h2><button type="button" onClick={()=>void load()} className="text-blue-700 underline text-sm">Refresh</button></div>
  <p className="text-sm text-slate-600">Only listings uploaded from your signed-in account appear here. Edits require admin approval.</p>
  {message&&<p role="status" className="rounded-lg bg-blue-50 p-3 text-sm">{message}</p>}
  {loading?<p>Loading your properties…</p>:items.length===0?<p className="text-sm text-slate-600">You have not uploaded any properties using this account.</p>:<div className="space-y-3">{items.map(p=><article key={p.id} className="border rounded-xl p-4 flex flex-wrap justify-between gap-3">
   <div><strong>{p.title}</strong><p className="text-sm text-slate-600">{p.locality}, {p.city} · {format(p.price)}</p><p className="text-xs font-semibold">Availability: {p.availability||'available'}</p><p className="text-xs">Listing: {p.status} {p.edit_pending?'· Edit awaiting approval':''}</p></div>
   <div className="flex flex-col gap-2"><button type="button" disabled={p.edit_pending} onClick={()=>{setEditing(p);setForm({...p});setMessage('');}} className="self-center bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50">{p.edit_pending?'Review pending':'Edit Property'}</button><button type="button" onClick={()=>void openMedia(p)} className="border rounded-lg px-3 py-2 text-sm">Manage photos & PDFs</button><button type="button" onClick={()=>setHistoryOpen(old=>old===p.id?null:p.id)} className="border rounded-lg px-3 py-2 text-sm">Edit history</button></div>
   {historyOpen===p.id&&<div className="w-full border-t pt-3 space-y-2"><strong className="text-sm">Edit history</strong>{history.filter(h=>h.property_id===p.id).length===0?<p className="text-xs text-slate-500">No edits recorded yet. Apply phase14 migration if history is unavailable.</p>:history.filter(h=>h.property_id===p.id).map(h=><div key={h.id} className="bg-slate-50 rounded p-2 text-xs"><span className="font-semibold capitalize">{h.status}</span> · {new Date(h.created_at).toLocaleString('en-IN')}<pre className="whitespace-pre-wrap break-words mt-1">{JSON.stringify(h.changes,null,2)}</pre></div>)}</div>}
  </article>)}</div>}
  {mediaEditing&&<div role="dialog" aria-modal="true" aria-label="Manage property media" className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-2 sm:p-4">
   <div className="bg-white w-full max-w-2xl max-h-[94vh] rounded-2xl overflow-hidden flex flex-col">
    <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between"><div><h3 className="font-bold">Manage Photos, Brochure & Floor Plan</h3><p className="text-xs text-slate-400">{mediaEditing.title}</p></div><button aria-label="Close media editor" type="button" onClick={()=>setMediaEditing(null)}><X className="w-5 h-5"/></button></div>
    <div className="p-5 space-y-4 overflow-y-auto">
     <p className="text-sm text-slate-600">Choose which media to replace. Untouched media stays as it is. Uploaded replacements are published only after admin approval.</p>
     <section className="border rounded-xl p-3 space-y-2"><label className="flex gap-2 font-semibold"><input type="checkbox" checked={replacePhotos} onChange={e=>setReplacePhotos(e.target.checked)}/><ImagePlus className="w-4 h-4"/>Replace property photos (1–12)</label>
      <div className="flex gap-2 flex-wrap">{currentMedia.photos.map(url=><img key={url} src={url} alt="Current property" className="h-20 w-24 rounded object-cover"/>)}</div>
      {replacePhotos&&<><input aria-label="Choose replacement photos" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={e=>setPhotos(Array.from(e.target.files||[]))}/><p className="text-xs">{photos.length} new photos selected (maximum 5 MB each)</p><div className="flex flex-wrap gap-2">{photos.map((file,i)=><span key={i} className="text-xs border rounded p-1">{file.name}</span>)}</div></>}
     </section>
     <section className="border rounded-xl p-3 space-y-2"><label className="flex gap-2 font-semibold"><input type="checkbox" checked={replaceBrochure} onChange={e=>setReplaceBrochure(e.target.checked)}/><FileText className="w-4 h-4"/>Replace or remove brochure PDF</label><p className="text-xs text-slate-500">Existing brochure: {currentMedia.brochure?'Yes':'None'} · Maximum 60 MB</p>{replaceBrochure&&<><input aria-label="Choose brochure PDF" type="file" accept="application/pdf" onChange={e=>setBrochure(e.target.files?.[0]||null)}/><p className="text-xs">Leave empty to remove the existing brochure.</p></>}</section>
     <section className="border rounded-xl p-3 space-y-2"><label className="flex gap-2 font-semibold"><input type="checkbox" checked={replaceFloorPlan} onChange={e=>setReplaceFloorPlan(e.target.checked)}/><FileText className="w-4 h-4"/>Replace or remove floor-plan PDF</label><p className="text-xs text-slate-500">Existing floor plan: {currentMedia.floorPlan?'Yes':'None'}</p>{replaceFloorPlan&&<><input aria-label="Choose floor-plan PDF" type="file" accept="application/pdf" onChange={e=>setFloorPlan(e.target.files?.[0]||null)}/><p className="text-xs">Leave empty to remove the existing floor plan.</p></>}</section>
     <div className="text-xs text-slate-600">Media request history: {mediaHistory.filter(x=>x.property_id===mediaEditing.id).map(x=>x.status).join(', ')||'None'}</div>
     {mediaProgress&&<p role="status" className="bg-blue-50 rounded-lg p-3 text-sm">{mediaProgress}</p>}
     <div className="flex justify-end gap-2"><button type="button" className="border rounded-lg px-4 py-2" onClick={()=>setMediaEditing(null)}>Cancel</button><button type="button" disabled={busy||mediaHistory.some(x=>x.property_id===mediaEditing.id&&x.status==='pending')} className="bg-blue-700 text-white rounded-lg px-4 py-2 disabled:opacity-50" onClick={()=>void submitMedia()}>{busy?'Uploading…':'Submit Media for Approval'}</button></div>
    </div>
   </div>
  </div>}
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
