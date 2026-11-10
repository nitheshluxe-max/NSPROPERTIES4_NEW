import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import {SUPABASE_URL,SUPABASE_ANON_KEY} from './config.js';
const db=createClient(SUPABASE_URL,SUPABASE_ANON_KEY),el=id=>document.getElementById(id);
const say=s=>el('message').textContent=s;
async function refresh(){
 const {data:{user}}=await db.auth.getUser();
 if(!user){el('login').hidden=false;el('dashboard').hidden=true;return;}
 const {data:membership,error:memberError}=await db.from('admin_users').select('user_id').eq('user_id',user.id).maybeSingle();
 if(memberError||!membership){el('login').hidden=false;el('dashboard').hidden=true;say('Signed in, but this account is not authorized as an admin.');return;}
 el('login').hidden=true;el('dashboard').hidden=false;
 const {data,error}=await db.rpc('admin_list_properties');if(error){say(error.message);return;}
 say((data||[]).length+' properties loaded');el('rows').replaceChildren();
 for(const p of data||[]){
  const tr=document.createElement('tr');
  for(const value of [p.title+' · '+p.locality+', '+p.city,'₹'+Number(p.price).toLocaleString('en-IN'),p.status]){
   const td=document.createElement('td');td.textContent=value;tr.append(td);
  }
  const td=document.createElement('td');
  for(const [label,status] of [['Approve','approved'],['Reject','rejected'],['Pending','pending']]){
   const b=document.createElement('button');b.className='btn btn-xs btn-outline mr-1 mb-1';b.textContent=label;b.disabled=p.status===status;
   b.onclick=async()=>{if(!confirm(label+' this property?'))return;b.disabled=true;const {error}=await db.rpc('admin_review_property',{target_id:p.id,new_status:status});if(error){say(error.message);b.disabled=false;}else await refresh();};td.append(b);
  }tr.append(td);el('rows').append(tr);
 }
}
el('loginForm').onsubmit=async e=>{e.preventDefault();const {error}=await db.auth.signInWithOtp({email:el('email').value.trim(),options:{emailRedirectTo:new URL('./admin.html',location.href).href}});say(error?error.message:'Check your email for a fresh sign-in link.');};
el('refresh').onclick=refresh;el('logout').onclick=async()=>{await db.auth.signOut();location.href='./admin.html';};
await refresh();
