/* 急救卡 Emergency Card — 离线缓存。每次发布新版本时，把下面的版本号改一下。 */
var V = "ec-v0.11.6";
var FILES = ["./", "index.html", "config.js", "manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png", "qr-wechat.png"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(V).then(function (c) {
    /* 安装新版时跳过浏览器缓存，确保拿到服务器上的最新文件 */
    /* config.js 是可选文件：即使没上传，也不影响安装（否则旧版本会一直留在手机上） */
    return Promise.all(FILES.map(function (f) {
      var p = c.add(new Request(f, { cache: "reload" }));
      return f === "config.js" ? p.catch(function () {}) : p;
    }));
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== V; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
/* 先用缓存（立刻打开，无网络也能用），同时在后台取最新版本，下次打开生效 */
self.addEventListener("fetch", function (e) {
  var r = e.request;
  if (r.method !== "GET" || new URL(r.url).origin !== self.location.origin) return;
  e.respondWith(caches.open(V).then(function (c) {
    return c.match(r, { ignoreSearch: true }).then(function (hit) {
      var net = fetch(r, { cache: "no-cache" }).then(function (res) {
        if (res && res.ok) c.put(r, res.clone());
        return res;
      }).catch(function () { return hit || c.match("index.html"); });
      return hit || net;
    });
  }));
});
