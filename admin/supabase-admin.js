const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const notice=s=>$('notice').textContent=s;
const key='ns_supabase_admin_session';
let session=null;
function store(s){session=s;if(s)sessionStorage.setItem(key,JSON.stringify(s));else sessionStorage.removeItem(key);}
try{session=JSON.parse(sessionStorage.getItem(key)||'null')}catch{}
async function auth(path,body){const {url,anonKey}=NS_BACKEND.config;const r=await fetch(url+'/auth/v1/'+path,{method:'POST',headers:{apikey:anonKey,'Content-Type':'application/json'},body:JSON.stringify(body)});const d=await r.json();if(!r.ok)throw Error(d.msg||d.error_description||d.message||'Authentication failed');return d;}
async function ensureSession(){
 if(!session)throw Error('Authentication required');
 if(Date.now()>=session.expires_at*1000-60000){
  const d=await auth('token?grant_type=refresh_token',{refresh_token:session.refresh_token});
  store({...d,expires_at:Math.floor(Date.now()/1000)+d.expires_in});
 }
 return session.access_token;
}
async function query(path,opts={}){return NS_BACKEND.request(path,{...opts,token:await ensureSession()})}
async function load(){
 try{
  const token=await ensureSession();
  const admins=await query('site_admins?select=user_id&user_id=eq.'+encodeURIComponent(session.user.id));
  if(!admins.length)throw Error('This account is not an administrator');
  const [properties,enquiries]=await Promise.all([
   query('properties?select=id,title,locality,city,price,status,created_at&order=created_at.desc&limit=100'),
   query('enquiries?select=id,name,phone,email,enquiry_type,message,created_at,properties(title)&order=created_at.desc&limit=100')
  ]);
  $('loginBox').hidden=true;$('dashboard').hidden=false;
  $('stats').innerHTML=['pending','approved','rejected'].map(s=>'<div class="content-card"><p class="muted">'+s.toUpperCase()+'</p><strong class="text-3xl brand">'+properties.filter(p=>p.status===s).length+'</strong></div>').join('');
  $('propertiesTable').innerHTML='<table class="table"><thead><tr><th>Property</th><th>Location</th><th>Price</th><th>Status</th><th>Review</th></tr></thead><tbody>'+properties.map(p=>'<tr><td>'+esc(p.title)+'</td><td>'+esc(p.locality)+', '+esc(p.city)+'</td><td>₹'+Number(p.price).toLocaleString('en-IN')+'</td><td>'+esc(p.status)+'</td><td><select aria-label="Review property" class="select review" data-id="'+esc(p.id)+'">'+['pending','approved','rejected'].map(s=>'<option value="'+s+'" '+(s===p.status?'selected':'')+'>'+s+'</option>').join('')+'</select></td></tr>').join('')+'</tbody></table>';
  $('enquiriesTable').innerHTML='<table class="table"><thead><tr><th>Date</th><th>Property</th><th>Name</th><th>Contact</th><th>Message</th></tr></thead><tbody>'+enquiries.map(e=>'<tr><td>'+esc(e.created_at)+'</td><td>'+esc(e.properties?.title)+'</td><td>'+esc(e.name)+'</td><td>'+esc(e.phone)+' '+esc(e.email)+'</td><td>'+esc(e.enquiry_type)+': '+esc(e.message)+'</td></tr>').join('')+'</tbody></table>';
  document.querySelectorAll('.review').forEach(el=>el.onchange=async()=>{try{
   await query('properties?id=eq.'+encodeURIComponent(el.dataset.id),{method:'PATCH',body:{status:el.value,approved_at:el.value==='approved'?new Date().toISOString():null}});
   notice('Property status updated');await load();
  }catch(e){notice(e.message);await load()}});
 }catch(e){notice(e.message);$('loginBox').hidden=false;$('dashboard').hidden=true;if(e.message.includes('Authentication'))store(null)}
}
$('loginForm').onsubmit=async e=>{e.preventDefault();try{
 if(!NS_BACKEND.configured)throw Error('Configure Supabase first. See SUPABASE_SETUP.md');
 const d=await auth('token?grant_type=password',{email:$('username').value,password:$('password').value});
 store({...d,expires_at:Math.floor(Date.now()/1000)+d.expires_in});$('password').value='';notice('');await load();
}catch(e){notice(e.message)}};
$('logout').onclick=async()=>{store(null);$('dashboard').hidden=true;$('loginBox').hidden=false;notice('Signed out')};
if(session&&NS_BACKEND.configured)load();
