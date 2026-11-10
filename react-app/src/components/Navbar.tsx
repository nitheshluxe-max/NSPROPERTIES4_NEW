import React, { useState } from 'react';
import { useProperty, COMPANY_NAME, COMPANY_PHONE, COMPANY_PHONE_DISPLAY, COMPANY_LOGO } from '../context/PropertyContext';
import { Heart, Scale, PlusCircle, MapPin, ChevronDown, Phone, Menu, X, Sparkles, Building2, UserCheck, TrendingUp, ShieldCheck } from 'lucide-react';
import { PropertyCategory, ListingPurpose } from '../types/property';

export const Navbar: React.FC<{ onOpenCompare: () => void }> = ({ onOpenCompare }) => {
  const {
    setIsPostModalOpen,
    favorites,
    comparisonList,
    filters,
    setFilters
  } = useProperty();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const cities = ['All Cities', 'Bengaluru', 'Mumbai', 'Delhi-NCR', 'Pune', 'Hyderabad'];

  const handleNavType = (purpose: ListingPurpose | 'all', type?: PropertyCategory | 'all', zeroBrokerage?: boolean) => {
    setFilters(prev => ({
      ...prev,
      listingType: purpose,
      propertyType: type || 'all',
      zeroBrokerageOnly: !!zeroBrokerage
    }));
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-2xs">
      {/* Top micro-banner inspired by NoBroker zero-commission commitment */}
      <div className="bg-slate-900 text-white text-[11px] font-medium py-1 px-4 sm:px-6 hidden md:flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Open Source PropTech</span>
          </span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-300">Direct Owner Listings with 0% Brokerage & Developer Resale</span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-300">Verified by Google Maps Platform</span>
        </div>
        <div className="flex items-center gap-4 text-slate-300">
          <span className="text-slate-400">Customer Helpline:</span>
          <a href={`tel:${COMPANY_PHONE}`} className="text-white font-mono font-bold hover:text-blue-400 transition-colors">
            {COMPANY_PHONE_DISPLAY}
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3 md:gap-6 h-16 sm:h-18">
          {/* Zone 1: Brand Wordmark & City Selector */}
          <div className="flex items-center gap-3 sm:gap-5 shrink-0">
            <button
              onClick={() => {
                setFilters({ propertyType: 'all', listingType: 'all', city: 'all', searchQuery: '', zeroBrokerageOnly: false });
              }}
              className="flex items-center gap-2.5 sm:gap-3 group text-left cursor-pointer"
            >
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl overflow-hidden shadow-xs border border-slate-200 shrink-0 bg-slate-950 group-hover:scale-105 transition-transform flex items-center justify-center">
                <img
                  src={COMPANY_LOGO}
                  alt={COMPANY_NAME}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex flex-col">
                <span className="text-base sm:text-xl font-black tracking-tight text-slate-950 leading-none">
                  {COMPANY_NAME}
                </span>
                <span className="text-[10px] font-bold text-blue-700 tracking-wider uppercase mt-1">
                  PropTech & Maps
                </span>
              </div>
            </button>

            {/* Quick Metro City Selector (Desktop / Tablet) */}
            <div className="hidden lg:flex items-center relative">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 rounded-lg text-xs font-semibold text-slate-700 transition-colors">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <select
                  value={filters.city === 'all' ? 'All Cities' : filters.city}
                  onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value === 'All Cities' ? 'all' : e.target.value }))}
                  aria-label="Filter by Metro City"
                  className="bg-transparent border-none outline-hidden cursor-pointer pr-4 font-semibold text-slate-800 text-xs"
                >
                  {cities.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-slate-500 pointer-events-none -ml-3" />
              </div>
            </div>
          </div>

          {/* Zone 2: Navigation Links (Desktop: Buy, Rent, Commercial, Plots, Zero Brokerage Owners) */}
          <nav className="hidden md:flex items-center gap-4 lg:gap-6 text-xs lg:text-sm font-semibold text-slate-600">
            <button
              onClick={() => handleNavType('sale', 'all', false)}
              className={`hover:text-blue-600 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                filters.listingType === 'sale' && filters.propertyType === 'all' && !filters.zeroBrokerageOnly
                  ? 'text-blue-600 font-black'
                  : ''
              }`}
            >
              Buy
            </button>
            <button
              onClick={() => handleNavType('rent', 'all', false)}
              className={`hover:text-blue-600 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                filters.listingType === 'rent' && !filters.zeroBrokerageOnly
                  ? 'text-blue-600 font-black'
                  : ''
              }`}
            >
              Rent
            </button>
            <button
              onClick={() => handleNavType('all', 'commercial', false)}
              className={`hover:text-blue-600 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                filters.propertyType === 'commercial'
                  ? 'text-blue-600 font-black'
                  : ''
              }`}
            >
              Commercial
            </button>
            <button
              onClick={() => handleNavType('sale', 'land', false)}
              className={`hover:text-blue-600 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                filters.propertyType === 'land'
                  ? 'text-blue-600 font-black'
                  : ''
              }`}
            >
              Plots
            </button>

            {/* NoBroker Reference: Zero Brokerage Direct Owners */}
            <button
              onClick={() => handleNavType('all', 'all', true)}
              className={`hover:text-emerald-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${
                filters.zeroBrokerageOnly
                  ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Zero Brokerage</span>
            </button>
          </nav>

          {/* Zone 3: Actions (Helpline + Compare + Post Property Free) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Phone Helpline */}
            <a
              href={`tel:${COMPANY_PHONE}`}
              className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Call Helpline"
            >
              <Phone className="w-3.5 h-3.5 text-blue-600" />
              <span className="font-mono">{COMPANY_PHONE_DISPLAY}</span>
            </a>

            {/* Compare trigger */}
            {comparisonList.length > 0 && (
              <button
                onClick={onOpenCompare}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                title="Compare properties"
              >
                <Scale className="w-3.5 h-3.5 text-blue-600" />
                <span>Compare ({comparisonList.length})</span>
              </button>
            )}

            {/* Shortlist Badge */}
            {favorites.length > 0 && (
              <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 rounded-lg border border-rose-200">
                <Heart className="w-3.5 h-3.5 fill-rose-600 text-rose-600" />
                <span>{favorites.length}</span>
              </div>
            )}

            {/* Primary Action CTA: Post Property FREE (0% Brokerage) */}
            <button
              onClick={() => setIsPostModalOpen(true)}
              className="px-3.5 sm:px-4 py-2 min-h-[40px] text-xs font-black text-white bg-blue-600 hover:bg-blue-700 active:scale-98 rounded-xl shadow-xs transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ring-2 ring-blue-500/20"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Post Property FREE</span>
              <span className="hidden lg:inline bg-blue-800/80 text-[10px] uppercase font-mono px-1.5 py-0.5 rounded ml-0.5">
                0% Brokerage
              </span>
            </button>

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Open mobile navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6 text-slate-700" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu (Responsive) */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-5 space-y-3 animate-in slide-in-from-top duration-150">
          <div className="flex items-center gap-2 p-2.5 bg-slate-100 rounded-lg text-xs font-semibold text-slate-800">
            <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-slate-500">City:</span>
            <select
              value={filters.city === 'all' ? 'All Cities' : filters.city}
              onChange={(e) => {
                setFilters(prev => ({ ...prev, city: e.target.value === 'All Cities' ? 'all' : e.target.value }));
                setMobileMenuOpen(false);
              }}
              className="bg-transparent font-bold text-slate-900 outline-hidden w-full cursor-pointer"
            >
              {cities.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-700">
            <button
              onClick={() => {
                setFilters({ propertyType: 'all', listingType: 'all', city: 'all', searchQuery: '', zeroBrokerageOnly: false });
                setMobileMenuOpen(false);
              }}
              className="p-3 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 active:bg-blue-100 rounded-lg text-left col-span-2 flex items-center justify-between"
            >
              <span>Explore All Listings</span>
              <span className="text-blue-600 font-semibold">View All →</span>
            </button>
            <button
              onClick={() => handleNavType('sale', 'all', false)}
              className="p-3 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 active:bg-blue-100 rounded-lg text-left min-h-[44px]"
            >
              Buy Properties
            </button>
            <button
              onClick={() => handleNavType('rent', 'all', false)}
              className="p-3 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 active:bg-blue-100 rounded-lg text-left min-h-[44px]"
            >
              Rent Properties
            </button>
            <button
              onClick={() => handleNavType('sale', 'land', false)}
              className="p-3 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 active:bg-blue-100 rounded-lg text-left min-h-[44px]"
            >
              Plots & Land
            </button>
            <button
              onClick={() => handleNavType('all', 'commercial', false)}
              className="p-3 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 active:bg-blue-100 rounded-lg text-left min-h-[44px]"
            >
              Commercial
            </button>
            <button
              onClick={() => handleNavType('all', 'all', true)}
              className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-left col-span-2 flex items-center justify-between"
            >
              <div className="flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span>Zero Brokerage (Direct Owners)</span>
              </div>
              <span className="text-[10px] font-mono font-bold bg-emerald-200 px-1.5 py-0.5 rounded">0% FEE</span>
            </button>
          </div>

          <a
            href={`tel:${COMPANY_PHONE}`}
            className="flex items-center justify-center gap-2 w-full py-3 bg-blue-50 text-blue-800 font-bold text-xs rounded-lg border border-blue-200 active:bg-blue-100 min-h-[44px]"
          >
            <Phone className="w-4 h-4 text-blue-600" />
            <span>Call Helpline: {COMPANY_PHONE_DISPLAY}</span>
          </a>
        </div>
      )}
    </header>
  );
};
