/**
 * pwa.js — 安装到桌面 / 后台通知增强
 *
 * 1) 注册 Service Worker，让 Chrome / Edge 认定应用可安装，满足"添加到桌面/安装应用"条件。
 * 2) 捕获 beforeinstallprompt，存下安装事件，用户点设置里的"添加到桌面"时调用原生安装流程。
 * 3) 监听 appinstalled，安装完成后更新设置项文案。
 *
 * 说明：iOS Safari / Firefox 不派发 beforeinstallprompt，这类浏览器无法用按钮触发下载，
 * 只提示用户走浏览器自带菜单（分享 → 添加到主屏幕 / 安装应用）。用户明确要的是 Chrome、Edge。
 */
(function () {
    'use strict';

    var _deferredPrompt = null;
    var _installed = false;

    function _isStandalone() {
        return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
               window.navigator.standalone === true;
    }

    function _setRow(active, desc) {
        var row = document.getElementById('pwa-install-row');
        var descEl = document.getElementById('pwa-install-desc');
        if (row) row.classList.toggle('active', !!active);
        if (descEl && desc) descEl.textContent = desc;
    }

    function _refreshUI() {
        if (_isStandalone() || _installed) {
            _setRow(true, '已安装，正在独立窗口中运行');
            return;
        }
        if (_deferredPrompt) {
            _setRow(true, '点这里把「传讯」装到桌面');
        } else {
            _setRow(false, '在浏览器菜单里选择「安装应用 / 添加到主屏幕」');
        }
    }

    window._installPWA = function () {
        if (_isStandalone() || _installed) {
            if (typeof showNotification === 'function') showNotification('应用已经装到桌面了', 'info', 1800);
            return;
        }
        if (_deferredPrompt) {
            _deferredPrompt.prompt();
            _deferredPrompt.userChoice.then(function (choice) {
                if (choice && choice.outcome === 'accepted') {
                    if (typeof showNotification === 'function') showNotification('正在安装到桌面…', 'success', 2000);
                } else {
                    if (typeof showNotification === 'function') showNotification('已取消安装', 'info', 1500);
                }
                _deferredPrompt = null;
                _refreshUI();
            }).catch(function () {
                _deferredPrompt = null;
                _refreshUI();
            });
            return;
        }
        // 没有可用的原生安装事件：给出对应浏览器的文字指引
        var ua = navigator.userAgent || '';
        var isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        var tip = isIOS
            ? '点击底部「分享」→「添加到主屏幕」即可安装'
            : '请点击浏览器右上角菜单 →「安装应用 / 添加到主屏幕」';
        if (typeof showNotification === 'function') showNotification(tip, 'info', 4000);
        _setRow(false, tip);
    };

    window.addEventListener('beforeinstallprompt', function (e) {
        e.preventDefault();
        _deferredPrompt = e;
        _refreshUI();
    });

    window.addEventListener('appinstalled', function () {
        _installed = true;
        _deferredPrompt = null;
        _refreshUI();
        if (typeof showNotification === 'function') showNotification('已添加到桌面 ✓', 'success', 2200);
    });

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', function (e) {
            if (e.data && e.data.type === 'NOTIFICATION_CLICK') {
                try {
                    if (typeof window._backToLatestMessages === 'function') window._backToLatestMessages();
                } catch (err) {}
            }
        });
        window.addEventListener('load', function () {
            navigator.serviceWorker.register('sw.js').then(function () {
                _refreshUI();
            }).catch(function (err) {
                console.warn('[pwa] Service Worker 注册失败', err);
            });
        });
    }

    document.addEventListener('DOMContentLoaded', _refreshUI);
    setTimeout(_refreshUI, 1500);
})();
