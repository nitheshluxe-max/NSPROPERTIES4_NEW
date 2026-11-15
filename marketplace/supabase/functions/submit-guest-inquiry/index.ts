// Supabase Edge Function: submit-guest-inquiry
// Deploy with --no-verify-jwt; CAPTCHA is mandatory for all guest submissions.
// Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (built-in), TURNSTILE_SECRET_KEY,
// GUEST_INQUIRY_HASH_SECRET, ALLOWED_ORIGINS (comma-separated https:// hosts).
import { createClient } from 'npm:@supabase/supabase-js@2';

const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') || '').split(',').map(x => x.trim().replace(/\\/$/, '')).filter(Boolean);
const json = (data: unknown, status: number, origin: string) => new Response(JSON.stringify(data), {
  status, headers: { 'content-type': 'application/json', 'access-control-allow-origin': origin,
    'vary': 'Origin', 'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type, x-supabase-api-version',
    'access-control-allow-methods': 'POST, OPTIONS' }
});
const clean = (x: unknown) => typeof x === 'string' ? x.trim() : '';
async function hash(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}
Deno.serve(async req => {
  const origin = req.headers.get('origin') || '';
  if (!origin || !allowedOrigins.includes(origin)) {
    console.warn('Guest inquiry rejected origin:', origin || '(missing)');
    return new Response('Forbidden origin', {status:403});
  }
  if (req.method === 'OPTIONS') return json({}, 200, origin);
  if (req.method !== 'POST') return json({error:'Method not allowed'},405,origin);
  try {
    const secret = Deno.env.get('TURNSTILE_SECRET_KEY');
    const salt = Deno.env.get('GUEST_INQUIRY_HASH_SECRET');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const url = Deno.env.get('SUPABASE_URL');
    if (!secret || !salt || !serviceKey || !url) return json({error:'Inquiry service not configured'},503,origin);
    if (Number(req.headers.get('content-length') || 0) > 12000) return json({error:'Request too large'},413,origin);
    const input = await req.json();
    const propertyId = clean(input.property_id);
    const name = clean(input.user_name);
    const phone = clean(input.user_phone);
    const email = clean(input.user_email);
    const inquiryType = clean(input.inquiry_type);
    const scheduled = clean(input.scheduled_date);
    const message = clean(input.message);
    const token = clean(input.captcha_token);
    // Honeypot must remain blank.
    if (clean(input.website)) return json({error:'Invalid submission'},400,origin);
    if (!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(propertyId) ||
        name.length < 2 || name.length > 120 ||
        !/^[+]?[0-9\s()-]{8,20}$/.test(phone) ||
        email.length > 254 || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) ||
        !['callback','site_visit','whatsapp','price_sheet'].includes(inquiryType) ||
        message.length > 2000 || scheduled.length > 40 ||
        (inquiryType === 'site_visit' && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(scheduled)) ||
        token.length < 10) return json({error:'Please check the inquiry details and verification.'},400,origin);
    const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '';
    if (!ip) return json({error:'Could not verify request origin'},400,origin);
    const verify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{
      method:'POST',headers:{'content-type':'application/json'},
      body:JSON.stringify({secret,response:token,remoteip:ip})
    });
    if (!verify.ok) return json({error:'Verification service unavailable'},503,origin);
    const result = await verify.json();
    if (!result.success || result.hostname !== new URL(origin).hostname) return json({error:'Verification failed. Please retry.'},403,origin);
    const db = createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
    const bucket = await hash(salt+':'+ip);
    const {data:allowed,error:limitError} = await db.rpc('consume_guest_inquiry_limit',{bucket_key:bucket,max_attempts:5});
    if (limitError) return json({error:'Inquiry rate limit unavailable'},503,origin);
    if (!allowed) return json({error:'Too many inquiries. Please try again later.'},429,origin);
    const {data:property,error:propertyError} = await db.from('properties').select('id,status').eq('id',propertyId).single();
    if (propertyError || property?.status !== 'approved') return json({error:'This property is not available for inquiries.'},404,origin);
    const {data,error} = await db.from('property_inquiries').insert({
      property_id:propertyId,user_id:null,user_name:name,user_phone:phone,user_email:email || null,
      inquiry_type:inquiryType,scheduled_date:scheduled || null,message,status:'new'
    }).select('id,created_at,status').single();
    if (error) { console.error('Guest inquiry insert failed',error.code); return json({error:'Unable to save inquiry. Please try again.'},500,origin); }
    return json({id:data.id,created_at:data.created_at,status:data.status},201,origin);
  } catch (e) { console.error('Guest inquiry error',e instanceof Error ? e.message : 'unknown'); return json({error:'Unable to submit inquiry'},500,origin); }
});
