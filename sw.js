const CACHE_NAME = 'nexus-v1';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/data.js',
  './js/auth.js',
  './js/router.js',
  './js/timer.js',
  './js/pages/login.js',
  './js/pages/guest.js',
  './js/pages/finance.js',
  './js/pages/buyers.js',
  './js/pages/docs.js',
  './js/pages/staff.js',
  './js/pages/admin.js',
  './js/app.js',
  'https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;600;700&family=Noto+Sans+KR:wght@300;400;500;700&display=swap'
];

// 설치
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// 활성화 - 구 캐시 삭제
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// 요청 처리 - Network first, Cache fallback
self.addEventListener('fetch', e => {
  // Firebase 요청은 캐시 안 함
  if (e.request.url.includes('firebaseapp.com') ||
      e.request.url.includes('googleapis.com/google.firestore') ||
      e.request.url.includes('identitytoolkit')) {
    return;
  }
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
