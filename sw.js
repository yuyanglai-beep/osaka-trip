/* -------------------------------------------------------
   🔧 懶人切換模式
   true  = 開發模式 (不快取、不攔截、100% 最新)
   false = 正式模式 (快取 + 離線 + 自動更新)
------------------------------------------------------- */
const DEV_MODE = true;

/* -------------------------------------------------------
   🧪 開發模式：什麼都不做，完全不影響 GitHub 更新
------------------------------------------------------- */
if (DEV_MODE) {
  self.addEventListener('install', event => {
    self.skipWaiting();
  });

  self.addEventListener('activate', event => {
    clients.claim();
  });

  self.addEventListener('fetch', event => {
    // 不攔截任何請求 → 永遠走最新版本
    return;
  });

  console.log("[SW] 開發模式啟動：不快取、不攔截");
  // 開發模式到這裡就結束，不會往下執行
  return;
}

/* -------------------------------------------------------
   🚀 正式模式：版本快取 + 離線支援 + 自動更新
------------------------------------------------------- */
const CACHE_NAME = "osaka-cache-v1"; // 改這個版本號就能強制更新
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  // 需要就自己加：CSS、JS、圖片...
];

// install：預先快取
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// activate：清除舊 cache
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  clients.claim();
});

// fetch：HTML採 Network First，其他 Cache First
self.addEventListener('fetch', event => {
  const req = event.request;

  // 1️⃣ HTML → Network First（避免鎖舊版）
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // 2️⃣ 其他檔案（CSS、JS、圖）→ Cache First
  event.respondWith(
    caches.match(req).then(cached => {
      return (
        cached ||
        fetch(req).then(res => {
          const resCopy = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, resCopy));
          return res;
        })
      );
    })
  );
});
