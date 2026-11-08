(async()=>{await NS_BACKEND.init();
const all=window.NS_PROPERTIES;
const ids=["Type","Category","Location","MaxPrice","Bhk","Status"];
const controls=Object.fromEntries(ids.map(k=>[k,document.getElementById("filter"+k)]));
const mobile=Object.fromEntries(ids.map(k=>[k,document.getElementById("m"+k)]));
const params=new URLSearchParams(location.search);
if(params.has("type"))controls.Type.value=params.get("type");
if(params.has("category"))controls.Category.value=params.get("category").toLowerCase();
if(params.has("location"))controls.Location.value=params.get("location");
if(params.has("max_price"))controls.MaxPrice.value=params.get("max_price");
let listView=false;
function filtered(){
 const type=controls.Type.value,cat=controls.Category.value,loc=controls.Location.value.toLowerCase(),max=Number(controls.MaxPrice.value)||Infinity,bhk=controls.Bhk.value,status=controls.Status.value,term=document.getElementById("listingSearch").value.toLowerCase();
 let items=all.filter(p=>(!type||p.type===type)&&(!cat||p.category===cat)&&(!loc||p.location.toLowerCase().includes(loc))&&p.price<=max&&(!bhk||(bhk==="4"?p.bhk>=4:p.bhk===Number(bhk)))&&(!status||p.status===status)&&(!term||(p.title+" "+p.location).toLowerCase().includes(term)));
 const sort=document.getElementById("sortBy").value;
 if(sort==="low")items.sort((a,b)=>a.price-b.price);else if(sort==="high")items.sort((a,b)=>b.price-a.price);else items.sort((a,b)=>Number(b.id)-Number(a.id));
 return items;
}
function render(){
 const items=filtered(),box=document.getElementById("propertyResults");
 document.getElementById("resultCount").textContent=items.length+" properties found";
 document.getElementById("emptyState").classList.toggle("hidden",items.length!==0);
 box.className=listView?"grid grid-cols-1 gap-4":"grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5";
 box.innerHTML=items.map(p=>NS.card(p)).join("");
}
function clear(){
 Object.values(controls).forEach(el=>el.value="");document.getElementById("listingSearch").value="";render();
}
Object.values(controls).forEach(el=>el.addEventListener("input",render));
document.getElementById("listingSearch").addEventListener("input",render);
document.getElementById("sortBy").addEventListener("change",render);
document.getElementById("clearFilters").addEventListener("click",clear);
document.getElementById("emptyClear").addEventListener("click",clear);
document.getElementById("gridView").addEventListener("click",()=>{listView=false;render()});
document.getElementById("listView").addEventListener("click",()=>{listView=true;render()});
document.getElementById("mobileFilterBtn").addEventListener("click",()=>{ids.forEach(k=>mobile[k].value=controls[k].value);document.getElementById("mobileFilters").showModal()});
document.getElementById("closeMobileFilters").addEventListener("click",()=>document.getElementById("mobileFilters").close());
document.getElementById("applyMobileFilters").addEventListener("click",()=>{ids.forEach(k=>controls[k].value=mobile[k].value);render();document.getElementById("mobileFilters").close()});
document.getElementById("mobileClear").addEventListener("click",()=>{ids.forEach(k=>mobile[k].value="")});
render();

})();
