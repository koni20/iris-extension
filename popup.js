// ── 初始化静态 UI 文字 ─────────────────────────────────────────────────────────
document.getElementById("verdictTitle").textContent = t.scanning;
document.getElementById("verdictSub").textContent   = t.loadingData;
document.querySelector('[data-tab="trackers"]').textContent   = t.tabTrackers;
document.querySelector('[data-tab="apis"]').textContent       = t.tabBrowserAPIs;
document.getElementById("emptyTrackers").querySelector(".empty-title").textContent = t.noTrackersTitle;
document.getElementById("emptyTrackers").querySelector(".empty-sub").textContent   = t.noTrackersSub;
document.getElementById("emptyApis").querySelector(".empty-title").textContent     = t.noApisTitle;
document.getElementById("emptyApis").querySelector(".empty-sub").textContent       = t.noApisSub;
document.querySelector(".comp-ends span:first-child").textContent = t.privacyFriendly;
document.querySelector(".comp-ends span:last-child").textContent  = t.mostInvasive;
document.getElementById("statTrackers").closest(".stat").querySelector(".stat-label").textContent = t.trackers;
document.getElementById("statRequests").closest(".stat").querySelector(".stat-label").textContent  = t.requests;
document.getElementById("statApis").closest(".stat").querySelector(".stat-label").textContent      = t.apiCalls;

document.querySelector(".ai-tab-label").textContent = t.tabAiSafety;
document.getElementById("tabBtnContent").textContent = t.tabContentSafety;
document.getElementById("emptyContentTitle").textContent = t.csEmptyTitle;
document.getElementById("emptyContentSub").textContent = t.csEmptySub;

function initTabs() {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((x) => x.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById("tabTrackers").classList.toggle("hidden", tab.dataset.tab !== "trackers");
      document.getElementById("tabApis").classList.toggle("hidden", tab.dataset.tab !== "apis");
      document.getElementById("tabAi").classList.toggle("hidden", tab.dataset.tab !== "ai");
      document.getElementById("tabContent").classList.toggle("hidden", tab.dataset.tab !== "content");
    });
  });
}
initTabs();

// ── 获取并渲染数据 ─────────────────────────────────────────────────────────────
function fetchAndRender() {
  chrome.runtime.sendMessage({ type: "GET_DATA" }, (data) => {
    if (chrome.runtime.lastError || !data) return;
    render(data);
  });
}

// ── 重置为"扫描中"状态 ────────────────────────────────────────────────────────
function resetToScanning() {
  document.getElementById("verdictSection").className = "verdict-section";
  document.getElementById("verdictIcon").textContent  = "🔍";
  document.getElementById("verdictTitle").textContent = t.scanning;
  document.getElementById("verdictTitle").className   = "verdict-title accent";
  document.getElementById("verdictSub").textContent   = t.loadingData;
  document.getElementById("statTrackers").textContent = "—";
  document.getElementById("statRequests").textContent = "—";
  document.getElementById("statApis").textContent     = "—";
  document.getElementById("comparisonSection").style.display = "none";
  document.getElementById("trackerList").innerHTML    = "";
  document.getElementById("apiList").innerHTML        = "";
  document.getElementById("emptyTrackers").style.display = "flex";
  document.getElementById("emptyApis").style.display     = "flex";
  document.getElementById("logoDot").className        = "logo-dot";
  document.getElementById("siteBadge").textContent    = "—";
  document.getElementById("phishingBanner").classList.add("hidden");
  document.getElementById("contentSafetyList").innerHTML = "";
  lastContentSafetyJson = "";
  const csSummary = document.getElementById("csSummary");
  if (csSummary) {
    csSummary.className = "cs-summary cs-rating-green";
    csSummary.innerHTML = "";
  }
}

// ── 监听来自 background 的 Tab 变化通知 ──────────────────────────────────────
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "TAB_CHANGED") {
    resetToScanning();
    setTimeout(fetchAndRender, 300);
  }
  if (message.type === "TAB_LOADING") {
    resetToScanning();
  }
});

// ── 轮询刷新（每 2 秒，让数据实时更新）──────────────────────────────────────
let lastTrackerCount = -1;
let lastApiCount = -1;
let lastContentSafetyJson = "";

function pollData() {
  chrome.runtime.sendMessage({ type: "GET_DATA" }, (data) => {
    if (chrome.runtime.lastError || !data) return;
    const csJson = JSON.stringify(data.contentSafety || {});
    const changed =
      data.trackers.length !== lastTrackerCount ||
      data.apiCalls.length !== lastApiCount ||
      csJson !== lastContentSafetyJson;
    if (changed) {
      lastTrackerCount = data.trackers.length;
      lastApiCount = data.apiCalls.length;
      lastContentSafetyJson = csJson;
      render(data);
    }
  });
}

// 首次加载
fetchAndRender();

// 持续轮询，实时更新
const pollInterval = setInterval(pollData, 2000);

// Popup 关闭时清理定时器
window.addEventListener("unload", () => clearInterval(pollInterval));

function renderPhishing(phishing) {
  const banner = document.getElementById("phishingBanner");
  if (!phishing) {
    banner.classList.add("hidden");
    return;
  }

  banner.classList.remove("hidden");
  document.getElementById("phishingTitle").textContent =
    t.phishingTitle
      ? t.phishingTitle(phishing.brand)
      : `⚠️ Possible fake ${phishing.brand} website`;

  document.getElementById("phishingSub").textContent =
    t.phishingSub
      ? t.phishingSub(phishing.spoofedDomain)
      : `"${phishing.spoofedDomain}" is not the official domain. You may be on a phishing site designed to steal your account or conversation data.`;

  document.getElementById("phishingLegit").textContent =
    (t.phishingLegitPrefix || "✅ Official: ") + phishing.legitimateDomains.join(" / ");
}

function renderDBMeta(dbMeta, csMeta) {
  if (!dbMeta) return;
  const dot = document.getElementById("dbDot");
  const status = document.getElementById("dbStatus");
  const parts = [];

  if (dbMeta.updatedAt) {
    const days = Math.floor((Date.now() - dbMeta.updatedAt) / 86400000);
    const dateStr = new Date(dbMeta.updatedAt).toLocaleDateString();
    const countStr = dbMeta.dynamicCount ? `+${dbMeta.dynamicCount.toLocaleString()} domains` : "";
    dot.className = "db-dot cache";
    parts.push(
      `disconnect.me ${countStr} · ${t.dbUpdated ? t.dbUpdated(days) : days === 0 ? "updated today" : `updated ${days}d ago`} (${dateStr})`
    );
  } else {
    dot.className = "db-dot local";
    parts.push(t.dbBuiltIn || "built-in database · fetching latest…");
  }

  if (csMeta && csMeta.updatedAt) {
    const csd = Math.floor((Date.now() - csMeta.updatedAt) / 86400000);
    const n = csMeta.dynamicCount ? `${csMeta.dynamicCount.toLocaleString()} adult domains · ` : "";
    parts.push(`content ${n}${t.dbUpdated(csd)}`);
  }

  status.textContent = parts.join(" · ");
}

function renderContentSafety(cs) {
  const summary = document.getElementById("csSummary");
  const list = document.getElementById("contentSafetyList");
  const empty = document.getElementById("emptyContent");
  const lang = (navigator.language || "en").toLowerCase().split("-")[0];
  const useZh = lang === "zh";

  const rating = cs.rating || "green";
  summary.className = "cs-summary cs-rating-" + rating;

  const titleKey = "csRating_" + rating + "Title";
  const subKey = "csRating_" + rating + "Sub";
  summary.innerHTML = `
    <div class="cs-rating-icon">${rating === "green" ? "🟢" : rating === "yellow" ? "🟡" : "🔴"}</div>
    <div class="cs-rating-body">
      <div class="cs-rating-title">${t[titleKey] || ""}</div>
      <div class="cs-rating-sub">${t[subKey] || ""}</div>
    </div>
  `;

  const hasRows =
    (cs.domainMatches && cs.domainMatches.length > 0) ||
    (cs.keywords && cs.keywords.length > 0) ||
    (cs.manipulation && cs.manipulation.length > 0);

  list.innerHTML = "";

  if (!hasRows && rating === "green") {
    empty.classList.remove("hidden");
    return;
  }

  empty.classList.add("hidden");

  for (const d of cs.domainMatches || []) {
    const div = document.createElement("div");
    div.className = "cs-item cs-item-domain";
    const catLabel = (t.csCategories && t.csCategories[d.category]) || d.category;
    div.innerHTML = `
      <div class="cs-item-tag">${catLabel}</div>
      <div class="cs-item-domain">${d.domain}</div>
      <div class="cs-item-plain">${useZh ? d.plain_zh : d.plain_en}</div>
    `;
    list.appendChild(div);
  }

  for (const k of cs.keywords || []) {
    const div = document.createElement("div");
    div.className = "cs-item cs-item-kw cs-level-" + k.level;
    const lvlKey = "csLevel_" + k.level;
    div.innerHTML = `
      <div class="cs-item-tag">${t[lvlKey] || k.level}</div>
      <div class="cs-item-plain">${typeof t.csKeywordMatch === "function" ? t.csKeywordMatch(k.match) : k.match}</div>
    `;
    list.appendChild(div);
  }

  for (const m of cs.manipulation || []) {
    const div = document.createElement("div");
    div.className = "cs-item cs-item-manip";
    const hintKey = "csManip_" + m.hint;
    const msg = t[hintKey] || m.hint;
    div.innerHTML = `
      <div class="cs-item-tag">${t.csManipType}</div>
      <div class="cs-item-plain">${msg}</div>
    `;
    list.appendChild(div);
  }
}

function render({
  trackers,
  totalRequests,
  apiCalls,
  aiCalls = [],
  phishing = null,
  dbMeta = null,
  csMeta = null,
  contentSafety = null,
  url,
}) {
  // 钓鱼警告（最优先渲染）
  renderPhishing(phishing);

  // 数据库状态
  renderDBMeta(dbMeta, csMeta);

  renderContentSafety(contentSafety || { rating: "green", domainMatches: [], keywords: [], manipulation: [] });

  // 站点名
  let hostname = "—";
  try { hostname = new URL(url).hostname.replace(/^www\./, ""); } catch {}
  document.getElementById("siteBadge").textContent = hostname;

  // 统计数字
  document.getElementById("statTrackers").textContent = trackers.length;
  document.getElementById("statRequests").textContent = totalRequests;
  document.getElementById("statApis").textContent = apiCalls.length;

  // 风险等级
  const risk = getRiskLevel({ trackers, apiCalls });
  renderVerdict(risk, trackers, apiCalls);

  // 比较条：只在有追踪器时显示（0 追踪器没有对比意义）
  if (trackers.length > 0) {
    renderComparison(trackers.length);
  }

  // 追踪器列表
  renderTrackers(trackers);

  // API 调用列表
  renderApis(apiCalls);

  // AI 调用列表
  renderAiCalls(aiCalls);

  // AI badge
  const aiBadge = document.getElementById("aiBadge");
  if (aiCalls.length > 0) {
    aiBadge.textContent = aiCalls.length;
    aiBadge.classList.remove("hidden");
  } else {
    aiBadge.classList.add("hidden");
  }

}

// ── 风险等级判断 ────────────────────────────────────────────────────────────────
function getRiskLevel({ trackers, apiCalls }) {
  // 第一梯队：无论其他情况，直接判定为高风险
  const criticalApis = ["geolocation", "media-access"];
  const criticalCategories = ["Session Recording", "Data Broker"];

  const hasCriticalApi     = apiCalls.some(a => criticalApis.includes(a.api));
  const hasCriticalTracker = trackers.some(tr => criticalCategories.includes(tr.category));

  if (hasCriticalApi || hasCriticalTracker || trackers.length > 15) return "high";

  // 第二梯队：指纹采集相关
  const fingerprintApis = ["canvas-fingerprint", "webgl-fingerprint", "audio-fingerprint"];
  const hasFingerprintApi     = apiCalls.some(a => fingerprintApis.includes(a.api));
  const hasFingerprintTracker = trackers.some(tr => tr.category === "Fingerprinting");

  // 指纹 + 较多追踪器 → 组合威胁，升级为高风险
  if ((hasFingerprintApi || hasFingerprintTracker) && trackers.length >= 5) return "high";

  // 指纹单独出现，或追踪器数量偏多 → 中风险
  if (hasFingerprintApi || hasFingerprintTracker || trackers.length > 3) return "medium";

  // 第三梯队：WebRTC 或少量追踪器
  if (apiCalls.some(a => a.api === "webrtc-leak") || trackers.length > 0 || apiCalls.length > 0) return "low";

  return "safe";
}

// ── 渲染 Verdict ─────────────────────────────────────────────────────────────
function renderVerdict(risk, trackers, apiCalls) {
  const section = document.getElementById("verdictSection");
  const icon = document.getElementById("verdictIcon");
  const title = document.getElementById("verdictTitle");
  const sub = document.getElementById("verdictSub");
  const dot = document.getElementById("logoDot");

  section.className = "verdict-section risk-" + risk;

  const configs = {
    high:   { icon: "⚠️", titleText: t.highExposure,   titleClass: "red",    dotClass: "red",   sub: buildSub(trackers, apiCalls) },
    medium: { icon: "🔶", titleText: t.mediumTracking,  titleClass: "amber",  dotClass: "amber", sub: buildSub(trackers, apiCalls) },
    low:    { icon: "🔵", titleText: t.lightTracking,   titleClass: "accent", dotClass: "",      sub: buildSub(trackers, apiCalls) },
    safe:   { icon: "✅", titleText: t.noTracking,      titleClass: "green",  dotClass: "green", sub: t.noIssues }
  };

  const cfg = configs[risk];
  icon.textContent = cfg.icon;
  title.textContent = cfg.titleText;
  title.className = "verdict-title " + cfg.titleClass;
  sub.textContent = cfg.sub;
  dot.className = "logo-dot " + cfg.dotClass;
}

function buildSub(trackers, apiCalls) {
  const parts = [];

  if (trackers.length > 0) {
    const companies = [...new Set(trackers.map(tr => tr.company))];
    const shown = companies.slice(0, 2).join(", ");
    const more = companies.length > 2 ? ` +${companies.length - 2}` : "";
    parts.push(t.dataSentTo(trackers.length, shown + more));
  }

  // API 调用：按 api 字段判断风险，label 字段显示友好名称
  const HIGH_RISK_APIS = ["canvas-fingerprint", "webgl-fingerprint", "audio-fingerprint", "geolocation", "media-access"];
  const highApis   = apiCalls.filter(a => HIGH_RISK_APIS.includes(a.api) || a.risk === "high");
  const otherApis  = apiCalls.filter(a => !HIGH_RISK_APIS.includes(a.api) && a.risk !== "high");

  const apiName = (a) => a.label || {
    "canvas-fingerprint":  "Canvas Fingerprinting",
    "webgl-fingerprint":   "WebGL Fingerprinting",
    "audio-fingerprint":   "Audio Fingerprinting",
    "geolocation":         "Location Access",
    "media-access":        "Camera / Microphone",
    "webrtc-leak":         "WebRTC IP Exposure",
    "clipboard-read":      "Clipboard Access",
    "battery-fingerprint": "Battery Fingerprinting"
  }[a.api] || a.api;

  if (highApis.length > 0) {
    parts.push(t.detected(highApis.map(apiName).join(", ")));
  } else if (otherApis.length > 0) {
    parts.push(t.detected(otherApis.map(apiName).join(", ")));
  }

  return parts.join(" · ") || t.noIssues;
}

// ── 渲染比较条 ──────────────────────────────────────────────────────────────────
function renderComparison(trackerCount) {
  const section = document.getElementById("comparisonSection");
  const fill = document.getElementById("compFill");
  const label = document.getElementById("compLabel");

  const pct = getPercentile(trackerCount);
  section.style.display = "block";
  label.innerHTML = t.compLabel(pct);

  setTimeout(() => { fill.style.width = pct + "%"; }, 100);
}

// ── 渲染追踪器列表 ──────────────────────────────────────────────────────────────
function renderTrackers(trackers) {
  const list = document.getElementById("trackerList");
  const empty = document.getElementById("emptyTrackers");

  list.innerHTML = ""; // 每次重新渲染前清空

  if (trackers.length === 0) {
    empty.style.display = "flex";
    return;
  }
  empty.style.display = "none";

  const hint = document.createElement("div");
  hint.className = "expand-hint";
  hint.textContent = t.expandHint;
  list.appendChild(hint);

  trackers.forEach((tracker, i) => {
    const item = document.createElement("div");
    item.className = "tracker-item";
    item.style.animationDelay = `${i * 40}ms`;

    const tagClass = "tag-" + tracker.category.replace(/[\s/]+/g, "-");
    const categoryLabel = t.categories[tracker.category] || tracker.category;

    item.innerHTML = `
      <div class="tracker-row">
        <span class="tracker-tag ${tagClass}">${categoryLabel}</span>
        <span class="tracker-domain">${tracker.domain}</span>
        <span class="tracker-chevron">▼</span>
      </div>
      <div class="tracker-company">${tracker.company}</div>
      <div class="tracker-plain">${tracker.plain}</div>
    `;

    item.addEventListener("click", () => item.classList.toggle("expanded"));
    list.appendChild(item);
  });
}

// ── 渲染 AI 调用列表 ────────────────────────────────────────────────────────────
function renderAiCalls(aiCalls) {
  const list  = document.getElementById("aiList");
  const empty = document.getElementById("emptyAi");

  list.innerHTML = "";

  document.getElementById("emptyAiTitle").textContent = t.noAiTitle || "No AI services detected";
  document.getElementById("emptyAiSub").textContent   = t.noAiSub   || "This page doesn't appear to be sending your data to any AI APIs.";

  if (aiCalls.length === 0) {
    empty.style.display = "flex";
    return;
  }
  empty.style.display = "none";

  // 顶部警告提示：如果是 AI 网站本身，用特殊文案
  const isOnAiSite = aiCalls.some(c => c.source === "website");
  const banner = document.createElement("div");
  banner.className = "ai-warning-banner";
  banner.textContent = isOnAiSite
    ? (t.aiWebsiteBanner || "🧠 You are currently on an AI service website. Your conversations and inputs are processed by their AI models.")
    : (t.aiWarningBanner || "⚠️ This page is sending data to AI services. Any text you enter may be processed by these AI models.");
  list.appendChild(banner);

  const lang = (navigator.language || "en").toLowerCase().split("-")[0];
  const plainKey = ["zh","ja","es","fr","de"].includes(lang) ? `plain_${lang}` : "plain_en";

  aiCalls.forEach((call, i) => {
    const item = document.createElement("div");
    // AI 官网本身用中性蓝色，第三方调用才用风险色
    const isWebsite = call.source === "website";
    item.className = `ai-item risk-${isWebsite ? "website" : (call.risk || "medium")}`;
    item.style.animationDelay = `${i * 50}ms`;

    // AI 官网本身不显示"高风险"，改为中性标签
    const riskLabel = isWebsite
      ? (t.aiServiceLabel || "AI 服务")
      : (call.risk === "high"
          ? (t.highRisk || "High Risk")
          : (t.mediumRisk || "Medium Risk"));

    const plainText = call[plainKey] || call.plain_en || "";
    const countText = isWebsite
      ? (t.aiCallWebsite || "You are currently using this AI service")
      : (call.count > 1
          ? (t.aiCallCount ? t.aiCallCount(call.count) : `${call.count} requests detected`)
          : (t.aiCallOnce || "Detected on this page"));

    const companyEmojis = {
      // 国际
      "OpenAI": "🟢", "Anthropic": "🟠", "Google": "🔵",
      "Microsoft Azure": "🔷", "Mistral AI": "🌊", "Groq": "⚡",
      "Perplexity AI": "🔮", "Cohere": "🌿", "Hugging Face": "🤗",
      "Replicate": "🔄", "Together AI": "🤝", "Stability AI": "🎨",
      // 中国
      "DeepSeek": "🐋",
      "Alibaba Cloud": "🧧",
      "Baidu": "🔴",
      "Tencent": "🐧",
      "ByteDance": "🎵",
      "Zhipu AI (智谱AI)": "🧠",
      "Moonshot AI (月之暗面)": "🌙",
      "Baichuan AI (百川智能)": "🌊",
      "MiniMax (稀宇科技)": "⚡",
      "iFlytek (科大讯飞)": "🎤",
      "01.AI (零一万物)": "0️⃣",
      "SenseTime (商汤科技)": "👁️"
    };
    const emoji = companyEmojis[call.company] || "🤖";

    item.innerHTML = `
      <div class="ai-header">
        <div class="ai-logo">${emoji}</div>
        <div class="ai-info">
          <div class="ai-company">${call.company}</div>
          <div class="ai-model">${call.model}</div>
        </div>
        <span class="ai-risk-tag ai-risk-${call.risk || "medium"}">${riskLabel}</span>
      </div>
      <div class="ai-count">${countText}</div>
      <div class="ai-plain">${plainText}</div>
    `;
    list.appendChild(item);
  });
}

// ── 渲染 API 调用列表 ──────────────────────────────────────────────────────────
function renderApis(apiCalls) {
  const list = document.getElementById("apiList");
  const empty = document.getElementById("emptyApis");

  list.innerHTML = ""; // 每次重新渲染前清空

  if (apiCalls.length === 0) {
    empty.style.display = "flex";
    return;
  }
  empty.style.display = "none";

  apiCalls.forEach((call, i) => {
    const item = document.createElement("div");
    item.className = `api-item risk-${call.risk || "medium"}`;
    item.style.animationDelay = `${i * 40}ms`;

    const riskLabel = { high: t.highRisk, medium: t.mediumRisk, low: t.lowRisk }[call.risk] || t.mediumRisk;
    const riskColor = { high: "#e53e3e", medium: "#d97706", low: "#6c5ef6" }[call.risk] || "#6c5ef6";

    const apiI18n = t.apis[call.api] || {};
    const displayLabel = apiI18n.label || call.label || call.api;
    const displayPlain = apiI18n.plain || call.plain || "";

    item.innerHTML = `
      <div class="api-row">
        <div class="api-risk-dot"></div>
        <div class="api-label">${displayLabel}</div>
        <span style="font-size:9.5px;font-weight:700;color:${riskColor};letter-spacing:0.4px;">${riskLabel}</span>
      </div>
      <div class="api-plain">${displayPlain}</div>
    `;

    list.appendChild(item);
  });
}
