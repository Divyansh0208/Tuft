// Tuft service worker: app shell works offline; CDN assets (CLIP library, wasm, fonts) are cached on first use.
const V='tuft-v2',SHELL=['./','./bench/','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
const CDN=['cdn.jsdelivr.net','fonts.googleapis.com','fonts.gstatic.com'];
const keep=(r,res)=>{if(res&&(res.ok||res.type==='opaque')){const cp=res.clone();caches.open(V).then(c=>c.put(r,cp))}return res};
self.addEventListener('install',e=>e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);
  if(u.origin===location.origin){
    // cache first (fast, works with bad signal), refresh in the background
    e.respondWith(caches.match(r,{ignoreSearch:true}).then(m=>{
      const net=fetch(r).then(res=>keep(r,res)).catch(()=>m||caches.match('./index.html'));
      return m||net;
    }));
  }else if(CDN.includes(u.hostname)){
    e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>keep(r,res))));
  }
});
