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
      if (!extAlive()) return;
      try {
        chrome.runtime.sendMessage({
          type: "SUBSCRIPTION_SCAN",
          gatePassed: !!detail.gatePassed,
          gateReason: detail.gateReason || null,
          hits,
        });
      } catch { /* Extension context invalidated：忽略 */ }
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
    "deepseek.com",
    "doubao.com",
    "tongyi.com",
    "tongyi.aliyun.com",
    "yuanbao.tencent.com",
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

  /** 国产 / 中文 AI 回答页常见引用容器（优先于通用表扫描） */
  const DOMESTIC_AI_ROOTS = [
    '[class*="reference" i]',
    '[class*="citation" i]',
    '[class*="source-card" i]',
    '[class*="source_card" i]',
    '[class*="search-result" i]',
    '[class*="search_result" i]',
    '[class*="web-result" i]',
    '[class*="web_result" i]',
    '[class*="footnote" i]',
    '[class*="quote" i]',
    '[data-testid*="source" i]',
    '[data-testid*="reference" i]',
    '[data-testid*="citation" i]',
    'a[target="_blank"][rel*="noopener"]',
  ];

  /** 通用引用容器允许表（其余站点优先在这些容器内取链接，作用同 Perplexity primary） */
  const CITATION_CONTAINER_ROOTS = [
    '[class*="citation" i]',
    '[class*="source" i]',
    '[class*="reference" i]',
    '[data-testid*="citation" i]',
    '[data-testid*="source" i]',
    '[class*="ref-" i]',
    '[class*="cite" i]',
  ];

  /** 「参考资料 / 来源 / 链接索引」等引用标题文案 */
  const CITATION_HEADING_RE =
    /参考资料|参考来源|参考链接|网页来源|信息来源|参考|来源|引用|链接索引|出处|引文|references?|sources?|citations?/i;

  /** 兜底全页扫描时要排除的非引用区域（导航/页眉页脚/侧栏/相关推荐等） */
  const EXCLUDE_REGION_SELECTOR =
    'nav, header, footer, aside, [role="navigation"], [role="banner"], [role="contentinfo"], ' +
    '[class*="sidebar" i], [class*="side-bar" i], [class*="menu" i], [class*="header" i], ' +
    '[class*="footer" i], [class*="nav" i], [class*="toolbar" i], [class*="topbar" i], ' +
    '[class*="breadcrumb" i], [class*="related" i], [class*="recommend" i], [class*="download" i]';

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

  // 扩展被重载/更新后，旧的注入脚本会失去 runtime 连接（Extension context invalidated）
  function extAlive() {
    try {
      return !!(chrome.runtime && chrome.runtime.id);
    } catch {
      return false;
    }
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

  // 锚点是否位于非引用区域（导航/页眉页脚/侧栏等）；向上限深查父链
  function isInExcludedRegion(a) {
    let node = a;
    let depth = 0;
    while (node && depth < 12) {
      try {
        if (node.matches && node.matches(EXCLUDE_REGION_SELECTOR)) return true;
      } catch { /* 非法选择器忽略 */ }
      node = node.parentElement;
      depth++;
    }
    return false;
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

  // 按「参考资料/来源/链接索引」标题就近容器收集外链（标题容器无 citation class 时用，如 DeepSeek）
  function collectFromCitationHeadings(pageRoot, seen, out, max) {
    let nodes;
    try {
      nodes = document.querySelectorAll('h1,h2,h3,h4,h5,h6,strong,span,div[class*="title" i]');
    } catch {
      return;
    }
    nodes.forEach((n) => {
      if (out.length >= max) return;
      const raw = (n.textContent || "").trim();
      const txt = raw.replace(/\s*[（(]\d+[）)]\s*$/, "").trim();
      if (!txt || txt.length > 28 || !CITATION_HEADING_RE.test(txt)) return;
      const scopes = new Set();
      scopes.add(n.parentElement);
      scopes.add(n.nextElementSibling);
      let p = n.parentElement;
      for (let d = 0; p && d < 3; d++) {
        scopes.add(p);
        if (p.nextElementSibling) scopes.add(p.nextElementSibling);
        p = p.parentElement;
      }
      collectLinksInScopes(scopes, pageRoot, seen, out, max);
    });
  }

  // 过滤版全页扫描：排除非引用区域
  function collectAnchorsGenericFiltered(pageRoot, max) {
    const seen = new Set();
    const out = [];
    document.querySelectorAll('a[href^="http"], a[href^="//"]').forEach((a) => {
      if (seen.has(a)) return;
      const host = anchorHost(pageRoot, a);
      if (!host) return;
      if (isInExcludedRegion(a)) return;
      seen.add(a);
      out.push({ anchor: a, host });
    });
    return out.slice(0, max);
  }

  // 原始全页扫描：不过滤，作为最终安全网（防过滤后为 0 的回归）
  function collectAnchorsRaw(pageRoot, max) {
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

  // 兜底：先过滤版全页，过滤后为空再退回原始全页（保证不漏）
  function collectAnchorsFallback(pageRoot, max) {
    const filtered = collectAnchorsGenericFiltered(pageRoot, max);
    return filtered.length ? filtered : collectAnchorsRaw(pageRoot, max);
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

  function isDomesticCitationHost(h) {
    return (
      h === "deepseek.com" || h.endsWith(".deepseek.com") ||
      h === "doubao.com" || h.endsWith(".doubao.com") ||
      h === "tongyi.com" || h.endsWith(".tongyi.com") ||
      h === "tongyi.aliyun.com" || h.endsWith(".tongyi.aliyun.com") ||
      h === "yuanbao.tencent.com" || h.endsWith(".yuanbao.tencent.com") ||
      h === "kimi.com" || h.endsWith(".kimi.com") ||
      h === "kimi.moonshot.cn" || h.endsWith(".kimi.moonshot.cn")
    );
  }

  function collectLinksInScopes(scopes, pageRoot, seen, out, max) {
    for (const scope of scopes) {
      if (!scope || out.length >= max) continue;
      try {
        scope.querySelectorAll('a[href^="http"], a[href^="//"]').forEach((a) => {
          if (seen.has(a)) return;
          const host = anchorHost(pageRoot, a);
          if (!host) return;
          seen.add(a);
          out.push({ anchor: a, host });
        });
      } catch { /* ignore */ }
    }
  }

  function collectCitationAnchors() {
    const pageRoot = pageRootHost();
    const max = 120;
    const seen = new Set();
    const out = [];
    if (isPerplexityHost(pageRoot)) {
      collectAnchorsUnderRoots(PERPLEXITY_PRIMARY_ROOTS, pageRoot, seen, out, max);
      if (out.length === 0) collectAnchorsUnderRoots(PERPLEXITY_FALLBACK_ROOTS, pageRoot, seen, out, max);
      return out.length ? out.slice(0, max) : collectAnchorsFallback(pageRoot, max);
    }
    if (isChatGPTHost(pageRoot)) {
      collectAnchorsUnderRoots(CHATGPT_ASSISTANT_ROOTS, pageRoot, seen, out, max);
      collectAnchorsUnderRoots(CHATGPT_SEARCH_ROOTS, pageRoot, seen, out, max);
      return out.length ? out.slice(0, max) : collectAnchorsFallback(pageRoot, max);
    }
    if (isDomesticCitationHost(pageRoot)) {
      collectAnchorsUnderRoots(DOMESTIC_AI_ROOTS, pageRoot, seen, out, max);
      if (out.length === 0) collectFromCitationHeadings(pageRoot, seen, out, max);
      if (out.length === 0) collectAnchorsUnderRoots(CITATION_CONTAINER_ROOTS, pageRoot, seen, out, max);
      return out.length ? out.slice(0, max) : collectAnchorsFallback(pageRoot, max);
    }
    // 其余站点：引用容器允许表 → 引用标题就近容器 → 过滤版全页（空再退原始全页）
    collectAnchorsUnderRoots(CITATION_CONTAINER_ROOTS, pageRoot, seen, out, max);
    if (out.length === 0) collectFromCitationHeadings(pageRoot, seen, out, max);
    if (out.length > 0) return out.slice(0, max);
    return collectAnchorsFallback(pageRoot, max);
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
      tagline: "AI answers aren't always true — see who it cites",
      note: "Heuristic signal, not a verdict.",
      sources: "sources",
      barTitle: (flagged, total) => `${total} sources checked, ${flagged} flagged`,
      checked: (n) => `${n} sources checked`,
      noFlag: "No questionable sources found.",
      tier: { low: "Low trust", caution: "Review" },
      cat: { official: "Official / academic", news: "Major media", ugc: "Forums / UGC", lowtrust: "Low trust", other: "Other" },
      installCta: "Add Iris",
      shareBtn: "Share",
      copied: "Copied to clipboard",
      copiedShare: "Copied — share with friends",
      shareHook: "AI answers aren't always true",
      shareRateHint: "Like it? Leave a quick rating",
      shareBy: "Checked by Iris — get it: ",
      shareTotal: (n) => `${n} sources checked`,
      verdict: {
        lowTrust: (n) => `${n} questionable source${n > 1 ? "s" : ""} cited`,
        noAuthority: "No authoritative sources cited",
        ugcHeavy: "Mostly forum / user-generated posts",
        singleSource: "Relies on a single source",
        hasAuthority: "Includes authoritative sources",
        balanced: "Mix of source types",
      },
      action: {
        lowTrust: "Verify key facts — don't take it at face value",
        noAuthority: "Double-check the key claims yourself",
        ugcHeavy: "Mostly personal opinions — cross-check them",
        singleSource: "Find a second source to confirm",
        hasAuthority: "Looks solid, but stay alert",
      },
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
      tagline: "AI 的答案不一定是真的 — 看清它引用了谁",
      note: "启发式提示，非事实判决。",
      sources: "来源",
      barTitle: (flagged, total) => `已检查 ${total} 个来源，其中 ${flagged} 个可疑`,
      checked: (n) => `已检查 ${n} 个来源`,
      noFlag: "未发现可疑来源。",
      tier: { low: "低可信", caution: "需留意" },
      cat: { official: "官方 / 学术", news: "主流媒体", ugc: "论坛 / UGC", lowtrust: "低可信", other: "其他" },
      installCta: "安装 Iris",
      shareBtn: "分享",
      copied: "已复制到剪贴板",
      copiedShare: "已复制，可转发给亲友",
      shareHook: "AI 答案不一定是真的",
      shareRateHint: "觉得有用？欢迎给 Iris 评分",
      shareBy: "由 Iris 检测，安装：",
      shareTotal: (n) => `已检查 ${n} 个来源`,
      verdict: {
        lowTrust: (n) => `引用了 ${n} 个可疑来源`,
        noAuthority: "缺少权威来源",
        ugcHeavy: "主要依据论坛 / 用户帖子",
        singleSource: "依赖单一来源",
        hasAuthority: "包含权威来源",
        balanced: "来源类型较均衡",
      },
      action: {
        lowTrust: "建议核实关键事实，勿轻信",
        noAuthority: "建议自行核实关键信息",
        ugcHeavy: "多为个人观点，建议交叉核对",
        singleSource: "建议再找一个来源印证",
        hasAuthority: "整体较可靠，仍建议留意",
      },
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
      tagline: "AIの回答は常に正しいとは限らない — 引用元を確認",
      note: "ヒューリスティックな目安であり、断定ではありません。",
      sources: "件",
      barTitle: (flagged, total) => `${total} 件を確認、うち ${flagged} 件が要注意`,
      checked: (n) => `${n} 件のソースを確認`,
      noFlag: "疑わしいソースは見つかりませんでした。",
      tier: { low: "低信頼", caution: "要確認" },
      cat: { official: "公式 / 学術", news: "主要メディア", ugc: "フォーラム / UGC", lowtrust: "低信頼", other: "その他" },
      installCta: "Iris を追加",
      shareBtn: "共有",
      copied: "クリップボードにコピーしました",
      copiedShare: "コピーしました。共有できます",
      shareHook: "AIの回答は常に正しいとは限らない",
      shareRateHint: "役に立ったら評価をお願いします",
      shareBy: "Iris で診断 — 入手：",
      shareTotal: (n) => `${n} 件のソースを確認`,
      verdict: {
        lowTrust: (n) => `${n} 件の疑わしいソースを引用`,
        noAuthority: "権威あるソースが不足",
        ugcHeavy: "主にフォーラム / 投稿に依拠",
        singleSource: "単一ソースに依存",
        hasAuthority: "権威あるソースを含む",
        balanced: "ソース種別はバランス型",
      },
      action: {
        lowTrust: "重要な事実は確認を。鵜呑みにしない",
        noAuthority: "重要な情報は自分で確認を",
        ugcHeavy: "個人の意見が中心。照合を推奨",
        singleSource: "もう一つソースを確認",
        hasAuthority: "概ね信頼できるが注意は必要",
      },
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

  // 落地入口：Chrome 商店详情页直达链接
  const IRIS_STORE_URL = "https://chromewebstore.google.com/detail/libmgcmdiiojoehiabepnabbploojccl";

  // 类别图标（不本地化）
  const CAT_ICON = { official: "🏛", news: "📰", ugc: "💬", lowtrust: "🔴", other: "🔗" };
  const CAT_ORDER = ["official", "news", "ugc", "lowtrust", "other"];

  // ── 标注状态 ─────────────────────────────────────────────────────────────────
  const hostScore = new Map();    // host → { tier, reasons, category }
  let lastAnchors = [];           // [{ anchor, host }]
  let activeBadges = [];          // [{ badge, anchor, host }]

  // 统计当前页面 present 来源的类别构成（按去重 host）
  function computeComposition() {
    const comp = { official: 0, news: 0, ugc: 0, lowtrust: 0, other: 0, total: 0 };
    const seen = new Set();
    for (const { anchor, host } of lastAnchors) {
      if (!anchor.isConnected || seen.has(host)) continue;
      const s = hostScore.get(host);
      if (!s) continue;
      seen.add(host);
      const cat = comp[s.category] != null ? s.category : "other";
      comp[cat]++;
      comp.total++;
    }
    return comp;
  }

  // 由构成生成一条大白话可信度结论 { level: "warn"|"info"|"ok", text, action }
  function computeVerdict(comp) {
    const v = L.verdict, a = L.action;
    const flagged = comp.lowtrust;
    if (flagged > 0) return { level: "warn", text: v.lowTrust(flagged), action: a.lowTrust };
    if (comp.total >= 3 && comp.official + comp.news === 0)
      return { level: "warn", text: v.noAuthority, action: a.noAuthority };
    if (comp.total >= 2 && comp.ugc / comp.total >= 0.5)
      return { level: "warn", text: v.ugcHeavy, action: a.ugcHeavy };
    if (comp.total === 1) return { level: "info", text: v.singleSource, action: a.singleSource };
    if (comp.official + comp.news > 0) return { level: "ok", text: v.hasAuthority, action: a.hasAuthority };
    return { level: "info", text: v.balanced, action: "" };
  }

  // 构建可分享的精简文案：品牌 + 结论 + 构成 + 安装链接（转发时携带品牌与入口）
  function buildShareText(verdict, comp) {
    const vIcon = verdict.level === "warn" ? "⚠" : verdict.level === "ok" ? "✓" : "ℹ";
    const host = pageRootHost();
    const compStr = CAT_ORDER.filter((c) => comp[c] > 0)
      .map((c) => `${CAT_ICON[c]} ${L.cat[c]} ${comp[c]}`)
      .join(" · ");
    const lines = [
      L.shareHook,
      `${L.title} · ${host}`,
      `${vIcon} ${verdict.text}${verdict.action ? `（${verdict.action}）` : ""}`,
    ];
    if (compStr) lines.push(compStr);
    lines.push(L.shareTotal(comp.total));
    lines.push(`${L.shareBy}${IRIS_STORE_URL}`);
    return lines.join("\n");
  }

  // 复制到剪贴板（优先 Clipboard API，失败退回 execCommand）
  function copyToClipboard(text, onDone) {
    const done = () => { try { onDone && onDone(); } catch { /* ignore */ } };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, () => fallbackCopy(text, done));
        return;
      }
    } catch { /* fallthrough */ }
    fallbackCopy(text, done);
  }

  function fallbackCopy(text, done) {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0;";
      (document.body || document.documentElement).appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    } catch { /* ignore */ }
    done();
  }

  // 在面板内显示短暂提示
  function showPanelToast(msg) {
    if (!panelRoot) return;
    const toast = panelRoot.getElementById
      ? panelRoot.getElementById("irisToast")
      : panelRoot.querySelector("#irisToast");
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(showPanelToast._t);
    const ms = String(msg).length > 28 ? 2400 : 1600;
    showPanelToast._t = setTimeout(() => toast.classList.remove("show"), ms);
  }

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
    .wrap{position:relative;width:max-content;max-width:312px;background:#1c1c1e;color:#f2f2f7;border-radius:12px;
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
    .insight{padding:9px 12px 2px;font-size:13px;font-weight:700;display:flex;align-items:center;gap:6px;}
    .insight.warn{color:#ffcf5c;}
    .insight.info{color:#9db2ff;}
    .insight.ok{color:#5fd49b;}
    .action{padding:0 12px 9px 12px;font-size:11px;opacity:.62;line-height:1.4;}
    .comp{padding:2px 12px 9px;}
    .seg{display:flex;height:6px;border-radius:3px;overflow:hidden;margin-bottom:7px;background:rgba(255,255,255,.06);}
    .seg i{display:block;height:100%;}
    .legend{display:flex;flex-wrap:wrap;gap:8px 12px;}
    .legend span{display:inline-flex;align-items:center;gap:4px;opacity:.85;font-size:11px;}
    .list{max-height:200px;overflow-y:auto;padding:2px 0;border-top:1px solid rgba(255,255,255,.07);}
    .row{padding:7px 12px;border-radius:6px;}
    .rh{display:flex;align-items:center;gap:6px;}
    .rh .host{font-weight:600;word-break:break-all;}
    .reason{margin-top:2px;opacity:.7;font-size:11px;line-height:1.35;}
    .ft{padding:8px 12px;border-top:1px solid rgba(255,255,255,.08);display:flex;flex-direction:column;gap:8px;}
    .ft-note{opacity:.55;font-size:10px;line-height:1.3;}
    .ft-btns{display:flex;gap:8px;}
    .ft .share{flex:1;display:inline-flex;align-items:center;justify-content:center;gap:5px;cursor:pointer;white-space:nowrap;
      color:#e8e8ef;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);
      padding:6px 10px;border-radius:7px;font-size:11px;font-weight:700;font-family:inherit;}
    .ft .share:hover{background:rgba(255,255,255,.14);}
    .ft .cta{flex:1;display:inline-flex;align-items:center;justify-content:center;gap:5px;text-decoration:none;color:#fff;white-space:nowrap;
      background:#6d5ef0;padding:6px 10px;border-radius:7px;font-size:11px;font-weight:700;}
    .ft .cta:hover{background:#7d70f5;}
    .toast{position:absolute;left:50%;bottom:12px;transform:translateX(-50%) translateY(8px);
      background:#1b1b22;color:#fff;border:1px solid rgba(255,255,255,.16);padding:7px 14px;border-radius:8px;
      font-size:11px;font-weight:600;white-space:nowrap;opacity:0;pointer-events:none;transition:opacity .2s,transform .2s;
      box-shadow:0 6px 20px rgba(0,0,0,.4);z-index:5;}
    .toast.show{opacity:1;transform:translateX(-50%) translateY(0);}
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
    const comp = computeComposition();
    const verdict = computeVerdict(comp);

    // 幂等：AI 流式回答会高频触发重扫，状态不变时跳过重绘，避免闪烁/滚动复位
    const key =
      (panelExpanded ? "E" : "C") +
      "|" + total + "|" + low + "|" + caution + "|" +
      CAT_ORDER.map((c) => comp[c]).join(",") + "|" + verdict.text + "|" + verdict.action + "|" +
      flagged.map(([h, s]) => h + ":" + s.tier).join(",");
    if (panelHost && panelHost.isConnected && key === lastPanelKey) return;
    lastPanelKey = key;

    ensurePanel();

    const SEG_COLOR = { official: "#5fd49b", news: "#9db2ff", ugc: "#c9a3ff", lowtrust: "#ff6b6b", other: "#6b7280" };
    const barTitle = escHtml(verdict.text + " · " + L.barTitle(flaggedCount, total));
    const vIcon = verdict.level === "warn" ? "⚠" : verdict.level === "ok" ? "✓" : "ℹ";

    let body;
    if (panelExpanded) {
      // 构成分段条 + 图例
      const segs = CAT_ORDER.filter((c) => comp[c] > 0)
        .map((c) => `<i style="width:${(comp[c] / total) * 100}%;background:${SEG_COLOR[c]}"></i>`)
        .join("");
      const legend = CAT_ORDER.filter((c) => comp[c] > 0)
        .map((c) => `<span>${CAT_ICON[c]} ${escHtml(L.cat[c])} ${comp[c]}</span>`)
        .join("");
      const rows = flagged
        .map(([host, s]) => {
          const ic = s.tier === "low" ? "🔴" : "🟡";
          return (
            `<div class="row" data-host="${escHtml(host)}">` +
            `<div class="rh"><span>${ic}</span><span class="host">${escHtml(host)}</span></div>` +
            `<div class="reason">${escHtml(reasonsText(s.reasons))}</div>` +
            `</div>`
          );
        })
        .join("");
      body =
        `<div class="hd"><span class="brand">${LOGO_SVG}<span class="wordmark">Iris</span></span>` +
        `<span class="sub">${escHtml(L.title)}</span><span class="x" id="irisX">▾</span></div>` +
        `<div class="insight ${verdict.level}">${vIcon} ${escHtml(verdict.text)}</div>` +
        (verdict.action ? `<div class="action">${escHtml(verdict.action)}</div>` : "") +
        `<div class="comp"><div class="seg">${segs}</div><div class="legend">${legend}</div></div>` +
        (rows ? `<div class="list">${rows}</div>` : "") +
        `<div class="ft"><div class="ft-note">${escHtml(L.note)}</div>` +
        `<div class="ft-btns">` +
        `<button class="share" id="irisShare" type="button">⤴ ${escHtml(L.shareBtn)}</button>` +
        `<a class="cta" href="${IRIS_STORE_URL}" target="_blank" rel="noopener noreferrer">${LOGO_SVG}${escHtml(L.installCta)}</a>` +
        `</div></div>` +
        `<div class="toast" id="irisToast"></div>`;
    } else {
      const countLine =
        flaggedCount > 0
          ? `${low > 0 ? `<span style="color:#ff6b6b">🔴 ${low}</span>` : ""}` +
            `${low > 0 && caution > 0 ? "&nbsp;" : ""}` +
            `${caution > 0 ? `<span style="color:#ffcf5c">🟡 ${caution}</span>` : ""}` +
            ` · ${total} ${escHtml(L.sources)}`
          : `<span style="opacity:.9">${escHtml(verdict.text)}</span> · ${total}`;
      body =
        `<div class="bar" id="irisBar" title="${barTitle}"><span class="brand">${LOGO_SVG}<span class="wordmark">Iris</span></span>` +
        `<span class="ct">${countLine}</span><span class="cv">▴</span></div>`;
    }

    panelRoot.innerHTML = `<style>${PANEL_CSS}</style><div class="wrap">${body}</div>`;

    if (panelExpanded) {
      const x = panelRoot.querySelector("#irisX");
      if (x) x.onclick = () => { panelExpanded = false; renderPanel(); };
      const share = panelRoot.querySelector("#irisShare");
      if (share) share.onclick = (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        copyToClipboard(buildShareText(verdict, comp), () => {
          const hint = L.shareRateHint ? ` · ${L.shareRateHint}` : "";
          showPanelToast((L.copiedShare || L.copied) + hint);
        });
      };
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
    if (!extAlive()) return; // 扩展已重载/更新，旧脚本静默退出，避免刷错
    if (!hostMatchesSurface(location.hostname)) return;
    const anchors = collectCitationAnchors();
    lastAnchors = anchors;
    const hosts = [...new Set(anchors.map((x) => x.host))].slice(0, 80);
    try {
      chrome.runtime.sendMessage({ type: "AI_SEARCH_SOURCES", hosts }, (resp) => {
        if (chrome.runtime.lastError) return;
        const scored = resp && Array.isArray(resp.scored) ? resp.scored : [];
        for (const s of scored) {
          hostScore.set(s.hostname, { tier: s.tier, reasons: s.reasons || [], category: s.category || "other" });
        }
        if (_aiEnabled && _annotateEnabled) annotate();
        else teardownAnnotations();
      });
    } catch { /* Extension context invalidated：忽略 */ }
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
