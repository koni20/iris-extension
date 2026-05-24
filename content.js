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
    if (event.data.api === "content-safety-scan") {
      let detail;
      try {
        detail = JSON.parse(event.data.detail || "{}");
      } catch {
        return;
      }
      chrome.runtime.sendMessage({
        type: "CONTENT_SAFETY_SCAN",
        keywords: detail.keywords || [],
        manipulation: detail.manipulation || [],
      });
      return;
    }

    if (event.data.api === "subscription-scan") {
      let detail;
      try {
        detail = JSON.parse(event.data.detail || "{}");
      } catch {
        return;
      }
      const hits = Array.isArray(detail.hits) ? detail.hits.filter((h) => h && h.id) : [];
      chrome.runtime.sendMessage({
        type: "SUBSCRIPTION_SCAN",
        gatePassed: !!detail.gatePassed,
        gateReason: detail.gateReason || null,
        hits,
      });
      return;
    }

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

// ── v1.3：AI 搜索页引用外链采集（反 GEO / 来源可信度）────────────────────────────
(function setupAiCitationScanner() {
  const ROOT_SUFFIXES = [
    "perplexity.ai",
    "chatgpt.com",
    "chat.openai.com",
    "kimi.moonshot.cn",
    "gemini.google.com",
    "copilot.microsoft.com",
    "metaso.cn",
  ];

  /** Perplexity：优先引用/Sources 容器；空则收窄到正文 article；再退回全页 */
  const PERPLEXITY_PRIMARY_ROOTS = [
    '[data-testid*="citation"]',
    '[data-testid*="Citation"]',
    '[data-testid*="source"]',
    '[data-testid*="Source"]',
    '[data-testid*="reference"]',
    '[data-testid*="Reference"]',
    '[class*="citation"]',
    '[class*="Citation"]',
    '[class*="source-card"]',
    '[class*="SourceCard"]',
    '[class*="web-result"]',
    '[class*="WebResult"]',
    '[class*="search-result"]',
  ];
  const PERPLEXITY_FALLBACK_ROOTS = ["main article", "article"];

  /** ChatGPT：助手消息内链接 + 搜索/网页结果块 */
  const CHATGPT_ASSISTANT_ROOTS = ['[data-message-author-role="assistant"]'];
  const CHATGPT_SEARCH_ROOTS = [
    '[data-testid*="search-result"]',
    '[data-testid*="web-result"]',
    '[class*="search-result"]',
    '[class*="web-result"]',
  ];

  function hostMatchesSurface(h) {
    const host = String(h || "")
      .replace(/^www\./, "")
      .toLowerCase();
    return ROOT_SUFFIXES.some((r) => host === r || host.endsWith("." + r));
  }

  function debounce(fn, ms) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  }

  function pageRootHost() {
    return location.hostname.replace(/^www\./, "").toLowerCase();
  }

  function addHrefHost(set, pageRoot, a) {
    try {
      const u = new URL(a.href, location.href);
      if (u.protocol !== "http:" && u.protocol !== "https:") return;
      const host = u.hostname.replace(/^www\./, "").toLowerCase();
      if (!host || host === pageRoot || host.endsWith("." + pageRoot)) return;
      set.add(host);
    } catch {
      /* ignore */
    }
  }

  function collectAnchorsUnderRoots(rootSelectors, pageRoot, max) {
    const set = new Set();
    for (const sel of rootSelectors) {
      let roots;
      try {
        roots = document.querySelectorAll(sel);
      } catch {
        continue;
      }
      roots.forEach((root) => {
        root.querySelectorAll('a[href^="http"], a[href^="//"]').forEach((a) => addHrefHost(set, pageRoot, a));
      });
      if (set.size >= max) return [...set].slice(0, max);
    }
    return [...set].slice(0, max);
  }

  function collectHostsGeneric(pageRoot, max) {
    const set = new Set();
    document.querySelectorAll('a[href^="http"], a[href^="//"]').forEach((a) => addHrefHost(set, pageRoot, a));
    return [...set].slice(0, max);
  }

  function isPerplexityHost(h) {
    return h === "perplexity.ai" || h.endsWith(".perplexity.ai");
  }

  function isChatGPTHost(h) {
    return (
      h === "chatgpt.com" ||
      h.endsWith(".chatgpt.com") ||
      h === "chat.openai.com" ||
      h.endsWith(".chat.openai.com")
    );
  }

  function collectPerplexityHosts(pageRoot, max) {
    let hosts = collectAnchorsUnderRoots(PERPLEXITY_PRIMARY_ROOTS, pageRoot, max);
    if (hosts.length === 0) hosts = collectAnchorsUnderRoots(PERPLEXITY_FALLBACK_ROOTS, pageRoot, max);
    if (hosts.length === 0) hosts = collectHostsGeneric(pageRoot, max);
    return hosts;
  }

  function collectChatGPTHosts(pageRoot, max) {
    const set = new Set();
    for (const h of collectAnchorsUnderRoots(CHATGPT_ASSISTANT_ROOTS, pageRoot, max)) set.add(h);
    for (const h of collectAnchorsUnderRoots(CHATGPT_SEARCH_ROOTS, pageRoot, max)) set.add(h);
    let merged = [...set].slice(0, max);
    if (merged.length === 0) merged = collectHostsGeneric(pageRoot, max);
    return merged;
  }

  function collectHosts() {
    const pageRoot = pageRootHost();
    const max = 80;
    if (isPerplexityHost(pageRoot)) return collectPerplexityHosts(pageRoot, max);
    if (isChatGPTHost(pageRoot)) return collectChatGPTHosts(pageRoot, max);
    return collectHostsGeneric(pageRoot, max);
  }

  function pushScan() {
    if (!hostMatchesSurface(location.hostname)) return;
    const hosts = collectHosts();
    chrome.runtime.sendMessage({ type: "AI_SEARCH_SOURCES", hosts });
  }

  const debouncedPush = debounce(pushScan, 650);

  function start() {
    if (!hostMatchesSurface(location.hostname)) return;
    pushScan();
    const obs = new MutationObserver(debouncedPush);
    obs.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
