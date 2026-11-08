window.NS_BACKEND={
 available:false,
 async init(){try{const r=await fetch('api/properties.php');if(!r.ok)return;const d=await r.json();if(Array.isArray(d.properties)){window.NS_PROPERTIES=d.properties;this.available=true;}}catch(e){console.info('Demo catalogue active');}},
 async submit(endpoint,payload){const r=await fetch('api/csrf.php',{credentials:'same-origin'});if(!r.ok)throw Error('Secure session unavailable');const {token}=await r.json();const s=await fetch('api/'+endpoint,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','X-CSRF-Token':token},body:JSON.stringify(payload)});const d=await s.json();if(!s.ok)throw Error(d.error||'Submission failed');return d;}
};