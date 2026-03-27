# Iris — Privacy & AI Safety

> See what websites really do with your data.

Iris is an open-source Chrome extension that makes browser privacy **observable**, not just blockable. While other tools silently block trackers, Iris explains what's happening — in plain language anyone can understand.

---

## Why Iris?

Most privacy tools are black boxes. You install uBlock Origin and things get blocked — but you never know *what* or *why*.

Iris takes a different approach: **Privacy Observability**. Instead of intercepting silently, it surfaces what websites are doing and lets you decide.

```
❌ "Canvas fingerprinting blocked."
✅ "This site read your canvas rendering to create a unique device ID."
```

---

## Features

### 🔍 Tracker Detection
Real-time detection of advertising, analytics, social, fingerprinting, data broker, and session recording trackers. Powered by [Disconnect.me](https://github.com/disconnectme/disconnect-tracking-protection) — updated automatically every 7 days.

### 🕵️ Browser Fingerprinting
Detects when a site accesses:
- Canvas & WebGL rendering (device fingerprinting)
- AudioContext hardware profiling
- Your precise geolocation
- Camera / microphone
- WebRTC (real IP exposure, even through VPN)
- Clipboard contents
- Battery status

### 🤖 AI Safety (unique)
Detects when a page sends data to AI services — including major international and Chinese AI providers:

| International | Chinese |
|--------------|---------|
| OpenAI, Anthropic, Google Gemini | DeepSeek, Kimi (Moonshot AI) |
| Mistral, Groq, Perplexity | Tongyi Qwen (Alibaba), Wenxin (Baidu) |
| Hugging Face, Replicate | Hunyuan (Tencent), Doubao (ByteDance) |
| Stability AI, Cohere | ChatGLM (Zhipu AI), Xinghuo (iFlytek) |

### 🚨 AI Phishing Detection (unique)
Identifies fake AI service websites — domains impersonating ChatGPT, Claude, Kimi, DeepSeek, and 17 other AI brands. Covers common typosquatting and lookalike patterns.

### 🌍 Multilingual
Fully localized in: English, 简体中文, 日本語, Español, Français, Deutsch.

### ⚡ Lightweight by Design
- **Zero extra bandwidth** — all detection is local
- **~4 MB memory** — lighter than uBlock Origin
- No data ever leaves your browser

---

## Installation

### From Source (Developer Mode)

```bash
git clone https://github.com/koni20/iris-extension.git
cd iris-extension
```

1. Open Chrome → `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `iris-extension` folder

### Chrome Web Store
*(Coming soon)*

---

## Architecture

```
iris-extension/
├── manifest.json          # MV3 manifest, permissions
├── background.js          # Service worker: network monitoring, tracker DB, badge
├── content.js             # Isolated world: bridge between inject.js and background
├── inject.js              # Main world: API interception (Canvas, WebGL, fetch, WS...)
├── trackers.js            # Tracker DB, AI services DB, phishing detection logic
├── popup.html/css/js      # Extension popup UI
├── i18n.js                # Runtime i18n (6 languages)
└── _locales/              # Chrome i18n for manifest strings
```

**How detection works:**

```
Page loads
  ├── content.js injects inject.js into page's Main World
  │     └── inject.js wraps: fetch, XHR, WebSocket, EventSource,
  │                          Canvas, WebGL, AudioContext, geolocation,
  │                          getUserMedia, RTCPeerConnection, clipboard, battery
  │                          → postMessage → content.js → chrome.runtime → background.js
  │
  └── background.js monitors all network requests via webRequest API
        └── matchTracker(hostname) against 6,000+ domain database
              → updates badge + stores per-tab data
```

---

## Data Sources

| Source | Usage | License |
|--------|-------|---------|
| [Disconnect.me Tracking Protection](https://github.com/disconnectme/disconnect-tracking-protection) | Tracker domain list (auto-updated every 7 days) | GPLv3 |
| Built-in curated list | ~200 domains with detailed descriptions | — |
| AI services database | 27 AI providers, 60+ domains | — |
| AI phishing whitelist | 20 brands, legitimate domain registry | — |

All data processing happens **entirely on your device**. No analytics, no telemetry, no servers.

---

## Contributing

Contributions are welcome. Areas where help is most valuable:

- **Tracker database**: Found a tracker domain not in our list? [Open an issue](https://github.com/koni20/iris-extension/issues/new)
- **AI services**: New AI provider or API domain? PRs welcome
- **False positives**: A legit site being flagged incorrectly? Please report it
- **Translations**: Improving existing or adding new languages
- **Testing**: Verified behavior on a specific website

### Reporting a False Positive
Open an issue with:
1. The website URL
2. What Iris detected
3. Why you believe it's incorrect

---

## Privacy Policy

Iris collects **nothing**. No usage data, no page content, no personal information.

The tracker database is fetched from GitHub (Disconnect.me's public repository) once every 7 days and cached locally. This is the only network request Iris makes that isn't part of your normal browsing.

---

## License

MIT — see [LICENSE](LICENSE)

---

## Roadmap

- [ ] Historical tracking data (last 30 days)
- [ ] Cross-site comparison ("this site tracks more than 89% of analyzed sites" — with real data)
- [ ] Shareable privacy report cards
- [ ] Extension safety audit (detect suspicious installed extensions)
- [ ] Public tracker leaderboard

---

*Built with the belief that privacy tools should be transparent about what they do.*
