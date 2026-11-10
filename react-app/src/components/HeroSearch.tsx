import React, { useState } from 'react';
import { useProperty, COMPANY_NAME, COMPANY_PHONE, COMPANY_PHONE_DISPLAY } from '../context/PropertyContext';
import { Search, MapPin, IndianRupee, Phone, ShieldCheck, CheckCircle2, UserCheck, PlusCircle, Sparkles, Building2 } from 'lucide-react';
import { PropertyCategory, ListingPurpose } from '../types/property';

export const HeroSearch: React.FC = () => {
  const { filters, setFilters, setCurrentView, setIsPostModalOpen } = useProperty();
  const [activeTab, setActiveTab] = useState<'all' | 'buy' | 'rent' | 'plots' | 'commercial' | 'zero_brokerage'>('all');
  const [localSearch, setLocalSearch] = useState(filters.searchQuery);
  const [localCity, setLocalCity] = useState(filters.city);

  const budgetOptions = [
    { label: 'Any Budget', min: 0, max: 150000000 },
    { label: 'Under ₹ 30 Lakhs', min: 0, max: 3000000 },
    { label: '₹ 30 L - ₹ 60 L', min: 3000000, max: 6000000 },
    { label: '₹ 60 L - ₹ 1 Cr', min: 6000000, max: 10000000 },
    { label: '₹ 1 Cr - ₹ 2.5 Cr', min: 10000000, max: 25000000 },
    { label: '₹ 2.5 Cr - ₹ 5 Cr', min: 25000000, max: 50000000 },
    { label: '₹ 5 Cr - ₹ 10 Cr', min: 50000000, max: 100000000 },
    { label: 'Above ₹ 10 Cr', min: 100000000, max: 150000000 },
  ];

  const handleTabChange = (tab: 'all' | 'buy' | 'rent' | 'plots' | 'commercial' | 'zero_brokerage') => {
    setActiveTab(tab);
    let purpose: ListingPurpose | 'all' = 'all';
    let type: PropertyCategory | 'all' = 'all';
    let zeroBrokerage = false;

    if (tab === 'all') {
      purpose = 'all';
      type = 'all';
    } else if (tab === 'buy') {
      purpose = 'sale';
      type = 'all';
    } else if (tab === 'rent') {
      purpose = 'rent';
      type = 'all';
    } else if (tab === 'plots') {
      purpose = 'all';
      type = 'land';
    } else if (tab === 'commercial') {
      purpose = 'all';
      type = 'commercial';
    } else if (tab === 'zero_brokerage') {
      purpose = 'all';
      type = 'all';
      zeroBrokerage = true;
    }

    setFilters(prev => ({
      ...prev,
      listingType: purpose,
      propertyType: type,
      zeroBrokerageOnly: zeroBrokerage
    }));
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setCurrentView('portal');
    setFilters(prev => ({
      ...prev,
      searchQuery: localSearch,
      city: localCity
    }));
  };

  const toggleBhk = (bhk: number) => {
    const current = filters.bedrooms;
    if (current.includes(bhk)) {
      setFilters(prev => ({ ...prev, bedrooms: current.filter(b => b !== bhk) }));
    } else {
      setFilters(prev => ({ ...prev, bedrooms: [...current, bhk] }));
    }
  };

  return (
    <div className="relative bg-gradient-to-b from-slate-950 via-slate-900 to-blue-950 text-white pt-6 sm:pt-10 pb-8 sm:pb-12 px-3 sm:px-6 lg:px-8 border-b border-slate-800">
      {/* Background architectural grid pattern */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none" 
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #60a5fa 1px, transparent 0)',
          backgroundSize: '24px 24px'
        }}
      />

      <div className="relative max-w-5xl mx-auto">
        {/* Editorial Title & Badges */}
        <div className="text-center mb-5 sm:mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 font-bold text-[11px] tracking-wide mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Open Source PropTech Portal · 0% Brokerage Direct Listings</span>
          </div>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-white mb-2 text-balance leading-tight">
            Buy, Rent, or Post Real Estate Across India
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Verified properties synchronized in real-time with Google Maps Platform. Direct connections between owners, builders, and buyers.
          </p>
        </div>

        {/* PropTech Search Console Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-6 text-slate-800 border border-slate-100">
          {/* Segmented Mode Tabs (99acres + NoBroker style) */}
          <div className="flex items-center gap-1.5 pb-3 mb-4 border-b border-slate-100 overflow-x-auto no-scrollbar scroll-smooth">
            {[
              { id: 'all', label: 'All Listings' },
              { id: 'buy', label: 'Buy Properties' },
              { id: 'rent', label: 'Rent Homes' },
              { id: 'zero_brokerage', label: '✨ Zero Brokerage (Owners)' },
              { id: 'commercial', label: 'Commercial' },
              { id: 'plots', label: 'Plots / Land' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as any)}
                className={`px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Main Search Input Strip */}
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-2.5 sm:gap-3 items-center">
            {/* City Selector */}
            <div className="sm:col-span-1 md:col-span-3 relative">
              <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Metro Hub
              </label>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus-within:border-blue-600 focus-within:bg-white transition-all min-h-[44px]">
                <MapPin className="w-4 h-4 text-blue-600 mr-2 shrink-0" />
                <select
                  value={localCity}
                  onChange={(e) => setLocalCity(e.target.value)}
                  aria-label="Select City"
                  className="w-full bg-transparent border-none outline-hidden text-xs sm:text-sm font-bold text-slate-900 cursor-pointer"
                >
                  <option value="all">All Metros (Pan India)</option>
                  <option value="Bengaluru">Bengaluru</option>
                  <option value="Mumbai">Mumbai MMR</option>
                  <option value="Delhi-NCR">Delhi-NCR</option>
                  <option value="Pune">Pune</option>
                  <option value="Hyderabad">Hyderabad</option>
                </select>
              </div>
            </div>

            {/* Locality Input */}
            <div className="sm:col-span-1 md:col-span-4 relative">
              <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Locality / Project / PIN Code
              </label>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus-within:border-blue-600 focus-within:bg-white transition-all min-h-[44px]">
                <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                <input
                  type="text"
                  placeholder="e.g. Whitefield, Indiranagar, Worli, 560066..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="w-full bg-transparent border-none outline-hidden text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 font-medium"
                />
              </div>
            </div>

            {/* Budget Selector */}
            <div className="sm:col-span-1 md:col-span-3 relative">
              <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Budget Range
              </label>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus-within:border-blue-600 focus-within:bg-white transition-all min-h-[44px]">
                <IndianRupee className="w-4 h-4 text-blue-600 mr-2 shrink-0" />
                <select
                  onChange={(e) => {
                    const idx = Number(e.target.value);
                    const sel = budgetOptions[idx];
                    setFilters(prev => ({ ...prev, minPrice: sel.min, maxPrice: sel.max }));
                  }}
                  aria-label="Select Budget Range"
                  className="w-full bg-transparent border-none outline-hidden text-xs sm:text-sm font-bold text-slate-900 cursor-pointer"
                >
                  {budgetOptions.map((opt, i) => (
                    <option key={opt.label} value={i}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Search Submit Button */}
            <div className="sm:col-span-1 md:col-span-2 pt-1 sm:pt-0 md:pt-5">
              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
              >
                <Search className="w-4 h-4" />
                <span>Search</span>
              </button>
            </div>
          </form>

          {/* Quick BHK & Filter Row */}
          <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-slate-500 mr-1 text-[11px]">BHK:</span>
              {[1, 2, 3, 4, 5].map((bhk) => {
                const isSelected = filters.bedrooms.includes(bhk);
                return (
                  <button
                    key={bhk}
                    type="button"
                    onClick={() => toggleBhk(bhk)}
                    className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer border ${
                      isSelected
                        ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {bhk === 5 ? '5+ BHK' : `${bhk} BHK`}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3 text-slate-600 text-xs flex-wrap">
              {/* Zero Brokerage filter toggle */}
              <button
                type="button"
                onClick={() => setFilters(prev => ({ ...prev, zeroBrokerageOnly: !prev.zeroBrokerageOnly }))}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md cursor-pointer font-bold transition-all border ${
                  filters.zeroBrokerageOnly
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Zero Brokerage (Owners)</span>
              </button>

              <button
                type="button"
                onClick={() => setFilters(prev => ({ ...prev, verifiedOnly: !prev.verifiedOnly }))}
                className={`flex items-center gap-1 cursor-pointer font-bold ${
                  filters.verifiedOnly ? 'text-blue-700' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Verified</span>
              </button>

              <button
                type="button"
                onClick={() => setFilters(prev => ({ ...prev, reraOnly: !prev.reraOnly }))}
                className={`flex items-center gap-1 cursor-pointer font-bold ${
                  filters.reraOnly ? 'text-blue-700' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                <span>RERA</span>
              </button>
            </div>
          </div>

          {/* Quick Locality chips with average price indications */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-1.5 flex-wrap text-xs text-slate-500">
            <span className="font-bold text-slate-400 text-[11px]">Popular Hotspots:</span>
            {[
              { label: 'Whitefield', city: 'Bengaluru', rate: '₹8.2k/sqft' },
              { label: 'Indiranagar', city: 'Bengaluru', rate: '₹12.5k/sqft' },
              { label: 'Worli', city: 'Mumbai', rate: '₹42k/sqft' },
              { label: 'Golf Course Rd', city: 'Delhi-NCR', rate: '₹18k/sqft' },
              { label: 'HSR Layout', city: 'Bengaluru', rate: '₹9.4k/sqft' },
              { label: 'Hitec City', city: 'Hyderabad', rate: '₹9.8k/sqft' },
              { label: 'Baner', city: 'Pune', rate: '₹8.6k/sqft' },
            ].map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => {
                  setLocalSearch(chip.label);
                  setLocalCity(chip.city);
                  setFilters(prev => ({
                    ...prev,
                    searchQuery: chip.label,
                    city: chip.city
                  }));
                  setCurrentView('portal');
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 text-slate-700 font-semibold text-[11px] transition-colors cursor-pointer border border-slate-200 flex items-center gap-1"
              >
                <span>📍 {chip.label}</span>
                <span className="text-[10px] text-slate-400 font-mono">({chip.rate})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Free Posting Banner for Property Owners & Builders */}
        <div className="mt-4 p-3 rounded-xl bg-blue-500/10 border border-blue-400/20 backdrop-blur-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-blue-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong className="text-white">Are you an Owner or Builder?</strong> List your property for FREE with zero brokerage and live Google Maps location.
            </span>
          </div>
          <button
            onClick={() => setIsPostModalOpen(true)}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition-colors shrink-0 cursor-pointer flex items-center gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Post Property FREE</span>
          </button>
        </div>
      </div>
    </div>
  );
};
