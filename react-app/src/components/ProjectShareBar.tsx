import React, { useState } from 'react';
import { Check, Link2, MessageCircle, Share2 } from 'lucide-react';
export function ProjectShareBar({title,priceText}:{title:string;priceText?:string}){
 const [copied,setCopied]=useState(false);
 const url=typeof window==='undefined'?'https://www.nsproperties4.com/#project/ds-max-sky-samurai':window.location.href;
 const summary=title+' ('+(priceText||'price on request')+') — Whitefield, Bengaluru. Project details: '+url;
 return <div className="flex flex-wrap items-center gap-2 text-xs"><span className="font-medium text-stone-500">Share:</span>
 <a href={'https://wa.me/?text='+encodeURIComponent(summary)} target="_blank" rel="noopener noreferrer" className="inline-flex gap-1 border rounded-md bg-white px-3 py-2"><MessageCircle size={15}/>WhatsApp</a>
 <a href={'https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(url)} target="_blank" rel="noopener noreferrer" className="inline-flex gap-1 border rounded-md bg-white px-3 py-2"><Share2 size={15}/>Facebook</a>
 <button type="button" onClick={()=>void navigator.clipboard.writeText(url).then(()=>setCopied(true)).catch(()=>setCopied(false))} className="inline-flex gap-1 border rounded-md bg-white px-3 py-2">{copied?<Check size={15}/>:<Link2 size={15}/>} {copied?'Copied':'Copy Link'}</button></div>;
}
