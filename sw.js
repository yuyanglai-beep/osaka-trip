/* -------------------------------------------------------
   🔧 懶人切換模式
   true  = 開發模式 (不快取、不攔截、100% 最新)
   false = 正式模式 (快取 + 離線 + 自動更新)
------------------------------------------------------- */
const DEV_MODE = true;

/* -------------------------------------------------------
   🧪 開發模式：不攔截、不快取 → 保證永遠是最新版本
   ✔ 修正：不使用 return；改用邏輯遮罩避免 SW 壞掉
------------------------------------------------------- */
if (DEV_MODE) {
  self.addEventListener('install', (event) => {
    self.skipWaiting();
  });

  self.addEventListener('activate', (event) => {
    clients.claim();
  });

  self.addEventListener('fetch', (event) => {
    // 完全不攔截
  });

  console.log("[SW] 開發模式啟動：不快取、不攔截");
}

/* -------------------------------------------------------
   🚀 正式模式：版本快取 + 離線支援 + 自動更新
   ✔ 只有在 DEV_MODE = false 時才會生效
------------------------------------------------------- */
if (!DEV_MODE) {
  const CACHE_NAME = "osaka-cache-v1"; // 每次 deploy 改版本即可
  const PRECACHE_URLS = [
    './',
    './index.html',
    './manifest.json',
  ];

  // install：預快取
  self.addEventListener('install', (event) => {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
    );
    self.skipWaiting();
  });

  // activate：清舊 cache
  self.addEventListener('activate', (event) => {
    event.waitUntil(
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
    );
    clients.claim();
  });

  // fetch：HTML → Network First
  self.addEventListener('fetch', (event) => {
    const req = event.request;

    if (req.mode === 'navigate') {
      event.respondWith(
        fetch(req).catch(() => caches.match('./index.html'))
      );
      return;
    }

    // Cache First for others
    event.respondWith(
      caches.match(req).then((cached) => {
        return (
          cached ||
          fetch(req).then((res) => {
            const resCopy = res.clone();
            caches.open(CACHE_NAME).then((cache) =>
              cache.put(req, resCopy)
            );
            return res;
          })
        );
      })
    );
  });
}
