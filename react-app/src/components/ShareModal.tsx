import React, { useState } from 'react';
import { Property } from '../types/property';
import { COMPANY_NAME } from '../context/PropertyContext';
import {
  X,
  Share2,
  Copy,
  Check,
  Mail,
  MessageSquare,
  ExternalLink,
  MapPin,
  Sparkles
} from 'lucide-react';

interface ShareModalProps {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ property, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !property) return null;

  // Build clean direct URL for sharing
  const getDirectUrl = () => {
    if (typeof window === 'undefined') return '';
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    return `${origin}${pathname}#property=${property.id}`;
  };

  const shareUrl = getDirectUrl();
  const shareTitle = `${property.title} | ${property.priceDisplay} on ${COMPANY_NAME}`;
  const shareText = `Check out this property: ${property.title} for ${property.priceDisplay} in ${property.locality}, ${property.city}. Verified on ${COMPANY_NAME}.`;

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        // Fallback for older browsers
        const input = document.createElement('input');
        input.value = shareUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.warn('Failed to copy to clipboard', err);
    }
  };

  // WhatsApp Share URL
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `🏠 *${property.title}*\n💰 *Price:* ${property.priceDisplay}\n📍 *Location:* ${property.locality}, ${property.city}\n\nView details & photos here:\n${shareUrl}`
  )}`;

  // Email Share URL
  const emailSubject = encodeURIComponent(`Property Recommendation: ${property.title} (${property.priceDisplay})`);
  const emailBody = encodeURIComponent(
    `Hi,\n\nI wanted to share this property listing with you on ${COMPANY_NAME}:\n\n` +
    `Property: ${property.title}\n` +
    `Price: ${property.priceDisplay}\n` +
    `Type: ${property.propertyType.toUpperCase()} (For ${property.listingType})\n` +
    `Location: ${property.locality}, ${property.city}\n` +
    `Super Built-up Area: ${property.superBuiltUpArea} sq.ft\n\n` +
    `View the full property details, verified location map, and photos here:\n${shareUrl}\n\n` +
    `Regards,\nShared via ${COMPANY_NAME}`
  );
  const mailtoUrl = `mailto:?subject=${emailSubject}&body=${emailBody}`;

  // Twitter / X Share URL
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    `Explore this property in ${property.city}: ${property.title} for ${property.priceDisplay}`
  )}&url=${encodeURIComponent(shareUrl)}`;

  // LinkedIn Share URL
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;

  // Native Web Share if available
  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      handleCopyLink();
    }
  };

  const hasNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-heading"
    >
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200 z-10 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 id="share-modal-heading" className="text-sm font-bold text-slate-900">
                Share Property
              </h3>
              <p className="text-[11px] text-slate-500">Share via social media, chat, or direct link</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
            aria-label="Close share dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Mini Property Summary Preview */}
          <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
            <img
              src={(Array.isArray(property?.images) && property.images[0]) || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&auto=format&fit=crop&q=80'}
              alt={property?.title || 'Property'}
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&auto=format&fit=crop&q=80';
              }}
              className="w-14 h-14 rounded-lg object-cover bg-slate-200 shrink-0 border border-slate-200"
            />
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-slate-900 truncate">{property.title}</h4>
              <div className="flex items-center gap-1 text-[11px] text-slate-500 truncate mt-0.5">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">{property.locality}, {property.city}</span>
              </div>
              <div className="text-xs font-extrabold text-blue-700 font-mono mt-0.5">
                {property.priceDisplay}
              </div>
            </div>
          </div>

          {/* Social Share Channel Grid */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Share to Platform
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              {/* WhatsApp (High Priority in India) */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100/90 text-emerald-800 border border-emerald-200 transition-all group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <MessageSquare className="w-4 h-4 fill-white" />
                </div>
                <div className="text-left">
                  <span className="text-xs font-bold block">WhatsApp</span>
                  <span className="text-[10px] text-emerald-600">Send to chat</span>
                </div>
              </a>

              {/* Email */}
              <a
                href={mailtoUrl}
                onClick={onClose}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-blue-50 hover:bg-blue-100/90 text-blue-800 border border-blue-200 transition-all group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="text-xs font-bold block">Email</span>
                  <span className="text-[10px] text-blue-600">Send detailed mail</span>
                </div>
              </a>

              {/* Twitter / X */}
              <a
                href={twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-100 hover:bg-slate-200/90 text-slate-800 border border-slate-200 transition-all group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform font-bold text-xs">
                  𝕏
                </div>
                <div className="text-left">
                  <span className="text-xs font-bold block">X (Twitter)</span>
                  <span className="text-[10px] text-slate-500">Post update</span>
                </div>
              </a>

              {/* LinkedIn */}
              <a
                href={linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-sky-50 hover:bg-sky-100/90 text-sky-900 border border-sky-200 transition-all group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-[#0A66C2] text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform font-bold text-xs">
                  in
                </div>
                <div className="text-left">
                  <span className="text-xs font-bold block">LinkedIn</span>
                  <span className="text-[10px] text-sky-600">Share to network</span>
                </div>
              </a>
            </div>
          </div>

          {/* Direct Link Copy Input */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Direct Link
            </label>
            <div className="flex items-center gap-2 p-1.5 bg-slate-50 rounded-xl border border-slate-200">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 bg-transparent border-none text-xs text-slate-700 font-mono px-2 outline-hidden select-all"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                  copied
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
            {copied && (
              <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                <Check className="w-3 h-3" />
                <span>Direct link copied to clipboard. Anyone with this link can open this listing directly!</span>
              </p>
            )}
          </div>

          {/* Native Mobile Share Button (if supported) */}
          {hasNativeShare && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>More Share Options (System Dialog)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
