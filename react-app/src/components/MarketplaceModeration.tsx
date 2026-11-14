import React, { useCallback, useEffect, useState } from 'react';
import { listAdminProperties, reviewProperty } from '../lib/propertyRepository';

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

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listAdminProperties();
      setProperties((data ?? []) as ReviewItem[]);
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
            <div className="flex flex-wrap gap-2">
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
