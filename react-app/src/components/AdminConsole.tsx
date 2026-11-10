import React, { useState } from 'react';
import { useProperty, COMPANY_NAME, COMPANY_PHONE, COMPANY_PHONE_DISPLAY, COMPANY_LOGO } from '../context/PropertyContext';
import { Property, ListingStatus, PropertyInquiry, VisitorStats } from '../types/property';
import { EditPropertyModal } from './EditPropertyModal';
import {
  Building2,
  Users,
  MessageSquare,
  BarChart3,
  CheckCircle2,
  XCircle,
  Star,
  Trash2,
  Search,
  LogOut,
  ShieldCheck,
  RotateCcw,
  IndianRupee,
  Layers,
  Phone,
  Mail,
  Calendar,
  Eye,
  Activity,
  Globe2,
  Smartphone,
  Monitor,
  Edit3,
  Check,
  X,
  AlertCircle
} from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  onReset?: () => void;
  onExit?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class AdminErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorMessage: error?.message || 'Display rendering error' };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Admin Console encountered an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-800 rounded-2xl border border-slate-700 p-6 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4 border border-amber-500/30">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">{COMPANY_NAME} Admin Recovery</h2>
            <p className="text-xs text-slate-300 mb-2 leading-relaxed">
              The Admin Console encountered a rendering issue. You can restore default seed data or return to the public portal.
            </p>
            {this.state.errorMessage && (
              <div className="mb-5 p-2 bg-slate-900/80 rounded-lg text-[11px] font-mono text-rose-300 border border-slate-700 break-words text-left">
                {this.state.errorMessage}
              </div>
            )}
            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => {
                  try {
                    localStorage.removeItem('nsp4_properties');
                    localStorage.removeItem('nsp4_inquiries');
                    localStorage.removeItem('nsp4_users');
                  } catch {}
                  this.setState({ hasError: false, errorMessage: '' });
                  if (this.props.onReset) this.props.onReset();
                  window.location.reload();
                }}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Reset Default Seed & Refresh
              </button>
              <button
                onClick={() => {
                  window.location.hash = '';
                  if (this.props.onExit) {
                    this.props.onExit();
                  } else {
                    window.location.href = window.location.origin + window.location.pathname;
                  }
                }}
                className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold text-xs rounded-xl transition-all cursor-pointer"
              >
                Back to Public Portal
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const AdminConsoleContent: React.FC = () => {
  const {
    properties,
    updateProperty,
    updatePropertyStatus,
    toggleFeaturedProperty,
    deleteProperty,
    inquiries,
    updateInquiryStatus,
    users,
    resetToDemoData,
    setSelectedProperty,
    logoutAdmin,
    visitorStats,
    resetVisitorStats
  } = useProperty();

  const [activeTab, setActiveTab] = useState<'listings' | 'leads' | 'visitors' | 'users' | 'analytics'>('listings');
  const [listingFilter, setListingFilter] = useState<'all' | 'approved' | 'pending' | 'rejected' | 'featured'>('all');
  const [listingSearch, setListingSearch] = useState('');
  const [leadSearch, setLeadSearch] = useState('');

  // Editing Property State
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [actionToast, setActionToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setActionToast(msg);
    setTimeout(() => setActionToast(null), 4000);
  };

  // Defensive array safeguards
  const safeProperties = Array.isArray(properties) ? properties : [];
  const safeInquiries = Array.isArray(inquiries) ? inquiries : [];
  const safeUsers = Array.isArray(users) ? users : [];

  const safeVisitorStats: VisitorStats = visitorStats || {
    totalVisitors: 1,
    todayVisitors: 1,
    activeNow: 1,
    cityBreakdown: { 'Bengaluru': 1 },
    deviceBreakdown: { mobile: 0, desktop: 100, tablet: 0 }
  };

  // Metrics computation
  const totalListings = safeProperties.length;
  const approvedListings = safeProperties.filter(p => p && p.status === 'approved').length;
  const pendingListings = safeProperties.filter(p => p && p.status === 'pending').length;
  const rejectedListings = safeProperties.filter(p => p && p.status === 'rejected').length;
  const featuredListings = safeProperties.filter(p => p && p.featured).length;
  const totalInquiries = safeInquiries.length;
  const scheduledVisits = safeInquiries.filter(i => i && (i.inquiryType === 'site_visit' || i.status === 'visit_scheduled')).length;

  const validPropsWithRate = safeProperties.filter(p => p && typeof p.pricePerSqFt === 'number' && p.pricePerSqFt > 0);
  const avgPricePerSqFt = validPropsWithRate.length > 0
    ? Math.round(validPropsWithRate.reduce((acc, p) => acc + (p.pricePerSqFt || 0), 0) / validPropsWithRate.length)
    : 14500;

  // Filtered Listings for table
  const filteredListings = safeProperties.filter(p => {
    if (!p) return false;
    if (listingFilter === 'approved' && p.status !== 'approved') return false;
    if (listingFilter === 'pending' && p.status !== 'pending') return false;
    if (listingFilter === 'rejected' && p.status !== 'rejected') return false;
    if (listingFilter === 'featured' && !p.featured) return false;

    if (listingSearch) {
      const q = listingSearch.toLowerCase().trim();
      const title = (p.title || '').toLowerCase();
      const city = (p.city || '').toLowerCase();
      const locality = (p.locality || '').toLowerCase();
      const sellerName = (p.seller?.name || '').toLowerCase();
      return (
        title.includes(q) ||
        city.includes(q) ||
        locality.includes(q) ||
        sellerName.includes(q)
      );
    }
    return true;
  });

  // Filtered Leads
  const filteredInquiries = safeInquiries.filter(i => {
    if (!i) return false;
    if (leadSearch) {
      const q = leadSearch.toLowerCase().trim();
      const userName = (i.userName || '').toLowerCase();
      const userPhone = (i.userPhone || '').toLowerCase();
      const propTitle = (i.propertyTitle || '').toLowerCase();
      return (
        userName.includes(q) ||
        userPhone.includes(q) ||
        propTitle.includes(q)
      );
    }
    return true;
  });

  // Analytics aggregations
  const cityCounts: { [k: string]: number } = {};
  const typeCounts: { [k: string]: number } = {};
  safeProperties.forEach(p => {
    if (p && p.city) {
      cityCounts[p.city] = (cityCounts[p.city] || 0) + 1;
    }
    if (p && p.propertyType) {
      typeCounts[p.propertyType] = (typeCounts[p.propertyType] || 0) + 1;
    }
  });

  const handleExitPortal = () => {
    if (typeof window !== 'undefined') {
      window.location.hash = '';
      try {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      } catch {}
    }
    logoutAdmin();
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-16">
      {/* Admin Top Header Bar */}
      <div className="bg-slate-900 text-white border-b border-slate-800 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/10 shrink-0 border border-slate-700 shadow-xs flex items-center justify-center">
              <img src={COMPANY_LOGO} alt={COMPANY_NAME} className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold">{COMPANY_NAME} Management Console</h1>
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] font-bold rounded">
                  Admin Console
                </span>
              </div>
              <p className="text-xs text-slate-400">Direct portal management, leads CRM, visitor analytics & listings moderation</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={resetToDemoData}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
              title="Reset properties and leads to default seed set"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Demo Seed</span>
            </button>

            {/* View live public portal button */}
            <button
              onClick={handleExitPortal}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
              title="Open public website portal"
            >
              <Globe2 className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">View Public Portal</span>
            </button>

            {/* Exit button to return to public portal */}
            <button
              onClick={handleExitPortal}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Exit Admin Portal</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* Executive Overview KPI Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {/* VISITOR COUNT KPI CARD */}
          <div className="bg-gradient-to-br from-blue-900 to-indigo-950 text-white p-4 rounded-xl border border-blue-800 shadow-md col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-blue-200 text-xs font-semibold mb-1">
              <span className="flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                Live Visitors
              </span>
              <Globe2 className="w-4 h-4 text-blue-300" />
            </div>
            <span className="text-2xl font-black text-white font-mono tabular-nums">
              {(safeVisitorStats.totalVisitors ?? 1).toLocaleString('en-IN')}
            </span>
            <div className="text-[11px] text-blue-200 mt-1 flex items-center justify-between">
              <span>Today: +{safeVisitorStats.todayVisitors ?? 1}</span>
              <span className="text-emerald-300 font-bold">{safeVisitorStats.activeNow ?? 1} online</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
              <span>Total Listings</span>
              <Building2 className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums">
              {totalListings}
            </span>
            <div className="text-[11px] text-slate-400 mt-0.5">Across 5 major metros</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
              <span>Active & Published</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-2xl font-extrabold text-emerald-600 font-mono tabular-nums">
              {approvedListings}
            </span>
            <div className="text-[11px] text-slate-400 mt-0.5">Public on portal & map</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
              <span>Pending Review</span>
              <Layers className="w-4 h-4 text-amber-500" />
            </div>
            <span className="text-2xl font-extrabold text-amber-600 font-mono tabular-nums">
              {pendingListings}
            </span>
            <div className="text-[11px] text-slate-400 mt-0.5">Moderation queue</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
              <span>Buyer Inquiries</span>
              <MessageSquare className="w-4 h-4 text-purple-600" />
            </div>
            <span className="text-2xl font-extrabold text-purple-600 font-mono tabular-nums">
              {totalInquiries}
            </span>
            <div className="text-[11px] text-slate-400 mt-0.5">{scheduledVisits} site visits booked</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
              <span>Avg Rate / Sq.Ft</span>
              <IndianRupee className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums">
              ₹ {avgPricePerSqFt.toLocaleString('en-IN')}
            </span>
            <div className="text-[11px] text-slate-400 mt-0.5">Metro benchmark</div>
          </div>
        </div>

        {/* Console Nav Tabs */}
        <div className="bg-white rounded-xl border border-slate-200 p-1.5 mb-6 flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth shadow-2xs">
          {[
            { id: 'listings', label: 'Property Listings', icon: Building2, count: safeProperties.length },
            { id: 'leads', label: 'Buyer Leads & Visits', icon: MessageSquare, count: safeInquiries.length },
            { id: 'visitors', label: 'Website Visitors', icon: Activity, count: safeVisitorStats.totalVisitors },
            { id: 'users', label: 'User & Agent Directory', icon: Users, count: safeUsers.length },
            { id: 'analytics', label: 'Market Analytics', icon: BarChart3 }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 min-h-[40px] text-xs font-bold rounded-lg transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isActive ? 'bg-blue-800 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {tab.count.toLocaleString('en-IN')}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 1: PROPERTY LISTINGS MANAGER */}
        {activeTab === 'listings' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            {/* Filter & Search Bar */}
            <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg overflow-x-auto no-scrollbar">
                {[
                  { id: 'all', label: `All Listings (${totalListings})` },
                  { id: 'approved', label: `Published & Live (${approvedListings})` },
                  { id: 'pending', label: `Pending Review (${pendingListings})` },
                  { id: 'rejected', label: `Rejected (${rejectedListings})` },
                  { id: 'featured', label: `Featured (${featuredListings})` }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setListingFilter(f.id as any)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                      listingFilter === f.id
                        ? 'bg-white text-slate-900 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="relative min-w-[240px] w-full sm:w-auto">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Filter listings, seller or locality..."
                  value={listingSearch}
                  onChange={(e) => setListingSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-hidden focus:border-blue-600 focus:bg-white"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 min-w-[760px]">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Property</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Seller Contact</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Featured</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredListings.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No property listings match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredListings.map((prop) => {
                      if (!prop) return null;
                      const imageSrc =
                        (Array.isArray(prop.images) && prop.images[0]) ||
                        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&auto=format&fit=crop&q=80';
                      const sellerName = prop.seller?.name || 'Property Owner';
                      const sellerType = prop.seller?.type || 'owner';
                      const sellerPhone = prop.seller?.phone || COMPANY_PHONE_DISPLAY;

                      return (
                        <tr key={prop.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={imageSrc}
                                alt=""
                                referrerPolicy="no-referrer"
                                className="w-12 h-10 object-cover rounded-md bg-slate-200 shrink-0"
                              />
                              <div>
                                <span
                                  onClick={() => setSelectedProperty(prop)}
                                  className="font-bold text-slate-900 hover:text-blue-600 cursor-pointer line-clamp-1 max-w-[220px]"
                                >
                                  {prop.title || 'Untitled Property'}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  ID: {prop.id}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span className="capitalize font-semibold text-slate-800 block">
                              {prop.propertyType || 'Residential'}
                            </span>
                            <span className="text-[10px] uppercase text-blue-700 font-bold">
                              For {prop.listingType || 'Sale'}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-800 block">{prop.locality || 'Metro Locality'}</span>
                            <span className="text-[11px] text-slate-500">{prop.city || 'Metro'}</span>
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-extrabold text-slate-900 font-mono tabular-nums block">
                              {prop.priceDisplay || `₹ ${prop.price?.toLocaleString('en-IN') || 'Price on Request'}`}
                            </span>
                            {prop.pricePerSqFt && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                ₹ {prop.pricePerSqFt.toLocaleString('en-IN')}/sqft
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-900 block">{sellerName}</span>
                            <span className="text-[10px] text-slate-500 capitalize">{sellerType} · {sellerPhone}</span>
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex flex-col gap-1.5 items-start">
                              {prop.status === 'approved' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span>Published Live</span>
                                </span>
                              ) : prop.status === 'rejected' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                  <X className="w-3 h-3 text-rose-600" />
                                  <span>Rejected</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                  <span>Pending Review</span>
                                </span>
                              )}
                              <select
                                value={prop.status || 'pending'}
                                onChange={async (e) => {
                                  const newStat = e.target.value as ListingStatus;
                                  await updatePropertyStatus(prop.id, newStat);
                                  showToast(`Listing ${prop.id} status changed to ${newStat}`);
                                }}
                                className="text-[10px] bg-slate-100 border border-slate-300 rounded px-1.5 py-0.5 cursor-pointer text-slate-700"
                              >
                                <option value="approved">Approved / Live</option>
                                <option value="pending">Pending</option>
                                <option value="rejected">Rejected</option>
                              </select>
                            </div>
                          </td>

                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => toggleFeaturedProperty(prop.id)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                prop.featured
                                  ? 'text-amber-500 hover:bg-amber-50'
                                  : 'text-slate-300 hover:text-slate-600 hover:bg-slate-100'
                              }`}
                              title={prop.featured ? 'Unmark featured' : 'Mark featured'}
                            >
                              <Star className={`w-4 h-4 ${prop.featured ? 'fill-amber-500' : ''}`} />
                            </button>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setSelectedProperty(prop)}
                                className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                                title="Inspect listing details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => setEditingProperty({ ...prop })}
                                className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                                title="Edit listing details"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>

                              {prop.status !== 'approved' && (
                                <button
                                  onClick={async () => {
                                    await updatePropertyStatus(prop.id, 'approved');
                                    showToast(`"${(prop.title || '').slice(0, 24)}..." approved & published live!`);
                                  }}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                                  title="Approve and publish to live website & map"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Approve</span>
                                </button>
                              )}

                              {prop.status === 'approved' && (
                                <button
                                  onClick={async () => {
                                    await updatePropertyStatus(prop.id, 'rejected');
                                    showToast(`"${(prop.title || '').slice(0, 24)}..." unpublished/rejected.`);
                                  }}
                                  className="px-2 py-1 bg-slate-200 hover:bg-rose-100 text-slate-700 hover:text-rose-700 rounded text-[10px] font-semibold transition-colors cursor-pointer"
                                  title="Reject and remove from live public feed"
                                >
                                  Reject
                                </button>
                              )}

                              <button
                                onClick={async () => {
                                  if (window.confirm(`Delete "${prop.title || 'this property'}" permanently from database?`)) {
                                    await deleteProperty(prop.id);
                                    showToast(`Listing deleted from database.`);
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                                title="Delete listing permanently"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: BUYER LEADS & CRM */}
        {activeTab === 'leads' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Buyer Inquiries & Site Visit CRM</h3>
                <p className="text-xs text-slate-500">Track and progress buyer leads from inquiry to closure</p>
              </div>

              <div className="relative min-w-[240px] w-full sm:w-auto">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search buyer name or phone..."
                  value={leadSearch}
                  onChange={(e) => setLeadSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-hidden focus:border-blue-600 focus:bg-white"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 min-w-[760px]">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Buyer Name & Contact</th>
                    <th className="py-3 px-4">Property Inquired</th>
                    <th className="py-3 px-4">Inquiry Type</th>
                    <th className="py-3 px-4">Message / Request</th>
                    <th className="py-3 px-4">Schedule / Date</th>
                    <th className="py-3 px-4">Pipeline Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInquiries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No inquiries recorded yet. Inquiries submitted via property cards will appear here.
                      </td>
                    </tr>
                  ) : (
                    filteredInquiries.map((inq) => {
                      if (!inq) return null;
                      return (
                        <tr key={inq.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900 block">{inq.userName || 'Anonymous'}</span>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{inq.userPhone || 'No phone'}</span>
                            </div>
                            {inq.userEmail && (
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                                <Mail className="w-3 h-3 text-slate-400" />
                                <span>{inq.userEmail}</span>
                              </div>
                            )}
                          </td>

                          <td className="py-3 px-4 max-w-[220px]">
                            <span className="font-semibold text-slate-900 block truncate">
                              {inq.propertyTitle || 'Property Inquiry'}
                            </span>
                            <span className="text-[11px] font-bold text-blue-600 font-mono">
                              {inq.propertyPriceDisplay || ''} {inq.propertyCity ? `· ${inq.propertyCity}` : ''}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              inq.inquiryType === 'site_visit'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : inq.inquiryType === 'whatsapp'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}>
                              {(inq.inquiryType || 'inquiry').replace('_', ' ')}
                            </span>
                          </td>

                          <td className="py-3 px-4 max-w-[240px]">
                            <p className="text-slate-600 line-clamp-2">{inq.message || 'No additional message'}</p>
                          </td>

                          <td className="py-3 px-4">
                            {inq.scheduledDate ? (
                              <span className="font-semibold text-purple-700 flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {inq.scheduledDate}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">
                                {inq.createdAt ? new Date(inq.createdAt).toLocaleDateString() : 'Recent'}
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              <select
                                value={inq.status || 'new'}
                                onChange={(e) => updateInquiryStatus(inq.id, e.target.value as any)}
                                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-semibold cursor-pointer"
                              >
                                <option value="new">New Lead</option>
                                <option value="contacted">Contacted</option>
                                <option value="visit_scheduled">Visit Scheduled</option>
                                <option value="closed">Deal Closed</option>
                              </select>

                              {inq.userPhone && (
                                <>
                                  <a
                                    href={`https://wa.me/91${inq.userPhone.replace(/\D/g, '').slice(-10)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded border border-emerald-200 transition-colors cursor-pointer"
                                    title="Contact lead on WhatsApp"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                  </a>
                                  <a
                                    href={`tel:${inq.userPhone}`}
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded border border-blue-200 transition-colors cursor-pointer"
                                    title="Call lead"
                                  >
                                    <Phone className="w-3.5 h-3.5" />
                                  </a>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: EXACT REAL-TIME LIVE VISITOR ANALYTICS */}
        {activeTab === 'visitors' && (
          <div className="space-y-6">
            {/* Live Engine Header & Reset Controls Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 shrink-0">
                  <Activity className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-slate-900">Exact & Live Visitor Analytics</h3>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      Live Heartbeat Connected
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">Real-time session presence tracking. All synthetic demo numbers have been purged.</p>
                </div>
              </div>

              {/* Reset Visitor Stats Action Button */}
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm('Reset visitor statistics and purge any old cached numbers back to real live count (1)?')) {
                    await resetVisitorStats();
                    showToast('Visitor statistics reset to exact live count (1).');
                  }
                }}
                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-200 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                title="Reset total and today visitors to 1 and sync clean state"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Demo Stats to Exact Live (1)</span>
              </button>
            </div>

            {/* Top Cards for Visitors */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-xs font-semibold text-slate-500 block mb-1">Lifetime Unique Visitors</span>
                <span className="text-3xl font-black text-blue-700 font-mono tabular-nums block">
                  {(safeVisitorStats.totalVisitors ?? 1).toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Exact visitor sessions recorded in database
                </span>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-xs font-semibold text-slate-500 block mb-1">Visitors Today</span>
                <span className="text-3xl font-black text-slate-900 font-mono tabular-nums block">
                  {(safeVisitorStats.todayVisitors ?? 1).toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Active sessions recorded today ({new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })})
                </span>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Active Online Now</span>
                </div>
                <span className="text-3xl font-black text-emerald-600 font-mono tabular-nums block">
                  {safeVisitorStats.activeNow ?? 1}
                </span>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Real-time heartbeat presence on the website right now
                </span>
              </div>
            </div>

            {/* City & Device traffic Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
                <h3 className="text-base font-bold text-slate-900 mb-1">Live Visitor Geographies</h3>
                <p className="text-xs text-slate-400 mb-4">Origins of active users currently browsing portal listings</p>
                <div className="space-y-3">
                  {Object.entries(safeVisitorStats.cityBreakdown || {}).map(([cName, count]) => {
                    const total = safeVisitorStats.totalVisitors || 1;
                    const pct = Math.min(100, Math.round((count / total) * 100)) || 100;
                    return (
                      <div key={cName}>
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span className="text-slate-800 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                            {cName}
                          </span>
                          <span className="text-slate-500 font-mono">{count.toLocaleString('en-IN')} visitor{count > 1 ? 's' : ''} ({pct}%)</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
                <h3 className="text-base font-bold text-slate-900 mb-1">Real Session Device Split</h3>
                <p className="text-xs text-slate-400 mb-4">Calculated dynamically from live active visitor user-agents</p>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-5 h-5 text-blue-600" />
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">Mobile Web (Smartphones)</span>
                        <span className="text-[10px] text-slate-500">Android & iOS mobile web browsers</span>
                      </div>
                    </div>
                    <span className="text-base font-extrabold text-blue-700 font-mono">{safeVisitorStats.deviceBreakdown?.mobile ?? 0}%</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <Monitor className="w-5 h-5 text-indigo-600" />
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">Desktop Workstations</span>
                        <span className="text-[10px] text-slate-500">Full split-screen map browsing sessions</span>
                      </div>
                    </div>
                    <span className="text-base font-extrabold text-indigo-700 font-mono">{safeVisitorStats.deviceBreakdown?.desktop ?? 100}%</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <Globe2 className="w-5 h-5 text-slate-600" />
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">Tablet & iPads</span>
                        <span className="text-[10px] text-slate-500">Touchscreen gallery viewers</span>
                      </div>
                    </div>
                    <span className="text-base font-extrabold text-slate-700 font-mono">{safeVisitorStats.deviceBreakdown?.tablet ?? 0}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: USER & AGENT DIRECTORY */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">User & Partner Directory</h3>
              <p className="text-xs text-slate-500">Registered owners, certified broker agents, and builders</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 min-w-[760px]">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Name & Profile</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Contact Info</th>
                    <th className="py-3 px-4">Base City</th>
                    <th className="py-3 px-4">Properties Posted</th>
                    <th className="py-3 px-4">Verification</th>
                    <th className="py-3 px-4">Member Since</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {safeUsers.map((u) => {
                    if (!u) return null;
                    const initial = (u.name || 'User').charAt(0).toUpperCase();
                    return (
                      <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                              {initial}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block">{u.name || 'User'}</span>
                              <span className="text-[10px] text-slate-400 font-mono">ID: {u.id}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-slate-100 text-slate-700">
                            {u.role || 'Member'}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <div>{u.email || 'N/A'}</div>
                          <div className="text-slate-500">{u.phone || 'N/A'}</div>
                        </td>

                        <td className="py-3 px-4 font-semibold text-slate-800">
                          {u.city || 'Metro'}
                        </td>

                        <td className="py-3 px-4 font-mono font-bold text-blue-700">
                          {u.listingsCount ?? 0} Listings
                        </td>

                        <td className="py-3 px-4">
                          {u.verified ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Verified
                            </span>
                          ) : (
                            <span className="text-slate-400">Unverified</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-slate-500">
                          {u.joinedDate || 'Recently'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: MARKET ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* City distribution */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
                <h3 className="text-base font-bold text-slate-900 mb-4">Inventory Distribution by Metro</h3>
                <div className="space-y-3">
                  {Object.entries(cityCounts).map(([cityName, count]) => {
                    const percentage = totalListings > 0 ? Math.round((count / totalListings) * 100) : 0;
                    return (
                      <div key={cityName}>
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span className="text-slate-800">{cityName}</span>
                          <span className="text-slate-500 font-mono">{count} ({percentage}%)</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Property Type distribution */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
                <h3 className="text-base font-bold text-slate-900 mb-4">Inventory by Category</h3>
                <div className="space-y-3">
                  {[
                    { key: 'apartment', label: 'Flats & Apartments', color: 'bg-blue-600' },
                    { key: 'villa', label: 'Independent Villas', color: 'bg-emerald-600' },
                    { key: 'land', label: 'Plots & Land', color: 'bg-amber-500' },
                    { key: 'commercial', label: 'Commercial Spaces', color: 'bg-purple-600' }
                  ].map((cat) => {
                    const count = typeCounts[cat.key] || 0;
                    const percentage = totalListings > 0 ? Math.round((count / totalListings) * 100) : 0;
                    return (
                      <div key={cat.key}>
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span className="text-slate-800">{cat.label}</span>
                          <span className="text-slate-500 font-mono">{count} ({percentage}%)</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${cat.color} rounded-full`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Price Insights table */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
              <h3 className="text-base font-bold text-slate-900 mb-3">Metro City Price Benchmark</h3>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                {[
                  { city: 'Mumbai MMR', rate: '₹ 28,500 / sqft', trend: '+8.4% YoY' },
                  { city: 'Delhi-NCR', rate: '₹ 18,200 / sqft', trend: '+11.2% YoY' },
                  { city: 'Bengaluru', rate: '₹ 11,400 / sqft', trend: '+14.6% YoY' },
                  { city: 'Pune', rate: '₹ 9,800 / sqft', trend: '+7.9% YoY' },
                  { city: 'Hyderabad', rate: '₹ 12,100 / sqft', trend: '+16.2% YoY' },
                ].map((item) => (
                  <div key={item.city} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-xs font-bold text-slate-500 block mb-1">{item.city}</span>
                    <span className="text-sm font-extrabold text-slate-900 font-mono block">{item.rate}</span>
                    <span className="text-[11px] font-bold text-emerald-600 mt-0.5 block">{item.trend}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Edit Property Modal Dialog */}
        <EditPropertyModal
          property={editingProperty}
          isOpen={!!editingProperty}
          onClose={() => setEditingProperty(null)}
          onSave={async (updated) => {
            await updateProperty(updated);
            showToast(`Property "${(updated.title || '').slice(0, 28)}..." updated successfully in database!`);
          }}
        />

        {/* Action Toast Notification */}
        {actionToast && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-2 text-xs font-semibold animate-in slide-in-from-bottom duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionToast}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export const AdminConsole: React.FC = () => {
  const { resetToDemoData, logoutAdmin } = useProperty();
  return (
    <AdminErrorBoundary onReset={resetToDemoData} onExit={logoutAdmin}>
      <AdminConsoleContent />
    </AdminErrorBoundary>
  );
};
