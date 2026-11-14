import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ReferencePostPropertyForm } from './ReferencePostPropertyForm';

type Listing = {
  id: string; title: string; city: string; locality: string; price: number;
  area_sqft: number | null; property_type: string; purpose: string;
  description: string | null; publish_contact: boolean; contact_phone: string | null;
  created_at: string;
  photoUrls?: string[];
  brochurePath?: string;
  brochureName?: string;
};
const money = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export function FreeMarketplace() {
  const [items, setItems] = useState<Listing[]>([]);
  const [query, setQuery] = useState('');
  const [purpose, setPurpose] = useState('');
  const [type, setType] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [postOpen, setPostOpen] = useState(() => window.location.hash === '#post-property');
  useEffect(() => {
    const sync = () => setPostOpen(window.location.hash === '#post-property');
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);
  const [account, setAccount] = useState<{ id: string; email?: string } | null>(null);
  const [authMode, setAuthMode] = useState<'signup' | 'signin'>('signup');
  const [authBusy, setAuthBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  useEffect(() => {
    let active = true;
    const update = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (active) setAccount(user && !user.is_anonymous && user.email ? { id: user.id, email: user.email } : null);
    };
    void update();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => { void update(); });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);
  async function submitAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (authBusy) return;
    const fields = new FormData(event.currentTarget);
    const email = String(fields.get('email') || '').trim().toLowerCase();
    const password = String(fields.get('password') || '');
    setAuthBusy(true); setAuthMessage('');
    try {
      if (authMode === 'signup') {
        const phone = String(fields.get('phone') || '').trim();
        if (!/^(?:[0-9]{10}|[+]91[0-9]{10})$/.test(phone)) throw new Error('Enter a 10-digit Indian mobile number, optionally prefixed with +91.');
        if (password.length < 8) throw new Error('Password must be at least 8 characters.');
        const { data, error } = await supabase.auth.signUp({
          email, password, options: { data: { contact_phone: phone },
            emailRedirectTo: window.location.origin + window.location.pathname + '#post-property' }
        });
        if (error) throw error;
        if (!data.session) setAuthMessage('Account created. Confirm your email using the link sent to your inbox, then sign in to post.');
        else setAuthMessage('Account created. You can now post a property.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setAuthMessage('Signed in. You can now post a property.');
      }
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : 'Authentication failed.');
    } finally { setAuthBusy(false); }
  }
  async function signOutMarketplace() {
    const { error } = await supabase.auth.signOut();
    if (error) setAuthMessage(error.message);
    else { setAccount(null); setAuthMessage('Signed out.'); }
  }
  const [refresh, setRefresh] = useState(0);
  const [brochureError, setBrochureError] = useState('');
  async function openBrochure(path: string) {
    setBrochureError('');
    const { data, error } = await supabase.storage.from('property-brochures').createSignedUrl(path, 60);
    if (error || !data?.signedUrl) { setBrochureError('Unable to open brochure: ' + (error?.message || 'Not available')); return; }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  }
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
      else {
        const listings = (data || []) as Listing[];
        if (!listings.length) { setMessage(''); setItems([]); return; }
        const ids = listings.map(p => p.id);
        const [photoResult, brochureResult] = await Promise.all([
          supabase.from('property_photos').select('property_id,storage_path,sort_order').in('property_id', ids).order('sort_order'),
          supabase.from('property_brochures').select('property_id,storage_path,file_name').in('property_id', ids)
        ]);
        if (!active) return;
        if (photoResult.error || brochureResult.error) {
          setMessage('Property media unavailable: ' + (photoResult.error?.message || brochureResult.error?.message));
        } else setMessage('');
        setItems(listings.map(p => {
          const brochure = brochureResult.data?.find(b => b.property_id === p.id);
          return { ...p,
            photoUrls: (photoResult.data || []).filter(photo => photo.property_id === p.id).map(photo =>
              supabase.storage.from('property-photos').getPublicUrl(photo.storage_path).data.publicUrl),
            brochurePath: brochure?.storage_path, brochureName: brochure?.file_name
          };
        }));
      }
    };
    void load();
    return () => { active = false; };
  }, [purpose, type, refresh]);
  const visible = items.filter(p => [p.title, p.city, p.locality].some(s => s.toLowerCase().includes(query.toLowerCase().trim())));

  const inputClass = 'w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm bg-white text-slate-900';
  return <main className="min-h-screen bg-slate-50">
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-wrap justify-between gap-4 items-center mb-6">
        <a href="#home" className="text-blue-700 font-semibold">← Back to NS Properties 4</a>

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
        <p className="text-sm text-slate-600 mb-4">Sign up or sign in before posting. Your listing will appear publicly only after admin approval.</p>
        {!account ? <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 mb-5">
          <div className="flex gap-2 mb-4">
            <button type="button" onClick={() => { setAuthMode('signup'); setAuthMessage(''); }} className={authMode === 'signup' ? 'bg-blue-700 text-white px-4 py-2 rounded-lg' : 'bg-white border px-4 py-2 rounded-lg'}>Create account</button>
            <button type="button" onClick={() => { setAuthMode('signin'); setAuthMessage(''); }} className={authMode === 'signin' ? 'bg-blue-700 text-white px-4 py-2 rounded-lg' : 'bg-white border px-4 py-2 rounded-lg'}>Sign in</button>
          </div>
          <form onSubmit={submitAccount} className="grid sm:grid-cols-2 gap-3">
            <label className="text-sm">Email address<input required name="email" type="email" autoComplete="email" className={inputClass + ' mt-1'}/></label>
            {authMode === 'signup' && <label className="text-sm">Phone number (no SMS verification)<input required name="phone" type="tel" inputMode="tel" pattern="[0-9]{10}|[+]91[0-9]{10}" placeholder="9876543210" className={inputClass + ' mt-1'}/></label>}
            <label className="text-sm">Password<input required name="password" type="password" autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'} minLength={authMode === 'signup' ? 8 : undefined} className={inputClass + ' mt-1'}/></label>
            <button disabled={authBusy} className="sm:col-span-2 bg-blue-700 text-white rounded-lg px-5 py-3 disabled:opacity-50">{authBusy ? 'Please wait…' : authMode === 'signup' ? 'Sign up' : 'Sign in'}</button>
          </form>
          {authMessage && <p role="status" className="mt-3 text-sm text-slate-800">{authMessage}</p>}
          <p className="mt-2 text-xs text-slate-600">Phone number is stored as account profile metadata and is not SMS-verified. Email confirmation may be required depending on Supabase settings.</p>
        </div> : <div className="flex flex-wrap items-center gap-3 rounded-lg bg-emerald-50 border border-emerald-200 p-3 mb-5 text-sm">
          <span>Signed in as <strong>{account.email}</strong></span>
          <button type="button" onClick={() => void signOutMarketplace()} className="text-blue-700 underline">Sign out</button>
        </div>}
        {account && <ReferencePostPropertyForm onSubmitted={() => setRefresh(v => v + 1)} />}
      </section>}
      {brochureError && <p role="alert" className="text-red-700 mb-4">{brochureError}</p>}
      <h2 className="text-2xl font-bold mb-4">Available properties {busy ? '· Loading…' : '(' + visible.length + ')'}</h2>
      {!busy && visible.length === 0 && <p className="text-slate-600">No approved properties match your search.</p>}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {visible.map(p => <article key={p.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          {p.photoUrls?.length ? <div className="mb-4"><img src={p.photoUrls[0]} alt={p.title} loading="lazy" className="w-full h-48 object-cover rounded-lg"/>{p.photoUrls.length > 1 && <div className="flex gap-2 overflow-x-auto mt-2">{p.photoUrls.slice(1).map(url => <img key={url} src={url} alt={p.title + ' additional view'} loading="lazy" className="h-16 w-20 object-cover rounded-md" />)}</div>}</div> : null}
          <h3 className="font-bold text-lg">{p.title}</h3><p className="text-blue-700 text-xl font-black my-2">{money(p.price)}</p>
          <p className="text-sm text-slate-600">{p.locality}, {p.city}</p>
          <p className="text-sm text-slate-600 capitalize mt-1">{p.property_type} · {p.purpose} {p.area_sqft ? '· ' + p.area_sqft + ' sq ft' : ''}</p>
          {p.description && <p className="text-sm mt-3 whitespace-pre-line">{p.description}</p>}
          {p.brochurePath && <button type="button" onClick={() => void openBrochure(p.brochurePath!)} className="inline-flex mt-4 mr-2 rounded-lg bg-slate-800 text-white font-bold px-4 py-2">View brochure (PDF)</button>}
          {p.publish_contact && p.contact_phone ? <a className="inline-flex mt-4 rounded-lg bg-blue-700 text-white font-bold px-4 py-2" href={'tel:' + p.contact_phone.replace(/[^+0-9]/g, '')}>Call seller — FREE</a> : <p className="text-sm text-slate-500 mt-4">Seller has not shared a public phone number.</p>}
        </article>)}
      </div>
    </div>
  </main>;
}
