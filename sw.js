/* -------------------------------------------------------
   🚀 Osaka Trip PWA - Stable Production Service Worker
   功能：
   1. Cache 版本管理（換 VERSION 即可強制更新）
   2. HTML → Network First（避免吃舊畫面）
   3. CSS/JS/圖片 → Stale-While-Revalidate（更快）
   4. 自動清除舊 cache
   5. 保證 GitHub Pages 每次更新後一定顯示最新
------------------------------------------------------- */

const VERSION = "2025-02-15-v1";   // ← 每次更新改這行即可
const CACHE_NAME = `osaka-trip-${VERSION}`;

// 預先快取的重要檔案（可依需求增減）
const PRECACHE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
];

/* -------------------------------------------------------
   🧠 Install：預先快取必要檔案
------------------------------------------------------- */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );

  self.skipWaiting(); // 新 SW 立即生效
});

/* -------------------------------------------------------
   🧹 Activate：清舊版 Cache
------------------------------------------------------- */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );

  clients.claim(); // 立即接管所有頁面
});

/* -------------------------------------------------------
   🌐 Fetch：分流策略
   1. HTML → Network First（避免舊版卡住）
   2. 其他 → Stale-While-Revalidate（最快）
------------------------------------------------------- */
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // 1️⃣ HTML（navigate）→ Network First
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // 2️⃣ 其他資源（CSS / JS / images）→ Stale-While-Revalidate
  event.respondWith(
    caches.match(req).then((cached) => {
      const networkFetch = fetch(req)
        .then((res) => {
          const resCopy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resCopy));
          return res;
        })
        .catch(() => cached);

      return cached || networkFetch;
    })
  );
});
