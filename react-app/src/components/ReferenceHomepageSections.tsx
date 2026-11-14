import React, { useMemo } from 'react';
import {
  ArrowRight, BedDouble, Building2, BriefcaseBusiness, CheckCircle2, Heart,
  Home, KeyRound, LandPlot, MapPin, MessageSquare, PlusCircle, ShieldCheck,
  Sparkles, UserCheck, Users, Eye
} from 'lucide-react';
import { useProperty } from '../context/PropertyContext';
import type { Property, PropertyCategory, ListingPurpose } from '../types/property';

// A UI port of the landing-page sections in NS_PROPERTIES_4, adapted to the
// current Supabase/React application and its existing property state.
const scrollToExplorer = () => document.getElementById('map-search-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
const postProperty = () => { window.location.hash = '#post-property'; };

type Offering = {
  title: string; subtitle: string; image: string; badge: string;
  icon: React.ComponentType<{ className?: string }>;
  listingType: ListingPurpose | 'all'; propertyType: PropertyCategory | 'all';
  zeroBrokerageOnly?: boolean;
};

const offerings: Offering[] = [
  { title: 'Buy a Home', subtitle: 'Apartments, gated villas & independent houses', badge: 'Find Your Home', icon: Home, listingType: 'sale', propertyType: 'apartment', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&auto=format&fit=crop&q=80' },
  { title: 'Rent a Home', subtitle: 'Furnished & semi-furnished flats and villas', badge: 'Rental Homes', icon: KeyRound, listingType: 'rent', propertyType: 'all', image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=900&auto=format&fit=crop&q=80' },
  { title: 'PG & Co-living', subtitle: 'Managed stays near IT parks & tech corridors', badge: 'Zero Brokerage Stays', icon: Users, listingType: 'rent', propertyType: 'all', zeroBrokerageOnly: true, image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=900&auto=format&fit=crop&q=80' },
  { title: 'Buy Plots/Land', subtitle: 'BDA, BMRDA, DTCP & gated villa plots', badge: 'Approved Plots', icon: LandPlot, listingType: 'sale', propertyType: 'land', image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=900&auto=format&fit=crop&q=80' },
  { title: 'Commercial Properties', subtitle: 'Grade-A offices, retail shops & tech spaces', badge: 'Commercial Spaces', icon: BriefcaseBusiness, listingType: 'all', propertyType: 'commercial', image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=900&auto=format&fit=crop&q=80' },
  { title: 'New Projects', subtitle: 'Builder townships & new launches', badge: 'Builder Projects', icon: Building2, listingType: 'all', propertyType: 'all', image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=900&auto=format&fit=crop&q=80' }
];

const locations = [
  { name: 'Whitefield', tag: 'IT & Metro Hub', image: 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800&auto=format&fit=crop&q=80' },
  { name: 'Soukya Road', tag: 'Villa & Residential Growth Corridor', image: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&auto=format&fit=crop&q=80' },
  { name: 'Hoskote', tag: 'STRR & Neo-Bengaluru Belt', image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80' },
  { name: 'Sarjapur', tag: 'Tech Parks & International Schools', image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop&q=80' },
  { name: 'Varthur', tag: 'Lakefront High-Rise Corridor', image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop&q=80' },
  { name: 'Gunjur', tag: 'East Bengaluru Residential Hub', image: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&auto=format&fit=crop&q=80' },
  { name: 'Kadugodi', tag: 'Purple Line Metro & ITPL Access', image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80' },
  { name: 'Electronic City', tag: 'Major IT Campus & Expressway Hub', image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80' }
];

function SectionHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-7">
    <div><span className="text-[11px] font-extrabold uppercase tracking-widest text-blue-600 block mb-1">{eyebrow}</span>
      <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight">{title}</h2></div>
    {subtitle && <p className="text-xs sm:text-sm text-slate-500 max-w-md">{subtitle}</p>}
  </div>;
}

export function ReferenceHomepageTop({ onFocusPropertyOnMap }: { onFocusPropertyOnMap: (property: Property) => void }) {
  const { properties, setFilters, resetFilters, setSelectedProperty, favorites, toggleFavorite } = useProperty();
  const approved = useMemo(() => properties.filter(p => p.status === 'approved'), [properties]);
  const featured = useMemo(() => [...approved.filter(p => p.featured), ...approved.filter(p => !p.featured)].slice(0, 6), [approved]);

  function selectOffering(item: Offering) {
    setFilters({ listingType: item.listingType, propertyType: item.propertyType, zeroBrokerageOnly: !!item.zeroBrokerageOnly,
      searchQuery: '', locality: '', city: 'all' });
    scrollToExplorer();
  }
  function selectLocation(name: string) {
    setFilters({ city: 'Bengaluru', locality: name, searchQuery: name, listingType: 'all', propertyType: 'all' });
    scrollToExplorer();
  }

  return <div className="bg-white">
    <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-10 sm:py-14 border-b border-slate-100" aria-label="Explore our offerings">
      <SectionHeading eyebrow="Explore Our Offerings" title="Everything You Need in Real Estate"
        subtitle="Browse homes, plots, commercial spaces and new builder projects with our interactive property search."/>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {offerings.map(item => { const Icon = item.icon; return <button key={item.title} type="button" onClick={() => selectOffering(item)}
          className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-xs hover:shadow-xl hover:border-blue-400 transition-all duration-300 cursor-pointer">
          <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-slate-900">
            <img src={item.image} loading="lazy" alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent"/>
            <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-blue-600/95 text-white text-[10px] font-extrabold uppercase tracking-wider">{item.badge}</span>
            <div className="absolute bottom-3 left-3.5 right-3.5 flex items-end justify-between text-white">
              <div><h3 className="text-base sm:text-lg font-black tracking-tight group-hover:text-blue-300 transition-colors">{item.title}</h3>
                <p className="text-xs text-slate-200 line-clamp-1">{item.subtitle}</p></div>
              <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center shrink-0"><Icon className="w-4 h-4 text-white"/></div>
            </div>
          </div>
        </button>; })}
      </div>
    </section>

    <section className="bg-slate-50/70 border-b border-slate-200/80 py-10 sm:py-14" aria-label="Popular locations">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-7">
          <SectionHeading eyebrow="High-Growth Corridors" title="Explore Popular Locations"/>
          <button type="button" onClick={() => { resetFilters(); scrollToExplorer(); }}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-800">
            View All Locations on Map <ArrowRight className="w-4 h-4"/>
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-5">
          {locations.map(loc => {
            const count = approved.filter(p => [p.locality, p.address, p.title].some(t => t.toLowerCase().includes(loc.name.toLowerCase()))).length;
            return <button key={loc.name} type="button" onClick={() => selectLocation(loc.name)}
              className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-lg hover:border-blue-500 transition-all text-left flex flex-col">
              <div className="relative h-28 sm:h-36 w-full overflow-hidden bg-slate-900">
                <img src={loc.image} loading="lazy" alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent"/>
                <div className="absolute bottom-2.5 left-3 right-3 flex items-center gap-1 text-white font-black text-sm sm:text-base">
                  <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0"/><span className="truncate">{loc.name}</span></div>
              </div>
              <div className="p-3 flex items-center justify-between gap-2">
                <div className="min-w-0"><p className="text-[11px] font-semibold text-slate-600 truncate">{loc.tag}</p>
                  <p className="text-[10px] text-blue-600 font-bold mt-0.5">{count > 0 ? `${count} Active Listings` : 'Explore Properties & Map'}</p></div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 shrink-0"/>
              </div>
            </button>;
          })}
        </div>
      </div>
    </section>

    <section id="featured-properties-section" className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-7">
        <div><span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-blue-600 mb-1"><Sparkles className="w-3.5 h-3.5"/> Handpicked & Verified</span>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900">Featured Properties</h2></div>
        <button type="button" onClick={() => { resetFilters(); scrollToExplorer(); }}
          className="px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs sm:text-sm flex items-center gap-1.5">
          Browse All {approved.length} Properties <ArrowRight className="w-4 h-4"/>
        </button>
      </div>
      {featured.length === 0 ? <p className="text-sm text-slate-500">Approved properties will appear here when available.</p> :
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {featured.map(prop => <article key={prop.id} className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-xl hover:border-blue-400 transition-all flex flex-col">
            <div className="relative h-52 bg-slate-200">
              {prop.images?.[0] && <img src={prop.images[0]} loading="lazy" alt={prop.title} className="w-full h-full object-cover"/>}
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/85 to-transparent pointer-events-none"/>
              <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-blue-600 text-white text-[10px] font-extrabold uppercase">{prop.listingType === 'rent' ? 'For Rent' : 'For Sale'}</span>
              {prop.isZeroBrokerage && <span className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-emerald-600 text-white text-[10px] font-extrabold">0% Brokerage</span>}
              <strong className="absolute bottom-3 left-3.5 text-white text-xl font-black">{prop.priceDisplay}</strong>
              <button type="button" onClick={() => toggleFavorite(prop.id)} aria-label={favorites.includes(prop.id) ? 'Remove saved property' : 'Save property'}
                className="absolute bottom-3 right-3 p-2 rounded-lg bg-white/90">
                <Heart className={`w-4 h-4 ${favorites.includes(prop.id) ? 'fill-rose-500 text-rose-600' : 'text-slate-700'}`}/>
              </button>
            </div>
            <div className="p-4 sm:p-5 flex-1 flex flex-col gap-3">
              <div><div className="flex justify-between gap-2 text-[11px] font-bold uppercase text-blue-600">{prop.propertyType}
                {prop.verified && <span className="flex items-center gap-1 text-emerald-700"><ShieldCheck className="w-3.5 h-3.5"/> Verified</span>}</div>
                <button type="button" className="text-left font-extrabold text-slate-900 group-hover:text-blue-700 mt-1" onClick={() => setSelectedProperty(prop)}>{prop.title}</button>
                <p className="text-xs text-slate-600 flex items-center gap-1 mt-1"><MapPin className="w-3.5 h-3.5 text-blue-600"/>{prop.locality}, {prop.city}</p></div>
              <div className="grid grid-cols-3 gap-2 text-center bg-slate-50 rounded-xl p-2.5 border border-slate-200">
                <div><span className="text-[10px] text-slate-500 uppercase block">Configuration</span><strong className="text-xs"><BedDouble className="w-3 h-3 text-blue-600 inline"/> {prop.bedrooms ? prop.bedrooms + ' BHK' : prop.propertyType}</strong></div>
                <div className="border-x border-slate-200"><span className="text-[10px] text-slate-500 uppercase block">Built-up</span><strong className="text-xs">{prop.superBuiltUpArea?.toLocaleString('en-IN')} sq.ft</strong></div>
                <div><span className="text-[10px] text-slate-500 uppercase block">Carpet</span><strong className="text-xs">{prop.carpetArea ? prop.carpetArea.toLocaleString('en-IN') + ' sq.ft' : '—'}</strong></div>
              </div>
              {prop.reraId && <p className="text-xs text-blue-800 bg-blue-50 rounded-lg px-3 py-2"><CheckCircle2 className="w-3.5 h-3.5 inline"/> RERA: {prop.reraId}</p>}
              <div className="grid grid-cols-2 gap-2 mt-auto">
                <button type="button" onClick={() => { onFocusPropertyOnMap(prop); scrollToExplorer(); }} className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 flex items-center justify-center gap-1.5"><MapPin className="w-4 h-4"/> View on Map</button>
                <button type="button" onClick={() => setSelectedProperty(prop)} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 flex items-center justify-center gap-1.5"><Eye className="w-4 h-4"/> View Details</button>
              </div>
            </div>
          </article>)}
        </div>}
    </section>
    {favorites.length > 0 && <section id="saved-properties-section" className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pb-10 scroll-mt-20">
      <div className="rounded-3xl bg-gradient-to-br from-rose-50 via-white to-slate-50 p-5 sm:p-7 border border-rose-200">
        <div className="flex items-center gap-2 mb-5"><Heart className="w-5 h-5 fill-rose-600 text-rose-600"/>
          <h2 className="font-black text-xl text-slate-900">Your Saved Properties ({favorites.length})</h2></div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {approved.filter(p => favorites.includes(p.id)).map(p => <button key={p.id} type="button" onClick={() => setSelectedProperty(p)}
            className="text-left rounded-2xl bg-white border border-slate-200 overflow-hidden hover:shadow-lg">
            {p.images?.[0] && <img src={p.images[0]} alt={p.title} loading="lazy" className="w-full h-36 object-cover"/>}
            <div className="p-4"><strong className="block text-slate-900">{p.title}</strong>
              <span className="block mt-1 text-xs text-slate-500">{p.locality}, {p.city}</span>
              <span className="block mt-2 text-blue-700 font-bold">{p.priceDisplay}</span></div>
          </button>)}
        </div>
      </div>
    </section>}
    <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pb-10 sm:pb-12">
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 sm:p-8 md:p-10 border border-blue-800/40 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-2.5 max-w-2xl">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-extrabold uppercase"><UserCheck className="w-4 h-4"/> 100% Zero Brokerage Guarantee</span>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black">Connect Directly with Property Owners & Builders</h2>
          <p className="text-xs sm:text-sm text-slate-300">Explore owner-listed homes, plots and builder projects, with direct inquiry options.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => { setFilters({ zeroBrokerageOnly: true }); scrollToExplorer(); }} className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 font-black text-xs sm:text-sm">Explore Zero Brokerage Homes</button>
          <button onClick={postProperty} className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 font-bold text-xs sm:text-sm flex items-center gap-2"><PlusCircle className="w-4 h-4"/> Post Owner Property FREE</button>
        </div>
      </div>
    </section>
  </div>;
}

export function ReferenceHomepageBottom() {
  const { properties, setSelectedProperty } = useProperty();
  const projects = useMemo(() => properties.filter(p => p.status === 'approved' && (p.seller?.type === 'builder' || p.possession === 'under-construction' || p.possession === 'new-launch')).slice(0, 6), [properties]);
  return <div className="bg-white">
    <section id="new-projects-section" className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-10 sm:py-14 border-t border-slate-100">
      <SectionHeading eyebrow="New & Upcoming Developments" title="Explore New Builder Projects" subtitle="Discover current project listings and upcoming opportunities."/>
      {projects.length === 0 ? <p className="text-sm text-slate-500">New projects will appear here after approval.</p> :
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {projects.map(p => <button key={p.id} type="button" onClick={() => setSelectedProperty(p)} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs text-left hover:shadow-lg">
          <div className="h-44 bg-slate-200">{p.images?.[0] && <img src={p.images[0]} alt={p.title} loading="lazy" className="w-full h-full object-cover"/>}</div>
          <div className="p-4"><strong className="text-base text-slate-900 block">{p.title}</strong>
            <p className="text-xs text-slate-500 mt-1">{p.locality}, {p.city}</p><p className="text-sm font-black text-blue-700 mt-2">{p.priceDisplay}</p></div>
        </button>)}
      </div>}
    </section>
    <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pb-10 sm:pb-14">
      <div className="rounded-3xl border border-blue-200 bg-blue-50 p-7 sm:p-10 flex flex-col md:flex-row gap-5 md:items-center justify-between">
        <div><span className="text-[11px] text-blue-700 uppercase tracking-widest font-black">List with NS Properties</span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">Post Your Property for FREE</h2>
          <p className="text-sm text-slate-600 mt-2">Owners, builders and agents can submit listings with photos and brochures for review.</p></div>
        <button onClick={postProperty} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-extrabold flex items-center justify-center gap-2 shrink-0"><PlusCircle className="w-5 h-5"/> Post Property FREE</button>
      </div>
    </section>
  </div>;
}
