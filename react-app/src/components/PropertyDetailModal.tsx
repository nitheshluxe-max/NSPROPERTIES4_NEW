import React, { useState, useEffect } from 'react';
import { Property } from '../types/property';
import { useProperty, COMPANY_NAME, COMPANY_PHONE, COMPANY_PHONE_DISPLAY } from '../context/PropertyContext';
import {
  X,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Phone,
  MessageSquare,
  Calendar,
  Calculator,
  Bed,
  Bath,
  Maximize2,
  Compass,
  Building,
  Check,
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Layers,
  FileText,
  Clock,
  ArrowUpRight,
  Info,
  Car,
  Zap,
  Waves,
  Dumbbell,
  TreePine,
  ShieldAlert,
  Flame,
  KeyRound,
  Navigation,
  TrendingUp
} from 'lucide-react';
import { PriceTrendChart } from './PriceTrendChart';
import { ShareModal } from './ShareModal';

interface PropertyDetailModalProps {
  property: Property;
  onClose: () => void;
}

export const PropertyDetailModal: React.FC<PropertyDetailModalProps> = ({ property, onClose }) => {
  const { openContactModal, favorites, toggleFavorite } = useProperty();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<'overview' | 'specs' | 'trends' | 'amenities' | 'emi'>('overview');

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Robust fallbacks for safe rendering across all devices & edge data
  const images = Array.isArray(property?.images) && property.images.length > 0
    ? property.images.filter((image): image is string => typeof image === 'string' && image.length > 0)
    : ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'];
  const safePrice = typeof property?.price === 'number' && !isNaN(property.price) && property.price > 0 
    ? property.price 
    : 10000000;
  
  const seller = property?.seller || {
    name: 'NS Properties 4 Advisor',
    phone: '8073266325',
    email: 'contact@nsproperties4.com',
    type: 'partner',
    verified: true
  };
  const sellerInitial = (seller.name || 'N').charAt(0).toUpperCase();
  const amenities = Array.isArray(property?.amenities) ? property.amenities : [];
  const safeArea = typeof property?.superBuiltUpArea === 'number' && Number.isFinite(property.superBuiltUpArea) ? property.superBuiltUpArea : 0;
  const furnishingLabel = typeof property?.furnishing === 'string' ? property.furnishing.replace(/-/g, ' ') : 'Not specified';
  const possessionLabel = property?.possession === 'ready' ? 'Ready to Move' : (property?.possessionDate || 'Not specified');

  // EMI Calculator State
  const defaultLoanAmount = Math.round(safePrice * 0.8);
  const [loanAmount, setLoanAmount] = useState(defaultLoanAmount);
  const [tenureYears, setTenureYears] = useState(20);
  const [interestRate, setInterestRate] = useState(8.5);

  const isFavorite = property?.id ? favorites.includes(property.id) : false;

  // EMI Calculation Math: E = P * r * (1 + r)^n / ((1 + r)^n - 1)
  const monthlyRate = interestRate / 12 / 100;
  const totalMonths = tenureYears * 12;
  const monthlyEMI = Math.round(
    (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
      (Math.pow(1 + monthlyRate, totalMonths) - 1)
  );
  const totalPayment = monthlyEMI * totalMonths;
  const totalInterest = Math.max(0, totalPayment - loanAmount);
  const principalPercent = totalPayment > 0 ? Math.round((loanAmount / totalPayment) * 100) : 60;
  const interestPercent = 100 - principalPercent;

  // Estimated Government Stamp Duty & Registration (~6% total in India)
  const estimatedStampDuty = Math.round(safePrice * 0.05);
  const estimatedRegistration = Math.round(safePrice * 0.01);

  const handleShare = () => {
    try {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(window.location.href);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      }
    } catch {
      // Fallback
    }
  };

  const getAmenityIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('pool') || lower.includes('water')) return <Waves className="w-4 h-4 text-cyan-600" />;
    if (lower.includes('gym') || lower.includes('fitness')) return <Dumbbell className="w-4 h-4 text-amber-600" />;
    if (lower.includes('park') || lower.includes('car')) return <Car className="w-4 h-4 text-blue-600" />;
    if (lower.includes('power') || lower.includes('backup') || lower.includes('ev')) return <Zap className="w-4 h-4 text-emerald-600" />;
    if (lower.includes('security') || lower.includes('cctv')) return <ShieldCheck className="w-4 h-4 text-indigo-600" />;
    if (lower.includes('garden') || lower.includes('play')) return <TreePine className="w-4 h-4 text-emerald-600" />;
    if (lower.includes('gas') || lower.includes('piped')) return <Flame className="w-4 h-4 text-orange-600" />;
    return <Check className="w-4 h-4 text-blue-600" />;
  };

  const scrollToSection = (secId: 'overview' | 'specs' | 'trends' | 'amenities' | 'emi') => {
    setActiveSection(secId);
    const el = document.getElementById(`modal-sec-${secId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4 md:p-6 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="property-modal-title"
    >
      {/* Click backdrop to dismiss */}
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      {/* Main Responsive Dialog Window */}
      <div className="relative bg-white w-full max-w-6xl h-[100vh] h-[100dvh] sm:h-[90vh] max-h-[100dvh] sm:max-h-[90vh] rounded-none sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col border-0 sm:border border-slate-200 z-10 animate-in zoom-in-95 duration-150">
        
        {/* TOP BAR: Breadcrumb, Badges & Actions */}
        <header className="px-4 sm:px-6 py-3 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[11px] font-bold px-2.5 py-1 bg-blue-600 text-white rounded-md uppercase tracking-wider shrink-0">
              {property.listingType === 'sale' ? 'For Sale' : 'For Rent'}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate">
              <span className="font-semibold text-slate-700 capitalize">{property.propertyType}</span>
              <span aria-hidden="true">·</span>
              <span className="truncate">{property.locality}, {property.city}</span>
              {property.reraId && (
                <>
                  <span aria-hidden="true" className="hidden md:inline">·</span>
                  <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    RERA: {property.reraId}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="p-2 text-slate-600 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer relative"
              title="Share property listing (WhatsApp, Email, Copy Link)"
              aria-label="Share property link"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => toggleFavorite(property.id)}
              className="p-2 text-slate-600 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              title={isFavorite ? 'Remove from shortlist' : 'Save to shortlist'}
              aria-label="Shortlist property"
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-600 text-rose-600' : ''}`} />
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer ml-1"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* IN-MODAL SECTION QUICK JUMP BAR (Desktop & Tablet) */}
        <nav className="hidden sm:flex items-center gap-2 px-6 py-2 bg-slate-50/90 border-b border-slate-200 text-xs font-semibold text-slate-600 shrink-0">
          <button
            onClick={() => scrollToSection('overview')}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
              activeSection === 'overview' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'hover:text-slate-900'
            }`}
          >
            Overview & Photos
          </button>
          <button
            onClick={() => scrollToSection('specs')}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
              activeSection === 'specs' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'hover:text-slate-900'
            }`}
          >
            Specifications
          </button>
          {property.priceHistory && property.priceHistory.length > 0 && (
            <button
              onClick={() => scrollToSection('trends')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeSection === 'trends' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
              <span>Price Trends</span>
            </button>
          )}
          <button
            onClick={() => scrollToSection('amenities')}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
              activeSection === 'amenities' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'hover:text-slate-900'
            }`}
          >
            Amenities ({amenities.length})
          </button>
          {property.listingType === 'sale' && (
            <button
              onClick={() => scrollToSection('emi')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                activeSection === 'emi' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              EMI Calculator & Taxes
            </button>
          )}
        </nav>

        {/* SCROLLABLE MODAL BODY */}
        <div className="overflow-y-auto overscroll-contain touch-pan-y flex-1 min-h-0 p-3 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 scroll-smooth">
          
          {/* SECTION 1: PHOTO GALLERY SHOWCASE */}
          <section id="modal-sec-overview" className="space-y-3">
            {/* Primary Viewport Image */}
            <div className="relative w-full h-64 sm:h-96 lg:h-[430px] rounded-2xl overflow-hidden bg-slate-900 shadow-sm border border-slate-200 group">
              <img
                src={images[selectedImageIndex] || images[0]}
                alt={property.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
              />

              {/* Gradient Bottom Scrim */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

              {/* Prev / Next Floating Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setSelectedImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow-lg transition-all active:scale-90 cursor-pointer"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() =>
                      setSelectedImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow-lg transition-all active:scale-90 cursor-pointer"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Floating Meta Badges inside Gallery */}
              <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                {property.featured && (
                  <span className="px-2.5 py-1 text-[11px] font-bold bg-amber-500 text-slate-950 rounded-md shadow-xs uppercase tracking-wide">
                    Featured
                  </span>
                )}
                {property.verified && (
                  <span className="px-2.5 py-1 text-[11px] font-bold bg-emerald-600 text-white rounded-md shadow-xs flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified by {COMPANY_NAME}
                  </span>
                )}
              </div>

              {/* Photo Counter Pill */}
              <div className="absolute bottom-3 right-3 px-3 py-1 bg-black/75 backdrop-blur-xs text-white text-xs font-semibold rounded-lg shadow-sm">
                Photo {selectedImageIndex + 1} of {images.length}
              </div>
            </div>

            {/* Thumbnail Navigation Ribbon */}
            {images.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative w-20 sm:w-24 h-14 sm:h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                      selectedImageIndex === idx
                        ? 'border-blue-600 ring-2 ring-blue-500/30 scale-102 shadow-sm'
                        : 'border-slate-200 opacity-70 hover:opacity-100 hover:border-slate-400'
                    }`}
                  >
                    <img src={img} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* TWO-COLUMN EDITORIAL SPLIT LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT MAIN COLUMN: Details, Specifications, Amenities & Calculator */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* PRICE & TITLE HEADER CARD */}
              <div className="space-y-3 pb-6 border-b border-slate-200">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <span className="text-3xl sm:text-4xl font-black text-slate-950 font-mono tracking-tight">
                      {property.priceDisplay}
                    </span>
                    {property.pricePerSqFt && (
                      <span className="text-xs sm:text-sm font-semibold text-slate-500 font-mono">
                        @ ₹ {Number(property.pricePerSqFt).toLocaleString('en-IN')}/sq.ft
                      </span>
                    )}
                    {property.listingType === 'rent' && property.securityDeposit && (
                      <span className="text-xs sm:text-sm font-semibold text-slate-600 font-mono bg-slate-100 px-2.5 py-1 rounded-md">
                        Deposit: ₹ {Number(property.securityDeposit).toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-3 py-1 rounded-full flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>0% Brokerage · Direct Connection</span>
                  </span>
                </div>

                <h1 id="property-modal-title" className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
                  {property.title}
                </h1>

                <div className="flex items-center text-xs sm:text-sm text-slate-600 gap-2">
                  <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{property.address || `${property.locality || 'Location not specified'}, ${property.city || ''}`} </span>
                  {property.landmark && (
                    <>
                      <span aria-hidden="true" className="text-slate-300">|</span>
                      <span className="text-slate-500">Near {property.landmark}</span>
                    </>
                  )}
                </div>

                {property.tagline && (
                  <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs sm:text-sm text-blue-900 font-medium italic">
                    "{property.tagline}"
                  </div>
                )}
              </div>

              {/* CORE METRICS GRID */}
              <div>
                <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-400 mb-3">
                  Key Property Highlights
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {property.bedrooms && (
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
                        <Bed className="w-4 h-4 text-blue-600" />
                        <span className="font-semibold">Configuration</span>
                      </div>
                      <span className="text-base font-bold text-slate-900">{property.bedrooms} BHK</span>
                    </div>
                  )}

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
                      <Maximize2 className="w-4 h-4 text-blue-600" />
                      <span className="font-semibold">Super Built-Up</span>
                    </div>
                    <span className="text-base font-bold text-slate-900 font-mono">
                      {safeArea.toLocaleString('en-IN')} <span className="text-xs text-slate-500 font-normal">sq.ft</span>
                    </span>
                  </div>

                  {property.carpetArea && (
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
                        <Layers className="w-4 h-4 text-blue-600" />
                        <span className="font-semibold">Carpet Area</span>
                      </div>
                      <span className="text-base font-bold text-slate-900 font-mono">
                        {Number(property.carpetArea).toLocaleString('en-IN')} <span className="text-xs text-slate-500 font-normal">sq.ft</span>
                      </span>
                    </div>
                  )}

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span className="font-semibold">Possession</span>
                    </div>
                    <span className="text-sm font-bold text-emerald-700">
                      {possessionLabel}
                    </span>
                  </div>

                  {property.facing && (
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
                        <Compass className="w-4 h-4 text-blue-600" />
                        <span className="font-semibold">Facing</span>
                      </div>
                      <span className="text-sm font-bold text-slate-900">{property.facing} Facing</span>
                    </div>
                  )}

                  {property.floorNumber !== undefined && (
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
                        <Building className="w-4 h-4 text-blue-600" />
                        <span className="font-semibold">Floor</span>
                      </div>
                      <span className="text-sm font-bold text-slate-900">
                        {property.floorNumber} of {property.totalFloors || 'N/A'} Floors
                      </span>
                    </div>
                  )}

                  {property.propertyType === 'land' && property.plotArea && (
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 col-span-2">
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
                        <Maximize2 className="w-4 h-4 text-blue-600" />
                        <span className="font-semibold">Plot Dimensions & Zoning</span>
                      </div>
                      <span className="text-base font-bold text-slate-900 font-mono">
                        {property.plotArea} {property.plotUnit} ({property.zoning || 'Residential NA'})
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* OVERVIEW & DETAILED DESCRIPTION */}
              <div className="space-y-3">
                <h3 className="text-base font-bold text-slate-900">About this Property</h3>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {property.description || 'Contact NS Properties for further details about this listing.'}
                </p>
              </div>

              {/* SECTION 2: ARCHITECTURAL SPECIFICATIONS */}
              <section id="modal-sec-specs" className="space-y-4 pt-4 border-t border-slate-200">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Property Specifications</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[11px] text-slate-400 block font-semibold uppercase">Furnishing</span>
                    <span className="text-sm font-bold text-slate-900 capitalize">
                      {furnishingLabel}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[11px] text-slate-400 block font-semibold uppercase">Bathrooms</span>
                    <span className="text-sm font-bold text-slate-900">
                      {property.bathrooms || property.bedrooms || 2} Luxury Baths
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[11px] text-slate-400 block font-semibold uppercase">Balconies</span>
                    <span className="text-sm font-bold text-slate-900">
                      {property.balconies !== undefined ? `${property.balconies} Balconies` : '2 Balconies'}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[11px] text-slate-400 block font-semibold uppercase">Facing Direction</span>
                    <span className="text-sm font-bold text-slate-900">
                      {property.facing ? `${property.facing} Facing` : 'East Facing'}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[11px] text-slate-400 block font-semibold uppercase">Floor Position</span>
                    <span className="text-sm font-bold text-slate-900">
                      {property.floorNumber !== undefined ? `Floor ${property.floorNumber} of ${property.totalFloors || 'N/A'}` : 'Mid Level Floor'}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[11px] text-slate-400 block font-semibold uppercase">Possession Timeline</span>
                    <span className="text-sm font-bold text-emerald-700">
                      {property.possession === 'ready' ? 'Immediate / Ready' : property.possessionDate}
                    </span>
                  </div>
                </div>
              </section>

              {/* HISTORICAL PRICE TRENDS (D3-BASED LINE CHART) */}
              {property.priceHistory && property.priceHistory.length > 0 && (
                <section id="modal-sec-trends" className="space-y-4 pt-4 border-t border-slate-200">
                  <PriceTrendChart
                    locality={property.locality}
                    city={property.city}
                    priceHistory={property.priceHistory}
                    currentSuperBuiltUpArea={property.superBuiltUpArea}
                  />
                </section>
              )}

              {/* SECTION 3: AMENITIES & FACILITIES */}
              <section id="modal-sec-amenities" className="space-y-4 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>Amenities & Infrastructure ({amenities.length})</span>
                  </h3>
                  <span className="text-xs text-slate-500">Verified On-Site</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {amenities.map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs font-semibold text-slate-800"
                    >
                      {getAmenityIcon(item)}
                      <span className="truncate">{item}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* SECTION 4: INTERACTIVE EMI & FINANCIAL CALCULATOR */}
              {property.listingType === 'sale' && (
                <section id="modal-sec-emi" className="space-y-5 pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calculator className="w-5 h-5 text-blue-600" />
                      <h3 className="text-base font-bold text-slate-900">Home Loan EMI Calculator</h3>
                    </div>
                    <span className="text-xs text-blue-700 font-semibold">Special Bank Rates</span>
                  </div>

                  <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      {/* Loan Amount Slider */}
                      <div>
                        <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                          <span>Loan Amount</span>
                          <span className="font-mono text-blue-700 font-bold">
                            ₹ {(loanAmount / 100000).toFixed(1)} Lakhs
                          </span>
                        </div>
                        <input
                          type="range"
                          min="500000"
                          max={safePrice}
                          step="200000"
                          value={loanAmount}
                          onChange={(e) => setLoanAmount(Number(e.target.value))}
                          aria-label="Adjust Loan Amount"
                          className="w-full accent-blue-600 cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                          <span>₹ 5 L</span>
                          <span>80% Max</span>
                        </div>
                      </div>

                      {/* Tenure Slider */}
                      <div>
                        <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                          <span>Loan Tenure</span>
                          <span className="font-mono text-blue-700 font-bold">{tenureYears} Years</span>
                        </div>
                        <input
                          type="range"
                          min="5"
                          max="30"
                          step="1"
                          value={tenureYears}
                          onChange={(e) => setTenureYears(Number(e.target.value))}
                          aria-label="Adjust Tenure in Years"
                          className="w-full accent-blue-600 cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                          <span>5 Yrs</span>
                          <span>30 Yrs</span>
                        </div>
                      </div>

                      {/* Interest Rate Slider */}
                      <div>
                        <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                          <span>Interest Rate</span>
                          <span className="font-mono text-blue-700 font-bold">{interestRate}%</span>
                        </div>
                        <input
                          type="range"
                          min="7.5"
                          max="12.5"
                          step="0.1"
                          value={interestRate}
                          onChange={(e) => setInterestRate(Number(e.target.value))}
                          aria-label="Adjust Interest Rate"
                          className="w-full accent-blue-600 cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                          <span>7.5%</span>
                          <span>12.5%</span>
                        </div>
                      </div>
                    </div>

                    {/* Calculated EMI Dashboard Box */}
                    <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <span className="text-[11px] text-slate-400 uppercase font-bold block">
                          Monthly Loan Installment
                        </span>
                        <span className="text-2xl sm:text-3xl font-black text-blue-700 font-mono tabular-nums">
                          ₹ {monthlyEMI.toLocaleString('en-IN')}{' '}
                          <span className="text-xs text-slate-500 font-normal">/ month</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-6 text-xs text-slate-600">
                        <div>
                          <span className="text-slate-400 block text-[11px]">Principal Loan</span>
                          <span className="font-bold text-slate-900 font-mono">
                            ₹ {(loanAmount / 10000000).toFixed(2)} Cr
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Total Interest</span>
                          <span className="font-bold text-amber-700 font-mono">
                            ₹ {(totalInterest / 10000000).toFixed(2)} Cr
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar Visualizing Principal vs Interest */}
                    <div>
                      <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden flex">
                        <div
                          className="bg-blue-600 h-full transition-all duration-300"
                          style={{ width: `${principalPercent}%` }}
                          title={`Principal: ${principalPercent}%`}
                        />
                        <div
                          className="bg-amber-500 h-full transition-all duration-300"
                          style={{ width: `${interestPercent}%` }}
                          title={`Interest: ${interestPercent}%`}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500 font-medium mt-1">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-blue-600" /> Principal ({principalPercent}%)
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-amber-500" /> Interest ({interestPercent}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ESTIMATED TAXES & GOVERNMENT CHARGES */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-2">
                    <span className="font-bold text-slate-900 block uppercase tracking-wide text-[11px]">
                      Estimated Government Levies & Registration (~6%)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      <div className="flex justify-between sm:block border-b sm:border-b-0 pb-1 sm:pb-0">
                        <span className="text-slate-500 block">Stamp Duty (5%):</span>
                        <span className="font-mono font-bold text-slate-900">
                          ₹ {estimatedStampDuty.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex justify-between sm:block border-b sm:border-b-0 pb-1 sm:pb-0">
                        <span className="text-slate-500 block">Registration (1%):</span>
                        <span className="font-mono font-bold text-slate-900">
                          ₹ {estimatedRegistration.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex justify-between sm:block">
                        <span className="text-slate-500 block">Monthly Maintenance:</span>
                        <span className="font-mono font-bold text-slate-900">
                          {property.maintenanceMonthly
                            ? `₹ ${Number(property.maintenanceMonthly).toLocaleString('en-IN')} / mo`
                            : 'Included in Lease'}
                        </span>
                      </div>
                    </div>
                  </div>
                </section>
              )}
            </div>

            {/* RIGHT SIDEBAR: ADVISORY, HELPLINE & SELLER CARD (Desktop Sticky) */}
            <div className="lg:col-span-4 lg:sticky lg:top-4 space-y-4">
              
              {/* PRIMARY CONTACT BOX */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-md space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-xs">
                    {sellerInitial}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">{seller.name}</h4>
                    <span className="text-xs text-slate-500 capitalize block">
                      {seller.type} {seller.company ? `· ${seller.company}` : ''}
                    </span>
                    {seller.verified && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-bold mt-0.5">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Verified Advertiser
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  {/* Direct Phone Helpline */}
                  <a
                    href={`tel:${COMPANY_PHONE}`}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Call Helpline: {COMPANY_PHONE_DISPLAY}</span>
                  </a>

                  {/* WhatsApp Quick Inquire */}
                  <a
                    href={`https://wa.me/918073266325?text=${encodeURIComponent(
                      `Hi NS Properties 4, I am interested in: ${property.title} (${property.priceDisplay}, ${property.locality}, ${property.city}). Please share floor plans, brochure & site visit timings.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer text-center"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>WhatsApp Direct (+91 80732 66325)</span>
                  </a>

                  {/* Book Site Visit CTA */}
                  <button
                    onClick={() => openContactModal(property)}
                    className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs sm:text-sm rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>Book Free Site Visit</span>
                  </button>

                  {/* Google Maps Directions */}
                  {/* Google Maps Directions */}
                  {property.coordinates && (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${property.coordinates.lat},${property.coordinates.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-4 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-semibold text-xs sm:text-sm rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Navigation className="w-4 h-4 text-blue-600" />
                      <span>Get Directions (Google Maps)</span>
                    </a>
                  )}

                  {/* Social Media & Link Share Button */}
                  <button
                    type="button"
                    onClick={() => setIsShareModalOpen(true)}
                    className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    title="Share listing to WhatsApp, Email, or copy direct link"
                  >
                    <Share2 className="w-4 h-4 text-blue-600" />
                    <span>Share Listing (WhatsApp / Email / Copy Link)</span>
                  </button>
                </div>

                {/* Trust Seal */}
                <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{COMPANY_NAME} Buyer Protection</span>
                  </div>
                  <p className="leading-relaxed">
                    Transparent title deeds, zero hidden brokerage, and doorstep assistance for document registration.
                  </p>
                </div>
              </div>

              {/* RERA Compliance Notice */}
              {property.reraId && (
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-900">
                  <span className="font-bold flex items-center gap-1.5 mb-1 text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    RERA Registered Project
                  </span>
                  <p className="font-mono text-[11px] text-emerald-700 mb-1">
                    Registration No: {property.reraId}
                  </p>
                  <p className="text-[11px] text-emerald-800/80">
                    Compliant under Real Estate Regulatory Authority. Buyers are entitled to statutory disclosure protection.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MOBILE STICKY QUICK-ACTION DOCK (Only visible on small screens < 640px) */}
        <footer className="sm:hidden shrink-0 bg-white border-t border-slate-200 p-2.5 flex items-center gap-2 z-20 shadow-[0_-4px_15px_rgba(0,0,0,0.08)]">
          <a
            href={`tel:${COMPANY_PHONE}`}
            className="p-3 bg-slate-100 active:bg-slate-200 text-slate-800 rounded-xl flex items-center justify-center cursor-pointer min-h-[46px]"
            title="Call Helpline"
            aria-label="Call Helpline"
          >
            <Phone className="w-5 h-5 text-blue-600" />
          </a>

          <button
            type="button"
            onClick={() => setIsShareModalOpen(true)}
            className="p-3 bg-slate-100 active:bg-slate-200 text-slate-700 rounded-xl flex items-center justify-center cursor-pointer min-h-[46px]"
            title="Share Property"
            aria-label="Share Property"
          >
            <Share2 className="w-5 h-5 text-slate-700" />
          </button>

          <a
            href={`https://wa.me/918073266325?text=${encodeURIComponent(
              `Hi NS Properties 4, I am inquiring about: ${property.title} (${property.priceDisplay}, ${property.locality}, ${property.city}).`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2.5 px-3 bg-emerald-600 active:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 min-h-[46px] cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>WhatsApp</span>
          </a>

          <button
            onClick={() => openContactModal(property)}
            className="flex-1 py-2.5 px-3 bg-blue-600 active:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 min-h-[46px] cursor-pointer shadow-xs"
          >
            <Calendar className="w-4 h-4" />
            <span>Book Visit</span>
          </button>
        </footer>

        {/* Social Media & Direct Link Share Modal */}
        <ShareModal
          property={property}
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
        />
      </div>
    </div>
  );
};
