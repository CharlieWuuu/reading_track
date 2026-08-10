// Reading Track service worker
//
// 刻意保守：只快取「靜態外殼」。所有 /api/ 與登入相關的請求一律直接走網路，
// 不進快取——那些是跟帳號綁定的私人資料，留在裝置上並不安全。

const CACHE = "reading-track-v6";

const SHELL = ["/icon-192.png", "/icon-512.png", "/apple-touch-icon.png", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function isCacheable(request) {
  if (request.method !== "GET") return false;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return false;
  if (url.pathname.startsWith("/api/")) return false;
  return true;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (!isCacheable(request)) return;

  // 網路優先，成功就順手更新快取；離線時才拿快取頂著。
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && response.type === "basic") {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        // 沒快取又離線時，至少講清楚發生什麼事，不要給一片空白
        if (request.mode === "navigate") return offlinePage();
        return Response.error();
      })
  );
});

function offlinePage() {
  return new Response(
    `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8">
     <meta name="viewport" content="width=device-width,initial-scale=1">
     <title>離線中</title></head>
     <body style="margin:0;display:flex;height:100vh;align-items:center;justify-content:center;
                  font-family:system-ui,sans-serif;background:#f9fafb;color:#374151">
       <div style="text-align:center;padding:24px">
         <p style="font-size:16px;font-weight:500">目前沒有網路連線</p>
         <p style="font-size:13px;color:#6b7280">閱讀紀錄存在 Google 試算表，恢復連線後即可繼續。</p>
       </div>
     </body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 503 }
  );
}
