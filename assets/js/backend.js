window.NS_BACKEND={
 available:false,
 get config(){return window.NS_SUPABASE_CONFIG||{}},
 get configured(){const {url,anonKey}=this.config;return /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(url||'')&&!!anonKey&&!anonKey.startsWith('YOUR_')},
 async request(path,{method='GET',body,token}={}){
  if(!this.configured)throw Error('Supabase is not configured. Follow SUPABASE_SETUP.md.');
  const {url,anonKey}=this.config;
  const r=await fetch(url.replace(/\/$/,'')+'/rest/v1/'+path,{method,headers:{apikey:anonKey,Authorization:'Bearer '+(token||anonKey),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
  const raw=await r.text();let data;try{data=raw?JSON.parse(raw):null}catch{throw Error('Supabase returned invalid JSON (HTTP '+r.status+')')}
  if(!r.ok)throw Error(data?.message||data?.error||'Supabase request failed');return data;
 },
 async init(){
  if(!this.configured){console.info('Supabase not configured; showing sample listings');return}
  try{
   const rows=await this.request('properties?select=id,title,listing_type,category,locality,city,price,area,bhk,bathrooms,availability,description,amenities,image_urls&status=eq.approved&order=created_at.desc&limit=100');
   window.NS_PROPERTIES=rows.map(p=>({...p,id:String(p.id),type:p.listing_type,location:p.locality+', '+p.city,status:p.availability,badge:p.availability,images:Array.isArray(p.image_urls)?p.image_urls:[],map:p.locality+', '+p.city}));
   this.available=true;
  }catch(e){console.error(e);window.NS_PROPERTIES=[];this.available=true}
 },
 async submit(endpoint,payload){
  if(endpoint==='submit-property.php'){const id=await this.request('rpc/submit_property',{method:'POST',body:{payload}});return {success:true,reference:'NSP-'+id,message:'Submitted for admin review. Photos are not uploaded yet.'}}
  if(endpoint==='enquiry.php'){await this.request('rpc/submit_enquiry',{method:'POST',body:{payload}});return {success:true,message:'Enquiry submitted'}}
  throw Error('Unsupported endpoint');
 }
};