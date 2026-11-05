(async()=>{await NS_BACKEND.init();
const params=new URLSearchParams(location.search);
const property=window.NS_PROPERTIES.find(p=>p.id===(params.get("id")||"1001"))||window.NS_PROPERTIES[0];
if(!property){document.querySelector("main").textContent="No approved properties are available yet.";return;}
const $=id=>document.getElementById(id);
document.title=property.title+" | NS PROPERTIES 4";
$("detailBadge").textContent=property.badge||property.status;
$("detailTitle").textContent=property.title;
$("detailLocation").textContent="📍 "+property.location;
$("detailPrice").textContent=property.priceLabel||NS.money(property.price);
$("detailRate").textContent=property.rate||"";
$("detailId").textContent="NSP-"+property.id;
$("detailDescription").textContent=property.description;
$("detailLocationText").textContent="Explore the neighbourhood around "+property.location+". Contact our team for exact property directions and a site visit.";
const specs=[["bx-bed",property.bhk?property.bhk+" BHK":"—","Bedrooms"],["bx-bath",property.bathrooms||"—","Bathrooms"],["bx-area",(property.area||"—")+" sq.ft.","Built-up Area"],["bx-building",property.category,"Type"]];
$("detailSpecs").innerHTML=specs.map(s=>`<div class="bg-slate-50 rounded-xl p-4"><i class="bx ${s[0]} text-2xl brand"></i><p class="muted text-xs mt-2">${s[2]}</p><b>${NS.escape(s[1])}</b></div>`).join("");
const facts=[["Facing",property.facing],["Floor",property.floor],["Furnishing",property.furnishing],["Possession",property.possession]];
$("detailFacts").innerHTML=facts.map(f=>`<div><span class="muted">${f[0]}</span><p class="font-semibold mt-1">${NS.escape(f[1]||"Not specified")}</p></div>`).join("");
$("detailAmenities").innerHTML=(property.amenities||[]).map(a=>`<div class="flex gap-2 items-center text-sm"><i class="bx bx-check-circle text-green-600 text-lg"></i>${NS.escape(a)}</div>`).join("");
const imgs=property.images||[];
$("detailGallery").innerHTML=imgs.slice(0,5).map((src,i)=>`<button class="${i===0?"md:col-span-2 md:row-span-2 h-64 md:h-[410px]":"h-32 md:h-[198px]"} rounded-xl overflow-hidden" data-img="${i}"><img class="w-full h-full object-cover" src="${src}" alt="Property photo ${i+1}"></button>`).join("");
document.querySelectorAll("#detailGallery button").forEach(b=>b.addEventListener("click",()=>{$("galleryLarge").src=imgs[Number(b.dataset.img)];$("galleryViewer").showModal()}));
$("closeGallery").addEventListener("click",()=>$("galleryViewer").close());
const mapQuery=encodeURIComponent(property.map||property.location);
$("detailMap").src="https://www.google.com/maps?q="+mapQuery+"&output=embed";
$("openMap").href="https://www.google.com/maps/search/?api=1&query="+mapQuery;
const phone="917019458179";
function wa(text){return "https://wa.me/"+phone+"?text="+encodeURIComponent(text)}
$("detailWhatsApp").href=wa("Hello NS PROPERTIES 4, I am interested in "+property.title+" ("+property.location+"), property ID "+property.id+". Please contact me.");
const savedKey="ns_properties_wishlist";
function getSaved(){try{return JSON.parse(localStorage.getItem(savedKey)||"[]")}catch{return[]}}
function updateSave(){const yes=getSaved().includes(property.id);$("saveProperty").innerHTML=yes?'<i class="bx bxs-heart text-red-500"></i> Saved':'<i class="bx bx-heart"></i> Save'}
$("saveProperty").addEventListener("click",()=>{let a=getSaved();a=a.includes(property.id)?a.filter(x=>x!==property.id):[...a,property.id];localStorage.setItem(savedKey,JSON.stringify(a));updateSave()});updateSave();
$("shareProperty").addEventListener("click",async()=>{try{if(navigator.share)await navigator.share({title:property.title,url:location.href});else{await navigator.clipboard.writeText(location.href);alert("Link copied")}}catch(e){if(e.name!=="AbortError")alert("Could not share link")}});
$("detailEnquiry").addEventListener("submit",async e=>{
 e.preventDefault();
 const name=$("enqName").value.trim(),phone=$("enqPhone").value.trim();
 if(!/^[0-9]{10}$/.test(phone)){alert("Enter a valid 10-digit mobile number");return;}
 if(!NS_BACKEND.available){alert("This is a demo property. Use the WhatsApp link to enquire.");return;}
 const button=e.target.querySelector('button[type="submit"],button:not([type])');if(button)button.disabled=true;
 try{await NS_BACKEND.submit("enquiry.php",{propertyId:property.id,name,phone,email:$("enqEmail").value.trim(),type:$("enqType").value,message:$("enqMessage").value});alert("Enquiry submitted successfully.");e.target.reset();}
 catch(err){alert(err.message)}finally{if(button)button.disabled=false;}
});
$("similarProperties").innerHTML=window.NS_PROPERTIES.filter(p=>p.id!==property.id).slice(0,3).map(p=>NS.card(p)).join("");

})();
