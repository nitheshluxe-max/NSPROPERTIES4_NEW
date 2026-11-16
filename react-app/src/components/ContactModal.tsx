import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useProperty } from '../context/PropertyContext';
import { X, CheckCircle2, Phone, Calendar, MessageSquare, FileText } from 'lucide-react';

const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;
type TurnstileApi = { render: (el: HTMLElement, options: Record<string, unknown>) => string; remove: (id: string) => void; reset: (id: string) => void };
const getTurnstile = () => (window as Window & { turnstile?: TurnstileApi }).turnstile;

export const ContactModal: React.FC = () => {
  const { isContactModalOpen, closeContactModal, contactProperty } = useProperty();

  const [inquiryType, setInquiryType] = useState<'callback' | 'site_visit' | 'whatsapp' | 'price_sheet'>('callback');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState('');
  const captchaElement = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  useEffect(() => {
    if (!isContactModalOpen || !contactProperty || !turnstileSiteKey) return;
    let cancelled = false;
    const render = () => {
      if (cancelled || !captchaElement.current || widgetId.current || !getTurnstile()) return;
      widgetId.current = getTurnstile()!.render(captchaElement.current, {
        sitekey: turnstileSiteKey,
        callback: (token: string) => setCaptchaToken(token),
        'expired-callback': () => setCaptchaToken(''),
        'error-callback': () => setCaptchaToken('')
      });
    };
    const scriptId = 'nsp4-turnstile-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      document.head.appendChild(script);
    }
    script.addEventListener('load', render);
    const interval = window.setInterval(render, 200);
    render();
    return () => {
      cancelled = true;
      script?.removeEventListener('load', render);
      window.clearInterval(interval);
      if (widgetId.current && getTurnstile()) getTurnstile()!.remove(widgetId.current);
      widgetId.current = null;
      setCaptchaToken('');
    };
  }, [isContactModalOpen, contactProperty?.id]);

  if (!isContactModalOpen || !contactProperty) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!turnstileSiteKey || !captchaToken) { setSubmitError('Complete the security verification before submitting.'); return; }
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const inquiry = {
      propertyId: contactProperty.id,
      propertyTitle: contactProperty.title,
      propertyPriceDisplay: contactProperty.priceDisplay,
      propertyCity: contactProperty.city,
      userName: name,
      userPhone: phone,
      userEmail: email,
      inquiryType,
      scheduledDate: visitDate || undefined,
      message: message || `Inquiring about ${contactProperty.title} in ${contactProperty.city}.`
    };
      const {data, error} = await supabase.functions.invoke('submit-guest-inquiry', {body: {
        property_id: inquiry.propertyId, user_name: inquiry.userName, user_phone: inquiry.userPhone,
        user_email: inquiry.userEmail, inquiry_type: inquiry.inquiryType,
        scheduled_date: inquiry.scheduledDate, message: inquiry.message, captcha_token: captchaToken,
        website: ''
      }});
      if (error || !data?.id) {
        let detail = error?.message || 'Inquiry could not be saved.';
        // Network/CORS failures have no readable HTTP response; give actionable guidance.
        if (error?.message?.includes('Failed to send a request to the Edge Function')) {
          detail = 'Unable to reach the inquiry service. Please retry shortly or contact us directly. (Network/CORS error)';
        }
        const context = (error as {context?: Response} | null)?.context;
        if (context && typeof context.json === 'function') {
          try { const payload = await context.json(); detail = payload.error || detail; } catch { /* retain original error */ }
        }
        throw new Error(detail);
      }

      setIsSubmitted(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to save inquiry. Please try again.');
      setCaptchaToken('');
      if (widgetId.current && getTurnstile()) getTurnstile()!.reset(widgetId.current);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsSubmitted(false);
    setSubmitError(null);
    setIsSubmitting(false);
    setName('');
    setPhone('');
    setEmail('');
    setVisitDate('');
    setMessage('');
    closeContactModal();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200 max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 sm:py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-900">Connect with Seller</h3>
            <p className="text-xs text-slate-500 truncate max-w-[280px]">{contactProperty.title}</p>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSubmitted ? (
          <div className="p-6 text-center space-y-4 overflow-y-auto">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">Inquiry Sent Successfully!</h4>
            <p className="text-xs text-slate-600">
              Your inquiry has been saved successfully. The NS Properties 4 team can now review it in the admin CRM.
            </p>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 text-left space-y-1">
              <div><span className="font-semibold">Direct Seller Line:</span> {contactProperty.seller?.phone || '8073266325'}</div>
              <div><span className="font-semibold">NS Properties 4 Helpline:</span> <a href="tel:8073266325" className="font-bold text-blue-600 hover:underline">8073266325</a></div>
            </div>
            <button
              onClick={handleClose}
              className="w-full py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition-colors cursor-pointer min-h-[44px]"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 text-xs text-slate-700 flex-1 overflow-y-auto">
            {submitError && <div role="alert" className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-xs text-rose-800">Inquiry not saved: {submitError}</div>}
            <div ref={captchaElement} aria-label="Security verification" />
            {!turnstileSiteKey && <p role="alert" className="text-rose-700">Guest inquiry verification is not configured. Set VITE_TURNSTILE_SITE_KEY in Vercel.</p>}
            {/* Inquiry Action Type */}
            <div>
              <label className="block font-bold text-slate-800 mb-2">I want to:</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { type: 'callback', label: 'Request Call', icon: Phone },
                  { type: 'site_visit', label: 'Book Site Visit', icon: Calendar },
                  { type: 'whatsapp', label: 'WhatsApp Chat', icon: MessageSquare },
                  { type: 'price_sheet', label: 'Price Brochure', icon: FileText },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = inquiryType === item.type;
                  return (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => setInquiryType(item.type as any)}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-left font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50 border-blue-600 text-blue-700'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Inputs */}
            <div>
              <label className="block font-semibold text-slate-800 mb-1">Your Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Rahul Verma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-blue-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">Phone Number (with WhatsApp) *</label>
              <input
                type="tel"
                required
                placeholder="+91 98000 00000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-blue-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">Email Address</label>
              <input
                type="email"
                placeholder="rahul@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-blue-600 focus:bg-white"
              />
            </div>

            {inquiryType === 'site_visit' && (
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Preferred Visit Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-blue-600 focus:bg-white"
                />
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-800 mb-1">Custom Message / Questions</label>
              <textarea
                rows={2}
                placeholder="Ask about floor, price negotiation, loan assistance..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-blue-600 focus:bg-white"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit" disabled={isSubmitting}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
              >
                Send Inquiry to Seller
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
