import React, { useState } from 'react';
import { useProperty } from '../context/PropertyContext';
import { X, CheckCircle2, Phone, Calendar, MessageSquare, FileText } from 'lucide-react';

export const ContactModal: React.FC = () => {
  const { isContactModalOpen, closeContactModal, contactProperty, addInquiry } = useProperty();

  const [inquiryType, setInquiryType] = useState<'callback' | 'site_visit' | 'whatsapp' | 'price_sheet'>('callback');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isContactModalOpen || !contactProperty) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    addInquiry({
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
    });

    setIsSubmitted(true);
  };

  const handleClose = () => {
    setIsSubmitted(false);
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
              The property advertiser (<strong>{contactProperty.seller?.name || 'NS Properties Advisor'}</strong>) and NS Properties 4 desk have received your request.
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
                type="submit"
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
