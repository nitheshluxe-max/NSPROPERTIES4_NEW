import React, { useState } from 'react';
import { Property, ListingStatus, PropertyCategory, ListingPurpose, FurnishingStatus, PossessionStatus } from '../types/property';
import { X, Save, AlertCircle, Loader2, Building2, CheckCircle2 } from 'lucide-react';
import { GoogleLocationPicker } from './GoogleLocationPicker';

interface EditPropertyModalProps {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: Property) => Promise<void>;
}

export const EditPropertyModal: React.FC<EditPropertyModalProps> = ({
  property,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen || !property) return null;

  const [form, setForm] = useState<Property>({ ...property });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatPriceDisplay = (amt: number, purpose: ListingPurpose) => {
    if (purpose === 'rent') {
      if (amt >= 100000) return `₹ ${(amt / 100000).toFixed(2)} Lakh/mo`;
      return `₹ ${amt.toLocaleString('en-IN')}/mo`;
    }
    if (amt >= 10000000) {
      return `₹ ${(amt / 10000000).toFixed(2)} Cr`;
    }
    return `₹ ${(amt / 100000).toFixed(2)} L`;
  };

  const handlePriceChange = (val: number) => {
    setForm(prev => ({
      ...prev,
      price: val,
      priceDisplay: formatPriceDisplay(val, prev.listingType),
      pricePerSqFt: Math.round(val / (prev.superBuiltUpArea || 1000)),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Title cannot be empty');
      return;
    }
    if (!form.price || form.price <= 0) {
      setError('Price must be greater than zero');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update property in database');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative bg-white w-full max-w-2xl max-h-[92vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 z-10">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <Building2 className="w-5 h-5 text-blue-400" />
            <div>
              <h2 className="text-base font-bold">Edit Property Listing</h2>
              <p className="text-[11px] text-slate-400 font-mono">ID: {form.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} noValidate className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Status & Purpose */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Moderation Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value as ListingStatus }))}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold"
              >
                <option value="approved">Approved (Live on Portal)</option>
                <option value="pending">Pending Review</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Listing Type</label>
              <select
                value={form.listingType}
                onChange={(e) => {
                  const val = e.target.value as ListingPurpose;
                  setForm(prev => ({
                    ...prev,
                    listingType: val,
                    priceDisplay: formatPriceDisplay(prev.price, val),
                  }));
                }}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
              >
                <option value="sale">For Sale / Purchase</option>
                <option value="rent">For Rent / Lease</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Property Category</label>
              <select
                value={form.propertyType}
                onChange={(e) => setForm(prev => ({ ...prev, propertyType: e.target.value as PropertyCategory }))}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg capitalize"
              >
                <option value="apartment">Apartment</option>
                <option value="villa">Villa</option>
                <option value="land">Land / Plot</option>
                <option value="commercial">Commercial</option>
              </select>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Listing Title *</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          {/* Price & Area */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Price in INR (₹) *</label>
              <input
                type="text"
                inputMode="numeric"
                required
                value={form.price ? form.price.toString() : ''}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, '');
                  handlePriceChange(cleaned === '' ? 0 : Number(cleaned));
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Price Display Tag</label>
              <input
                type="text"
                value={form.priceDisplay}
                onChange={(e) => setForm(prev => ({ ...prev, priceDisplay: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-blue-700"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Super Area (sq.ft) *</label>
              <input
                type="number"
                required
                value={form.superBuiltUpArea}
                onChange={(e) => setForm(prev => ({ ...prev, superBuiltUpArea: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
              />
            </div>
          </div>

          {/* Location details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Metro City *</label>
              <select
                value={form.city}
                onChange={(e) => setForm(prev => ({ ...prev, city: e.target.value as any }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value="Mumbai">Mumbai MMR</option>
                <option value="Delhi-NCR">Delhi-NCR</option>
                <option value="Bengaluru">Bengaluru</option>
                <option value="Pune">Pune</option>
                <option value="Hyderabad">Hyderabad</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Locality *</label>
              <input
                type="text"
                required
                value={form.locality}
                onChange={(e) => setForm(prev => ({ ...prev, locality: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Address / Society Name</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm(prev => ({ ...prev, address: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>

          {/* Interactive Google Maps Location Picker */}
          <GoogleLocationPicker
            city={form.city}
            locality={form.locality}
            address={form.address}
            coords={form.coordinates || { lat: 12.9716, lng: 77.5946 }}
            onCoordsChange={(newCoords) => setForm(prev => ({ ...prev, coordinates: newCoords }))}
          />

          {/* Bedrooms & Bathrooms */}
          {form.propertyType !== 'land' && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Bedrooms (BHK)</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={form.bedrooms || ''}
                  onChange={(e) => setForm(prev => ({ ...prev, bedrooms: Number(e.target.value) || undefined }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Bathrooms</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={form.bathrooms || ''}
                  onChange={(e) => setForm(prev => ({ ...prev, bathrooms: Number(e.target.value) || undefined }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Balconies</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={form.balconies || ''}
                  onChange={(e) => setForm(prev => ({ ...prev, balconies: Number(e.target.value) || undefined }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>

          {/* Seller Contact Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Seller Name *</label>
              <input
                type="text"
                required
                value={form.seller.name}
                onChange={(e) => setForm(prev => ({
                  ...prev,
                  seller: { ...prev.seller, name: e.target.value }
                }))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Seller Phone *</label>
              <input
                type="text"
                required
                value={form.seller.phone}
                onChange={(e) => setForm(prev => ({
                  ...prev,
                  seller: { ...prev.seller, phone: e.target.value }
                }))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          {/* Checkboxes */}
          <div className="flex items-center gap-6 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm(prev => ({ ...prev, featured: e.target.checked }))}
                className="w-4 h-4 text-blue-600 rounded-sm"
              />
              <span className="font-semibold text-slate-700">Featured Listing</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.verified}
                onChange={(e) => setForm(prev => ({ ...prev, verified: e.target.checked }))}
                className="w-4 h-4 text-emerald-600 rounded-sm"
              />
              <span className="font-semibold text-slate-700">Verified Listing</span>
            </label>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 cursor-pointer font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-60 shadow-xs"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving to Database...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
