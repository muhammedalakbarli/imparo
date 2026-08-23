// Imparo — service worker (PWA offline dəstəyi).
// Strategiya (təhlükəsiz, dinamik məzmunu pozmadan):
//   - Yalnız GET + eyni-mənbə (same-origin) sorğularına toxunur.
//   - API, auth və Supabase sorğuları HEÇ VAXT keşlənmir → həmişə şəbəkə.
//   - Naviqasiya (səhifə): əvvəlcə şəbəkə, offline olsa keşdən/ana səhifədən.
//   - Statik fayllar (_next/static, şəkil, şrift): stale-while-revalidate.

// Keş adı DEPLOY-a görə dəyişir. Əvvəl sabit ("bilik-yolu-v99") idi və bu,
// ciddi bir nasazlıq yaradırdı: sw.js faylı hər deploy-da BAYT-BAYT EYNİ qalırdı,
// ona görə brauzer "yeni service worker var" qərarına gəlmirdi — nə install,
// nə activate, nə də köhnə keşin silinməsi baş verirdi. Nəticədə aşağıdakı
// activate bloku və ServiceWorkerRegister-dəki avtomatik yeniləmə HEÇ VAXT
// işə düşmürdü; istifadəçi köhnə JS paketində ilişib qalırdı.
//
// İndi SW `/sw.js?v=<BUILD_ID>` kimi qeydiyyatdan keçir: hər deploy-da skript
// URL-i dəyişir → brauzer yeni SW görür → activate köhnə keşləri silir →
// controllerchange açıq səhifəni bir dəfə təzələyir.
const VERSION = new URL(self.location.href).searchParams.get("v") || "dev";
const CACHE = `imparo-${VERSION}`;
const OFFLINE_URL = "/";

// Şəbəkə çatmayanda göstəriləcək minimal offline HTML.
const OFFLINE_HTML = `<!doctype html><html lang="az"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Imparo — offline</title>
<style>body{margin:0;height:100vh;display:flex;flex-direction:column;align-items:center;
justify-content:center;font-family:system-ui,sans-serif;background:#f4f3fb;color:#2a2340;text-align:center;padding:24px}
h1{font-size:20px;margin:16px 0 8px}p{color:#6b6880;max-width:280px}</style></head>
<body><div style="font-size:56px">⭐</div><h1>İnternet bağlantısı yoxdur</h1>
<p>Imparo-nu işlətmək üçün internetə qoşul. Bağlantı bərpa olunanda səhifəni yenilə.</p></body></html>`;

// Səhifə "Yenilə" deyəndə gözləyən SW-i dərhal aktiv et (yeni versiyaya keç).
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

// ── Push bildirişləri (re-engagement) ──
// Server (Vercel Cron) push göndərəndə bildirişi göstər.
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }
  const title = data.title || "Imparo";
  const options = {
    body: data.body || "Öyrənməyə davam et! 🔥",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    lang: "az",
    tag: data.tag || "bilik-reminder",
    renotify: true,
    data: { url: data.url || "/dashboard" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Bildirişə toxunanda tətbiqi aç/fokusla.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/dashboard";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) {
            client.navigate(target);
            return client.focus();
          }
        }
        if (self.clients.openWindow) return self.clients.openWindow(target);
      }),
  );
});

self.addEventListener("install", (event) => {
  // skipWaiting-i BURADA çağırmırıq — yeni SW gözləyir ki, istifadəçi
  // "Yenilə" düyməsi ilə təsdiqləsin (səhifə ortasında məcburi yeniləmə olmasın).
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache.put(
        OFFLINE_URL,
        new Response(OFFLINE_HTML, {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        }),
      ),
    ),
  );
});

self.addEventListener("activate", (event) => {
  // Köhnə keşləri təmizlə + açıq səhifələri dərhal idarə et.
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icon") ||
    url.pathname === "/apple-touch-icon.png" ||
    /\.(?:png|jpg|jpeg|svg|gif|webp|ico|woff2?|ttf|css|js)$/.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // Yalnız eyni mənbə; API/auth-a toxunma.
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api") || url.pathname.startsWith("/auth")) return;

  // Səhifə naviqasiyası: əvvəlcə şəbəkə, offline olsa keş/ana səhifə.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(CACHE);
        return (await cache.match(request)) || (await cache.match(OFFLINE_URL));
      }),
    );
    return;
  }

  // Statik fayllar: stale-while-revalidate.
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((resp) => {
            if (resp.ok) cache.put(request, resp.clone());
            return resp;
          })
          .catch(() => cached);
        return cached || network;
      }),
    );
  }
});
