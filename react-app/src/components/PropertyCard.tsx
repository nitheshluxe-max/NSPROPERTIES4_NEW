import React, { useState } from 'react';
import { Property } from '../types/property';
import { useProperty } from '../context/PropertyContext';
import {
  Heart,
  Scale,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Phone,
  MessageSquare,
  Bed,
  Bath,
  Maximize2,
  Building,
  Navigation,
  Eye,
  UserCheck,
  Share2
} from 'lucide-react';
import { calculateDistanceKm } from '../utils/geoData';
import { ShareModal } from './ShareModal';

interface PropertyCardProps {
  property: Property;
  index?: number;
  isActive?: boolean;
  onSelect: (prop: Property) => void;
  onFocusOnMap?: (prop: Property) => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  index,
  isActive = false,
  onSelect,
  onFocusOnMap
}) => {
  if (!property) return null;

  const {
    favorites,
    toggleFavorite,
    comparisonList,
    toggleCompare,
    openContactModal,
    activeMapPropertyId,
    setActiveMapPropertyId,
    newlyPostedId,
    userLocation
  } = useProperty();

  const [isShareOpen, setIsShareOpen] = useState(false);

  const safeImages = Array.isArray(property?.images) && property.images.length > 0
    ? property.images.filter((img): img is string => typeof img === 'string' && img.trim().length > 0)
    : [];
  const displayImages = safeImages.length > 0
    ? safeImages
    : ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80'];

  const isFavorite = favorites.includes(property.id);
  const isCompared = comparisonList.includes(property.id);
  const isMapActive = activeMapPropertyId === property.id;
  const isHighlighted = isActive || isMapActive;
  const isNewlyPosted = newlyPostedId === property.id;

  // Calculate real distance if user has granted location permission
  const distanceKm =
    userLocation && property.coordinates?.lat && property.coordinates?.lng
      ? calculateDistanceKm(
          userLocation.lat,
          userLocation.lng,
          property.coordinates.lat,
          property.coordinates.lng
        )
      : null;

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('a')) return;
    // Clicking card points and pins the property on the map, showing its details in the map
    setActiveMapPropertyId(property.id);
    if (onFocusOnMap) onFocusOnMap(property);
  };

  const getCategoryLabel = () => {
    switch (property.propertyType) {
      case 'apartment':
        return `${property.bedrooms || ''} BHK Flat / Apartment`;
      case 'villa':
        return `${property.bedrooms || ''} BHK Independent Villa`;
      case 'land':
        return `${property.plotArea || property.superBuiltUpArea} ${property.plotUnit || 'sq.ft'} ${property.zoning || 'Plot'}`;
      case 'commercial':
        return property.commercialSubType || 'Commercial Space';
      default:
        return 'Property';
    }
  };

  return (
    <div
      id={`property-card-${property.id}`}
      data-property-id={property.id}
      onClick={handleCardClick}
      className={`group bg-white rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col sm:flex-row hover:shadow-xl relative ${
        isNewlyPosted
          ? 'border-emerald-500 ring-2 ring-emerald-500/40 shadow-lg'
          : isHighlighted
          ? 'border-blue-600 ring-2 ring-blue-500/30 shadow-lg bg-blue-50/10'
          : 'border-slate-200 hover:border-blue-300'
      }`}
    >
      {/* Property Media Image Section */}
      <div className="relative sm:w-72 md:w-80 h-52 sm:h-auto shrink-0 overflow-hidden bg-slate-100 rounded-t-2xl sm:rounded-tr-none sm:rounded-l-2xl">
        <img
          src={displayImages[0]}
          alt={property.title || 'Property'}
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80';
          }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Scrim Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 z-10">
          {index !== undefined && (
            <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-slate-900/90 text-white rounded shadow-sm">
              #{index + 1}
            </span>
          )}
          {isNewlyPosted && (
            <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-white rounded shadow-md ring-2 ring-emerald-300 animate-pulse flex items-center gap-1">
              ✨ Just Listed Live
            </span>
          )}
          {property.featured && (
            <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide bg-amber-500 text-slate-950 rounded shadow-xs">
              Featured
            </span>
          )}
          {(property.isZeroBrokerage || property.seller?.type === 'owner') && (
            <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide bg-emerald-700 text-white rounded shadow-xs flex items-center gap-1">
              <UserCheck className="w-3 h-3 text-emerald-200" />
              <span>0% Brokerage</span>
            </span>
          )}
          {property.verified && (
            <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-600 text-white rounded shadow-xs flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Verified
            </span>
          )}
          {property.reraId && (
            <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-700 text-white rounded shadow-xs flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              RERA
            </span>
          )}
        </div>

        {/* Photo Count badge */}
        <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 bg-black/60 backdrop-blur-xs text-white rounded text-[10px] font-medium">
          {displayImages.length} Photos
        </div>

        {/* Distance Badge if GPS active */}
        {distanceKm !== null && (
          <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 bg-blue-600/90 backdrop-blur-xs text-white rounded text-[10px] font-bold flex items-center gap-1 shadow-xs">
            <Navigation className="w-3 h-3" />
            <span>{distanceKm} km away</span>
          </div>
        )}

        {/* Quick Social Share Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsShareOpen(true);
          }}
          className="absolute top-2.5 right-12 w-8 h-8 rounded-full bg-white/90 text-slate-700 hover:text-blue-600 hover:bg-white flex items-center justify-center transition-transform active:scale-90 shadow-sm cursor-pointer"
          title="Share property listing (WhatsApp, Email, Copy Link)"
          aria-label="Share property listing"
        >
          <Share2 className="w-3.5 h-3.5" />
        </button>

        {/* Shortlist Heart Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(property.id);
          }}
          className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center transition-transform active:scale-90 shadow-sm cursor-pointer ${
            isFavorite
              ? 'bg-rose-50 text-rose-600 fill-rose-600'
              : 'bg-white/90 text-slate-600 hover:text-rose-600'
          }`}
          title={isFavorite ? 'Remove from shortlist' : 'Add to shortlist'}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-600 text-rose-600' : ''}`} />
        </button>
      </div>

      {/* Property Details Section */}
      <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between">
        <div>
          {/* Header Row: Price & Category */}
          <div className="flex items-start justify-between gap-3 mb-1">
            <div>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-xl sm:text-2xl font-black text-slate-950 font-mono tabular-nums">
                  {property.priceDisplay || 'Contact for Price'}
                </span>
                {typeof property.pricePerSqFt === 'number' && !isNaN(property.pricePerSqFt) && (
                  <span className="text-xs text-slate-500 font-mono tabular-nums">
                    @ ₹ {property.pricePerSqFt.toLocaleString('en-IN')}/sq.ft
                  </span>
                )}
                {property.listingType === 'rent' && typeof property.securityDeposit === 'number' && !isNaN(property.securityDeposit) && (
                  <span className="text-xs text-slate-500 font-mono tabular-nums">
                    · Deposit: ₹ {property.securityDeposit.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
              <span className="text-xs font-semibold text-blue-700 tracking-wide block mt-0.5">
                {getCategoryLabel()}
              </span>
            </div>

            {/* Compare Checkbox */}
            <label
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 cursor-pointer select-none"
            >
              <input
                type="checkbox"
                checked={isCompared}
                onChange={() => toggleCompare(property.id)}
                className="w-3.5 h-3.5 text-blue-600 rounded-sm cursor-pointer"
              />
              <span className="hidden md:inline font-medium">Compare</span>
            </label>
          </div>

          {/* Property Title & Address */}
          <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1 mb-1">
            {property.title || 'Property'}
          </h3>
          <div className="flex items-center text-xs text-slate-500 gap-1 mb-3 line-clamp-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{property.locality || 'Bengaluru'}, {property.city || 'Bengaluru'}</span>
            {property.pincode && (
              <span className="font-mono text-slate-400">({property.pincode})</span>
            )}
            {property.landmark && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-slate-400">Near {property.landmark}</span>
              </>
            )}
          </div>

          {/* Specifications Pills & Stats */}
          <div className="grid grid-cols-3 gap-2 py-2.5 px-3 bg-slate-50 rounded-xl text-xs text-slate-700 mb-3 border border-slate-100">
            {/* Area */}
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Built-Up Area</span>
              <span className="font-semibold font-mono tabular-nums">
                {(property.superBuiltUpArea ?? property.plotArea ?? 1000).toLocaleString('en-IN')} sq.ft
              </span>
            </div>

            {/* Carpet Area or Plot Specs */}
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">
                {property.propertyType === 'land' ? 'Zoning' : 'Carpet Area'}
              </span>
              <span className="font-semibold font-mono tabular-nums">
                {property.propertyType === 'land'
                  ? property.zoning || 'Clear Title'
                  : typeof property.carpetArea === 'number' && !isNaN(property.carpetArea)
                  ? `${property.carpetArea.toLocaleString('en-IN')} sq.ft`
                  : 'N/A'}
              </span>
            </div>

            {/* Status */}
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Possession</span>
              <span className="font-semibold text-emerald-700">
                {property.possession === 'ready' ? 'Ready to Move' : property.possessionDate || 'Immediate'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer: Seller Info & Action Buttons */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          {/* Seller Tag */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-[11px] font-bold text-slate-700 uppercase">
              {(property.seller?.name || 'N').charAt(0)}
            </div>
            <div className="text-xs">
              <span className="font-semibold text-slate-900 block leading-tight">
                {property.seller?.name || 'NS Properties Advisor'}
              </span>
              <span className="text-[10px] text-slate-500 capitalize">
                {property.seller?.type || 'owner'} · {property.seller?.verified ? 'Verified' : 'Direct'}
              </span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 flex-wrap">
            {/* Show on Map Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveMapPropertyId(property.id);
                if (onFocusOnMap) onFocusOnMap(property);
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                isHighlighted
                  ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-300'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
              }`}
              title="Show property location on the map"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Show on Map</span>
            </button>

            {/* View Full Specs Modal Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(property);
              }}
              className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
              title="View full specs, amenities, and floor plan"
            >
              <Eye className="w-3.5 h-3.5 text-slate-600" />
              <span>Details</span>
            </button>

            {/* Get Directions Trigger */}
            {property.coordinates?.lat && property.coordinates?.lng && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${property.coordinates.lat},${property.coordinates.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                title="Get directions to this property on Google Maps"
              >
                <Navigation className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden md:inline">Directions</span>
              </a>
            )}

            {/* WhatsApp Enquiry */}
            <a
              href={`https://wa.me/918073266325?text=${encodeURIComponent(
                `Hi NS Properties, I am interested in: ${property.title} (${property.priceDisplay}, ${property.locality}, ${property.city}). Please share details.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex-1 sm:flex-initial px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 border border-emerald-200 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
            >
              <MessageSquare className="w-3.5 h-3.5 shrink-0" />
              <span>WhatsApp</span>
            </a>

            {/* Share Listing Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsShareOpen(true);
              }}
              className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Share listing to WhatsApp, Email, or copy direct link"
            >
              <Share2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Share</span>
            </button>

            {/* Contact Seller Phone Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openContactModal(property);
              }}
              className="flex-1 sm:flex-initial px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer text-center"
            >
              <Phone className="w-3.5 h-3.5 shrink-0" />
              <span>Contact Seller</span>
            </button>
          </div>
        </div>
      </div>

      {/* Social Media & Direct Link Share Modal */}
      <ShareModal
        property={property}
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
      />
    </div>
  );
};
