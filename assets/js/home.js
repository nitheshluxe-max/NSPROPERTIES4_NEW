const featured = document.getElementById("featuredProperties");
if (featured) featured.innerHTML = window.NS_PROPERTIES.slice(0,3).map(p=>NS.card(p)).join("");
document.getElementById("homeSearch")?.addEventListener("submit",e=>{
 e.preventDefault();const q=new URLSearchParams();
 q.set("type",document.getElementById("searchType").value);
 const cat=document.getElementById("searchCategory").value,loc=document.getElementById("searchLocation").value.trim(),price=document.getElementById("searchBudget").value;
 if(cat)q.set("category",cat);if(loc)q.set("location",loc);if(price)q.set("max_price",price);
 location.href="properties.html?"+q.toString();
});
