// content.js — 运行在隔离世界（Isolated World）
// 职责：把 inject.js 注入页面主世界，并把检测结果转发给 background

(function () {
  // ── 注入 inject.js 到页面主世界 ──────────────────────────────────────────────
  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("inject.js");
  script.onload = () => {
    script.remove();
    // 注入完成后立即把用户设置发给 inject.js（通过 postMessage）
    chrome.runtime.sendMessage({ type: "GET_SETTINGS" }, (settings) => {
      if (settings) {
        window.postMessage({ __irisSettings: true, settings }, "*");
      }
    });
  };
  (document.head || document.documentElement).appendChild(script);

  // 设置变更时即时下发给页面内脚本（无需刷新页面）
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg && msg.type === "SETTINGS_UPDATED" && msg.settings) {
      window.postMessage({ __irisSettings: true, settings: msg.settings }, "*");
    }
  });

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

    if (event.data.api === "cookie-consent-scan") {
      let detail;
      try {
        detail = JSON.parse(event.data.detail || "{}");
      } catch {
        return;
      }
      chrome.runtime.sendMessage({
        type: "COOKIE_CONSENT_SCAN",
        vendor:      detail.vendor      || null,
        bannerFound: !!detail.bannerFound,
        patterns:    Array.isArray(detail.patterns) ? detail.patterns : [],
      });
      return;
    }

    if (event.data.api === "confirmshaming-scan") {
      let detail;
      try {
        detail = JSON.parse(event.data.detail || "{}");
      } catch {
        return;
      }
      chrome.runtime.sendMessage({
        type: "CONFIRMSHAMING_SCAN",
        hits: Array.isArray(detail.hits) ? detail.hits : [],
      });
      return;
    }

    if (event.data.api === "anti-geo-scan") {
      let detail;
      try {
        detail = JSON.parse(event.data.detail || "{}");
      } catch {
        return;
      }
      chrome.runtime.sendMessage({
        type: "ANTI_GEO_SCAN",
        signals: Array.isArray(detail.signals) ? detail.signals : [],
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

// ── v1.3 / v1.10：AI 搜索页引用来源采集 + 页面内体检标注 ──────────────────────────
(function setupAiCitationScanner() {
  // 检查 mod_aiSafety / aiAnnotateInPage 是否启用，未收到设置前默认启用
  let _aiEnabled = true;
  let _annotateEnabled = true;
  window.addEventListener("message", (e) => {
    if (!e.data?.__irisSettings) return;
    const s = e.data.settings || {};
    _aiEnabled = s.mod_aiSafety !== false;
    _annotateEnabled = s.aiAnnotateInPage !== false;
    if (!hostMatchesSurface(location.hostname)) return;
    if (_aiEnabled && _annotateEnabled) annotate();
    else teardownAnnotations();
  });
  const ROOT_SUFFIXES = [
    "perplexity.ai",
    "chatgpt.com",
    "chat.openai.com",
    "kimi.com",
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

  function anchorHost(pageRoot, a) {
    try {
      const u = new URL(a.href, location.href);
      if (u.protocol !== "http:" && u.protocol !== "https:") return null;
      const host = u.hostname.replace(/^www\./, "").toLowerCase();
      if (!host || host === pageRoot || host.endsWith("." + pageRoot)) return null;
      return host;
    } catch {
      return null;
    }
  }

  function collectAnchorsUnderRoots(rootSelectors, pageRoot, seen, out, max) {
    for (const sel of rootSelectors) {
      let roots;
      try {
        roots = document.querySelectorAll(sel);
      } catch {
        continue;
      }
      roots.forEach((root) => {
        root.querySelectorAll('a[href^="http"], a[href^="//"]').forEach((a) => {
          if (seen.has(a)) return;
          const host = anchorHost(pageRoot, a);
          if (!host) return;
          seen.add(a);
          out.push({ anchor: a, host });
        });
      });
      if (out.length >= max) return;
    }
  }

  function collectAnchorsGeneric(pageRoot, max) {
    const seen = new Set();
    const out = [];
    document.querySelectorAll('a[href^="http"], a[href^="//"]').forEach((a) => {
      if (seen.has(a)) return;
      const host = anchorHost(pageRoot, a);
      if (!host) return;
      seen.add(a);
      out.push({ anchor: a, host });
    });
    return out.slice(0, max);
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

  function collectCitationAnchors() {
    const pageRoot = pageRootHost();
    const max = 120;
    const seen = new Set();
    const out = [];
    if (isPerplexityHost(pageRoot)) {
      collectAnchorsUnderRoots(PERPLEXITY_PRIMARY_ROOTS, pageRoot, seen, out, max);
      if (out.length === 0) collectAnchorsUnderRoots(PERPLEXITY_FALLBACK_ROOTS, pageRoot, seen, out, max);
      return out.length ? out.slice(0, max) : collectAnchorsGeneric(pageRoot, max);
    }
    if (isChatGPTHost(pageRoot)) {
      collectAnchorsUnderRoots(CHATGPT_ASSISTANT_ROOTS, pageRoot, seen, out, max);
      collectAnchorsUnderRoots(CHATGPT_SEARCH_ROOTS, pageRoot, seen, out, max);
      return out.length ? out.slice(0, max) : collectAnchorsGeneric(pageRoot, max);
    }
    return collectAnchorsGeneric(pageRoot, max);
  }

  // ── 页面内体检：本地化文案（精简，按浏览器语言取，回退英文）──────────────────
  const _lang = (() => {
    const l = (navigator.language || "en").toLowerCase();
    if (l.startsWith("zh")) return "zh";
    if (l.startsWith("ja")) return "ja";
    return "en";
  })();
  const STR = {
    en: {
      title: "AI Source Check",
      tagline: "See who the AI is citing",
      note: "Heuristic signal, not a verdict.",
      sources: "sources",
      barTitle: (flagged, total) => `${total} sources checked, ${flagged} flagged`,
      checked: (n) => `${n} sources checked`,
      noFlag: "No questionable sources found.",
      tier: { low: "Low trust", caution: "Review" },
      reasonCit: {
        aiCitationReason_thinContent: "Thin / aggregator-style source",
        aiCitationReason_conspiracy: "Conspiracy / state-sponsored disinformation",
        aiCitationReason_pseudoscience: "Pseudoscience or health misinformation",
        aiCitationReason_fakenews: "Fabricated or highly misleading news",
      },
      cs: { Adult: "Adult content", Gambling: "Gambling", Scam: "Scam / high risk", Violence: "Violent / harmful", Extreme: "Extremist content" },
      tr: { Fingerprinting: "Fingerprinting", "Data Broker": "Data broker", "Session Recording": "Session recording" },
    },
    zh: {
      title: "AI 来源体检",
      tagline: "看清 AI 在引用谁",
      note: "启发式提示，非事实判决。",
      sources: "来源",
      barTitle: (flagged, total) => `已检查 ${total} 个来源，其中 ${flagged} 个可疑`,
      checked: (n) => `已检查 ${n} 个来源`,
      noFlag: "未发现可疑来源。",
      tier: { low: "低可信", caution: "需留意" },
      reasonCit: {
        aiCitationReason_thinContent: "薄内容 / 聚合转载类来源",
        aiCitationReason_conspiracy: "阴谋论 / 国家背景虚假信息媒体",
        aiCitationReason_pseudoscience: "伪科学或健康虚假信息来源",
        aiCitationReason_fakenews: "已知编造或严重误导性新闻来源",
      },
      cs: { Adult: "成人内容", Gambling: "赌博", Scam: "诈骗 / 高风险", Violence: "暴力 / 有害", Extreme: "极端内容" },
      tr: { Fingerprinting: "指纹追踪", "Data Broker": "数据经纪", "Session Recording": "会话录制" },
    },
    ja: {
      title: "AIソース診断",
      tagline: "AIが引用している先を可視化",
      note: "ヒューリスティックな目安であり、断定ではありません。",
      sources: "件",
      barTitle: (flagged, total) => `${total} 件を確認、うち ${flagged} 件が要注意`,
      checked: (n) => `${n} 件のソースを確認`,
      noFlag: "疑わしいソースは見つかりませんでした。",
      tier: { low: "低信頼", caution: "要確認" },
      reasonCit: {
        aiCitationReason_thinContent: "薄いコンテンツ／まとめ型ソース",
        aiCitationReason_conspiracy: "陰謀論または国家主導の偽情報発信元",
        aiCitationReason_pseudoscience: "疑似科学または健康系デマ情報源",
        aiCitationReason_fakenews: "捏造または著しく誤解を招くニュース",
      },
      cs: { Adult: "アダルト", Gambling: "ギャンブル", Scam: "詐欺 / 高リスク", Violence: "暴力的 / 有害", Extreme: "過激なコンテンツ" },
      tr: { Fingerprinting: "フィンガープリント", "Data Broker": "データブローカー", "Session Recording": "セッション録画" },
    },
  };
  const L = STR[_lang] || STR.en;

  function escHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );
  }

  function reasonsText(reasons) {
    return (reasons || [])
      .map((r) => {
        if (r.kind === "citationList") return L.reasonCit[r.key] || "";
        if (r.kind === "contentSafety") return L.cs[r.category] || r.category;
        if (r.kind === "tracker") return L.tr[r.category] || r.category;
        return "";
      })
      .filter(Boolean)
      .join(" · ");
  }

  // ── 标注状态 ─────────────────────────────────────────────────────────────────
  const hostScore = new Map();    // host → { tier, reasons }
  let lastAnchors = [];           // [{ anchor, host }]
  let activeBadges = [];          // [{ badge, anchor, host }]

  function insertBadge(anchor, host, score) {
    const isLow = score.tier === "low";
    const badge = document.createElement("span");
    badge.setAttribute("data-iris-badge", "1");
    badge.textContent = isLow ? "🔴" : "🟡";
    badge.title = `${L.tier[score.tier] || score.tier}${reasonsText(score.reasons) ? " · " + reasonsText(score.reasons) : ""}`;
    badge.style.cssText =
      "display:inline !important;cursor:pointer !important;font-size:11px !important;" +
      "margin:0 2px !important;padding:0 !important;vertical-align:super !important;" +
      "line-height:1 !important;user-select:none !important;text-decoration:none !important;";
    badge.addEventListener("click", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      panelExpanded = true;
      renderPanel();
      highlightRow(host);
    });
    anchor.setAttribute("data-iris-badged", "1");
    if (anchor.parentNode) anchor.parentNode.insertBefore(badge, anchor.nextSibling);
    activeBadges.push({ badge, anchor, host });
  }

  function annotate() {
    if (!_aiEnabled || !_annotateEnabled) {
      teardownAnnotations();
      return;
    }
    // 清理 anchor 已离开 DOM 的孤立角标（SPA 重渲染）
    activeBadges = activeBadges.filter(({ badge, anchor }) => {
      if (!anchor || !anchor.isConnected) {
        badge.remove();
        return false;
      }
      return true;
    });
    // 为命中的来源注入角标
    for (const { anchor, host } of lastAnchors) {
      if (!anchor.isConnected) continue;
      if (anchor.getAttribute("data-iris-badged") === "1") continue;
      const score = hostScore.get(host);
      if (!score || (score.tier !== "low" && score.tier !== "caution")) continue;
      insertBadge(anchor, host, score);
    }
    renderPanel();
  }

  function teardownAnnotations() {
    for (const { badge, anchor } of activeBadges) {
      badge.remove();
      if (anchor) anchor.removeAttribute("data-iris-badged");
    }
    activeBadges = [];
    removePanel();
  }

  // ── 右下角浮动体检面板（Shadow DOM 隔离样式）──────────────────────────────────
  let panelHost = null;
  let panelRoot = null;
  let panelExpanded = false;
  let lastPanelKey = null;

  function ensurePanel() {
    if (panelHost && panelHost.isConnected) return;
    panelHost = document.createElement("div");
    panelHost.id = "__iris_citation_panel_host";
    panelHost.style.cssText =
      "all:initial;position:fixed;z-index:2147483647;right:16px;bottom:16px;";
    panelRoot = panelHost.attachShadow({ mode: "open" });
    (document.body || document.documentElement).appendChild(panelHost);
  }

  function removePanel() {
    if (panelHost) panelHost.remove();
    panelHost = null;
    panelRoot = null;
    panelExpanded = false;
    lastPanelKey = null;
  }

  // Iris 品牌标识（内联 SVG，还原光圈/虹膜造型；不暴露图标资源，避免被网页探测扩展）
  const LOGO_SVG =
    '<svg class="logo" viewBox="0 0 32 32" width="16" height="16" aria-hidden="true">' +
    '<circle cx="16" cy="16" r="15" fill="#6d5ef0"/>' +
    '<circle cx="16" cy="16" r="11" fill="#8b7cf6"/>' +
    '<circle cx="16" cy="16" r="7" fill="#b39dfb"/>' +
    '<circle cx="16" cy="16" r="3.2" fill="#1c1c2e"/>' +
    '</svg>';

  const PANEL_CSS = `
    *{box-sizing:border-box;margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;}
    .wrap{width:max-content;max-width:300px;background:#1c1c1e;color:#f2f2f7;border-radius:12px;
      box-shadow:0 6px 24px rgba(0,0,0,.35);overflow:hidden;font-size:12px;border:1px solid rgba(255,255,255,.08);}
    .logo{flex-shrink:0;border-radius:50%;display:block;}
    .brand{display:flex;align-items:center;gap:6px;}
    .wordmark{font-weight:800;font-size:13px;letter-spacing:.3px;}
    .bar{display:flex;align-items:center;gap:8px;padding:8px 12px;cursor:pointer;white-space:nowrap;}
    .bar .ct{font-weight:600;letter-spacing:.2px;opacity:.92;}
    .bar .cv{margin-left:auto;opacity:.55;font-size:11px;padding-left:4px;}
    .hd{display:flex;align-items:center;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,.08);}
    .hd .sub{margin-left:8px;opacity:.55;font-size:11px;font-weight:500;}
    .hd .x{margin-left:auto;cursor:pointer;opacity:.6;font-size:13px;}
    .summary{padding:7px 12px;font-size:11.5px;font-weight:600;opacity:.7;background:rgba(255,255,255,.03);}
    .list{max-height:240px;overflow-y:auto;padding:4px 0;}
    .row{padding:7px 12px;border-radius:6px;}
    .rh{display:flex;align-items:center;gap:6px;}
    .rh .host{font-weight:600;word-break:break-all;}
    .reason{margin-top:2px;opacity:.7;font-size:11px;line-height:1.35;}
    .empty{padding:10px 12px;opacity:.7;}
    .ft{padding:7px 12px;border-top:1px solid rgba(255,255,255,.08);display:flex;align-items:center;justify-content:space-between;gap:8px;}
    .ft .tag{opacity:.8;font-size:11px;font-weight:600;}
    .ft .note{opacity:.45;font-size:10px;text-align:right;}
  `;

  function renderPanel() {
    if (!_aiEnabled || !_annotateEnabled) {
      removePanel();
      return;
    }
    const present = new Map(); // host → score（去重）
    for (const { anchor, host } of lastAnchors) {
      if (!anchor.isConnected) continue;
      const s = hostScore.get(host);
      if (!s) continue;
      if (!present.has(host)) present.set(host, s);
    }
    const total = present.size;
    if (total === 0) {
      removePanel();
      return;
    }

    let low = 0;
    let caution = 0;
    const flagged = [];
    for (const [host, s] of present) {
      if (s.tier === "low") {
        low++;
        flagged.push([host, s]);
      } else if (s.tier === "caution") {
        caution++;
        flagged.push([host, s]);
      }
    }
    const flaggedCount = low + caution;

    // 幂等：AI 流式回答会高频触发重扫，状态不变时跳过重绘，避免闪烁/滚动复位
    const key =
      (panelExpanded ? "E" : "C") +
      "|" + total + "|" + low + "|" + caution + "|" +
      flagged.map(([h, s]) => h + ":" + s.tier).join(",");
    if (panelHost && panelHost.isConnected && key === lastPanelKey) return;
    lastPanelKey = key;

    ensurePanel();

    const countLine =
      flaggedCount > 0
        ? `${low > 0 ? `<span style="color:#ff6b6b">🔴 ${low}</span>` : ""}` +
          `${low > 0 && caution > 0 ? "&nbsp;" : ""}` +
          `${caution > 0 ? `<span style="color:#ffcf5c">🟡 ${caution}</span>` : ""}` +
          ` · ${total} ${escHtml(L.sources)}`
        : `<span style="color:#5fd49b">✓</span> ${escHtml(L.checked(total))}`;
    const barTitle = escHtml(L.barTitle(flaggedCount, total));

    let body;
    if (panelExpanded) {
      const rows =
        flaggedCount > 0
          ? flagged
              .map(([host, s]) => {
                const ic = s.tier === "low" ? "🔴" : "🟡";
                return (
                  `<div class="row" data-host="${escHtml(host)}">` +
                  `<div class="rh"><span>${ic}</span><span class="host">${escHtml(host)}</span></div>` +
                  `<div class="reason">${escHtml(reasonsText(s.reasons))}</div>` +
                  `</div>`
                );
              })
              .join("")
          : `<div class="empty">${escHtml(L.noFlag)}</div>`;
      body =
        `<div class="hd"><span class="brand">${LOGO_SVG}<span class="wordmark">Iris</span></span>` +
        `<span class="sub">${escHtml(L.title)}</span><span class="x" id="irisX">▾</span></div>` +
        `<div class="summary">${escHtml(L.barTitle(flaggedCount, total))}</div>` +
        `<div class="list">${rows}</div>` +
        `<div class="ft"><span class="tag">${escHtml(L.tagline)}</span><span class="note">${escHtml(L.note)}</span></div>`;
    } else {
      body =
        `<div class="bar" id="irisBar" title="${barTitle}"><span class="brand">${LOGO_SVG}<span class="wordmark">Iris</span></span>` +
        `<span class="ct">${countLine}</span><span class="cv">▴</span></div>`;
    }

    panelRoot.innerHTML = `<style>${PANEL_CSS}</style><div class="wrap">${body}</div>`;

    if (panelExpanded) {
      const x = panelRoot.querySelector("#irisX");
      if (x) x.onclick = () => { panelExpanded = false; renderPanel(); };
    } else {
      const bar = panelRoot.querySelector("#irisBar");
      if (bar) bar.onclick = () => { panelExpanded = true; renderPanel(); };
    }
  }

  function highlightRow(host) {
    if (!panelRoot) return;
    let row;
    try {
      row = panelRoot.querySelector(`.row[data-host="${CSS.escape(host)}"]`);
    } catch {
      return;
    }
    if (!row) return;
    row.scrollIntoView({ block: "nearest" });
    row.style.transition = "background .25s";
    row.style.background = "rgba(255,207,92,.22)";
    setTimeout(() => { row.style.background = ""; }, 1200);
  }

  // ── 扫描入口 ─────────────────────────────────────────────────────────────────
  function pushScan() {
    if (!_aiEnabled) return;
    if (!hostMatchesSurface(location.hostname)) return;
    const anchors = collectCitationAnchors();
    lastAnchors = anchors;
    const hosts = [...new Set(anchors.map((x) => x.host))].slice(0, 80);
    chrome.runtime.sendMessage({ type: "AI_SEARCH_SOURCES", hosts }, (resp) => {
      if (chrome.runtime.lastError) return;
      const scored = resp && Array.isArray(resp.scored) ? resp.scored : [];
      for (const s of scored) {
        hostScore.set(s.hostname, { tier: s.tier, reasons: s.reasons || [] });
      }
      if (_aiEnabled && _annotateEnabled) annotate();
      else teardownAnnotations();
    });
  }

  const debouncedPush = debounce(pushScan, 650);

  function isOwnNode(n) {
    return !!(
      n &&
      n.nodeType === 1 &&
      ((n.id === "__iris_citation_panel_host") ||
        (typeof n.getAttribute === "function" && n.getAttribute("data-iris-badge") === "1"))
    );
  }

  function onMutations(records) {
    // 忽略仅由我们自己注入的角标/面板引起的变更，避免自触发循环
    for (const rec of records) {
      const added = Array.from(rec.addedNodes || []);
      const removed = Array.from(rec.removedNodes || []);
      if (added.length === 0 && removed.length === 0) continue;
      if (added.every(isOwnNode) && removed.every(isOwnNode)) continue;
      debouncedPush();
      return;
    }
  }

  function start() {
    if (!hostMatchesSurface(location.hostname)) return;
    pushScan();
    const obs = new MutationObserver(onMutations);
    obs.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
