// content.js — 运行在隔离世界（Isolated World）
// 职责：把 inject.js 注入页面主世界，并把检测结果转发给 background

(function () {
  // ── 注入 inject.js 到页面主世界 ──────────────────────────────────────────────
  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("inject.js");
  script.onload = () => script.remove();
  (document.head || document.documentElement).appendChild(script);

  // ── 接收来自 inject.js 的消息，转发给 background ─────────────────────────────
  // ── AI API 调用上报 ───────────────────────────────────────────────────────────
  const reportedAI = new Set();

  window.addEventListener("message", (event) => {
    if (!event.data?.__uncloak || event.data.api !== "ai-api-call") return;
    let detail;
    try { detail = JSON.parse(event.data.detail || "{}"); } catch { return; }
    const key = detail.domain || detail.url;
    if (!key || reportedAI.has(key)) return;
    reportedAI.add(key);
    chrome.runtime.sendMessage({ type: "AI_CALL", domain: detail.domain, url: detail.url });
  });

  const API_LABELS = {
    "canvas-fingerprint":  { label: "Canvas Fingerprinting",  plain: "This site read your canvas rendering to create a unique ID for your device.", risk: "high" },
    "webgl-fingerprint":   { label: "WebGL Fingerprinting",   plain: "Your GPU model was accessed — a key data point for device fingerprinting.", risk: "high" },
    "audio-fingerprint":   { label: "Audio Fingerprinting",   plain: "Your audio hardware was profiled to help identify your device.", risk: "high" },
    "geolocation":         { label: "Location Request",        plain: "This site requested your precise geographic location.", risk: "high" },
    "media-access":        { label: "Camera / Microphone",     plain: "This site attempted to access your camera or microphone.", risk: "high" },
    "webrtc-leak":         { label: "WebRTC IP Exposure",      plain: "A peer-to-peer connection was opened — this can reveal your real IP even if you use a VPN.", risk: "medium" },
    "clipboard-read":      { label: "Clipboard Access",        plain: "This site attempted to read the contents of your clipboard.", risk: "medium" },
    "battery-fingerprint": { label: "Battery Fingerprinting",  plain: "Your battery status was accessed — sometimes used to track you across sessions.", risk: "medium" }
  };

  const reported = new Set();

  window.addEventListener("message", (event) => {
    if (!event.data?.__uncloak) return;
    const { api } = event.data;
    if (!api || reported.has(api)) return;

    reported.add(api);
    const meta = API_LABELS[api];
    if (!meta) return;

    chrome.runtime.sendMessage({
      type: "API_CALL",
      api,
      label: meta.label,
      plain: meta.plain,
      risk: meta.risk
    });
  });
})();
