import React, { useEffect, useState } from 'react';
import { Crown, ArrowRight, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';

type GoldListing={id:string;title:string;city:string;locality:string;price:number;area_sqft:number|null;property_type:string;photoUrl?:string};
const price=(value:number)=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(value);

export function GoldCollectionSection(){
 const [properties,setProperties]=useState<GoldListing[]>([]);
 const [loading,setLoading]=useState(true);
 useEffect(()=>{
  let active=true;
  async function load(){
   const tiers=await supabase.from('public_property_highlights').select('property_id').eq('tier','gold').limit(30);
   if(tiers.error||!tiers.data?.length){if(active){setProperties([]);setLoading(false);}return;}
   const ids=tiers.data.map(x=>x.property_id);
   const [listings,photos]=await Promise.all([
    supabase.from('public_properties').select('id,title,city,locality,price,area_sqft,property_type').in('id',ids).eq('status','approved'),
    supabase.from('property_photos').select('property_id,storage_path,sort_order').in('property_id',ids).order('sort_order')
   ]);
   if(!active)return;
   if(listings.error){setProperties([]);setLoading(false);return;}
   setProperties((listings.data||[]).map(p=>({...p,photoUrl:photos.data?.find(x=>x.property_id===p.id)?.storage_path?supabase.storage.from('property-photos').getPublicUrl(photos.data.find(x=>x.property_id===p.id)!.storage_path).data.publicUrl:undefined})));
   setLoading(false);
  }
  void load();
  return ()=>{active=false;};
 },[]);
 const hasSamurai=properties.some(p=>/sky\s*samurai/i.test(p.title));
 const hasSampurn=properties.some(p=>/sky\s*sampurn/i.test(p.title));
 return <section id="gold-collection" aria-labelledby="gold-collection-title" className="w-full bg-gradient-to-b from-[#fff9e7] via-[#fffcf4] to-white border-y border-amber-200 py-10 sm:py-14">
  <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
   <div className="flex flex-wrap items-end justify-between gap-4 mb-7">
    <div><span className="inline-flex gap-2 items-center text-amber-800 text-xs font-extrabold tracking-[.2em] uppercase"><Crown className="w-5 h-5"/>Premium Property Showcase</span><h2 id="gold-collection-title" className="mt-2 font-serif text-3xl sm:text-4xl font-black text-[#33230b]">Gold Collection Properties</h2><p className="mt-2 text-sm text-stone-600">Explore selected residential properties and detailed project information.</p></div>
    <a href="#free-marketplace" className="text-sm font-semibold text-amber-900 underline underline-offset-4">View all properties →</a>
   </div>
   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
    {!hasSamurai&&<a href="#project/ds-max-sky-samurai" className="group flex flex-col overflow-hidden rounded-2xl border-2 border-[#bd8a27] bg-gradient-to-br from-[#fff1bd] via-[#f3d47c] to-[#e0ad3e] shadow-[0_8px_22px_rgba(156,107,18,.16)] hover:shadow-xl transition-shadow">
     <div className="h-44 sm:h-48 bg-[#ead7ac] relative overflow-hidden"><img src={`${import.meta.env.BASE_URL}assets/sky-samurai/ProjectImg.webp`} alt="DS-MAX Sky Samurai project elevation" className="w-full h-full object-cover" loading="lazy"/><span className="absolute top-3 left-3 rounded-full bg-[#241b0d] text-[#ffe49b] px-3 py-1 text-xs font-bold">✦ GOLD COLLECTION</span></div>
     <div className="p-5 flex-1 flex flex-col"><h3 className="font-serif text-xl font-black text-[#2c1e0b]">DS-MAX Sky Samurai</h3><p className="mt-2 flex gap-1 items-center text-sm text-[#62431c]"><MapPin className="w-4 h-4"/>Soukya Road, Whitefield</p><p className="mt-3 text-sm font-medium">2 & 3 BHK Apartments</p><p className="mt-3 text-2xl font-black text-[#291c09]">From ₹78.38 L*</p><p className="mt-2 text-xs text-[#6c4c1f]">Indicative price; verify availability and charges.</p><span className="mt-auto pt-5 flex items-center gap-2 text-sm font-bold text-[#33230b]">View Project Details <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform"/></span></div>
    </a>}
    {!hasSampurn&&<a href="#project/ds-max-sky-sampurn" className="group flex flex-col overflow-hidden rounded-2xl border-2 border-[#bd8a27] bg-gradient-to-br from-[#fff6d9] via-[#f7e5a9] to-[#eac66b] shadow-[0_8px_22px_rgba(156,107,18,.16)] hover:shadow-xl transition-shadow">
     <div className="relative h-44 sm:h-48 bg-gradient-to-br from-amber-200 to-amber-500 overflow-hidden">
      <img src="https://ns-properties-seo-accelerator-1023770862236.asia-southeast1.run.app/assets/aistudio/ds_sky_sampurn-varthur_bangalore-bengaluru-ds-max_properties_private_limited_ce7873d3.jpeg" alt="DS-MAX Sky Sampurn residential project elevation" loading="lazy" className="h-full w-full object-cover"/>
      <span className="absolute top-3 left-3 rounded-full bg-[#241b0d] text-[#ffe49b] px-3 py-1 text-xs font-bold">✦ GOLD COLLECTION</span>
     </div>
     <div className="p-5 flex-1 flex flex-col">
      <h3 className="font-serif text-xl font-black text-[#2c1e0b]">DS-MAX Sky Sampurn</h3>
      <p className="mt-2 flex gap-1 items-center text-sm text-[#62431c]"><MapPin className="w-4 h-4"/>Varthur, Bengaluru</p>
      <p className="mt-3 text-sm font-medium">2 &amp; 3 BHK Apartments</p>
      <p className="mt-3 text-2xl font-black text-[#291c09]">From ₹80 L*</p>
      <p className="mt-2 text-xs text-[#6c4c1f]">Indicative price; verify availability and charges.</p>
      <span className="mt-auto pt-5 flex items-center gap-2 text-sm font-bold text-[#33230b]">View Project Details <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform"/></span>
     </div>
    </a>}
    {properties.map(p=><a key={p.id} href={/sky\s*samurai/i.test(p.title)?'#project/ds-max-sky-samurai':/sky\s*sampurn/i.test(p.title)?'#project/ds-max-sky-sampurn':'#free-marketplace'} className="group flex flex-col overflow-hidden rounded-2xl border-2 border-[#bd8a27] bg-gradient-to-br from-[#fff6d9] via-[#f7e5a9] to-[#eac66b] shadow-[0_8px_22px_rgba(156,107,18,.16)] hover:shadow-xl transition-shadow">
     <div className="relative h-44 sm:h-48 bg-gradient-to-br from-amber-200 to-amber-500 overflow-hidden">{p.photoUrl?<img src={p.photoUrl} alt={p.title} loading="lazy" className="h-full w-full object-cover"/>:<div className="h-full flex items-center justify-center"><Crown className="w-16 h-16 text-white/60"/></div>}<span className="absolute top-3 left-3 rounded-full bg-[#241b0d] text-[#ffe49b] px-3 py-1 text-xs font-bold">✦ GOLD COLLECTION</span></div>
     <div className="p-5 flex-1 flex flex-col"><h3 className="font-serif text-xl font-black text-[#2c1e0b] line-clamp-2">{p.title}</h3><p className="mt-2 flex items-center gap-1 text-sm text-[#62431c]"><MapPin className="w-4 h-4"/>{p.locality}, {p.city}</p><p className="mt-3 text-sm capitalize">{p.property_type}{p.area_sqft?' · '+p.area_sqft.toLocaleString('en-IN')+' sq. ft.':''}</p><p className="mt-3 text-2xl font-black text-[#291c09]">{price(p.price)}</p><span className="mt-auto pt-5 flex items-center gap-2 text-sm font-bold text-[#33230b]">Explore Property <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform"/></span></div>
    </a>)}
   </div>
   {loading&&<p className="mt-4 text-xs text-stone-500">Loading featured listings…</p>}
  </div>
 </section>;
}
