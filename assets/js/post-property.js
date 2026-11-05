const form=document.getElementById("postPropertyForm"),photoInput=document.getElementById("postPhotos");
let photos=[];
const esc=s=>NS.escape(s);
photoInput.addEventListener("change",e=>{
 const accepted=Array.from(e.target.files).filter(f=>["image/jpeg","image/png","image/webp"].includes(f.type)&&f.size<=5*1024*1024);
 if(photos.length+accepted.length>10){alert("Maximum 10 photos allowed");e.target.value="";return}
 photos.push(...accepted);renderPhotos();e.target.value="";
});
function renderPhotos(){
 const box=document.getElementById("photoPreviews");box.innerHTML="";
 photos.forEach((f,i)=>{const url=URL.createObjectURL(f),wrap=document.createElement("div");wrap.className="relative rounded-lg overflow-hidden h-28";const img=document.createElement("img");img.src=url;img.className="w-full h-full object-cover";const btn=document.createElement("button");btn.type="button";btn.className="absolute top-1 right-1 btn btn-xs btn-error";btn.textContent="×";btn.onclick=()=>{URL.revokeObjectURL(url);photos.splice(i,1);renderPhotos()};wrap.append(img,btn);box.append(wrap)});
 document.getElementById("photoCount").textContent=photos.length+" of 10 photos selected";
}
document.getElementById("postDescription").addEventListener("input",e=>document.getElementById("descriptionCount").textContent=e.target.value.length);
document.getElementById("postPrice").addEventListener("input",e=>document.getElementById("priceWords").textContent=e.target.value?NS.money(e.target.value):"");
let pending=null;
form.addEventListener("submit",e=>{
 e.preventDefault();if(!form.reportValidity())return;
 if(photos.length){alert("Images are currently preview-only and will NOT be uploaded with your listing.");}
 if(!document.getElementById("postDeclaration").checked){alert("Please accept the declaration.");return}
 pending=Object.fromEntries(new FormData(form).entries());
 pending.amenities=Array.from(document.querySelectorAll("#amenityOptions input:checked")).map(x=>x.value);
 pending.photoNames=photos.map(x=>x.name);
 const price=NS.money(pending.price);
 document.getElementById("postPreviewContent").innerHTML=`<div class="bg-blue-50 rounded-xl p-4"><b class="text-xl brand">${esc(pending.title)}</b><p class="muted mt-1">${esc(pending.locality)}, ${esc(pending.city)}</p><p class="text-2xl font-bold mt-3">${price}</p></div><div class="grid grid-cols-2 gap-3">${Object.entries(pending).filter(([k])=>!["description","amenities","photoNames","mapLink"].includes(k)).map(([k,v])=>`<div class="bg-slate-50 p-3 rounded-lg"><span class="muted text-xs">${esc(k)}</span><p class="font-semibold">${esc(v)}</p></div>`).join("")}</div><div><b>Description</b><p class="muted whitespace-pre-wrap">${esc(pending.description)}</p></div><div><b>Amenities:</b> ${esc(pending.amenities.join(", ")||"Not specified")}</div><div><b>Photos:</b> ${photos.length} selected</div>`;
 document.getElementById("postPreviewModal").showModal();
});
document.getElementById("postEdit").onclick=()=>document.getElementById("postPreviewModal").close();
document.getElementById("confirmPost").onclick=async()=>{
 const button=document.getElementById("confirmPost");button.disabled=true;
 try{
  const result=await NS_BACKEND.submit("submit-property.php",pending);
  document.getElementById("postPreviewModal").close();
  document.getElementById("postSuccessText").textContent="Reference "+result.reference+". "+result.message;
  document.getElementById("postSuccessModal").showModal();
 }catch(err){alert("Submission failed: "+err.message)}finally{button.disabled=false;}
};
document.getElementById("postSuccessClose").onclick=()=>document.getElementById("postSuccessModal").close();
document.getElementById("resetPostForm").addEventListener("click",()=>{photos.forEach(()=>{});photos=[];renderPhotos();document.getElementById("descriptionCount").textContent="0";document.getElementById("priceWords").textContent=""});
