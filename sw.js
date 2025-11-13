const CACHE = 'abt-cache-v2';
const ASSETS = [
  '/',              
  '/index.html',
  '/report.html',
  '/track.html',
  '/styles.css',
  '/app-pwa.js',
  '/manifest.json',
  '/icons/icon192.png',
  '/icons/icon512.png',
  '/offline.html'
];

const CACHE_NAME = 'abt-report-v2';
const urlsToCache = [
  '/',
  '/ABT-Report/',
  '/ABT-Report/index.html',
  '/ABT-Report/report.html',
  '/ABT-Report/manifest.json',
  '/ABT-Report/icon192.png',
  '/ABT-Report/icon512.png'
];

// ติดตั้ง: แคชไฟล์หลัก
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

// เปิดใช้งาน: ลบแคชเก่า
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// กลยุทธ์ fetch: Network-first สำหรับหน้า HTML, Cache-first สำหรับทรัพยากรอื่น
self.addEventListener('fetch', (e) => {
  const req = e.request;
  const isHTML = req.headers.get('accept')?.includes('text/html');

  if (isHTML) {
    // พยายามเน็ตก่อน ถ้าไม่ได้ค่อย fallback offline
    e.respondWith(
      fetch(req).catch(() => caches.match(req).then(r => r || caches.match('/offline.html')))
    );
  } else {
    // ไฟล์ static ใช้ cache-first
    e.respondWith(
      caches.match(req).then(cached => cached || fetch(req))
    );
  }
});