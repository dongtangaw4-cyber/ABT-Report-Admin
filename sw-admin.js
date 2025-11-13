const CACHE = 'abt-admin-v2';
const ASSETS = [
  './',
  './admin.html',
  './app-admin.js',
  './icon192.png',
  './icon512.png',
  './logo.png',
  './logo1.png',
  './Backgroundธีม.png'
];

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
});

self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>k!==CACHE && caches.delete(k)))));
});

self.addEventListener('fetch', e=>{
  const url = new URL(e.request.url);
  if (url.origin === location.origin) {
    e.respondWith(
      caches.match(e.request).then(resp => resp || fetch(e.request))
    );
  }
});