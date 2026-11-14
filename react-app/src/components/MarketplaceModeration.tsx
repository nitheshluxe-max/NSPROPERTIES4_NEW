import React, { useCallback, useEffect, useState } from 'react';
import { listAdminProperties, reviewProperty } from '../lib/propertyRepository';
import { supabase } from '../lib/supabase';

type ReviewStatus = 'pending' | 'approved' | 'rejected';
type ReviewItem = {
  id: string; title: string; city: string; locality: string;
  price: number; status: ReviewStatus; created_at: string; contact_phone: string | null;
};

const money = (price: number) => new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', maximumFractionDigits: 0
}).format(price);

export function MarketplaceModeration() {
  const [properties, setProperties] = useState<ReviewItem[]>([]);
  const [filter, setFilter] = useState<'all' | ReviewStatus>('pending');
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [media, setMedia] = useState<Record<string, { photos: string[]; brochurePath?: string; documents: { path: string; name: string; type: string }[] }>>({});
  async function viewBrochure(path: string) {
    const { data, error } = await supabase.storage.from('property-brochures').createSignedUrl(path, 60);
    if (error || !data?.signedUrl) { setError(error?.message || 'Unable to open brochure.'); return; }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  }

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listAdminProperties();
      const entries = (data ?? []) as ReviewItem[];
      setProperties(entries);
      if (entries.length) {
        const ids = entries.map(item => item.id);
        const [photos, brochures, documents] = await Promise.all([
          supabase.from('property_photos').select('property_id,storage_path,sort_order').in('property_id', ids).order('sort_order'),
          supabase.from('property_brochures').select('property_id,storage_path').in('property_id', ids),
          supabase.from('property_documents').select('property_id,storage_path,file_name,document_type').in('property_id', ids)
        ]);
        if (photos.error || brochures.error || documents.error) throw photos.error || brochures.error || documents.error;
        const next: Record<string, { photos: string[]; brochurePath?: string; documents: { path: string; name: string; type: string }[] }> = {};
        entries.forEach(item => {
          next[item.id] = {
            photos: (photos.data || []).filter(p => p.property_id === item.id).map(p => supabase.storage.from('property-photos').getPublicUrl(p.storage_path).data.publicUrl),
            brochurePath: brochures.data?.find(b => b.property_id === item.id)?.storage_path,
            documents: (documents.data || []).filter(d => d.property_id === item.id).map(d => ({path:d.storage_path,name:d.file_name,type:d.document_type}))
          };
        });
        setMedia(next);
      } else setMedia({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load marketplace submissions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  async function changeStatus(item: ReviewItem, status: ReviewStatus) {
    if (workingId) return;
    if (!window.confirm(`Mark "${item.title}" as ${status}?`)) return;
    setWorkingId(item.id);
    setError('');
    setNotice('');
    try {
      await reviewProperty(item.id, status);
      setNotice(`"${item.title}" marked as ${status}.`);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update property status.');
    } finally {
      setWorkingId(null);
    }
  }

  const shown = properties.filter(p => filter === 'all' || p.status === filter);
  const pendingCount = properties.filter(p => p.status === 'pending').length;

  return (
    <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 sm:p-6 space-y-4" aria-label="Supabase marketplace moderation">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Free Marketplace — Property Approvals</h2>
          <p className="text-sm text-slate-600">Supabase submissions · {pendingCount} awaiting review</p>
        </div>
        <button type="button" onClick={() => void refresh()} disabled={loading || !!workingId}
          className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm disabled:opacity-50">
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter property status">
        {(['pending', 'approved', 'rejected', 'all'] as const).map(status => (
          <button key={status} type="button" onClick={() => setFilter(status)}
            aria-pressed={filter === status}
            className={`px-3 py-2 text-sm rounded-lg border capitalize ${filter === status ? 'bg-blue-700 text-white border-blue-700' : 'bg-white text-slate-800 border-slate-300'}`}>
            {status}
          </button>
        ))}
      </div>
      {error && <p role="alert" className="rounded-lg bg-red-50 text-red-800 border border-red-200 p-3 text-sm">{error}</p>}
      {notice && <p role="status" className="rounded-lg bg-green-50 text-green-800 border border-green-200 p-3 text-sm">{notice}</p>}
      {!loading && !error && shown.length === 0 && <p className="text-sm text-slate-600">No {filter === 'all' ? '' : filter} marketplace properties found.</p>}
      <div className="space-y-3">
        {shown.map(item => (
          <article key={item.id} className="border border-slate-200 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="min-w-0 space-y-1">
              <div className="font-semibold text-slate-900 break-words">{item.title}</div>
              <div className="text-sm text-slate-600">{item.locality}, {item.city} · {money(item.price)}</div>
              <div className="text-xs text-slate-500">Submitted {new Date(item.created_at).toLocaleDateString('en-IN')} · {item.status}</div>
              {item.contact_phone && <div className="text-xs text-slate-600">Seller contact (admin only): {item.contact_phone}</div>}
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              {media[item.id]?.photos.map(url => <img key={url} src={url} alt={item.title + ' photo'} loading="lazy" className="h-16 w-20 object-cover rounded-lg" />)}
              {media[item.id]?.documents.map(doc => <button key={doc.path} type="button" className="px-3 py-2 rounded-lg border border-blue-300 text-blue-800 text-sm" onClick={() => void viewBrochure(doc.path)}>View {doc.type === 'floor-plan' ? 'floor plan' : 'brochure'} (PDF)</button>)}
              {media[item.id]?.brochurePath && <button type="button" className="px-3 py-2 rounded-lg border border-blue-300 text-blue-800 text-sm" onClick={() => void viewBrochure(media[item.id].brochurePath!)}>View brochure</button>}
              {item.status !== 'approved' && <button type="button" disabled={!!workingId}
                onClick={() => void changeStatus(item, 'approved')}
                className="px-3 py-2 rounded-lg bg-emerald-700 text-white text-sm disabled:opacity-50">Approve</button>}
              {item.status !== 'rejected' && <button type="button" disabled={!!workingId}
                onClick={() => void changeStatus(item, 'rejected')}
                className="px-3 py-2 rounded-lg bg-red-700 text-white text-sm disabled:opacity-50">Reject</button>}
              {item.status !== 'pending' && <button type="button" disabled={!!workingId}
                onClick={() => void changeStatus(item, 'pending')}
                className="px-3 py-2 rounded-lg border border-slate-300 text-slate-800 text-sm disabled:opacity-50">Return to pending</button>}
            </div>
          </article>
        ))}
      </div>
      <p className="text-xs text-slate-500">This panel manages Supabase marketplace submissions. Other dashboard property tools still use their existing data source.</p>
    </section>
  );
}
