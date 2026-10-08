/**
 * sw.js — Service Worker
 *
 * 作用：
 *   1）满足 PWA「可安装」的硬性条件，让 Chrome / Edge 能把网页装成类 App；
 *   2）接管通知点击：点系统通知时打开或聚焦 App 窗口。
 *
 * 特意不做离线缓存（没有 fetch 缓存逻辑）：避免你以后改了 js/css，
 * 浏览器却一直加载旧版本。
 */
'use strict';

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

// 点击通知 → 打开/聚焦 App
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
            for (const c of list) {
                if ('focus' in c) return c.focus();
            }
            if (clients.openWindow) return clients.openWindow('./index.html');
        })
    );
});