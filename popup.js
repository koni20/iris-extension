// ── 安全转义（防止 innerHTML 注入）─────────────────────────────────────────────
function esc(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ── 用户设置（popup 本地副本）──────────────────────────────────────────────────
const DEFAULT_SETTINGS = {
  mod_trackers: true, mod_fingerprinting: true,
  mod_aiSafety: true, mod_contentSafety: true,
  mod_spendGuard: true, mod_cookieConsent: true,
  spendSensitivity: "normal",
};
let currentSettings = { ...DEFAULT_SETTINGS };

// ── 初始化静态 UI 文字 ─────────────────────────────────────────────────────────
document.getElementById("verdictTitle").textContent = t.scanning;
document.getElementById("verdictSub").textContent   = t.loadingData;
document.getElementById("ttlTrackers").textContent  = t.tabTrackers;
document.getElementById("ttlApis").textContent      = t.tabBrowserAPIs;
document.getElementById("ttlAi").textContent        = t.tabAiSafety;
document.getElementById("ttlContent").textContent   = t.tabContentSafety;
document.getElementById("ttlSpend").textContent     = t.tabSpendGuard;
document.getElementById("ttlCookie").textContent    = t.tabCookieConsent;
document.getElementById("emptyTrackersTitle").textContent = t.noTrackersTitle;
document.getElementById("emptyTrackersSub").textContent   = t.noTrackersSub;
document.getElementById("emptyApisTitle").textContent     = t.noApisTitle;
document.getElementById("emptyApisSub").textContent       = t.noApisSub;
document.getElementById("compEndLeft").textContent  = t.privacyFriendly;
document.getElementById("compEndRight").textContent = t.mostInvasive;
document.getElementById("statLabelTrackers").textContent = t.trackers;
document.getElementById("statLabelRequests").textContent = t.requests;
document.getElementById("statLabelApis").textContent     = t.apiCalls;
document.getElementById("emptyContentTitle").textContent = t.csEmptyTitle;
document.getElementById("emptyContentSub").textContent   = t.csEmptySub;
document.getElementById("emptySpendTitle").textContent   = t.subEmptyScanningTitle;
document.getElementById("emptySpendSub").textContent     = t.subEmptyScanningSub;

// session bar 静态文字
document.getElementById("sessionLabel").textContent = t.sessionLabel || "SESSION";

// ── Section Cards 折叠导航 ────────────────────────────────────────────────────
function initCards() {
  document.querySelectorAll(".sc-hdr").forEach((hdr) => {
    hdr.addEventListener("click", () => {
      const body = hdr.nextElementSibling;
      const isOpen = body.classList.contains("open");
      body.classList.toggle("open", !isOpen);
      hdr.classList.toggle("open", !isOpen);
    });
  });
}
initCards();

// ── 设置面板 ──────────────────────────────────────────────────────────────────
function initSettingsPanel() {
  // 静态文字
  document.getElementById("spTitle").textContent          = t.settingsTitle        || "Settings";
  document.getElementById("spLabelModules").textContent   = t.settingsModules      || "Modules";
  document.getElementById("spLabelSensitivity").textContent = t.settingsSensitivity || "Spend Guard";
  document.getElementById("spMod_trackers").textContent      = t.tabTrackers;
  document.getElementById("spMod_fingerprinting").textContent = t.tabBrowserAPIs;
  document.getElementById("spMod_aiSafety").textContent      = t.tabAiSafety;
  document.getElementById("spMod_contentSafety").textContent = t.tabContentSafety;
  document.getElementById("spMod_spendGuard").textContent    = t.tabSpendGuard;
  document.getElementById("spMod_cookieConsent").textContent = t.tabCookieConsent;
  document.getElementById("spSensTitle").textContent         = t.settingsSensTitle  || "Detection Sensitivity";
  document.getElementById("sensNormal").textContent          = t.settingsSensNormal || "Normal";
  document.getElementById("sensStrict").textContent          = t.settingsSensStrict || "Strict";
  document.getElementById("spNote").textContent              = t.settingsSavedNote  || "Changes saved automatically.";

  // 齿轮按钮
  document.getElementById("gearBtn").addEventListener("click", () => {
    showPanel(_currentPanel === "settings" ? null : "settings");
  });
  document.getElementById("settingsClose").addEventListener("click", () => toggleSettings(false));

  // 模块开关：change 时立即保存
  ["trackers","fingerprinting","aiSafety","contentSafety","spendGuard","cookieConsent"].forEach((mod) => {
    document.getElementById("tog_" + mod).addEventListener("change", (e) => {
      currentSettings["mod_" + mod] = e.target.checked;
      saveSettings();
    });
  });

  // 灵敏度 pill
  ["sensNormal","sensStrict"].forEach((id) => {
    document.getElementById(id).addEventListener("click", (e) => {
      const val = e.currentTarget.dataset.val;
      currentSettings.spendSensitivity = val;
      applySensitivityUI(val);
      saveSettings();
    });
  });
}

// ── 面板切换（settings / history / null）────────────────────────────────────
let _currentPanel = null;

function showPanel(panel) {
  _currentPanel = panel;
  const showSections = panel === null;
  document.getElementById("settingsPanel").classList.toggle("hidden", panel !== "settings");
  document.getElementById("historyPanel").classList.toggle("hidden", panel !== "history");
  document.getElementById("sections").classList.toggle("hidden", !showSections);
  document.getElementById("gearBtn").classList.toggle("active", panel === "settings");
  document.getElementById("historyBtn").classList.toggle("active", panel === "history");
}

function toggleSettings(open) {
  showPanel(open ? "settings" : null);
}

function toggleHistory(open) {
  showPanel(open ? "history" : null);
  if (open) {
    chrome.runtime.sendMessage({ type: "GET_HISTORY" }, (entries) => {
      renderHistory(entries || []);
    });
  }
}

function applySettingsToUI() {
  ["trackers","fingerprinting","aiSafety","contentSafety","spendGuard","cookieConsent"].forEach((mod) => {
    const el = document.getElementById("tog_" + mod);
    if (el) el.checked = !!currentSettings["mod_" + mod];
  });
  applySensitivityUI(currentSettings.spendSensitivity || "normal");
}

function applySensitivityUI(val) {
  document.getElementById("sensNormal").classList.toggle("active", val === "normal");
  document.getElementById("sensStrict").classList.toggle("active", val === "strict");
  const descKey = val === "strict" ? "settingsSensStrictDesc" : "settingsSensNormalDesc";
  document.getElementById("spSensDesc").textContent = t[descKey] || "";
}

function saveSettings() {
  chrome.runtime.sendMessage({ type: "SAVE_SETTINGS", settings: currentSettings });
}

// ── Session 汇总栏渲染 ────────────────────────────────────────────────────────
function renderSession(session) {
  if (!session) return;
  document.getElementById("sessTrackers").textContent  = session.trackers || 0;
  document.getElementById("sessAiCalls").textContent   = session.aiCalls || 0;
  document.getElementById("sessLowTrust").textContent  = session.lowTrustCitations || 0;

  const ltEl = document.getElementById("sessLt");
  if (ltEl) ltEl.classList.toggle("has-alert", (session.lowTrustCitations || 0) > 0);
}

// ── 更新 section card 头部状态和角标 ──────────────────────────────────────────
function updateCard(key, { dot = "", badge = "", badgeColor = "", findings = false, findingLevel = "" } = {}) {
  const dotEl  = document.getElementById("dot" + key);
  const bdgEl  = document.getElementById("bdg" + key);
  const cardEl = document.getElementById("card" + key);
  if (dotEl) dotEl.className = "sc-dot" + (dot ? " " + dot : "");
  if (bdgEl) {
    if (badge) {
      bdgEl.textContent = badge;
      bdgEl.className = "sc-bdg" + (badgeColor ? " bdg-" + badgeColor : "");
    } else {
      bdgEl.classList.add("hidden");
    }
  }
  if (cardEl) {
    cardEl.classList.toggle("lvl-red",   findingLevel === "red");
    cardEl.classList.toggle("lvl-amber", findingLevel === "amber");
  }
}

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
  lastAiSourcesJson = "";
  lastSpendJson = "";
  lastCookieJson = "";
  const asm = document.getElementById("aiSourcesMount");
  if (asm) asm.innerHTML = "";
  const csSummary = document.getElementById("csSummary");
  if (csSummary) { csSummary.className = "cs-summary cs-rating-green"; csSummary.innerHTML = ""; }
  const spendSummary = document.getElementById("spendSummary");
  if (spendSummary) { spendSummary.className = "cs-summary cs-rating-neutral"; spendSummary.innerHTML = ""; }
  document.getElementById("spendList").innerHTML = "";
  document.getElementById("emptySpend").classList.add("hidden");
  const cookieSummary = document.getElementById("cookieSummary");
  if (cookieSummary) { cookieSummary.className = "cs-summary cs-rating-neutral"; cookieSummary.innerHTML = ""; }
  document.getElementById("cookieList").innerHTML = "";
  // 重置所有 card 角标
  ["Trackers","Apis","Ai","Content","Spend","Cookie"].forEach((k) => {
    updateCard(k, { dot: "", badge: "" });
  });
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
let lastAiSourcesJson = "";
let lastSpendJson = "";
let lastCookieJson = "";

function pollData() {
  chrome.runtime.sendMessage({ type: "GET_DATA" }, (data) => {
    if (chrome.runtime.lastError || !data) return;
    const csJson     = JSON.stringify(data.contentSafety || {});
    const asJson     = JSON.stringify(data.aiSearchSources || null);
    const spendJson  = JSON.stringify(data.subscriptionGuard || null);
    const cookieJson = JSON.stringify(data.cookieConsent || null);
    const changed =
      data.trackers.length !== lastTrackerCount ||
      data.apiCalls.length !== lastApiCount ||
      csJson    !== lastContentSafetyJson ||
      asJson    !== lastAiSourcesJson     ||
      spendJson !== lastSpendJson         ||
      cookieJson !== lastCookieJson;
    if (changed) {
      lastTrackerCount      = data.trackers.length;
      lastApiCount          = data.apiCalls.length;
      lastContentSafetyJson = csJson;
      lastAiSourcesJson     = asJson;
      lastSpendJson         = spendJson;
      lastCookieJson        = cookieJson;
      render(data);
    }
  });
}

// ── 启动：先加载设置，再初始化面板和数据 ─────────────────────────────────────
initSettingsPanel();
initHistoryPanel();

chrome.storage.local.get("irisSettings", (stored) => {
  if (stored.irisSettings) Object.assign(currentSettings, stored.irisSettings);
  applySettingsToUI();
  fetchAndRender();
});

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
    let csPart = "";
    if (csMeta.dynamicCount) {
      if (csMeta.breakdown) {
        const b = csMeta.breakdown;
        csPart = `${csMeta.dynamicCount.toLocaleString()} domains (A${b.adult}+G${b.gambling}+S${b.scam}) · `;
      } else {
        csPart = `${csMeta.dynamicCount.toLocaleString()} domains · `;
      }
    }
    parts.push(`content ${csPart}${t.dbUpdated(csd)}`);
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
      <div class="cs-item-tag">${esc(catLabel)}</div>
      <div class="cs-item-domain">${esc(d.domain)}</div>
      <div class="cs-item-plain">${esc(useZh ? d.plain_zh : d.plain_en)}</div>
    `;
    list.appendChild(div);
  }

  for (const k of cs.keywords || []) {
    const div = document.createElement("div");
    div.className = "cs-item cs-item-kw cs-level-" + k.level;
    const lvlKey = "csLevel_" + k.level;
    div.innerHTML = `
      <div class="cs-item-tag">${esc(t[lvlKey] || k.level)}</div>
      <div class="cs-item-plain">${esc(typeof t.csKeywordMatch === "function" ? t.csKeywordMatch(k.match) : k.match)}</div>
    `;
    list.appendChild(div);
  }

  for (const m of cs.manipulation || []) {
    const div = document.createElement("div");
    div.className = "cs-item cs-item-manip";
    const hintKey = "csManip_" + m.hint;
    const msg = t[hintKey] || m.hint;
    div.innerHTML = `
      <div class="cs-item-tag">${esc(t.csManipType)}</div>
      <div class="cs-item-plain">${esc(msg)}</div>
    `;
    list.appendChild(div);
  }

  // 更新 card 角标
  if (rating === "red") {
    updateCard("Content", { dot: "red", badge: t.csRating_redTitle || "Flagged", badgeColor: "red", findingLevel: "red" });
  } else if (rating === "yellow") {
    updateCard("Content", { dot: "amber", badge: t.csRating_yellowTitle || "Caution", badgeColor: "amber", findingLevel: "amber" });
  } else {
    updateCard("Content", { dot: "green", badge: t.clean || "Clean", badgeColor: "green" });
  }
}

function renderSpendGuard(subscriptionGuard) {
  const summary = document.getElementById("spendSummary");
  const list = document.getElementById("spendList");
  const empty = document.getElementById("emptySpend");
  if (!summary || !list || !empty) return;

  const disc = `<div class="ai-sources-disclaimer" style="margin-top:8px;">${t.subDisclaimer || ""}</div>`;

  if (subscriptionGuard == null) {
    summary.className = "cs-summary cs-rating-neutral";
    summary.innerHTML = `
      <div class="cs-rating-icon">🔍</div>
      <div class="cs-rating-body">
        <div class="cs-rating-title">${t.subEmptyScanningTitle || ""}</div>
        <div class="cs-rating-sub">${t.subEmptyScanningSub || ""}</div>
      </div>
    `;
    list.innerHTML = "";
    empty.classList.add("hidden");
    updateCard("Spend", { dot: "", badge: "—" });
    return;
  }

  const rating = subscriptionGuard.rating || "neutral";
  const hits = subscriptionGuard.hits || [];

  if (rating === "neutral") {
    summary.className = "cs-summary cs-rating-neutral";
    summary.innerHTML = `
      <div class="cs-rating-icon">➖</div>
      <div class="cs-rating-body">
        <div class="cs-rating-title">${t.subSummary_neutralTitle || ""}</div>
        <div class="cs-rating-sub">${t.subSummary_neutralSub || ""}</div>
        ${disc}
      </div>
    `;
    list.innerHTML = "";
    empty.classList.add("hidden");
    updateCard("Spend", { dot: "green", badge: t.clean || "Clean", badgeColor: "green" });
    return;
  }

  if (rating === "green") {
    summary.className = "cs-summary cs-rating-green";
    summary.innerHTML = `
      <div class="cs-rating-icon">🟢</div>
      <div class="cs-rating-body">
        <div class="cs-rating-title">${t.subSummary_greenTitle || ""}</div>
        <div class="cs-rating-sub">${t.subSummary_greenSub || ""}</div>
        ${disc}
      </div>
    `;
    list.innerHTML = "";
    empty.classList.add("hidden");
    updateCard("Spend", { dot: "green", badge: t.clean || "Clean", badgeColor: "green" });
    return;
  }

  summary.className = "cs-summary cs-rating-yellow";
  summary.innerHTML = `
    <div class="cs-rating-icon">🟡</div>
    <div class="cs-rating-body">
      <div class="cs-rating-title">${t.subSummary_yellowTitle || ""}</div>
      <div class="cs-rating-sub">${t.subSummary_yellowSub || ""}</div>
      ${disc}
    </div>
  `;
  list.innerHTML = "";
  for (const h of hits) {
    const div = document.createElement("div");
    div.className = "cs-item cs-item-manip";
    const msg = (h && h.id && t[h.id]) || (h && h.id) || "";
    div.innerHTML = `
      <div class="cs-item-tag">${esc(t.subSigTag || "Pattern")}</div>
      <div class="cs-item-plain">${esc(msg)}</div>
    `;
    list.appendChild(div);
  }
  empty.classList.add("hidden");

  // 更新 card 角标
  updateCard("Spend", { dot: "amber", badge: String(hits.length), badgeColor: "amber", findingLevel: "amber" });
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
  aiSearchSources = null,
  subscriptionGuard = null,
  cookieConsent = null,
  url,
  session = null,
}) {
  renderPhishing(phishing);
  renderDBMeta(dbMeta, csMeta);
  renderSession(session);

  // 各模块按设置决定是否渲染
  if (currentSettings.mod_contentSafety) {
    renderContentSafety(contentSafety || { rating: "green", domainMatches: [], keywords: [], manipulation: [] });
  } else {
    renderModuleDisabled("Content");
  }

  if (currentSettings.mod_spendGuard) {
    renderSpendGuard(subscriptionGuard);
  } else {
    renderModuleDisabled("Spend");
  }

  if (currentSettings.mod_cookieConsent) {
    renderCookieConsent(cookieConsent);
  } else {
    renderModuleDisabled("Cookie");
  }

  let hostname = "—";
  try { hostname = new URL(url).hostname.replace(/^www\./, ""); } catch {}
  document.getElementById("siteBadge").textContent = hostname;

  const effectiveTrackers = currentSettings.mod_trackers ? trackers : [];
  const effectiveApis     = currentSettings.mod_fingerprinting ? apiCalls : [];

  document.getElementById("statTrackers").textContent = effectiveTrackers.length;
  document.getElementById("statRequests").textContent = totalRequests;
  document.getElementById("statApis").textContent     = effectiveApis.length;

  const risk = getRiskLevel({ trackers: effectiveTrackers, apiCalls: effectiveApis });
  renderVerdict(risk, effectiveTrackers, effectiveApis);

  if (effectiveTrackers.length > 0) renderComparison(effectiveTrackers.length);

  if (currentSettings.mod_trackers) {
    renderTrackers(trackers);
  } else {
    renderModuleDisabled("Trackers");
  }

  if (currentSettings.mod_fingerprinting) {
    renderApis(apiCalls);
  } else {
    renderModuleDisabled("Apis");
  }

  if (currentSettings.mod_aiSafety) {
    renderAiCalls(aiCalls, aiSearchSources);
  } else {
    renderModuleDisabled("Ai");
  }
}

// ── 模块已禁用时的卡片状态 ────────────────────────────────────────────────────
function renderModuleDisabled(key) {
  updateCard(key, { dot: "", badge: t.moduleDisabledBadge || "Off", badgeColor: "" });
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
        <span class="tracker-tag ${esc(tagClass)}">${esc(categoryLabel)}</span>
        <span class="tracker-domain">${esc(tracker.domain)}</span>
        <span class="tracker-chevron">▼</span>
      </div>
      <div class="tracker-company">${esc(tracker.company)}</div>
      <div class="tracker-plain">${esc(tracker.plain)}</div>
    `;

    item.addEventListener("click", () => item.classList.toggle("expanded"));
    list.appendChild(item);
  });

  // 更新 card 角标
  if (trackers.length > 0) {
    const hasCritical = trackers.some((tr) => ["Session Recording", "Data Broker", "Fingerprinting"].includes(tr.category));
    const lvl = (hasCritical || trackers.length > 5) ? "red" : "amber";
    updateCard("Trackers", { dot: lvl, badge: String(trackers.length), badgeColor: lvl, findingLevel: lvl });
  } else {
    updateCard("Trackers", { dot: "green", badge: t.clean || "Clean", badgeColor: "green" });
  }
}

function formatAiSourceReason(r) {
  if (r.kind === "contentSafety") return (t.csCategories && t.csCategories[r.category]) || r.category;
  if (r.kind === "tracker") return (t.categories && t.categories[r.category]) || r.category;
  if (r.kind === "citationList" && r.key && t[r.key]) return t[r.key];
  return "";
}

function renderAiSearchSources(aiSearchSources) {
  const mount = document.getElementById("aiSourcesMount");
  if (!mount) return;
  mount.innerHTML = "";

  if (!aiSearchSources || !Array.isArray(aiSearchSources.sources)) {
    return;
  }

  const { sources, rating, counts } = aiSearchSources;
  const wrap = document.createElement("div");
  wrap.className = "ai-sources-wrap";

  const sum = document.createElement("div");
  sum.className = "ai-sources-summary cs-rating-" + (rating === "red" ? "red" : rating === "yellow" ? "yellow" : "green");
  const icon = rating === "red" ? "🔴" : rating === "yellow" ? "🟡" : "🟢";
  const summaryLine =
    typeof t.aiSourcesSummary === "function"
      ? t.aiSourcesSummary(counts)
      : `${counts.total} sources`;
  sum.innerHTML = `
    <div class="cs-rating-icon">${icon}</div>
    <div class="cs-rating-body">
      <div class="cs-rating-title">${t.aiSourcesHeading || "Citation sources"}</div>
      <div class="cs-rating-sub">${summaryLine}</div>
      <div class="ai-sources-disclaimer">${t.aiSourcesDisclaimer || ""}</div>
    </div>
  `;
  wrap.appendChild(sum);

  if (sources.length === 0) {
    const emptyRow = document.createElement("div");
    emptyRow.className = "ai-sources-empty";
    emptyRow.textContent = t.aiSourcesEmpty || "No external links yet.";
    wrap.appendChild(emptyRow);
    mount.appendChild(wrap);
    return;
  }

  const tierLabel = (tier) =>
    ({
      low: t.aiSourceTier_low || "Low trust",
      caution: t.aiSourceTier_caution || "Review",
      ok: t.aiSourceTier_ok || "OK",
    })[tier] || tier;

  sources.forEach((s, i) => {
    const row = document.createElement("div");
    row.className = "ai-source-row tier-" + s.tier;
    row.style.animationDelay = `${i * 35}ms`;
    const reasonStr = (s.reasons || []).map(formatAiSourceReason).filter(Boolean).join(" · ");
    row.innerHTML = `
      <div class="ai-source-main">
        <span class="ai-source-tier">${esc(tierLabel(s.tier))}</span>
        <span class="ai-source-host">${esc(s.hostname)}</span>
      </div>
      ${reasonStr ? `<div class="ai-source-reasons">${esc(reasonStr)}</div>` : ""}
    `;
    wrap.appendChild(row);
  });

  mount.appendChild(wrap);
}

// ── 渲染 AI 调用列表 ────────────────────────────────────────────────────────────
function renderAiCalls(aiCalls, aiSearchSources) {
  renderAiSearchSources(aiSearchSources);

  // 更新 card 角标
  const citeLow = aiSearchSources?.counts
    ? aiSearchSources.counts.low + aiSearchSources.counts.caution
    : 0;
  if (citeLow > 0) {
    updateCard("Ai", { dot: "amber", badge: String(citeLow), badgeColor: "amber", findingLevel: "amber" });
  } else if (aiCalls.length > 0) {
    updateCard("Ai", { dot: "amber", badge: String(aiCalls.length), badgeColor: "amber", findingLevel: "amber" });
  } else {
    updateCard("Ai", { dot: "green", badge: t.clean || "Clean", badgeColor: "green" });
  }

  const list  = document.getElementById("aiList");
  const empty = document.getElementById("emptyAi");

  list.innerHTML = "";

  document.getElementById("emptyAiTitle").textContent = t.noAiTitle || "No AI services detected";
  document.getElementById("emptyAiSub").textContent   = t.noAiSub   || "This page doesn't appear to be sending your data to any AI APIs.";

  const hasCitationPanel = aiSearchSources != null;

  if (aiCalls.length === 0 && !hasCitationPanel) {
    empty.style.display = "flex";
    return;
  }
  if (aiCalls.length === 0 && hasCitationPanel) {
    empty.style.display = "none";
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
        <div class="ai-logo">${esc(emoji)}</div>
        <div class="ai-info">
          <div class="ai-company">${esc(call.company)}</div>
          <div class="ai-model">${esc(call.model)}</div>
        </div>
        <span class="ai-risk-tag ai-risk-${esc(call.risk || "medium")}">${esc(riskLabel)}</span>
      </div>
      <div class="ai-count">${esc(countText)}</div>
      <div class="ai-plain">${esc(plainText)}</div>
    `;
    list.appendChild(item);
  });
}

// ── 渲染 Cookie 同意暗模式（v1.5）──────────────────────────────────────────────
function renderCookieConsent(cookieConsent) {
  const summary = document.getElementById("cookieSummary");
  const list    = document.getElementById("cookieList");
  if (!summary || !list) return;

  if (!cookieConsent) {
    summary.className = "cs-summary cs-rating-neutral";
    summary.innerHTML = `
      <div class="cs-rating-icon">🍪</div>
      <div class="cs-rating-body">
        <div class="cs-rating-title">${t.cookieNeutralTitle || ""}</div>
        <div class="cs-rating-sub">${t.cookieNeutralSub || ""}</div>
      </div>
    `;
    list.innerHTML = "";
    updateCard("Cookie", { dot: "", badge: "—" });
    return;
  }

  const { vendor, bannerFound, patterns } = cookieConsent;
  const vendorTag = vendor ? ` · ${esc(vendor)}` : "";

  if (!bannerFound) {
    summary.className = "cs-summary cs-rating-green";
    summary.innerHTML = `
      <div class="cs-rating-icon">🟢</div>
      <div class="cs-rating-body">
        <div class="cs-rating-title">${t.cookieGreenTitle || ""}</div>
        <div class="cs-rating-sub">${t.cookieGreenSub || ""}</div>
      </div>
    `;
    list.innerHTML = "";
    updateCard("Cookie", { dot: "green", badge: t.clean || "Clean", badgeColor: "green" });
    return;
  }

  if (!patterns || patterns.length === 0) {
    summary.className = "cs-summary cs-rating-green";
    summary.innerHTML = `
      <div class="cs-rating-icon">🟢</div>
      <div class="cs-rating-body">
        <div class="cs-rating-title">${t.cookieBannerCleanTitle || ""}${vendorTag}</div>
        <div class="cs-rating-sub">${t.cookieBannerCleanSub || ""}</div>
      </div>
    `;
    list.innerHTML = "";
    updateCard("Cookie", { dot: "green", badge: t.clean || "Clean", badgeColor: "green" });
    return;
  }

  summary.className = "cs-summary cs-rating-yellow";
  summary.innerHTML = `
    <div class="cs-rating-icon">🟡</div>
    <div class="cs-rating-body">
      <div class="cs-rating-title">${t.cookieYellowTitle || ""}${vendorTag}</div>
      <div class="cs-rating-sub">${t.cookieYellowSub || ""}</div>
    </div>
  `;
  list.innerHTML = "";
  for (const p of patterns) {
    const div = document.createElement("div");
    div.className = "cs-item cs-item-manip";
    const msg = t["cookiePattern_" + p] || p;
    div.innerHTML = `
      <div class="cs-item-tag">${esc(t.cookiePatternTag || "Pattern")}</div>
      <div class="cs-item-plain">${esc(msg)}</div>
    `;
    list.appendChild(div);
  }
  updateCard("Cookie", { dot: "amber", badge: String(patterns.length), badgeColor: "amber", findingLevel: "amber" });
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
        <div class="api-label">${esc(displayLabel)}</div>
        <span style="font-size:9.5px;font-weight:700;color:${esc(riskColor)};letter-spacing:0.4px;">${esc(riskLabel)}</span>
      </div>
      <div class="api-plain">${esc(displayPlain)}</div>
    `;

    list.appendChild(item);
  });

  // 更新 card 角标
  if (apiCalls.length > 0) {
    const hasHigh = apiCalls.some((a) => a.risk === "high");
    const lvl = hasHigh ? "red" : "amber";
    updateCard("Apis", { dot: lvl, badge: String(apiCalls.length), badgeColor: lvl, findingLevel: lvl });
  } else {
    updateCard("Apis", { dot: "green", badge: t.clean || "Clean", badgeColor: "green" });
  }
}

// ── 历史记录面板（v1.7）──────────────────────────────────────────────────────
function initHistoryPanel() {
  document.getElementById("histTitle").textContent = t.historyTitle || "History";
  document.getElementById("historyBtn").addEventListener("click", () => {
    showPanel(_currentPanel === "history" ? null : "history");
    if (_currentPanel === "history") {
      chrome.runtime.sendMessage({ type: "GET_HISTORY" }, (entries) => {
        renderHistory(entries || []);
      });
    }
  });
  document.getElementById("historyClose").addEventListener("click", () => toggleHistory(false));
}

function renderHistory(entries) {
  const scroll  = document.getElementById("histScroll");
  const summary = document.getElementById("histSummary");
  if (!scroll || !summary) return;

  if (!entries || entries.length === 0) {
    summary.innerHTML = "";
    scroll.innerHTML = `
      <div class="hist-empty">
        <div class="hist-empty-icon">📊</div>
        ${esc(t.historyEmpty || "No data yet. Browse some sites and your history will appear here.")}
      </div>`;
    return;
  }

  // ── 汇总栏（近 7 天）──────────────────────────────────────────────────────
  const last7 = entries.slice(0, 7);
  const totalTrackers = last7.reduce((s, e) => s + (e.trackers || 0), 0);
  const totalAi       = last7.reduce((s, e) => s + (e.aiCalls  || 0), 0);
  const totalLow      = last7.reduce((s, e) => s + (e.lowTrust || 0), 0);

  summary.innerHTML = `
    <div class="hist-sum-item">
      <div class="hist-sum-num">${totalTrackers}</div>
      <div class="hist-sum-label">🔍 ${esc(t.trackers || "Trackers")}</div>
    </div>
    <div class="hist-sum-item">
      <div class="hist-sum-num">${totalAi}</div>
      <div class="hist-sum-label">🤖 ${esc(t.aiCalls || "AI Calls")}</div>
    </div>
    <div class="hist-sum-item">
      <div class="hist-sum-num">${totalLow}</div>
      <div class="hist-sum-label">⚠️ ${esc(t.lowTrust || "Low-Trust")}</div>
    </div>`;

  // ── Insights：聚合近 7 天数据 ─────────────────────────────────────────────
  function aggregateTopSites(field) {
    const agg = new Map();
    for (const e of last7) {
      for (const { hostname, count } of (e[field] || [])) {
        agg.set(hostname, (agg.get(hostname) || 0) + count);
      }
    }
    return [...agg.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  }

  const topTrackerSites  = aggregateTopSites("topSites");
  const topAiSites       = aggregateTopSites("aiSites");
  const topLowTrustPlatforms = aggregateTopSites("lowTrustPlatforms");
  const totalSpend  = last7.reduce((s, e) => s + (e.spendSiteCount  || 0), 0);
  const totalCookie = last7.reduce((s, e) => s + (e.cookieDarkCount || 0), 0);

  function tagsHtml(items, cls = "") {
    if (!items.length) return `<span class="hist-tag" style="opacity:.5">${esc(t.historyNone || "None detected")}</span>`;
    return items.map(([h, c]) =>
      `<span class="hist-tag${cls ? " " + cls : ""}">${esc(h)}<span class="hist-tag-count">·${c}</span></span>`
    ).join("");
  }

  const insightsLabel = t.historyInsights || "THIS WEEK'S INSIGHTS";
  let html = `<div class="hist-section-label">${esc(insightsLabel)}</div>`;

  html += `
    <div class="hist-insight-row">
      <div class="hist-insight-ico">🔍</div>
      <div class="hist-insight-body">
        <div class="hist-insight-label">${esc(t.historyTopTracked || "Most tracked sites")}</div>
        <div class="hist-tags">${tagsHtml(topTrackerSites)}</div>
      </div>
    </div>
    <div class="hist-insight-row">
      <div class="hist-insight-ico">🤖</div>
      <div class="hist-insight-body">
        <div class="hist-insight-label">${esc(t.historyAiSites || "Sites using AI in background")}</div>
        <div class="hist-tags">${tagsHtml(topAiSites, "tag-ai")}</div>
      </div>
    </div>
    <div class="hist-insight-row">
      <div class="hist-insight-ico">⚠️</div>
      <div class="hist-insight-body">
        <div class="hist-insight-label">${esc(t.historyLowTrustAI || "AI platforms with low-trust citations")}</div>
        <div class="hist-tags">${tagsHtml(topLowTrustPlatforms, "tag-warn")}</div>
      </div>
    </div>
    <div class="hist-insight-row">
      <div class="hist-insight-ico">💳</div>
      <div class="hist-insight-body">
        <div class="hist-insight-label">${esc(t.historySpend || "Spend Guard alerts")}</div>
        <span class="hist-insight-count${totalSpend === 0 ? " is-zero" : ""}">
          ${totalSpend === 0
            ? (t.historyNone || "None detected")
            : totalSpend + " " + (t.historySites || "sites")}
        </span>
      </div>
    </div>
    <div class="hist-insight-row">
      <div class="hist-insight-ico">🍪</div>
      <div class="hist-insight-body">
        <div class="hist-insight-label">${esc(t.historyCookieDark || "Cookie dark pattern sites")}</div>
        <span class="hist-insight-count${totalCookie === 0 ? " is-zero" : ""}">
          ${totalCookie === 0
            ? (t.historyNone || "None detected")
            : totalCookie + " " + (t.historySites || "sites")}
        </span>
      </div>
    </div>`;

  // ── 每日列表 ────────────────────────────────────────────────────────────────
  const maxTrackers_ = Math.max(...entries.map((e) => e.trackers || 0), 1);
  const todayStr_    = new Date().toISOString().slice(0, 10);
  const yestStr_     = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const dayNames     = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const labelDaily   = t.historyDaily || "DAILY";
  const labelOlder   = t.historyLast30 || "OLDER";

  html += `<div class="hist-section-label">${esc(labelDaily)}</div>`;
  let addedOlderLabel = false;

  entries.forEach((entry, idx) => {
    if (idx === 7 && !addedOlderLabel) {
      html += `<div class="hist-section-label">${esc(labelOlder)}</div>`;
      addedOlderLabel = true;
    }
    const barPct  = Math.max(2, Math.round(((entry.trackers || 0) / maxTrackers_) * 100));
    const isToday = entry.date === todayStr_;
    let dateLabel;
    if (isToday)                   dateLabel = t.historyToday     || "Today";
    else if (entry.date === yestStr_) dateLabel = t.historyYesterday || "Yesterday";
    else {
      const d = new Date(entry.date + "T12:00:00");
      dateLabel = dayNames[d.getDay()] + " " + (d.getMonth() + 1) + "/" + d.getDate();
    }
    const alertCls = (entry.lowTrust || 0) > 0 ? " has-alert" : "";
    html += `
      <div class="hist-row${isToday ? " is-today" : ""}">
        <div class="hist-date">${esc(dateLabel)}</div>
        <div class="hist-bar-wrap"><div class="hist-bar" style="width:${barPct}%"></div></div>
        <div class="hist-stats">
          <span class="hist-stat">🔍 ${entry.trackers || 0}</span>
          <span class="hist-stat">🤖 ${entry.aiCalls  || 0}</span>
          <span class="hist-stat${alertCls}">⚠️ ${entry.lowTrust || 0}</span>
        </div>
      </div>`;
  });

  scroll.innerHTML = html;
}
