/* sw.js — 传讯 Service Worker
 * 作用：
 *   1) 让应用满足 Chrome / Edge 的"添加到桌面 / 安装应用"条件（可安装 PWA）
 *   2) 后台系统通知：即使页面被系统挂起，也能通过 SW 弹出消息提醒
 *   3) 同源静态资源做网络优先缓存，断网时仍可打开应用外壳
 * 注意：只接管同源 GET 请求，不碰云端同步/媒体接口等跨域请求，避免影响原有数据流程。
 */
var CACHE_NAME = 'chuanxun-shell-v1';
var SHELL = [
    './',
    './index.html',
    './manifest.json',
    './assets/icons/icon-192.png',
    './assets/icons/icon-512.png',
    './assets/audio/silence.mp3'
];

self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function (cache) {
                return Promise.all(SHELL.map(function (url) {
                    return cache.add(url).catch(function () { /* 单个资源失败不影响安装 */ });
                }));
            })
            .then(function () { return self.skipWaiting(); })
    );
});

self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function (keys) {
            return Promise.all(keys.map(function (key) {
                if (key !== CACHE_NAME) return caches.delete(key);
            }));
        }).then(function () { return self.clients.claim(); })
    );
});

self.addEventListener('fetch', function (event) {
    var req = event.request;
    if (req.method !== 'GET') return;

    var url;
    try { url = new URL(req.url); } catch (e) { return; }
    // 仅处理同源请求，跨域（云同步、图片 CDN 等）直接放行
    if (url.origin !== self.location.origin) return;

    event.respondWith(
        fetch(req)
            .then(function (res) {
                if (res && res.ok && res.type === 'basic') {
                    var copy = res.clone();
                    caches.open(CACHE_NAME).then(function (cache) { cache.put(req, copy); }).catch(function () {});
                }
                return res;
            })
            .catch(function () {
                return caches.match(req).then(function (cached) {
                    if (cached) return cached;
                    if (req.mode === 'navigate') return caches.match('./index.html');
                    return Response.error();
                });
            })
    );
});

/* 页面请求 SW 弹后台通知（比页面里的 new Notification 更稳，页面被挂起也能弹） */
self.addEventListener('message', function (event) {
    var data = event.data || {};
    if (data.type !== 'SHOW_NOTIFICATION') return;
    var title = data.title || '传讯';
    var options = {
        body: data.body || '对方发来了消息',
        icon: data.icon || './assets/icons/icon-192.png',
        badge: './assets/icons/icon-192.png',
        tag: data.tag || 'partner-msg',
        renotify: true,
        data: { url: data.url || './index.html' }
    };
    self.registration.showNotification(title, options);
});

/* 点通知：优先聚焦已打开的应用窗口，没有就新开一个 */
self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    var target = (event.notification.data && event.notification.data.url) || './index.html';
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            for (var i = 0; i < clientList.length; i++) {
                var client = clientList[i];
                if ('focus' in client) {
                    client.postMessage({ type: 'NOTIFICATION_CLICK' });
                    return client.focus();
                }
            }
            if (self.clients.openWindow) return self.clients.openWindow(target);
        })
    );
});
