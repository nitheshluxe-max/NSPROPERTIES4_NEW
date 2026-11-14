import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  PropertyProvider,
  useProperty,
  COMPANY_NAME,
  COMPANY_PHONE,
  COMPANY_PHONE_DISPLAY,
  COMPANY_LOGO
} from './context/PropertyContext';
import { Navbar } from './components/Navbar';
import { FreeMarketplace } from './components/FreeMarketplace';
import { ReferenceHomepageTop, ReferenceHomepageBottom } from './components/ReferenceHomepageSections';
import { HeroSearch } from './components/HeroSearch';
import { FilterBar } from './components/FilterBar';
import { PropertyCard } from './components/PropertyCard';
import { PropertyMap } from './components/PropertyMap';
import { PropertyDetailModal } from './components/PropertyDetailModal';
import { ContactModal } from './components/ContactModal';
import { CompareDrawer } from './components/CompareDrawer';
import { AdminConsole } from './components/AdminConsole';
import { PasswordRecovery } from './components/PasswordRecovery';
import { AdminPreview } from './components/AdminPreview';
import { AdminLoginModal } from './components/AdminLoginModal';
import { Property } from './types/property';
import {
  MapPin,
  Building,
  ShieldCheck,
  Scale,
  Inbox,
  ArrowRight,
  PhoneCall,
  Map as MapIcon,
  List,
  MessageSquare,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Navigation,
  Eye,
  X,
  Compass,
  Search,
  UserCheck
} from 'lucide-react';

const PortalContent: React.FC<{ onOpenCompare: () => void }> = ({ onOpenCompare }) => {
  const {
    filteredProperties,
    selectedProperty,
    setSelectedProperty,
    activeMapPropertyId,
    setActiveMapPropertyId,
    currentView,
    filters,
    resetFilters,
    comparisonList,
    isAdminAuthenticated
  } = useProperty();

  // Mobile View Toggle: 'list' or 'map'
  const [mobileViewMode, setMobileViewMode] = useState<'list' | 'map'>('list');
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [showHeroSearch, setShowHeroSearch] = useState(true);

  const cardsContainerRef = useRef<HTMLDivElement>(null);

  // Google Maps Quota Listener
  useEffect(() => {
    const handleQuota = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuota);
  }, []);

  const isNavigatingRef = useRef(false);

  // Active index for one-by-one browsing
  const activeIndex = useMemo(() => {
    if (!activeMapPropertyId || filteredProperties.length === 0) return 0;
    const idx = filteredProperties.findIndex((p) => p && p.id === activeMapPropertyId);
    return idx >= 0 ? idx : 0;
  }, [filteredProperties, activeMapPropertyId]);

  const [mapFocusTimestamp, setMapFocusTimestamp] = useState<number>(0);

  // Set initial active property once on initial load
  const hasInitializedActiveRef = useRef(false);
  useEffect(() => {
    if (!hasInitializedActiveRef.current && filteredProperties.length > 0) {
      hasInitializedActiveRef.current = true;
      if (filteredProperties[0]?.id) {
        setActiveMapPropertyId(filteredProperties[0].id);
      }
    }
  }, [filteredProperties, setActiveMapPropertyId]);

  // If filteredProperties changes (due to filtering) and activeMapPropertyId is not in it, reset to first
  useEffect(() => {
    if (filteredProperties.length > 0 && activeMapPropertyId) {
      const exists = filteredProperties.some((p) => p && p.id === activeMapPropertyId);
      if (!exists && filteredProperties[0]?.id) {
        setActiveMapPropertyId(filteredProperties[0].id);
      }
    }
  }, [filteredProperties, activeMapPropertyId, setActiveMapPropertyId]);

  // Smoothly scroll to target index without triggering feedback loop
  const scrollToPropertyIndex = useCallback(
    (index: number) => {
      if (index < 0 || index >= filteredProperties.length) return;
      const target = filteredProperties[index];
      if (!target) return;

      isNavigatingRef.current = true;
      setActiveMapPropertyId(target.id);

      const el = document.getElementById(`property-card-${target.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }

      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 700);
    },
    [filteredProperties, setActiveMapPropertyId]
  );

  const handlePrevious = useCallback(() => {
    if (activeIndex > 0) {
      scrollToPropertyIndex(activeIndex - 1);
    }
  }, [activeIndex, scrollToPropertyIndex]);

  const handleNext = useCallback(() => {
    if (activeIndex < filteredProperties.length - 1) {
      scrollToPropertyIndex(activeIndex + 1);
    }
  }, [activeIndex, filteredProperties.length, scrollToPropertyIndex]);

  // Marker Click Handler from Google Map (Two-way synchronization)
  const handleMarkerClick = useCallback(
    (prop: Property) => {
      isNavigatingRef.current = true;
      setActiveMapPropertyId(prop.id);
      const el = document.getElementById(`property-card-${prop.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 700);
    },
    [setActiveMapPropertyId]
  );

  // Automatic Map Synchronization on manual scroll of left cards container
  useEffect(() => {
    const container = cardsContainerRef.current;
    if (!container) return;

    let timeoutId: any;
    const handleScroll = () => {
      if (isNavigatingRef.current) return;
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (isNavigatingRef.current || !container) return;
        const containerRect = container.getBoundingClientRect();
        const containerMid = containerRect.top + containerRect.height * 0.35;

        let closestId: string | null = null;
        let minDiff = Infinity;

        for (const prop of filteredProperties) {
          const el = document.getElementById(`property-card-${prop.id}`);
          if (el) {
            const rect = el.getBoundingClientRect();
            const cardMid = (rect.top + rect.bottom) / 2;
            const diff = Math.abs(cardMid - containerMid);
            if (diff < minDiff) {
              minDiff = diff;
              closestId = prop.id;
            }
          }
        }

        if (closestId && closestId !== activeMapPropertyId) {
          setActiveMapPropertyId(closestId);
        }
      }, 150);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, [filteredProperties, activeMapPropertyId, setActiveMapPropertyId]);

  // Active property object for preview/sync
  const activeProperty =
    filteredProperties.find((p) => p.id === activeMapPropertyId) ||
    filteredProperties[0] ||
    null;

  // If in admin view, render the Admin Console
  if (currentView === 'admin' && isAdminAuthenticated) {
    return <AdminConsole />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 pb-20 lg:pb-0">
      {/* Quota Defense Banner (Demo Key / Starter Tier) */}
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {/* Hero Search Console (Collapsible) */}
      {showHeroSearch && <HeroSearch />}

      {/* Reference homepage sections from NS_PROPERTIES_4 */}
      <ReferenceHomepageTop onFocusPropertyOnMap={(prop) => {
        setActiveMapPropertyId(prop.id);
        setMapFocusTimestamp(Date.now());
        if (window.innerWidth < 1024) setMobileViewMode('map');
      }} />

      {/* Interactive map and listings section */}
      <div id="map-search-section" className="scroll-mt-20"><FilterBar /></div>

      {/* Split-Screen Main Content Viewport */}
      <main className="max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-3 flex-1 flex flex-col">
        {/* Results Header Status */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3 shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              {filters.city !== 'all' ? `${filters.city} Properties` : 'All Metro Properties'}
              <span className="text-slate-500 font-normal ml-2 text-xs sm:text-sm">
                ({filteredProperties.length} listings available)
              </span>
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500">
              {filters.listingType === 'sale' ? 'Properties for Sale / Purchase' : 'Rental Properties and Leases'}
              {filters.propertyType !== 'all' && ` · ${filters.propertyType.toUpperCase()}`}
              {filters.locality && ` · ${filters.locality}`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHeroSearch(!showHeroSearch)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors cursor-pointer"
              title="Toggle full hero search banner"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{showHeroSearch ? 'Hide Search Banner' : 'Advanced Search Banner'}</span>
            </button>

            {/* Mobile List / Map View Toggle Pill */}
            <div className="lg:hidden flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
              <button
                onClick={() => setMobileViewMode('list')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  mobileViewMode === 'list'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>List ({filteredProperties.length})</span>
              </button>
              <button
                onClick={() => setMobileViewMode('map')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  mobileViewMode === 'map'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <MapIcon className="w-3.5 h-3.5" />
                <span>Map View</span>
              </button>
            </div>
          </div>
        </div>

        {/* Split Viewport: 65% Property Listing Cards (Left) / 35% Google Map (Right) */}
        <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
          {/* Left Column (65%): Property Cards Feed with independent up and down scrolling */}
          <div className={`w-full lg:w-[65%] flex flex-col shrink-0 ${mobileViewMode === 'map' ? 'hidden lg:flex' : 'flex'}`}>
            {/* ONE-BY-ONE PROPERTY BROWSING & MAP SYNCHRONIZATION TOOLBAR */}
            {filteredProperties.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-3 mb-3 shadow-2xs flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Browsing:</span>
                  <span className="text-xs font-black text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg font-mono tabular-nums shadow-2xs">
                    PROPERTY {activeIndex + 1} OF {filteredProperties.length}
                  </span>
                  {activeProperty && (
                    <span className="text-xs text-slate-700 font-semibold truncate max-w-[200px] sm:max-w-xs">
                      · {activeProperty.title}
                    </span>
                  )}
                  {filters.zeroBrokerageOnly && (
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <UserCheck className="w-3 h-3 text-emerald-600" />
                      <span>Zero Brokerage Only</span>
                    </span>
                  )}
                </div>

                {/* 1-by-1 UP, DOWN, PREV, NEXT NAVIGATION BUTTONS */}
                <div className="flex items-center gap-1.5 ml-auto">
                  <button
                    type="button"
                    onClick={handlePrevious}
                    disabled={activeIndex === 0}
                    className="px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 active:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                    title="Previous Property (Scroll UP one card)"
                  >
                    <ChevronUp className="w-4 h-4 text-blue-600" />
                    <span className="hidden sm:inline">Previous Property</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={activeIndex >= filteredProperties.length - 1}
                    className="px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 active:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                    title="Next Property (Scroll DOWN one card)"
                  >
                    <span className="hidden sm:inline">Next Property</span>
                    <ChevronDown className="w-4 h-4 text-blue-600" />
                  </button>
                </div>
              </div>
            )}

            <div
              ref={cardsContainerRef}
              className="w-full lg:h-[calc(100vh-250px)] lg:overflow-y-auto lg:pr-3 space-y-4 scroll-smooth property-scroll-container"
            >
            {filteredProperties.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center space-y-3">
                <Inbox className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">No properties match your current filters</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Try adjusting the budget range, property type, or locality filter to see more available homes and plots.
                </p>
                <div className="pt-2 flex flex-wrap justify-center gap-3">
                  <button
                    onClick={resetFilters}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 cursor-pointer"
                  >
                    Reset All Filters
                  </button>
                  <button
                    onClick={() => { window.location.hash = '#post-property'; }}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-200 cursor-pointer"
                  >
                    Post a Property
                  </button>
                </div>
              </div>
            ) : (
              filteredProperties.map((prop, idx) => (
                <PropertyCard
                  key={prop.id}
                  property={prop}
                  index={idx}
                  isActive={activeMapPropertyId === prop.id}
                  onSelect={(p) => setSelectedProperty(p)}
                  onFocusOnMap={(p) => {
                    setActiveMapPropertyId(p.id);
                    setMapFocusTimestamp(Date.now());
                  }}
                />
              ))
            )}
          </div>
        </div>

          {/* Right Column (35%): Interactive Google Maps Property Map - FIXED POSITION, NOT MOVED */}
          <div
            className={`w-full lg:w-[35%] lg:sticky lg:top-20 lg:h-[calc(100vh-185px)] h-[65vh] min-h-[460px] sm:h-[540px] shrink-0 ${
              mobileViewMode === 'list' ? 'hidden lg:block' : 'block'
            }`}
          >
            <PropertyMap
              properties={filteredProperties}
              onSelectProperty={(p) => setSelectedProperty(p)}
              onMarkerClick={handleMarkerClick}
              focusTimestamp={mapFocusTimestamp}
            />
          </div>
        </div>
      </main>
      <ReferenceHomepageBottom />

      {/* MOBILE FULL-SCREEN MAP VIEW MODAL (When Mobile Map View is active) */}
      {mobileViewMode === 'map' && (
        <div className="fixed inset-0 z-50 bg-slate-900 lg:hidden flex flex-col">
          {/* Mobile Map Top Bar */}
          <div className="bg-white px-3 py-2.5 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0 shadow-sm">
            <button
              onClick={() => setMobileViewMode('list')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Listings</span>
            </button>

            {filteredProperties.length > 0 && (
              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg">
                {filteredProperties.length} Properties
              </span>
            )}
          </div>

          {/* Full Screen Mobile Map Container */}
          <div className="flex-1 relative">
            <PropertyMap
              properties={filteredProperties}
              onSelectProperty={(p) => setSelectedProperty(p)}
              onMarkerClick={handleMarkerClick}
              isFullScreenMode={true}
              onCloseFullScreen={() => setMobileViewMode('list')}
              focusTimestamp={mapFocusTimestamp}
            />

            {/* Mobile Bottom Floating Card */}
            {activeProperty && (
              <div className="absolute bottom-3 inset-x-3 z-30 bg-white/95 backdrop-blur-md rounded-2xl p-3 border border-slate-200 shadow-2xl flex flex-col gap-2.5">
                <div className="flex items-center gap-3">
                  <img
                    src={(Array.isArray(activeProperty?.images) && activeProperty.images[0]) || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&auto=format&fit=crop&q=80'}
                    alt={activeProperty.title || 'Property'}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&auto=format&fit=crop&q=80';
                    }}
                    className="w-16 h-16 rounded-xl object-cover shrink-0 bg-slate-100"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-black text-blue-700 font-mono block">
                      {activeProperty.priceDisplay}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {activeProperty.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate">
                      {activeProperty.locality}, {activeProperty.city}
                    </p>
                  </div>
                </div>

                {/* Mobile Action Controls */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                  <button
                    onClick={() => setSelectedProperty(activeProperty)}
                    className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Property Details</span>
                  </button>
                  <button
                    onClick={() => setMobileViewMode('list')}
                    className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Compare Trigger Drawer (when items are selected) */}
      {comparisonList.length > 0 && (
        <div className="fixed bottom-18 sm:bottom-4 right-4 z-40 bg-slate-900 text-white px-4 sm:px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 sm:gap-4 border border-slate-700 animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold">{comparisonList.length} Selected</span>
          </div>
          <button
            onClick={onOpenCompare}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
          >
            <span>Compare</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Mobile Sticky Quick Action Bottom Bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2 flex items-center justify-between gap-1 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] lg:hidden">
        {/* Helpline Call */}
        <a
          href={`tel:${COMPANY_PHONE}`}
          className="flex-1 flex flex-col items-center justify-center py-1 text-slate-700 active:text-blue-600 cursor-pointer min-h-[44px]"
        >
          <PhoneCall className="w-5 h-5 text-emerald-600 mb-0.5" />
          <span className="text-[10px] font-bold">Call Helpline</span>
        </a>

        {/* WhatsApp Chat */}
        <a
          href={`https://wa.me/918073266325?text=${encodeURIComponent(
            'Hi NS Properties 4, I am browsing your property listings and would like assistance.'
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex flex-col items-center justify-center py-1 text-slate-700 active:text-emerald-600 cursor-pointer min-h-[44px]"
        >
          <MessageSquare className="w-5 h-5 text-emerald-500 mb-0.5" />
          <span className="text-[10px] font-bold">WhatsApp</span>
        </a>

        {/* Mode Switcher: List vs Map */}
        <button
          onClick={() => setMobileViewMode((prev) => (prev === 'list' ? 'map' : 'list'))}
          className="flex-1 flex flex-col items-center justify-center py-1 text-slate-700 active:text-blue-600 cursor-pointer min-h-[44px]"
        >
          {mobileViewMode === 'list' ? (
            <>
              <MapIcon className="w-5 h-5 text-blue-600 mb-0.5" />
              <span className="text-[10px] font-bold">Map View</span>
            </>
          ) : (
            <>
              <List className="w-5 h-5 text-blue-600 mb-0.5" />
              <span className="text-[10px] font-bold">List View</span>
            </>
          )}
        </button>

        {/* Post Property FREE */}
        <button
          onClick={() => { window.location.hash = '#post-property'; }}
          className="flex-1 py-2 px-2.5 bg-blue-600 active:bg-blue-700 text-white rounded-xl flex flex-col items-center justify-center shadow-xs cursor-pointer min-h-[44px]"
        >
          <PlusCircle className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] font-extrabold whitespace-nowrap">Post FREE</span>
        </button>
      </div>

      {/* Footer: NS Properties */}
      <footer className="bg-slate-900 text-slate-400 text-xs mt-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-800 shrink-0 border border-slate-700">
                  <img src={COMPANY_LOGO} alt={COMPANY_NAME} className="w-full h-full object-cover" />
                </div>
                <span className="text-sm font-bold text-white">{COMPANY_NAME}</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed mb-3">
                Trusted real estate advisory across Mumbai, Delhi-NCR, Bengaluru, Pune, and Hyderabad.
              </p>
              <div className="text-slate-300 font-semibold text-xs space-y-1">
                <div>Helpline: <a href={`tel:${COMPANY_PHONE}`} className="text-blue-400 hover:underline">{COMPANY_PHONE_DISPLAY}</a></div>
                <div className="text-slate-500 font-normal text-[11px]">Official: https://nsproperties4.com</div>
              </div>
            </div>

            <div>
              <h4 className="text-white font-bold mb-3 text-xs uppercase tracking-wider">Top Metropolitan Hubs</h4>
              <ul className="space-y-1.5 text-[11px]">
                <li><button onClick={() => filters.city !== 'Mumbai' && window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-white transition-colors cursor-pointer">Mumbai MMR Luxury Homes</button></li>
                <li><button onClick={() => filters.city !== 'Bengaluru' && window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-white transition-colors cursor-pointer">Bengaluru Tech Corridor & Whitefield</button></li>
                <li><button onClick={() => filters.city !== 'Delhi-NCR' && window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-white transition-colors cursor-pointer">Delhi-NCR Golf Course Road</button></li>
                <li><button onClick={() => filters.city !== 'Pune' && window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-white transition-colors cursor-pointer">Pune IT Hubs & Baner</button></li>
                <li><button onClick={() => filters.city !== 'Hyderabad' && window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-white transition-colors cursor-pointer">Hyderabad Financial District</button></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-3 text-xs uppercase tracking-wider">Property Types</h4>
              <ul className="space-y-1.5 text-[11px]">
                <li><span className="text-slate-300">Apartments & Flats (1 to 5 BHK)</span></li>
                <li><span className="text-slate-300">Independent Gated Villas</span></li>
                <li><span className="text-slate-300">Residential NA & BDA Plots</span></li>
                <li><span className="text-slate-300">Grade-A Commercial Offices</span></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800 text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span>© {new Date().getFullYear()} {COMPANY_NAME} (nsproperties4.com). All rights reserved.</span>
            <span>Google Maps Platform Verified · Free Property Posting · Direct Owner & Builder Listings</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

const MainApp: React.FC = () => {
  const { currentView, isAdminAuthenticated, setIsAdminLoginModalOpen } = useProperty();
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [marketplaceOpen, setMarketplaceOpen] = useState(() => (window.location.hash === '#free-marketplace' || window.location.hash === '#post-property'));
  useEffect(() => { const update = () => setMarketplaceOpen(window.location.hash === '#free-marketplace'); window.addEventListener('hashchange', update); return () => window.removeEventListener('hashchange', update); }, []);
  const [recoveryOpen, setRecoveryOpen] = useState(() => window.location.hash === '#forgot-password' || new URLSearchParams(window.location.search).get('auth') === 'recovery');
  useEffect(() => {
    const sync = () => setRecoveryOpen(window.location.hash === '#forgot-password' || new URLSearchParams(window.location.search).get('auth') === 'recovery');
    window.addEventListener('hashchange', sync);
    window.addEventListener('popstate', sync);
    return () => { window.removeEventListener('hashchange', sync); window.removeEventListener('popstate', sync); };
  }, []);
  if (recoveryOpen) return <PasswordRecovery onClose={() => { window.history.replaceState({}, '', window.location.pathname + '#admin'); setRecoveryOpen(false); }} />;
  if (marketplaceOpen) return <FreeMarketplace />;

  // Directly render the isolated Admin Console if #admin is open
  if (currentView === 'admin' && isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-100">
        <AdminConsole />
        <PropertyDetailModalWrapper />
      </div>
    );
  }

  if (currentView === 'admin' && !isAdminAuthenticated) {
    return <><AdminPreview onSignIn={() => setIsAdminLoginModalOpen(true)} /><AdminLoginModal /></>;
  }

  return (
    <>
      {currentView === 'admin' && !isAdminAuthenticated && <div className="bg-amber-50 text-amber-900 text-center p-3">Admin access requires a verified account. <button className="underline font-semibold" onClick={() => setIsAdminLoginModalOpen(true)}>Sign in</button></div>}
      <AdminLoginModal />
      <Navbar onOpenCompare={() => setIsCompareOpen(true)} />
      <PortalContent onOpenCompare={() => setIsCompareOpen(true)} />
      <PropertyDetailModalWrapper />

      <ContactModalWrapper />
      <CompareDrawer isOpen={isCompareOpen} onClose={() => setIsCompareOpen(false)} />
    </>
  );
};

export default function App() {
  return (
    <PropertyProvider>
      <MainApp />
    </PropertyProvider>
  );
}

// Wrapper to connect PropertyDetailModal with context
const PropertyDetailModalWrapper: React.FC = () => {
  const { selectedProperty, setSelectedProperty } = useProperty();
  if (!selectedProperty) return null;
  return (
    <PropertyDetailModal
      property={selectedProperty}
      onClose={() => setSelectedProperty(null)}
    />
  );
};

// Wrapper for ContactModal
const ContactModalWrapper: React.FC = () => {
  return <ContactModal />;
};
