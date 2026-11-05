(() => {
 const header = document.getElementById("siteHeader");
 if (header) header.innerHTML = `
 <div class="navbar bg-white shadow-sm sticky top-0 z-50 px-4 lg:px-10">
  <div class="navbar-start"><a href="index.html" class="text-xl md:text-2xl font-extrabold tracking-tight brand">NS PROPERTIES <span style="color:#c49a45">4</span></a></div>
  <div class="navbar-center hidden lg:flex"><ul class="menu menu-horizontal gap-1 font-medium">
   <li><a href="index.html">Home</a></li><li><a href="properties.html?type=buy">Buy</a></li><li><a href="properties.html?type=rent">Rent</a></li><li><a href="properties.html?type=new-project">New Projects</a></li><li><a href="properties.html?type=commercial">Commercial</a></li>
  </ul></div>
  <div class="navbar-end gap-2"><a href="post-property.html" class="btn btn-brand btn-sm hidden sm:flex">+ Post Property Free</a>
   <div class="dropdown dropdown-end lg:hidden"><button tabindex="0" class="btn btn-ghost btn-square"><i class="bx bx-menu text-2xl"></i></button><ul tabindex="0" class="dropdown-content menu bg-white rounded-box shadow-lg w-52 p-2"><li><a href="index.html">Home</a></li><li><a href="properties.html?type=buy">Buy</a></li><li><a href="properties.html?type=rent">Rent</a></li><li><a href="properties.html?type=new-project">New Projects</a></li><li><a href="properties.html?type=commercial">Commercial</a></li><li><a href="post-property.html">Post Property Free</a></li></ul></div>
  </div>
 </div>`;
 const footer = document.getElementById("siteFooter");
 if (footer) footer.innerHTML = `<div class="site-footer"><div class="footer-inner">
  <div><h2 class="text-xl font-extrabold">NS PROPERTIES <span style="color:#c49a45">4</span></h2><p class="text-sm text-gray-400 mt-3 leading-6">Your trusted partner for buying, selling and renting properties. Discover the right property with professional assistance.</p></div>
  <div><b>Quick Links</b><a href="index.html">Home</a><a href="properties.html">Properties</a><a href="post-property.html">Post Property</a></div>
  <div><b>Explore</b><a href="properties.html?type=buy">Buy</a><a href="properties.html?type=rent">Rent</a><a href="properties.html?type=commercial">Commercial</a></div>
  <div><b>Contact</b><a href="tel:+917019458179">+91 70194 58179</a><a href="tel:+917411513707">+91 74115 13707</a><a>Bangalore, Karnataka</a></div>
 </div><div class="footer-bottom">© ${new Date().getFullYear()} NS PROPERTIES 4. All Rights Reserved.</div></div>`;
 window.NS = {
  money(n){return "₹"+Number(n||0).toLocaleString("en-IN")},
  escape(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))},
  card(p){return `<article class="property-card"><a href="property-details.html?id=${encodeURIComponent(p.id)}"><img src="${this.escape(p.images?.[0]||"https://placehold.co/800x500/e8eef5/173d68?text=Property+Photo+Pending")}" alt="${this.escape(p.title)}" loading="lazy"><div class="property-card-body"><span class="badge badge-outline badge-sm mb-2">${this.escape(p.badge||p.status)}</span><h3 class="font-bold text-gray-800">${this.escape(p.title)}</h3><p class="muted text-xs mt-2"><i class="bx bx-map"></i> ${this.escape(p.location)}</p><div class="flex justify-between items-center mt-4"><b class="brand">${this.escape(p.priceLabel||this.money(p.price))}</b><span class="text-xs muted">${p.bhk?this.escape(p.bhk+" BHK"):this.escape(p.category)}</span></div><div class="text-xs muted mt-3">${this.escape(p.area)} sq.ft. · ${this.escape(p.bathrooms||"—")} bath</div></div></a></article>`}
 };
})();
