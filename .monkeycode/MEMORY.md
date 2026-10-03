# User Instruction Memory

This file records user instructions, preferences, and teachings for reference in future interactions.

## Format

### User Instruction Entry
[User Instruction Summary]
- Date: [YYYY-MM-DD]
- Context: [Mentioned scenario or time]
- Instructions:
  - [Content of user teaching or instruction, described line by line]

### Project Knowledge Entry
[Project Knowledge Summary]
- Date: [YYYY-MM-DD]
- Context: Discovered by Agent while performing [specific task description]
- Category: [Operations & Deployment|Build Methods|Testing Methods|Troubleshooting & Debugging|Workflow & Collaboration|Environment Configuration]
- Instructions:
  - [Specific knowledge points, described line by line]

## Entries

[Project Knowledge Summary]
- Date: 2026-10-03
- Context: Discovered by Agent while implementing PWA install / background keep-alive features
- Category: Operations & Deployment
- Instructions:
  - This project is a pure static site (no build step). Preview locally with `python3 -m http.server 8000`.
  - Latest preview URL: `https://8000-42690e526df9c2dc.monkeycode-ai.online`
  - PWA support files (added 2026-10-03): `manifest.json`, `sw.js` (Service Worker, must be served from site root), `js/pwa.js` (install prompt + SW registration), icons under `assets/icons/`.
  - Chrome/Edge "添加到桌面 / 安装应用" requires: HTTPS (preview domain qualifies), manifest with 192px + 512px icons, and a registered Service Worker with a fetch handler.
  - Background keep-alive lives in `js/features.js` (silent audio loop + Web Audio oscillator + MediaSession + 15s watchdog). Background system notifications use the Service Worker `showNotification` path in `js/data.js`.
