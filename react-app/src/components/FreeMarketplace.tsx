import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type Listing = {
  id: string; title: string; city: string; locality: string; price: number;
  area_sqft: number | null; property_type: string; purpose: string;
  description: string | null; publish_contact: boolean; contact_phone: string | null;
  created_at: string;
};
const money = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export function FreeMarketplace() {
  const [items, setItems] = useState<Listing[]>([]);
  const [query, setQuery] = useState('');
  const [purpose, setPurpose] = useState('');
  const [type, setType] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [postOpen, setPostOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    setBusy(true);
    const load = async () => {
      let request = supabase.from('public_properties')
        .select('id,title,city,locality,price,area_sqft,property_type,purpose,description,publish_contact,contact_phone,created_at')
        .eq('status', 'approved').order('created_at', { ascending: false }).limit(100);
      if (purpose) request = request.eq('purpose', purpose);
      if (type) request = request.eq('property_type', type);
      const { data, error } = await request;
      if (!active) return;
      setBusy(false);
      if (error) { setMessage('Marketplace listings unavailable: ' + error.message); setItems([]); }
      else { setMessage(''); setItems((data || []) as Listing[]); }
    };
    void load();
    return () => { active = false; };
  }, [purpose, type, refresh]);
  const visible = items.filter(p => [p.title, p.city, p.locality].some(s => s.toLowerCase().includes(query.toLowerCase().trim())));

  async function sendLoginLink(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin + window.location.pathname + '#free-marketplace' }
    });
    setBusy(false);
    setMessage(error ? error.message : 'Check your email for the sign-in link, then return to post your property.');
  }
  async function submitProperty(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const form = event.currentTarget;
    const fields = new FormData(form);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      setBusy(false);
      setMessage('Please sign in with your email before posting.');
      return;
    }
    const contact = String(fields.get('contact_phone') || '').trim();
    const publish = fields.get('publish_contact') === 'on';
    if (publish && !contact) { setBusy(false); setMessage('Enter a phone number if you want it published.'); return; }
    const { error } = await supabase.from('properties').insert({
      user_id: user.id, title: String(fields.get('title') || '').trim(),
      city: String(fields.get('city') || '').trim(), locality: String(fields.get('locality') || '').trim(),
      purpose: fields.get('purpose'), property_type: fields.get('property_type'),
      price: Number(fields.get('price')), area_sqft: fields.get('area_sqft') ? Number(fields.get('area_sqft')) : null,
      description: String(fields.get('description') || '').trim(),
      contact_phone: contact || null, publish_contact: publish, status: 'pending'
    });
    setBusy(false);
    if (error) setMessage('Submission failed: ' + error.message);
    else { setMessage('Property submitted for review. Posting is free.'); form.reset(); setPostOpen(false); setRefresh(v => v + 1); }
  }
  const inputClass = 'w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm bg-white text-slate-900';
  return <main className="min-h-screen bg-slate-50">
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-wrap justify-between gap-4 items-center mb-6">
        <a href="#home" className="text-blue-700 font-semibold">← Back to NS Properties 4</a>
        <button onClick={() => setPostOpen(v => !v)} className="rounded-xl bg-blue-700 px-5 py-3 text-white font-bold">Post a Property — FREE</button>
      </div>
      <section className="rounded-2xl bg-slate-900 text-white p-7 md:p-12 mb-8">
        <p className="text-emerald-300 text-sm font-bold mb-2">100% FREE PROPERTY MARKETPLACE</p>
        <h1 className="text-3xl md:text-5xl font-black">Find, list and connect. No paywalls.</h1>
        <p className="mt-3 text-slate-200 max-w-2xl">Browse homes and commercial properties, publish your listing for free, and contact sellers who choose to share their details.</p>
        <div className="grid sm:grid-cols-3 gap-3 mt-7">
          <input aria-label="Search by location or title" value={query} onChange={e => setQuery(e.target.value)} placeholder="City, locality or keyword" className={inputClass}/>
          <select aria-label="Listing purpose" value={purpose} onChange={e => setPurpose(e.target.value)} className={inputClass}><option value="">Buy, rent or lease</option><option value="sale">Buy</option><option value="rent">Rent</option><option value="lease">Lease</option></select>
          <select aria-label="Property type" value={type} onChange={e => setType(e.target.value)} className={inputClass}><option value="">All types</option><option value="apartment">Apartment</option><option value="house">House</option><option value="plot">Plot</option><option value="commercial">Commercial</option><option value="pg">PG</option></select>
        </div>
      </section>
      {message && <p role="status" className="rounded-lg bg-amber-50 border border-amber-200 p-3 mb-5 text-sm">{message}</p>}
      {postOpen && <section className="rounded-2xl bg-white border border-slate-200 p-6 mb-8">
        <h2 className="text-2xl font-bold mb-2">List your property free</h2>
        <p className="text-sm text-slate-600 mb-4">Email sign-in is required to prevent spam. Contact details are public only with your consent.</p>
        <form onSubmit={sendLoginLink} className="flex flex-wrap gap-2 mb-5"><input type="email" required aria-label="Your email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email for sign-in link" className={inputClass + ' sm:max-w-sm'}/><button disabled={busy} className="bg-slate-800 text-white rounded-lg px-4 py-2">Send sign-in link</button></form>
        <form onSubmit={submitProperty} className="grid sm:grid-cols-2 gap-3">
          <input name="title" required minLength={5} maxLength={120} placeholder="Property title" className={inputClass + ' sm:col-span-2'}/>
          <input name="city" required placeholder="City" className={inputClass}/>
          <input name="locality" required placeholder="Locality" className={inputClass}/>
          <select name="purpose" className={inputClass}><option value="sale">For sale</option><option value="rent">For rent</option><option value="lease">For lease</option></select>
          <select name="property_type" className={inputClass}><option value="apartment">Apartment</option><option value="house">House</option><option value="plot">Plot</option><option value="commercial">Commercial</option><option value="pg">PG</option></select>
          <input name="price" required type="number" min="1" step="1" placeholder="Price in ₹" className={inputClass}/>
          <input name="area_sqft" type="number" min="1" placeholder="Area in sq ft" className={inputClass}/>
          <input name="contact_phone" type="tel" pattern="[0-9+() -]{7,20}" placeholder="Contact phone (optional)" className={inputClass + ' sm:col-span-2'}/>
          <textarea name="description" maxLength={3000} placeholder="Property description" className={inputClass + ' sm:col-span-2'} rows={3}/>
          <label className="sm:col-span-2 flex gap-2 items-center text-sm"><input name="publish_contact" type="checkbox"/> I consent to publicly displaying my contact phone number</label>
          <button disabled={busy} className="sm:col-span-2 bg-blue-700 text-white rounded-lg px-5 py-3 font-bold">Submit for review — FREE</button>
        </form>
      </section>}
      <h2 className="text-2xl font-bold mb-4">Available properties {busy ? '· Loading…' : '(' + visible.length + ')'}</h2>
      {!busy && visible.length === 0 && <p className="text-slate-600">No approved properties match your search.</p>}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {visible.map(p => <article key={p.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 className="font-bold text-lg">{p.title}</h3><p className="text-blue-700 text-xl font-black my-2">{money(p.price)}</p>
          <p className="text-sm text-slate-600">{p.locality}, {p.city}</p>
          <p className="text-sm text-slate-600 capitalize mt-1">{p.property_type} · {p.purpose} {p.area_sqft ? '· ' + p.area_sqft + ' sq ft' : ''}</p>
          {p.description && <p className="text-sm mt-3 whitespace-pre-line">{p.description}</p>}
          {p.publish_contact && p.contact_phone ? <a className="inline-flex mt-4 rounded-lg bg-blue-700 text-white font-bold px-4 py-2" href={'tel:' + p.contact_phone.replace(/[^+0-9]/g, '')}>Call seller — FREE</a> : <p className="text-sm text-slate-500 mt-4">Seller has not shared a public phone number.</p>}
        </article>)}
      </div>
    </div>
  </main>;
}
