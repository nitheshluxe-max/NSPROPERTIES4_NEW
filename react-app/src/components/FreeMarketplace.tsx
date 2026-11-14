import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

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
  const [postOpen, setPostOpen] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [photos, setPhotos] = useState<File[]>([]);
  const [brochure, setBrochure] = useState<File | null>(null);
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

  async function submitProperty(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const form = event.currentTarget;
    const fields = new FormData(form);
    // Create a limited Supabase anonymous session for guests. RLS still requires
    // the listing to belong to auth.uid() and to remain pending until admin approval.
    let { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      const anonymous = await supabase.auth.signInAnonymously();
      user = anonymous.data.user;
      authError = anonymous.error;
    }
    if (authError || !user) {
      setBusy(false);
      setMessage('Guest posting is unavailable. Ask the site administrator to enable Anonymous Sign-Ins in Supabase Authentication. ' + (authError?.message || ''));
      return;
    }
    const contact = String(fields.get('contact_phone') || '').trim();
    const publish = fields.get('publish_contact') === 'on';
    if (publish && !contact) { setBusy(false); setMessage('Enter a phone number if you want it published.'); return; }
    if (photos.length > 6 || photos.some(f => !['image/jpeg','image/png','image/webp'].includes(f.type) || f.size > 5 * 1024 * 1024)) { setBusy(false); setMessage('Choose up to 6 JPG, PNG or WebP photos (5 MB each).'); return; }
    if (brochure && (brochure.type !== 'application/pdf' || brochure.size > 10 * 1024 * 1024)) { setBusy(false); setMessage('Brochure must be a PDF under 10 MB.'); return; }
    const { data: inserted, error } = await supabase.from('properties').insert({
      user_id: user.id, title: String(fields.get('title') || '').trim(),
      city: String(fields.get('city') || '').trim(), locality: String(fields.get('locality') || '').trim(),
      purpose: fields.get('purpose'), property_type: fields.get('property_type'),
      price: Number(fields.get('price')), area_sqft: fields.get('area_sqft') ? Number(fields.get('area_sqft')) : null,
      description: String(fields.get('description') || '').trim(),
      contact_phone: contact || null, publish_contact: publish, status: 'pending'
    }).select('id').single();
    if (error || !inserted) { setBusy(false); setMessage('Submission failed: ' + (error?.message || 'Unknown error')); return; }
    try {
      for (const [index, file] of photos.entries()) {
        const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
        const path = `${user.id}/${inserted.id}/${crypto.randomUUID()}.${ext}`;
        const upload = await supabase.storage.from('property-photos').upload(path, file, { contentType: file.type, upsert: false });
        if (upload.error) throw upload.error;
        const linked = await supabase.from('property_photos').insert({ property_id: inserted.id, storage_path: path, sort_order: index });
        if (linked.error) throw linked.error;
      }
      if (brochure) {
        const path = `${user.id}/${inserted.id}/${crypto.randomUUID()}.pdf`;
        const upload = await supabase.storage.from('property-brochures').upload(path, brochure, { contentType: 'application/pdf', upsert: false });
        if (upload.error) throw upload.error;
        const linked = await supabase.from('property_brochures').insert({ property_id: inserted.id, storage_path: path, file_name: brochure.name });
        if (linked.error) throw linked.error;
      }
      setMessage('Property and media submitted for admin review. They will appear publicly after approval.');
      setPhotos([]); setBrochure(null); form.reset(); setPostOpen(false); setRefresh(v => v + 1);
    } catch (uploadError) {
      setMessage('Property saved as pending, but media upload failed: ' + (uploadError instanceof Error ? uploadError.message : 'Unknown error') + '. Contact the administrator before approval.');
    } finally { setBusy(false); }
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
        <p className="text-sm text-slate-600 mb-4">No email login required. Your listing will be reviewed by an administrator before it appears publicly. Contact details are public only with your consent.</p>
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
          <label className="sm:col-span-2 text-sm font-medium">Property images (up to 6, JPG/PNG/WebP, max 5 MB each)
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple className={inputClass + ' mt-1'} onChange={e => setPhotos(Array.from(e.target.files || []))}/>
          </label>
          <label className="sm:col-span-2 text-sm font-medium">Property brochure (optional PDF, max 10 MB)
            <input type="file" accept="application/pdf,.pdf" className={inputClass + ' mt-1'} onChange={e => setBrochure(e.target.files?.[0] || null)}/>
          </label>
          <label className="sm:col-span-2 flex gap-2 items-center text-sm"><input name="publish_contact" type="checkbox"/> I consent to publicly displaying my contact phone number</label>
          <button disabled={busy} className="sm:col-span-2 bg-blue-700 text-white rounded-lg px-5 py-3 font-bold">Submit for review — FREE</button>
        </form>
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
