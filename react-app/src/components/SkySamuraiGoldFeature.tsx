import React from 'react';
import { ArrowRight, Crown, MapPin, Sparkles } from 'lucide-react';

export function SkySamuraiGoldFeature() {
 return <section aria-label="Gold Collection featured property" className="max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-5">
  <a href="#project/ds-max-sky-samurai" className="group relative block overflow-hidden rounded-3xl border-[3px] border-[#b8860b] bg-gradient-to-br from-[#fff0b2] via-[#eac15c] to-[#b87b18] shadow-[0_18px_42px_rgba(141,91,12,.26)] hover:shadow-[0_22px_48px_rgba(141,91,12,.36)] transition-shadow">
   <div aria-hidden="true" className="absolute -right-24 -top-28 h-80 w-80 rounded-full border-[45px] border-white/20"/>
   <div aria-hidden="true" className="absolute right-8 bottom-0 h-32 w-48 rounded-t-full bg-white/10"/>
   <div className="relative grid lg:grid-cols-[1.4fr_.6fr] gap-5 p-6 sm:p-9 lg:p-11 items-center">
    <div>
     <span className="inline-flex items-center gap-2 rounded-full bg-[#201707] text-[#ffe29a] px-4 py-2 text-xs sm:text-sm font-black tracking-wider shadow-md"><Crown className="w-4 h-4"/> GOLD COLLECTION <Sparkles className="w-4 h-4"/></span>
     <h2 className="mt-5 font-serif text-4xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight text-[#211708] drop-shadow-[0_1px_0_rgba(255,255,255,.35)]">DS-MAX Sky Samurai</h2>
     <p className="mt-3 text-lg sm:text-xl font-bold text-[#49300c]">Premium 2 & 3 BHK Apartments · Whitefield, Bengaluru</p>
     <p className="mt-3 flex items-center gap-2 text-[#49300c] text-sm font-semibold"><MapPin className="w-4 h-4"/>Soukya Road, Whitefield</p>
     <p className="mt-5 text-[#49300c] max-w-2xl leading-relaxed">Explore project highlights, configurations, amenities, floor-plan information and indicative home-loan estimates in our detailed project guide.</p>
     <span className="mt-7 inline-flex items-center gap-3 rounded-xl bg-[#1c1711] px-6 py-3.5 font-extrabold text-white shadow-lg group-hover:bg-[#49300c] transition-colors">View Gold Project Details <ArrowRight className="w-5 h-5"/></span>
    </div>
    <div className="rounded-2xl border-2 border-[#a87820] bg-[#fff9e6]/80 backdrop-blur p-6 sm:p-8 shadow-inner">
     <p className="uppercase tracking-widest text-xs font-bold text-[#8b5910]">Indicative starting price</p>
     <p className="mt-2 font-serif font-black text-4xl sm:text-5xl text-[#241808]">₹78.38 L*</p>
     <div className="mt-5 border-t border-[#c59a49] pt-4 grid grid-cols-2 gap-4">
      <div><p className="text-xs text-[#704a16]">Configurations</p><p className="font-bold text-lg text-[#241808]">2 & 3 BHK</p></div>
      <div><p className="text-xs text-[#704a16]">Area range</p><p className="font-bold text-lg text-[#241808]">1,104–1,632</p><p className="text-xs text-[#704a16]">sq. ft.</p></div>
     </div>
     <p className="mt-5 text-xs text-[#704a16]">*Indicative developer-listed pricing; confirm current rates, availability and applicable charges.</p>
    </div>
   </div>
  </a>
 </section>;
}
