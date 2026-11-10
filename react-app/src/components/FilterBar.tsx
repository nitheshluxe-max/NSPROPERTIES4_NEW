import React, { useState } from 'react';
import { useProperty } from '../context/PropertyContext';
import { SlidersHorizontal, X, RotateCcw, ArrowUpDown, Check } from 'lucide-react';
import { PropertyCategory, ListingPurpose } from '../types/property';

export const FilterBar: React.FC = () => {
  const { filters, setFilters, resetFilters, filteredProperties } = useProperty();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Active filter count calculation
  let activeFilterCount = 0;
  if (filters.city !== 'all') activeFilterCount++;
  if (filters.propertyType !== 'all') activeFilterCount++;
  if (filters.searchQuery) activeFilterCount++;
  if (filters.locality) activeFilterCount++;
  if (filters.pincode) activeFilterCount++;
  if (filters.minPrice > 0 || filters.maxPrice < 150000000) activeFilterCount++;
  if (filters.bedrooms.length > 0) activeFilterCount++;
  if (filters.furnishing !== 'all') activeFilterCount++;
  if (filters.possession !== 'all') activeFilterCount++;
  if (filters.verifiedOnly) activeFilterCount++;
  if (filters.reraOnly) activeFilterCount++;
  if (filters.featuredOnly) activeFilterCount++;
  if (filters.zeroBrokerageOnly) activeFilterCount++;

  const propertyTypes: { label: string; value: PropertyCategory | 'all' }[] = [
    { label: 'All Types', value: 'all' },
    { label: 'Flats & Apartments', value: 'apartment' },
    { label: 'Villas & Houses', value: 'villa' },
    { label: 'Plots & Land', value: 'land' },
    { label: 'Commercial Spaces', value: 'commercial' }
  ];

  const formatPriceLabel = (val: number) => {
    if (val >= 10000000) {
      return `₹ ${(val / 10000000).toFixed(2)} Cr`;
    }
    if (val >= 100000) {
      return `₹ ${(val / 100000).toFixed(0)} L`;
    }
    return `₹ ${val.toLocaleString('en-IN')}`;
  };

  return (
    <div className="bg-white border-b border-slate-200 py-2.5 px-3 sm:px-6 lg:px-8 sticky top-16 sm:top-20 z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
        {/* Quick Filter Horizontal Scroll Strip */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-0.5 -mx-3 px-3 sm:mx-0 sm:px-0">
          {/* Quick Sale vs Rent Toggle */}
          <div className="flex items-center gap-0.5 bg-slate-100 p-1 rounded-lg shrink-0">
            <button
              onClick={() => setFilters({ listingType: 'all' })}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap ${
                filters.listingType === 'all'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilters({ listingType: 'sale' })}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap ${
                filters.listingType === 'sale'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Buy
            </button>
            <button
              onClick={() => setFilters({ listingType: 'rent' })}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap ${
                filters.listingType === 'rent'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Rent
            </button>
          </div>

          {/* Property Type quick segment buttons */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg shrink-0">
            {propertyTypes.map((pt) => {
              const isActive = filters.propertyType === pt.value;
              return (
                <button
                  key={pt.value}
                  onClick={() => setFilters({ propertyType: pt.value })}
                  className={`px-2.5 sm:px-3 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-white text-blue-700 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {pt.label}
                </button>
              );
            })}
          </div>

          {/* Zero Brokerage Quick Chip (NoBroker style) */}
          <button
            onClick={() => setFilters({ zeroBrokerageOnly: !filters.zeroBrokerageOnly })}
            className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all whitespace-nowrap cursor-pointer shrink-0 flex items-center gap-1.5 ${
              filters.zeroBrokerageOnly
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <span>0% Brokerage</span>
          </button>
        </div>

        {/* Secondary Bar: Sort and Deep Filters button */}
        <div className="flex items-center justify-between sm:justify-end gap-2 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          <span className="text-[11px] text-slate-500 font-medium sm:hidden">
            {filteredProperties.length} found
          </span>

          <div className="flex items-center gap-2 ml-auto">
            {/* Sort By Dropdown */}
            <div className="flex items-center gap-1 text-xs font-medium text-slate-600">
              <ArrowUpDown className="w-3 h-3 text-slate-500" />
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters({ sortBy: e.target.value as any })}
                aria-label="Sort listings by"
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-800 outline-hidden cursor-pointer"
              >
                <option value="relevance">Featured & Relevant</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="date_desc">Newest Listings</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>

            {/* All Filters Button with Badge */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap ${
                activeFilterCount > 0
                  ? 'bg-blue-50 border-blue-600 text-blue-700'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Reset All */}
            {activeFilterCount > 0 && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-medium cursor-pointer"
                title="Reset all filters"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Slide-in Filter Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* Drawer Body */}
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Advanced Property Filters</h3>
                <p className="text-xs text-slate-500">Narrow your search with precise parameters</p>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-700">
              {/* City Selection */}
              <div>
                <label className="block font-semibold text-slate-900 mb-2">Metro City</label>
                <select
                  value={filters.city}
                  onChange={(e) => setFilters({ city: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-hidden"
                >
                  <option value="all">All Metros (Pan India)</option>
                  <option value="Mumbai">Mumbai MMR</option>
                  <option value="Delhi-NCR">Delhi-NCR</option>
                  <option value="Bengaluru">Bengaluru</option>
                  <option value="Pune">Pune</option>
                  <option value="Hyderabad">Hyderabad</option>
                </select>
              </div>

              {/* Locality & PIN Code */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-900 mb-1.5">Locality</label>
                  <input
                    type="text"
                    placeholder="e.g. Whitefield"
                    value={filters.locality}
                    onChange={(e) => setFilters({ locality: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-hidden focus:border-blue-600 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-900 mb-1.5">PIN Code</label>
                  <input
                    type="text"
                    placeholder="e.g. 560066"
                    value={filters.pincode || ''}
                    onChange={(e) => setFilters({ pincode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono outline-hidden focus:border-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              {/* Price Range Slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-semibold text-slate-900">Budget Limit</label>
                  <span className="text-xs font-mono tabular-nums font-bold text-blue-600">
                    Max: {formatPriceLabel(filters.maxPrice)}
                  </span>
                </div>
                <input
                  type="range"
                  min="500000"
                  max="150000000"
                  step="500000"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({ maxPrice: Number(e.target.value) })}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-slate-400 font-mono mt-1">
                  <span>₹ 5 Lakhs</span>
                  <span>₹ 5 Crores</span>
                  <span>₹ 15+ Crores</span>
                </div>
              </div>

              {/* Bedrooms (BHK) */}
              <div>
                <label className="block font-semibold text-slate-900 mb-2">Bedrooms (BHK)</label>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((bhk) => {
                    const isSelected = filters.bedrooms.includes(bhk);
                    return (
                      <button
                        key={bhk}
                        type="button"
                        onClick={() => {
                          const current = filters.bedrooms;
                          if (current.includes(bhk)) {
                            setFilters({ bedrooms: current.filter(b => b !== bhk) });
                          } else {
                            setFilters({ bedrooms: [...current, bhk] });
                          }
                        }}
                        className={`py-2 text-xs font-bold rounded-lg border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {bhk === 5 ? '5+ BHK' : `${bhk} BHK`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Furnishing Status */}
              <div>
                <label className="block font-semibold text-slate-900 mb-2">Furnishing Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'All', value: 'all' },
                    { label: 'Fully Furnished', value: 'fully-furnished' },
                    { label: 'Semi-Furnished', value: 'semi-furnished' },
                    { label: 'Unfurnished', value: 'unfurnished' }
                  ].map((f) => (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => setFilters({ furnishing: f.value as any })}
                      className={`py-2 px-2 text-xs font-semibold rounded-lg border text-center transition-all cursor-pointer ${
                        filters.furnishing === f.value
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Possession Status */}
              <div>
                <label className="block font-semibold text-slate-900 mb-2">Possession Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'All', value: 'all' },
                    { label: 'Ready to Move', value: 'ready' },
                    { label: 'Under Construction', value: 'under-construction' }
                  ].map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setFilters({ possession: p.value as any })}
                      className={`py-2 px-2 text-xs font-semibold rounded-lg border text-center transition-all cursor-pointer ${
                        filters.possession === p.value
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles: Verified, RERA, Featured */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="font-medium text-slate-800">Verified Properties Only</span>
                  <input
                    type="checkbox"
                    checked={filters.verifiedOnly}
                    onChange={(e) => setFilters({ verifiedOnly: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded-sm cursor-pointer"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="font-medium text-slate-800">RERA Registered Projects</span>
                  <input
                    type="checkbox"
                    checked={filters.reraOnly}
                    onChange={(e) => setFilters({ reraOnly: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded-sm cursor-pointer"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="font-medium text-slate-800">Featured & Hot Deals</span>
                  <input
                    type="checkbox"
                    checked={filters.featuredOnly}
                    onChange={(e) => setFilters({ featuredOnly: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded-sm cursor-pointer"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex flex-col">
                    <span className="font-bold text-emerald-800">Zero Brokerage Only</span>
                    <span className="text-[11px] text-slate-500">Listings posted directly by owners</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={filters.zeroBrokerageOnly || false}
                    onChange={(e) => setFilters({ zeroBrokerageOnly: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded-sm cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center gap-3">
              <button
                onClick={resetFilters}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Clear All
              </button>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
              >
                Show {filteredProperties.length} Properties
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
