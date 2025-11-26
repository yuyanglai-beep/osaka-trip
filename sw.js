// 🛠 開發模式 Service Worker
// 特性：
// - 不快取 HTML
// - 不快取 JS / CSS
// - 不攔截 fetch
// - 只負責確保 SW 可以正常註冊

self.addEventListener('install', event => {
  // 開發用不做任何快取
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  // 直接取得控制權，不做 cache 清理
  clients.claim();
});

self.addEventListener('fetch', event => {
  // 開發模式 → 什麼都不攔截
  return; // 讓所有請求正常走網路
});
