import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, ArrowLeft, Check, CheckCircle2, ChevronLeft, ChevronRight, FileText, ImagePlus, MapPin, ShieldCheck, Trash2, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Fields = Record<string, string>;
type PropertyCategory = 'apartment' | 'villa' | 'independent-building' | 'land' | 'commercial';
const steps = ['Basic Details', 'Location & Pin', 'Specifications', 'Pricing & Photos'];
const categories: { value: PropertyCategory; label: string }[] = [
  { value: 'apartment', label: 'Apartment / Flat' }, { value: 'villa', label: 'Independent Villa' },
  { value: 'independent-building', label: 'Independent Building' }, { value: 'land', label: 'Land / Plot' },
  { value: 'commercial', label: 'Commercial' }
];
const amenitiesByCategory: Record<PropertyCategory, string[]> = {
  apartment: ['24/7 Security','Covered Parking','Power Backup','Gymnasium','Swimming Pool','Lift / Elevator','Children\'s Play Area','CCTV','Clubhouse','Rainwater Harvesting','Visitor Parking','Balcony','Gated Community'],
  villa: ['24/7 Security','Covered Parking','Power Backup','Garden','Private Terrace','Gated Community','CCTV','Water Supply','Solar Power','Swimming Pool'],
  'independent-building': ['Stilt / Covered Parking','Own Borewell + Water Sump','Separate BESCOM Meters','Passenger Lift / Elevator','Cauvery / Municipal Water','High Rental Yield Location','CCTV','Power Backup'],
  land: ['Blacktop Tarred Roads','Underground Electricity','Underground Sewage (UGD)','24/7 Gated Security & CCTV','Avenue Plantation & Parks','Clear Title & Ready Registration','Water Connection','Boundary Wall'],
  commercial: ['100% DG Power Backup','Central Air Conditioning (HVAC)','High-Speed Passenger & Service Lifts','Fire Safety NOC & Sprinklers','24/7 Boom Barrier Security & CCTV','Reserved & Visitor Car Parking','Server Room & Fiber Optic Internet','Main Road High-Visibility Frontage']
};
const input = 'w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-600 focus:bg-white';
const label = 'block text-xs font-semibold text-slate-700 mb-1';
const initial: Fields = {
  seller_type:'owner',purpose:'sale',category:'apartment',city:'Bengaluru',furnishing:'unfurnished',possession:'ready',facing:'East',
  property_title:'',description:'',seller_name:'',seller_phone:'',seller_email:'',company:'',locality:'',address:'',landmark:'',pincode:'',
  latitude:'',longitude:'',project_name:'',rera_id:'',bedrooms:'',bathrooms:'',balconies:'',floor_number:'',total_floors:'',
  super_built_up_area:'',carpet_area:'',plot_area:'',plot_unit:'sq.ft',plot_dimensions:'',plot_length:'',plot_breadth:'',
  khata_type:'',plot_approval:'',zoning:'Residential NA',commercial_sub_type:'Office Space',fit_out:'Bare Shell',
  open_sides:'',boundary_wall:'yes',possession_date:'',price:'',price_per_sqft:'',maintenance:'',deposit:'',negotiable:'yes',
  contact_visibility:'no',tagline:'',video_tour_url:''
};
const mapCategory: Record<PropertyCategory,string> = {apartment:'apartment',villa:'house','independent-building':'house',land:'plot',commercial:'commercial'};
const fieldNames = Object.keys(initial).filter(k => !['contact_visibility'].includes(k));
const humanize = (key:string) => key.replace(/_/g,' ').replace(/\b\w/g, s=>s.toUpperCase());

function TextField({ name, value, onChange, type='text', required=false, placeholder='', min }: {
  name:string;value:string;onChange:(name:string,value:string)=>void;type?:string;required?:boolean;placeholder?:string;min?:number;
}) {
  return <div><label htmlFor={'post-'+name} className={label}>{humanize(name)} {required && '*'}</label>
    <input id={'post-'+name} name={name} type={type} value={value} onChange={e=>onChange(name,e.target.value)}
      required={required} min={min} placeholder={placeholder} className={input}/></div>;
}
function SelectField({ name, value, onChange, options }: {name:string;value:string;onChange:(name:string,value:string)=>void;options:string[]}) {
  return <div><label htmlFor={'post-'+name} className={label}>{humanize(name)}</label>
    <select id={'post-'+name} value={value} onChange={e=>onChange(name,e.target.value)} className={input}>
      {options.map(o=><option key={o} value={o}>{o}</option>)}
    </select></div>;
}
function Group({title,children}:{title:string;children:React.ReactNode}) {
  return <section className="space-y-4"><h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-200 pb-2">{title}</h3>{children}</section>;
}

export function ReferencePostPropertyForm({ onSubmitted }: { onSubmitted:()=>void }) {
  const [step,setStep]=useState(1);
  const [f,setF]=useState<Fields>(initial);
  const [amenities,setAmenities]=useState<string[]>([]);
  const [photos,setPhotos]=useState<File[]>([]);
  const [brochure,setBrochure]=useState<File|null>(null);
  const [floorPlan,setFloorPlan]=useState<File|null>(null);
  const [error,setError]=useState('');
  const [submitting,setSubmitting]=useState(false);
  const [progress,setProgress]=useState('');
  const [complete,setComplete]=useState(false);
  const top=useRef<HTMLDivElement>(null);
  const previews=useMemo(()=>photos.map(file=>({file,url:URL.createObjectURL(file)})),[photos]);
  useEffect(()=>()=>previews.forEach(p=>URL.revokeObjectURL(p.url)),[previews]);
  const set=(name:string,value:string)=>setF(old=>({...old,[name]:value}));
  const category=f.category as PropertyCategory;
  const isLand=category==='land';
  const isCommercial=category==='commercial';
  const isBuilding=category==='independent-building';
  const scroll=()=>top.current?.scrollIntoView({behavior:'smooth',block:'start'});
  const validPhone=(phone:string)=>/^(?:[0-9]{10}|[+]91[0-9]{10})$/.test(phone.replace(/[\s-]/g,''));
  function validate(n:number):string {
    if(n===1) {
      if(f.seller_name.trim().length<2) return 'Enter your full name.';
      if(!validPhone(f.seller_phone)) return 'Enter a valid 10-digit mobile number or +91 number.';
      if(f.seller_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.seller_email)) return 'Enter a valid email address.';
    }
    if(n===2) {
      if(!f.city.trim()||!f.locality.trim()||!f.address.trim()) return 'City, locality and full address are required.';
      if(f.latitude && (!Number.isFinite(Number(f.latitude))||Math.abs(Number(f.latitude))>90)) return 'Latitude must be between -90 and 90.';
      if(f.longitude && (!Number.isFinite(Number(f.longitude))||Math.abs(Number(f.longitude))>180)) return 'Longitude must be between -180 and 180.';
    }
    if(n===3) {
      const area=isLand ? f.plot_area : f.super_built_up_area;
      if(!Number.isFinite(Number(area))||Number(area)<=0) return 'Enter a valid property area greater than zero.';
    }
    if(n===4) {
      if(f.property_title.trim().length<5||f.property_title.trim().length>120) return 'Property title must contain 5–120 characters.';
      if(!Number.isFinite(Number(f.price))||Number(f.price)<=0) return 'Enter a valid asking price.';
      if(photos.length>6||photos.some(p=>!['image/jpeg','image/png','image/webp'].includes(p.type)||p.size>5*1024*1024)) return 'Upload at most 6 JPG, PNG or WebP images (up to 5 MB each).';
      if(brochure && (brochure.type!=='application/pdf'||brochure.size>10*1024*1024)) return 'Brochure must be a PDF of up to 10 MB.';
      if(floorPlan && (floorPlan.type!=='application/pdf'||floorPlan.size>10*1024*1024)) return 'Floor plan must be a PDF of up to 10 MB.';
    }
    return '';
  }
  function next(){
    const issue=validate(step);setError(issue);
    if(issue) {scroll();return;}
    setStep(s=>Math.min(4,s+1));scroll();
  }
  function previous(){setError('');setStep(s=>Math.max(1,s-1));scroll();}
  function choosePhotos(files:FileList|null){
    const selected=Array.from(files||[]);
    const merged=[...photos,...selected];
    if(merged.length>6||merged.some(p=>!['image/jpeg','image/png','image/webp'].includes(p.type)||p.size>5*1024*1024)) {
      setError('Choose up to 6 JPG, PNG or WebP images, maximum 5 MB each.');return;
    }
    setError('');setPhotos(merged);
  }
  async function submit(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();
    if(step!==4||submitting)return;
    for(let i=1;i<=4;i++){const issue=validate(i);if(issue){setError(issue);setStep(i);scroll();return;}}
    setSubmitting(true);setError('');setProgress('Checking account…');
    try{
      const {data:{user},error:authError}=await supabase.auth.getUser();
      if(authError||!user||user.is_anonymous||!user.email)throw new Error('Sign in with your email account before posting.');
      const details:Record<string,unknown>={...f,amenities,photo_count:photos.length,source:'reference-post-form'};
      const {data:inserted,error:insertError}=await supabase.from('properties').insert({
        user_id:user.id,title:f.property_title.trim(),description:f.description.trim()||null,
        city:f.city.trim(),locality:f.locality.trim(),purpose:f.purpose,
        property_type:mapCategory[category],price:Number(f.price),
        area_sqft:Number(isLand?f.plot_area:f.super_built_up_area),
        contact_phone:f.seller_phone.trim(),publish_contact:f.contact_visibility==='yes',
        status:'pending',details
      }).select('id').single();
      if(insertError||!inserted)throw new Error(insertError?.message||'Unable to create listing.');
      try{
        for(const [index,file] of photos.entries()){
          setProgress(`Uploading photo ${index+1} of ${photos.length}…`);
          const ext=file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg';
          const path=`${user.id}/${inserted.id}/${crypto.randomUUID()}.${ext}`;
          const uploaded=await supabase.storage.from('property-photos').upload(path,file,{contentType:file.type,upsert:false});
          if(uploaded.error)throw uploaded.error;
          const linked=await supabase.from('property_photos').insert({property_id:inserted.id,storage_path:path,sort_order:index});
          if(linked.error)throw linked.error;
        }
        for(const [file,kind] of [[brochure,'brochure'],[floorPlan,'floor-plan']] as const){
          if(!file)continue;
          setProgress(`Uploading ${kind}…`);
          const path=`${user.id}/${inserted.id}/${crypto.randomUUID()}.pdf`;
          const uploaded=await supabase.storage.from('property-brochures').upload(path,file,{contentType:'application/pdf',upsert:false});
          if(uploaded.error)throw uploaded.error;
          const linked=await supabase.from('property_documents').insert({property_id:inserted.id,storage_path:path,file_name:file.name,document_type:kind});
          if(linked.error)throw linked.error;
        }
      }catch(mediaError){
        throw new Error('Listing saved as pending, but media upload failed: '+(mediaError instanceof Error?mediaError.message:'Unknown error')+'. Contact an administrator before approval.');
      }
      setProgress('');setComplete(true);onSubmitted();scroll();
    }catch(err){setError(err instanceof Error?err.message:'Submission failed.');scroll();}
    finally{setSubmitting(false);setProgress('');}
  }
  if(complete)return <div ref={top} className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
    <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3"/><h2 className="text-2xl font-black text-slate-900">Property Submitted Successfully</h2>
    <p className="text-sm text-slate-700 mt-2">Your listing is pending administrator approval. It will appear publicly only after approval.</p>
    <button type="button" onClick={()=>{setComplete(false);setStep(1);setF(initial);setPhotos([]);setBrochure(null);setFloorPlan(null);setAmenities([]);}}
      className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-white font-bold">Post Another Property</button></div>;

  return <div ref={top} className="rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden scroll-mt-24">
    <header className="bg-slate-900 text-white px-5 sm:px-7 py-5 flex items-start justify-between gap-3">
      <div><p className="text-xs font-extrabold uppercase tracking-widest text-emerald-300">100% Free Property Listing</p>
        <h2 className="text-xl sm:text-2xl font-black mt-1">Post Your Property FREE</h2>
        <p className="text-xs text-slate-300 mt-1">Step {step} of 4: {steps[step-1]}</p></div>
      <span className="text-xs text-blue-200 font-semibold flex gap-1 items-center"><ShieldCheck className="w-4 h-4"/> Admin Verified</span>
    </header>
    <div className="h-1.5 bg-slate-200"><div className="h-full bg-blue-600 transition-all" style={{width:`${step*25}%`}}/></div>
    <nav aria-label="Posting steps" className="hidden sm:grid grid-cols-4 gap-2 border-b border-slate-200 p-4 text-xs">
      {steps.map((name,i)=><div key={name} className={`flex items-center gap-2 font-bold ${step>=i+1?'text-blue-700':'text-slate-400'}`}>
        <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${step>=i+1?'bg-blue-600 text-white':'bg-slate-200 text-slate-500'}`}>{step>i+1?<Check className="w-3.5 h-3.5"/>:i+1}</span>{name}
      </div>)}
    </nav>
    <form onSubmit={submit} noValidate className="p-4 sm:p-7 space-y-6 text-sm text-slate-800">
      {error&&<div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-300 bg-rose-50 p-3 text-rose-800"><AlertCircle className="w-5 h-5 shrink-0"/>{error}</div>}
      {step===1&&<div className="space-y-6">
        <Group title="You are listing as:">
          <div className="grid grid-cols-3 gap-3">{['owner','agent','builder'].map(v=><button type="button" key={v} onClick={()=>set('seller_type',v)}
            className={`rounded-xl border px-3 py-3 font-bold capitalize ${f.seller_type===v?'bg-blue-50 border-blue-600 text-blue-700 ring-1 ring-blue-200':'border-slate-200'}`}>{v}</button>)}</div>
        </Group>
        <Group title="Listing Purpose:">
          <div className="grid grid-cols-2 gap-3">{[['sale','Sell Property'],['rent','Rent / Lease Out']].map(([v,t])=><button type="button" key={v} onClick={()=>set('purpose',v)}
            className={`rounded-xl border px-4 py-3 font-bold ${f.purpose===v?'bg-blue-600 text-white border-blue-600':'border-slate-200'}`}>{t}</button>)}</div>
        </Group>
        <Group title="Property Category:">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">{categories.map(c=><button type="button" key={c.value} onClick={()=>{set('category',c.value);setAmenities([]);}}
            className={`rounded-xl border px-3 py-3 text-xs font-bold ${category===c.value?'bg-blue-50 text-blue-700 border-blue-600 ring-2 ring-blue-500/20':'border-slate-200'}`}>{c.label}</button>)}</div>
        </Group>
        <Group title="Seller Details">
          <div className="grid sm:grid-cols-2 gap-4">
            <TextField name="seller_name" value={f.seller_name} onChange={set} required placeholder="Your full name"/>
            <TextField name="seller_phone" value={f.seller_phone} onChange={set} required type="tel" placeholder="+91 9876543210"/>
            <TextField name="seller_email" value={f.seller_email} onChange={set} type="email" placeholder="you@example.com"/>
            {f.seller_type!=='owner'&&<TextField name="company" value={f.company} onChange={set} placeholder="Company / Firm Name"/>}
          </div>
        </Group>
      </div>}
      {step===2&&<div className="space-y-6">
        <Group title="Property Location & Project Details">
          <div className="grid sm:grid-cols-2 gap-4">
            <SelectField name="city" value={f.city} onChange={set} options={['Bengaluru','Mumbai','Delhi-NCR','Pune','Hyderabad','Chennai','Other']}/>
            <TextField name="locality" value={f.locality} onChange={set} required placeholder="e.g. Whitefield"/>
            <div className="sm:col-span-2"><TextField name="address" value={f.address} onChange={set} required placeholder="Complete property address"/></div>
            <TextField name="landmark" value={f.landmark} onChange={set} placeholder="Nearby landmark"/>
            <TextField name="pincode" value={f.pincode} onChange={set} placeholder="6-digit PIN"/>
            <TextField name="project_name" value={f.project_name} onChange={set} placeholder="Project / Society name"/>
            <TextField name="rera_id" value={f.rera_id} onChange={set} placeholder="RERA Registration ID"/>
          </div>
        </Group>
        <Group title="Exact Location & Map Pin">
          <p className="text-xs text-slate-500">Enter coordinates from Google Maps to attach an accurate map pin. These are saved with the property.</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <TextField name="latitude" type="number" value={f.latitude} onChange={set} placeholder="e.g. 12.9698"/>
            <TextField name="longitude" type="number" value={f.longitude} onChange={set} placeholder="e.g. 77.7499"/>
          </div>
          <a className="inline-flex items-center gap-2 text-blue-700 text-xs font-bold" href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer"><MapPin className="w-4 h-4"/> Find your pin on Google Maps</a>
        </Group>
      </div>}
      {step===3&&<div className="space-y-6">
        <Group title={isLand?'Plot / Land Specifications':isCommercial?'Commercial Specifications':isBuilding?'Independent Building Specifications':'Residential Specifications'}>
          <div className="grid sm:grid-cols-2 gap-4">
            {!isLand&&!isCommercial&&!isBuilding&&<>
              <TextField name="bedrooms" type="number" value={f.bedrooms} onChange={set} min={0}/>
              <TextField name="bathrooms" type="number" value={f.bathrooms} onChange={set} min={0}/>
              <TextField name="balconies" type="number" value={f.balconies} onChange={set} min={0}/>
            </>}
            {!isLand&&<>
              <TextField name="super_built_up_area" type="number" value={f.super_built_up_area} onChange={set} required min={1}/>
              <TextField name="carpet_area" type="number" value={f.carpet_area} onChange={set} min={1}/>
              <TextField name="floor_number" type="number" value={f.floor_number} onChange={set}/>
              <TextField name="total_floors" type="number" value={f.total_floors} onChange={set} min={0}/>
              <SelectField name="furnishing" value={f.furnishing} onChange={set} options={['unfurnished','semi-furnished','fully-furnished']}/>
            </>}
            {(isLand||isBuilding)&&<>
              <TextField name="plot_area" type="number" value={f.plot_area} onChange={set} required={isLand} min={1}/>
              <SelectField name="plot_unit" value={f.plot_unit} onChange={set} options={['sq.ft','sq.yards','acres']}/>
              <TextField name="plot_dimensions" value={f.plot_dimensions} onChange={set} placeholder="30 x 40 ft"/>
              <TextField name="plot_length" type="number" value={f.plot_length} onChange={set} min={1}/>
              <TextField name="plot_breadth" type="number" value={f.plot_breadth} onChange={set} min={1}/>
              <TextField name="khata_type" value={f.khata_type} onChange={set} placeholder="A-Khata"/>
              <TextField name="plot_approval" value={f.plot_approval} onChange={set} placeholder="BBMP / BDA"/>
            </>}
            {isLand&&<>
              <SelectField name="zoning" value={f.zoning} onChange={set} options={['Residential NA','Commercial','Industrial','Agricultural']}/>
              <TextField name="open_sides" type="number" value={f.open_sides} onChange={set} min={1}/>
              <SelectField name="boundary_wall" value={f.boundary_wall} onChange={set} options={['yes','no']}/>
            </>}
            {isCommercial&&<>
              <SelectField name="commercial_sub_type" value={f.commercial_sub_type} onChange={set} options={['Office Space','Retail Showroom','Warehouse','Coworking Desk']}/>
              <SelectField name="fit_out" value={f.fit_out} onChange={set} options={['Bare Shell','Warm Shell','Fully Fitted','Furnished']}/>
            </>}
            <SelectField name="facing" value={f.facing} onChange={set} options={['North','East','North-East','West','South']}/>
            <SelectField name="possession" value={f.possession} onChange={set} options={['ready','under-construction','new-launch']}/>
            <TextField name="possession_date" value={f.possession_date} onChange={set} placeholder="Immediate / Dec 2026"/>
          </div>
        </Group>
        <Group title="Amenities & Highlights">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">{amenitiesByCategory[category].map(a=><label key={a} className={`flex gap-2 items-center rounded-lg border p-2.5 text-xs cursor-pointer ${amenities.includes(a)?'bg-blue-50 border-blue-500':'border-slate-200'}`}>
            <input type="checkbox" checked={amenities.includes(a)} onChange={()=>setAmenities(prev=>prev.includes(a)?prev.filter(x=>x!==a):[...prev,a])} className="accent-blue-600"/>{a}
          </label>)}</div>
        </Group>
      </div>}
      {step===4&&<div className="space-y-6">
        <Group title="Pricing & Property Information">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2"><TextField name="property_title" value={f.property_title} onChange={set} required placeholder="Enter an attractive property title"/></div>
            <TextField name="price" type="number" value={f.price} onChange={set} required min={1} placeholder="Asking price in ₹"/>
            <TextField name="price_per_sqft" type="number" value={f.price_per_sqft} onChange={set} min={0}/>
            <TextField name="maintenance" type="number" value={f.maintenance} onChange={set} min={0}/>
            {f.purpose==='rent'&&<TextField name="deposit" type="number" value={f.deposit} onChange={set} min={0}/>}
            <SelectField name="negotiable" value={f.negotiable} onChange={set} options={['yes','no']}/>
            <TextField name="tagline" value={f.tagline} onChange={set} placeholder="Short promotional tagline"/>
            <TextField name="video_tour_url" value={f.video_tour_url} onChange={set} type="url" placeholder="Optional video tour URL"/>
            <div className="sm:col-span-2"><label className={label}>Detailed Property Description</label><textarea className={input} rows={5} maxLength={3000} value={f.description} onChange={e=>set('description',e.target.value)} placeholder="Describe the property, surroundings and unique features…"/></div>
          </div>
        </Group>
        <Group title="Property Photos (Up to 6)">
          <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-blue-200 rounded-xl p-7 cursor-pointer bg-blue-50/40 hover:bg-blue-50">
            <ImagePlus className="w-7 h-7 text-blue-600"/><strong className="text-slate-900">Choose Photos from Phone / Computer</strong>
            <span className="text-xs text-slate-500">JPG, PNG or WebP • Max 5 MB per photo</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={e=>{choosePhotos(e.target.files);e.target.value='';}}/>
          </label>
          {previews.length>0&&<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{previews.map((p,i)=><div key={p.url} className="relative rounded-xl overflow-hidden border border-slate-200">
            <img src={p.url} alt={`Property preview ${i+1}`} className="h-28 w-full object-cover"/>
            <button type="button" aria-label={`Remove photo ${i+1}`} onClick={()=>setPhotos(old=>old.filter((_,index)=>index!==i))}
              className="absolute top-1.5 right-1.5 p-1.5 rounded-lg bg-white text-rose-700"><Trash2 className="w-4 h-4"/></button>
          </div>)}</div>}
        </Group>
        <Group title="Floor Plan & Official Project Brochure">
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="rounded-xl border border-slate-200 p-4 flex flex-col gap-2 cursor-pointer"><FileText className="w-5 h-5 text-blue-600"/><strong>Upload Unit / Floor Plan (PDF)</strong><span className="text-xs text-slate-500">{floorPlan?.name||'Optional, max 10 MB'}</span>
              <input type="file" accept="application/pdf,.pdf" onChange={e=>setFloorPlan(e.target.files?.[0]||null)} className="text-xs max-w-full"/></label>
            <label className="rounded-xl border border-slate-200 p-4 flex flex-col gap-2 cursor-pointer"><Upload className="w-5 h-5 text-blue-600"/><strong>Upload E-Brochure (PDF)</strong><span className="text-xs text-slate-500">{brochure?.name||'Optional, max 10 MB'}</span>
              <input type="file" accept="application/pdf,.pdf" onChange={e=>setBrochure(e.target.files?.[0]||null)} className="text-xs max-w-full"/></label>
          </div>
        </Group>
        <Group title="Seller Contact & Visibility">
          <p className="text-xs text-slate-500">Your phone number remains private unless you explicitly consent to display it on the approved listing.</p>
          <label className="flex gap-2 items-center"><input type="checkbox" checked={f.contact_visibility==='yes'} onChange={e=>set('contact_visibility',e.target.checked?'yes':'no')}/>
            I consent to publicly displaying my contact number.</label>
        </Group>
      </div>}
      <footer className="border-t border-slate-200 pt-5 flex flex-wrap justify-between gap-3 items-center">
        <button type="button" disabled={step===1||submitting} onClick={previous} className="inline-flex gap-1.5 items-center px-4 py-2.5 rounded-xl border border-slate-300 font-bold disabled:opacity-40"><ChevronLeft className="w-4 h-4"/> Previous</button>
        <span className="text-xs text-slate-500">{step} / 4</span>
        {step<4?<button type="button" onClick={next} className="inline-flex gap-2 items-center px-6 py-2.5 rounded-xl bg-blue-600 text-white font-extrabold">Next Step <ChevronRight className="w-4 h-4"/></button>
          :<button type="submit" disabled={submitting} className="inline-flex gap-2 items-center px-6 py-2.5 rounded-xl bg-blue-600 text-white font-extrabold disabled:opacity-50">{submitting?progress||'Submitting…':'Submit for Review — FREE'} <Check className="w-4 h-4"/></button>}
      </footer>
    </form>
  </div>;
}
