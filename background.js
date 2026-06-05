importScripts("trackers.js", "contentSafety.js", "citationLowTrust.js");

// ── 追踪器数据库动态更新 ────────────────────────────────────────────────────────
const DB_CACHE_KEY  = "irisTrackerCache";
const DB_TTL_MS     = 7 * 24 * 60 * 60 * 1000;   // 7 天
const DISCONNECT_URL = "https://raw.githubusercontent.com/disconnectme/disconnect-tracking-protection/master/services.json";

// Disconnect.me 分类 → Iris 分类映射
const CAT_MAP = {
  "Advertising":   "Advertising",
  "Analytics":     "Analytics",
  "Social":        "Social",
  "Disconnect":    "Fingerprinting",
  "Content":       "Analytics",
  "Email":         "Analytics",
  "FingerprintingInvasive": "Fingerprinting",
  "FingerprintingGeneral":  "Fingerprinting",
};

/**
 * 将 Disconnect.me services.json 解析为 { domain: {category, company, plain} }
 * 格式与 TRACKER_DB 一致，方便直接合并
 */
function parseDisconnectList(json) {
  const result = {};
  for (const [cat, entries] of Object.entries(json.categories || {})) {
    const category = CAT_MAP[cat] || "Analytics";
    for (const companyObj of entries) {
      for (const [company, domainMap] of Object.entries(companyObj)) {
        for (const trackerList of Object.values(domainMap)) {
          for (const domain of trackerList) {
            if (!result[domain]) {
              result[domain] = {
                category,
                company,
                plain: `${company} (${category.toLowerCase()}) tracker.`,
              };
            }
          }
        }
      }
    }
  }
  return result;
}

/**
 * 将动态数据合并进 TRACKER_DB（只补充静态库没有的条目，不覆盖已有精细描述）
 */
function mergeTrackerData(dynamic) {
  let added = 0;
  for (const [domain, info] of Object.entries(dynamic)) {
    if (!TRACKER_DB[domain]) {
      TRACKER_DB[domain] = info;
      added++;
    }
  }
  return added;
}

/**
 * 主更新函数：检查缓存 → 按需拉取 → 合并
 * 成功时在 chrome.storage.local 记录更新时间和条目数
 */
async function refreshTrackerDB() {
  try {
    const stored = await chrome.storage.local.get(DB_CACHE_KEY);
    const cache  = stored[DB_CACHE_KEY];
    const now    = Date.now();

    if (cache && (now - cache.timestamp) < DB_TTL_MS) {
      mergeTrackerData(cache.data);
      return;
    }

    const resp = await fetch(DISCONNECT_URL, { cache: "no-store" });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

    const json   = await resp.json();
    const parsed = parseDisconnectList(json);
    mergeTrackerData(parsed);

    await chrome.storage.local.set({
      [DB_CACHE_KEY]: { data: parsed, timestamp: now, count: Object.keys(parsed).length }
    });
  } catch {
    // 网络失败时静默降级，使用静态数据库
  }
}

// ── 内容安全列表动态更新（uBlock adult 等）─────────────────────────────────────
const CS_CACHE_KEY = "irisContentSafetyCacheV2";
const UBLOCK_ADULT_URL =
  "https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/adult.txt";
const STEVENBLACK_GAMBLING_HOSTS =
  "https://raw.githubusercontent.com/StevenBlack/hosts/master/alternates/gambling-only/hosts";
const UBLOCK_BADWARE_URL =
  "https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/badware.txt";

/** uBlock 风格 ||domain^ 规则 → 指定分类 */
function parseUblockFilterDomains(text, category) {
  const p = plainForCategory(category);
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("!")) continue;
    const m = t.match(/^\|\|([^/^|*]+)\^/);
    if (!m) continue;
    const host = m[1].replace(/^www\./, "");
    if (host.includes("*") || host.includes("#")) continue;
    out[host] = { category, plain_en: p.plain_en, plain_zh: p.plain_zh };
  }
  return out;
}

function parseUblockAdultDomains(text) {
  return parseUblockFilterDomains(text, "Adult");
}

/** Hosts 文件（0.0.0.0 / 127.0.0.1 domain）→ 指定分类 */
function parseHostsFile(text, category) {
  const p = plainForCategory(category);
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const m = t.match(/^(\d+\.\d+\.\d+\.\d+)\s+(\S+)/);
    if (!m) continue;
    let host = m[2].toLowerCase().replace(/^www\./, "");
    if (
      host === "localhost" ||
      host === "local" ||
      host === "broadcasthost" ||
      host.endsWith(".local") ||
      host.includes("/")
    ) {
      continue;
    }
    out[host] = { category, plain_en: p.plain_en, plain_zh: p.plain_zh };
  }
  return out;
}

/** 合并顺序靠后者覆盖前者；最终以 Adult > Gambling > Scam 优先级手工合成 */
function mergeContentSafetyMaps(adultMap, gambleMap, scamMap) {
  return { ...scamMap, ...gambleMap, ...adultMap };
}

async function fetchContentSafetyPart(url, label, parser) {
  try {
    const resp = await fetch(url, { cache: "no-store" });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const text = await resp.text();
    return parser(text);
  } catch {
    return {};
  }
}

async function refreshContentSafetyDB() {
  try {
    const stored = await chrome.storage.local.get(CS_CACHE_KEY);
    const cache = stored[CS_CACHE_KEY];
    const now = Date.now();

    if (cache && (now - cache.timestamp) < DB_TTL_MS) {
      mergeContentSafetySeed(cache.data);
      return;
    }

    const [adultMap, gambleMap, scamMap] = await Promise.all([
      fetchContentSafetyPart(UBLOCK_ADULT_URL, "uBlock adult", parseUblockAdultDomains),
      fetchContentSafetyPart(
        STEVENBLACK_GAMBLING_HOSTS,
        "StevenBlack gambling hosts",
        (txt) => parseHostsFile(txt, "Gambling")
      ),
      fetchContentSafetyPart(
        UBLOCK_BADWARE_URL,
        "uBlock badware",
        (txt) => parseUblockFilterDomains(txt, "Scam")
      ),
    ]);

    const parsed = mergeContentSafetyMaps(adultMap, gambleMap, scamMap);
    mergeContentSafetySeed(parsed);

    await chrome.storage.local.set({
      [CS_CACHE_KEY]: {
        data: parsed,
        timestamp: now,
        count: Object.keys(parsed).length,
        breakdown: {
          adult: Object.keys(adultMap).length,
          gambling: Object.keys(gambleMap).length,
          scam: Object.keys(scamMap).length,
        },
      },
    });
  } catch {
    // 静默降级
  }
}

async function getCSMeta() {
  const stored = await chrome.storage.local.get(CS_CACHE_KEY);
  const cache = stored[CS_CACHE_KEY];
  if (!cache) return { updatedAt: null, dynamicCount: 0, breakdown: null };
  return {
    updatedAt: cache.timestamp,
    dynamicCount: cache.count || 0,
    breakdown: cache.breakdown || null,
  };
}

function computeAiSourcesRating(sources) {
  if (!sources || sources.length === 0) return "green";
  if (sources.some((s) => s.tier === "low")) return "red";
  if (sources.some((s) => s.tier === "caution")) return "yellow";
  return "green";
}

/**
 * AI 回答引用域名可信度（v1.3）：启发式，非判决。
 * low：内容安全库高危类；caution：暴力类、高侵入追踪器或静态「薄内容」列表。
 */
function scoreCitationDomain(hostname) {
  const reasons = [];
  let tier = "ok";

  const cs = matchContentSafety(hostname);
  if (cs) {
    if (["Adult", "Gambling", "Scam", "Extreme"].includes(cs.category)) {
      tier = "low";
      reasons.push({ kind: "contentSafety", category: cs.category });
    } else if (cs.category === "Violence") {
      tier = "caution";
      reasons.push({ kind: "contentSafety", category: cs.category });
    }
  }

  const tr = matchTracker(hostname);
  if (tr && ["Fingerprinting", "Data Broker", "Session Recording"].includes(tr.category)) {
    if (tier === "ok") tier = "caution";
    reasons.push({ kind: "tracker", category: tr.category });
  }

  const cit = matchCitationLowTrust(hostname);
  if (cit && tier !== "low") {
    if (tier === "ok") tier = "caution";
    reasons.push({ kind: "citationList", key: cit.reasonKey });
  }

  return { tier, reasons };
}

function computeContentSafetyRating(cs) {
  const domains = cs.domainMatches || [];
  const keywords = cs.keywords || [];
  const manip = cs.manipulation || [];

  const redCat = new Set(["Adult", "Gambling", "Scam", "Extreme"]);
  const yellowCat = new Set(["Violence"]);

  for (const d of domains) {
    if (redCat.has(d.category)) return "red";
  }

  let band = 0;
  for (const d of domains) {
    if (yellowCat.has(d.category)) band = Math.max(band, 1);
  }

  let mild = 0;
  for (const k of keywords) {
    if (k.level === "severe") return "red";
    if (k.level === "moderate") band = Math.max(band, 1);
    if (k.level === "mild") mild++;
  }
  if (mild >= 5) band = Math.max(band, 1);

  if (manip.length > 0) band = Math.max(band, 1);

  if (band >= 1) return "yellow";
  return "green";
}

// 扩展启动时立即执行一次更新
refreshTrackerDB();
refreshContentSafetyDB();

// 每隔 7 天自动重新拉取（用 alarm 保证 service worker 被唤醒）
chrome.alarms.create("refreshTrackerDB", { periodInMinutes: 7 * 24 * 60 });
chrome.alarms.create("refreshContentSafetyDB", { periodInMinutes: 7 * 24 * 60 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "refreshTrackerDB") refreshTrackerDB();
  if (alarm.name === "refreshContentSafetyDB") refreshContentSafetyDB();
});

// GET_DATA 时也可查询数据库状态
async function getDBMeta() {
  const stored = await chrome.storage.local.get(DB_CACHE_KEY);
  const cache  = stored[DB_CACHE_KEY];
  if (!cache) return { source: "built-in", updatedAt: null, dynamicCount: 0 };
  return {
    source:       "disconnect.me + built-in",
    updatedAt:    cache.timestamp,
    dynamicCount: cache.count || 0,
  };
}

// ── 会话累计（内存，service worker 重启时重置）────────────────────────────────
const sessionTotals = {
  trackerDomains: new Set(),      // 唯一追踪器域名
  aiCallCount: 0,                 // AI 调用次数（不重复计同域）
  tabLowTrust: new Map(),         // tabId → 低可信引用数
  siteTrackers: new Map(),        // siteHostname → max tracker count
  siteAiCalls: new Map(),         // siteHostname → ai call count
  lowTrustPlatforms: new Map(),   // platform hostname → low-trust count
  spendSites: new Set(),          // 触发 Spend Guard 的站点
  cookieDarkSites: new Set(),     // 有 Cookie 暗模式的站点
};

function getSessionSnapshot() {
  let lowTrust = 0;
  for (const n of sessionTotals.tabLowTrust.values()) lowTrust += n;
  return {
    trackers: sessionTotals.trackerDomains.size,
    aiCalls:  sessionTotals.aiCallCount,
    lowTrustCitations: lowTrust,
  };
}

/** 将 Map 转换为按 count 降序的数组，取前 N 条 */
function topNFromMap(map, n) {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([hostname, count]) => ({ hostname, count }));
}

/** Tab 离开前将该站点数据写入 sessionTotals */
function recordSiteToSession(data) {
  const h = data.siteHostname;
  if (!h) return;
  if (data.trackers.length > 0) {
    sessionTotals.siteTrackers.set(h,
      Math.max(sessionTotals.siteTrackers.get(h) || 0, data.trackers.length));
  }
  if (data.aiCalls.length > 0) {
    sessionTotals.siteAiCalls.set(h,
      (sessionTotals.siteAiCalls.get(h) || 0) + data.aiCalls.length);
  }
  if (data.subscriptionGuard?.hits?.length > 0) {
    sessionTotals.spendSites.add(h);
  }
  if (data.cookieConsent?.patterns?.length > 0) {
    sessionTotals.cookieDarkSites.add(h);
  }
}

// ── 本地历史记录 ───────────────────────────────────────────────────────────────
const HISTORY_KEY = "irisHistory";

function todayStr() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

async function updateTodayHistory(snapshot) {
  try {
    const stored = await chrome.storage.local.get(HISTORY_KEY);
    let history = stored[HISTORY_KEY] || [];
    const today = todayStr();
    const idx = history.findIndex((e) => e.date === today);

    const newEntry = {
      date:              today,
      trackers:          snapshot.trackers,
      aiCalls:           snapshot.aiCalls,
      lowTrust:          snapshot.lowTrustCitations,
      topSites:          topNFromMap(sessionTotals.siteTrackers, 5),
      aiSites:           topNFromMap(sessionTotals.siteAiCalls, 5),
      lowTrustPlatforms: topNFromMap(sessionTotals.lowTrustPlatforms, 3),
      spendSiteCount:    sessionTotals.spendSites.size,
      cookieDarkCount:   sessionTotals.cookieDarkSites.size,
    };

    if (idx >= 0) {
      const ex = history[idx];
      newEntry.trackers       = Math.max(ex.trackers || 0, newEntry.trackers);
      newEntry.aiCalls        = Math.max(ex.aiCalls  || 0, newEntry.aiCalls);
      newEntry.lowTrust       = Math.max(ex.lowTrust || 0, newEntry.lowTrust);
      newEntry.spendSiteCount = Math.max(ex.spendSiteCount || 0, newEntry.spendSiteCount);
      newEntry.cookieDarkCount= Math.max(ex.cookieDarkCount || 0, newEntry.cookieDarkCount);
      // site 列表取条目更多的那份（避免 SW 重启后数据变少）
      if ((ex.topSites?.length || 0) > (newEntry.topSites?.length || 0))
        newEntry.topSites = ex.topSites;
      if ((ex.aiSites?.length || 0) > (newEntry.aiSites?.length || 0))
        newEntry.aiSites = ex.aiSites;
      if ((ex.lowTrustPlatforms?.length || 0) > (newEntry.lowTrustPlatforms?.length || 0))
        newEntry.lowTrustPlatforms = ex.lowTrustPlatforms;
      history[idx] = newEntry;
    } else {
      history.unshift(newEntry);
    }

    history = history.slice(0, 30);
    await chrome.storage.local.set({ [HISTORY_KEY]: history });
  } catch { /* 存储失败静默忽略 */ }
}

// ── Session Replay 服务商数据库 ────────────────────────────────────────────────
// 格式：hostname → { name, plain_en, plain_zh }
const SESSION_REPLAY_DB = {
  // Hotjar
  "static.hotjar.com":       { name: "Hotjar",          plain_en: "Records your mouse movements, clicks, and keystrokes in real time.", plain_zh: "实时录制你的鼠标移动、点击和键盘输入。" },
  "script.hotjar.com":       { name: "Hotjar",          plain_en: "Records your mouse movements, clicks, and keystrokes in real time.", plain_zh: "实时录制你的鼠标移动、点击和键盘输入。" },
  "insights.hotjar.com":     { name: "Hotjar",          plain_en: "Records your mouse movements, clicks, and keystrokes in real time.", plain_zh: "实时录制你的鼠标移动、点击和键盘输入。" },
  // Microsoft Clarity
  "clarity.ms":              { name: "Microsoft Clarity", plain_en: "Records your exact page interactions — scroll, click, and rage-click patterns.", plain_zh: "录制你在页面上的精确操作——滚动、点击和连续点击行为。" },
  // FullStory
  "fullstory.com":           { name: "FullStory",        plain_en: "Captures a full video-like replay of your session on this site.", plain_zh: "录制你在此网站的完整会话，类似视频回放。" },
  "rs.fullstory.com":        { name: "FullStory",        plain_en: "Captures a full video-like replay of your session on this site.", plain_zh: "录制你在此网站的完整会话，类似视频回放。" },
  "edge.fullstory.com":      { name: "FullStory",        plain_en: "Captures a full video-like replay of your session on this site.", plain_zh: "录制你在此网站的完整会话，类似视频回放。" },
  // LogRocket
  "cdn.logrocket.io":        { name: "LogRocket",        plain_en: "Records user sessions including console logs and network requests.", plain_zh: "录制用户会话，包括控制台日志和网络请求。" },
  "r.lr-in.com":             { name: "LogRocket",        plain_en: "Records user sessions including console logs and network requests.", plain_zh: "录制用户会话，包括控制台日志和网络请求。" },
  "r.lr-in-prod.com":        { name: "LogRocket",        plain_en: "Records user sessions including console logs and network requests.", plain_zh: "录制用户会话，包括控制台日志和网络请求。" },
  // Mouseflow
  "cdn.mouseflow.com":       { name: "Mouseflow",        plain_en: "Records mouse movements, heatmaps, and form interactions.", plain_zh: "录制鼠标移动轨迹、热力图和表单填写行为。" },
  // Lucky Orange
  "cdn.luckyorange.com":     { name: "Lucky Orange",     plain_en: "Records sessions and generates click/scroll heatmaps.", plain_zh: "录制会话并生成点击和滚动热力图。" },
  "luckyorange.net":         { name: "Lucky Orange",     plain_en: "Records sessions and generates click/scroll heatmaps.", plain_zh: "录制会话并生成点击和滚动热力图。" },
  // Smartlook
  "rec.smartlook.com":       { name: "Smartlook",        plain_en: "Records user sessions and user interactions for analysis.", plain_zh: "录制用户会话和交互行为用于分析。" },
  "manager.smartlook.com":   { name: "Smartlook",        plain_en: "Records user sessions and user interactions for analysis.", plain_zh: "录制用户会话和交互行为用于分析。" },
  // Inspectlet
  "cdn.inspectlet.com":      { name: "Inspectlet",       plain_en: "Records sessions, mouse movements, and form keystrokes.", plain_zh: "录制会话、鼠标移动和表单键盘输入。" },
  // Heap
  "cdn.heapanalytics.com":   { name: "Heap",             plain_en: "Automatically captures every user interaction for replay.", plain_zh: "自动捕获每一个用户操作以供回放。" },
  "heapanalytics.com":       { name: "Heap",             plain_en: "Automatically captures every user interaction for replay.", plain_zh: "自动捕获每一个用户操作以供回放。" },
  // Quantum Metric
  "cdn.quantummetric.com":   { name: "Quantum Metric",   plain_en: "Records sessions for digital experience analytics.", plain_zh: "录制会话用于数字体验分析。" },
  // Pendo
  "cdn.pendo.io":            { name: "Pendo",            plain_en: "Records user interactions for product analytics and in-app guides.", plain_zh: "录制用户交互用于产品分析和应用内引导。" },
  "data.pendo.io":           { name: "Pendo",            plain_en: "Records user interactions for product analytics and in-app guides.", plain_zh: "录制用户交互用于产品分析和应用内引导。" },
  // Contentsquare
  "t.contentsquare.net":     { name: "Contentsquare",    plain_en: "Records full session replays and user journeys.", plain_zh: "录制完整的会话回放和用户访问路径。" },
  "cdn.contentsquare.net":   { name: "Contentsquare",    plain_en: "Records full session replays and user journeys.", plain_zh: "录制完整的会话回放和用户访问路径。" },
  // Glassbox
  "api.glassboxdigital.io":  { name: "Glassbox",         plain_en: "Records full session replays including all page interactions.", plain_zh: "录制完整会话回放，包括所有页面交互。" },
  // SessionCam
  "sessioncam.com":          { name: "SessionCam",        plain_en: "Records and analyzes user session replays.", plain_zh: "录制并分析用户会话回放。" },
};

/**
 * 检查 hostname 是否命中 Session Replay 服务商
 * 支持精确匹配和子域名后缀匹配
 */
function matchSessionReplay(hostname) {
  if (!hostname) return null;
  const h = hostname.replace(/^www\./, "").toLowerCase();
  if (SESSION_REPLAY_DB[h]) return SESSION_REPLAY_DB[h];
  // 子域名匹配：例如 eu.static.hotjar.com → static.hotjar.com
  for (const key of Object.keys(SESSION_REPLAY_DB)) {
    if (h.endsWith("." + key)) return SESSION_REPLAY_DB[key];
  }
  return null;
}

// ── 用户设置 ───────────────────────────────────────────────────────────────────
const SETTINGS_KEY = "irisSettings";
const DEFAULT_SETTINGS = {
  mod_trackers:       true,
  mod_fingerprinting: true,
  mod_aiSafety:       true,
  mod_contentSafety:  true,
  mod_spendGuard:     true,
  mod_cookieConsent:  true,
  spendSensitivity:   "normal",   // "normal" | "strict"
};

// 内存缓存，避免在高频 webRequest 回调里每次读 storage
let activeSettings = { ...DEFAULT_SETTINGS };
chrome.storage.local.get(SETTINGS_KEY, (stored) => {
  if (stored[SETTINGS_KEY]) activeSettings = { ...DEFAULT_SETTINGS, ...stored[SETTINGS_KEY] };
});

// ── 内存存储：每个 tab 的检测数据 ──────────────────────────────────────────────
// tabId → { requests: Set, trackers: [], apiCalls: [], timestamp }
const tabData = new Map();

function getTabData(tabId) {
  if (!tabData.has(tabId)) {
    tabData.set(tabId, {
      siteHostname: null,  // 当前站点主域名，由 webNavigation.onCommitted 写入
      requests: new Set(),
      trackers: [],
      apiCalls: [],
      aiCalls:  [],
      totalRequests: 0,
      timestamp: Date.now(),
      aiSearchSources: null,
      contentSafety: {
        domainMatches: [],
        keywords: [],
        manipulation: [],
      },
      subscriptionGuard: null,
      cookieConsent: null,
      confirmshaming: null,         // 确认羞辱暗模式检测结果
      sessionReplay: [],            // Session Replay 服务商检测结果
      sessionReplayDomains: new Set(), // 去重用
      antiGeo: null,                // Anti-GEO 检测结果
    });
  }
  return tabData.get(tabId);
}

// ── 网络请求监控 ────────────────────────────────────────────────────────────────
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (!activeSettings.mod_trackers) return;
    const { tabId, url, type } = details;
    if (tabId < 0 || type === "main_frame") return;

    let hostname;
    try {
      hostname = new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return;
    }

    const data = getTabData(tabId);
    data.totalRequests++;

    // 检查是否在追踪器数据库中
    if (!data.requests.has(hostname)) {
      const tracker = matchTracker(hostname);
      if (tracker) {
        data.requests.add(hostname);
        data.trackers.push({
          domain: hostname,
          ...tracker,
          time: Date.now()
        });
        sessionTotals.trackerDomains.add(hostname);
        updateBadge(tabId, data);
      }
    }

    // Session Replay 检测（同受 mod_trackers 开关控制）
    if (!data.sessionReplayDomains.has(hostname)) {
      const srHit = matchSessionReplay(hostname);
      if (srHit) {
        data.sessionReplayDomains.add(hostname);
        data.sessionReplay.push({
          name:     srHit.name,
          domain:   hostname,
          plain_en: srHit.plain_en,
          plain_zh: srHit.plain_zh,
          time:     Date.now(),
        });
        updateBadge(tabId, data);
      }
    }

    const csHit = matchContentSafety(hostname);
    if (csHit) {
      const dm = data.contentSafety.domainMatches;
      const dup = dm.some((x) => x.domain === csHit.domain && x.category === csHit.category);
      if (!dup) {
        dm.push({
          domain: csHit.domain,
          category: csHit.category,
          plain_en: csHit.plain_en,
          plain_zh: csHit.plain_zh,
          time: Date.now(),
        });
      }
    }
  },
  { urls: ["<all_urls>"] }
);

// ── 域名匹配（支持子域名）─────────────────────────────────────────────────────
function matchTracker(hostname) {
  // 精确匹配
  if (TRACKER_DB[hostname]) return TRACKER_DB[hostname];

  // 父域名匹配（如 cdn.doubleclick.net → doubleclick.net）
  const parts = hostname.split(".");
  for (let i = 1; i < parts.length - 1; i++) {
    const parent = parts.slice(i).join(".");
    if (TRACKER_DB[parent]) return TRACKER_DB[parent];
  }
  return null;
}

// ── 更新 Badge ─────────────────────────────────────────────────────────────────
function updateBadge(tabId, data) {
  const count = data.trackers.length;
  const hasHighRisk = data.trackers.some(t =>
    ["Fingerprinting", "Data Broker", "Session Recording"].includes(t.category)
  ) || (data.sessionReplay && data.sessionReplay.length > 0);

  const text  = count > 0 ? String(count) : "";
  const color = hasHighRisk ? "#ef4444" : count > 5 ? "#f59e0b" : "#7c6af7";

  chrome.action.setBadgeText({ text, tabId }).catch(() => {});
  if (text) chrome.action.setBadgeBackgroundColor({ color, tabId }).catch(() => {});
}

// service worker 被唤醒后 tabData 已丢失时，强制清除遗留 badge
function clearStaleBadge(tabId) {
  if (!tabData.has(tabId)) {
    chrome.action.setBadgeText({ text: "", tabId }).catch(() => {});
  }
}

// ── Tab 导航时重置数据 ─────────────────────────────────────────────────────────
chrome.webNavigation.onCommitted.addListener((details) => {
  if (details.frameId === 0) {
    // 离开前先记录旧页面数据
    const oldData = tabData.get(details.tabId);
    if (oldData) recordSiteToSession(oldData);

    tabData.delete(details.tabId);

    // 记录新页面的 hostname，供后续追踪器数据关联使用
    try {
      const hostname = new URL(details.url).hostname.replace(/^www\./, "");
      if (hostname) getTabData(details.tabId).siteHostname = hostname;
    } catch { /* 忽略无效 URL */ }

    chrome.action.setBadgeText({ text: "", tabId: details.tabId }).catch(() => {});
  }
});

// 切换 Tab 时通知 popup 刷新
chrome.tabs.onActivated.addListener(({ tabId }) => {
  chrome.runtime.sendMessage({ type: "TAB_CHANGED", tabId }).catch(() => {});
});

// Tab 开始加载新页面时通知 popup
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "loading" && tab.active) {
    // 数据清理由 webNavigation.onCommitted 负责（避免在记录前提前删除）
    chrome.action.setBadgeText({ text: "", tabId }).catch(() => {});
    chrome.runtime.sendMessage({ type: "TAB_LOADING" }).catch(() => {});
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  const data = tabData.get(tabId);
  if (data) recordSiteToSession(data);
  tabData.delete(tabId);
  sessionTotals.tabLowTrust.delete(tabId);
});

// ── 消息处理 ────────────────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  // Popup 请求当前 tab 数据
  if (message.type === "GET_DATA") {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (!tabs[0]) {
        return sendResponse({
          trackers: [],
          totalRequests: 0,
          apiCalls: [],
          contentSafety: {
            rating: "green",
            domainMatches: [],
            keywords: [],
            manipulation: [],
          },
          aiSearchSources: null,
          subscriptionGuard: null,
          cookieConsent: null,
          confirmshaming: null,
          sessionReplay: [],
          antiGeo: null,
          csMeta: await getCSMeta(),
        });
      }
      clearStaleBadge(tabs[0].id);   // service worker 刚唤醒时清除残留 badge
      const data = getTabData(tabs[0].id);

      // 检测当前页面本身是否是 AI 服务网站
      let aiCalls = [...data.aiCalls];
      const tabUrl = tabs[0].url || "";
      const aiWebsite = matchAIWebsite(tabUrl);
      if (aiWebsite) {
        const already = aiCalls.find(a => a.source === "website" && a.domain === aiWebsite.domain);
        if (!already) {
          aiCalls = [{
            ...aiWebsite,
            source: "website",
            count: 1,
            time: Date.now()
          }, ...aiCalls];
        }
      }

      // 钓鱼检测
      const phishing = detectAIPhishing(tabUrl);

      // 数据库元信息（给 popup 展示）
      const dbMeta = await getDBMeta();
      const csMeta = await getCSMeta();
      const cs = data.contentSafety;
      const contentSafety = {
        rating: computeContentSafetyRating(cs),
        domainMatches: cs.domainMatches,
        keywords: cs.keywords,
        manipulation: cs.manipulation,
      };

      let aiSearchSources = null;
      if (data.aiSearchSources && Array.isArray(data.aiSearchSources.sources)) {
        const sources = data.aiSearchSources.sources;
        aiSearchSources = {
          sources,
          updatedAt: data.aiSearchSources.updatedAt,
          rating: computeAiSourcesRating(sources),
          counts: {
            total: sources.length,
            low: sources.filter((s) => s.tier === "low").length,
            caution: sources.filter((s) => s.tier === "caution").length,
            ok: sources.filter((s) => s.tier === "ok").length,
          },
        };
      }

      let subscriptionGuard = null;
      const rawSg = data.subscriptionGuard;
      if (rawSg && typeof rawSg === "object") {
        const hits = Array.isArray(rawSg.hits) ? rawSg.hits : [];
        const gatePassed = !!rawSg.gatePassed;
        subscriptionGuard = {
          gatePassed,
          gateReason: rawSg.gateReason || null,
          hits,
          updatedAt: rawSg.updatedAt || null,
          rating: gatePassed ? (hits.length > 0 ? "yellow" : "green") : "neutral",
        };
      }

      // 每次 popup 拉取时都同步 badge，防止 service worker 休眠后 badge 残留
      updateBadge(tabs[0].id, data);

      const snap = getSessionSnapshot();
      updateTodayHistory(snap); // 异步写入，不阻塞响应

      sendResponse({
        trackers: data.trackers,
        totalRequests: data.totalRequests,
        apiCalls: data.apiCalls,
        aiCalls,
        phishing,
        dbMeta,
        csMeta,
        contentSafety,
        aiSearchSources,
        subscriptionGuard,
        cookieConsent: data.cookieConsent || null,
        confirmshaming: data.confirmshaming || null,
        sessionReplay: data.sessionReplay || [],
        antiGeo: data.antiGeo || null,
        url: tabUrl,
        session: snap,
      });
    });
    return true;
  }

  // Content script 上报 API 调用
  // AI API 调用上报
  if (message.type === "AI_CALL" && sender.tab) {
    const data = getTabData(sender.tab.id);
    const existing = data.aiCalls.find(a => a.domain === message.domain);
    if (!existing) {
      const service = matchAIService("https://" + message.domain);
      if (service) {
        data.aiCalls.push({ ...service, count: 1, time: Date.now() });
        sessionTotals.aiCallCount++;
        updateBadge(sender.tab.id, data);
      }
    } else {
      existing.count++;
    }
  }

  if (message.type === "API_CALL" && sender.tab) {
    const data = getTabData(sender.tab.id);
    const existing = data.apiCalls.find(a => a.api === message.api);
    if (!existing) {
      data.apiCalls.push({
        api:   message.api,
        label: message.label,
        plain: message.plain,
        risk:  message.risk,
        count: 1,
        time:  Date.now()
      });
    } else {
      existing.count++;
    }
    updateBadge(sender.tab.id, data);
  }

  if (message.type === "CONTENT_SAFETY_SCAN" && sender.tab) {
    const data = getTabData(sender.tab.id);
    const cs = data.contentSafety;
    for (const kw of message.keywords || []) {
      const dup = cs.keywords.some((k) => k.level === kw.level && k.match === kw.match);
      if (!dup) cs.keywords.push(kw);
    }
    for (const m of message.manipulation || []) {
      const dup = cs.manipulation.some((x) => x.type === m.type && x.hint === m.hint);
      if (!dup) cs.manipulation.push(m);
    }
  }

  if (message.type === "AI_SEARCH_SOURCES" && sender.tab) {
    const hosts = Array.isArray(message.hosts) ? message.hosts : [];
    const sources = hosts.map((hostname) => ({
      hostname,
      ...scoreCitationDomain(hostname),
    }));
    const data = getTabData(sender.tab.id);
    data.aiSearchSources = {
      sources,
      updatedAt: Date.now(),
    };
    const lowCount = sources.filter((s) => s.tier === "low" || s.tier === "caution").length;
    if (lowCount > 0) {
      sessionTotals.tabLowTrust.set(sender.tab.id, lowCount);
      // 记录产生低可信引用的 AI 平台
      try {
        const platform = new URL(sender.tab.url || "").hostname.replace(/^www\./, "");
        if (platform) {
          sessionTotals.lowTrustPlatforms.set(platform,
            (sessionTotals.lowTrustPlatforms.get(platform) || 0) + lowCount);
        }
      } catch { /* 忽略 */ }
    }
  }

  if (message.type === "SUBSCRIPTION_SCAN" && sender.tab) {
    const seen = new Set();
    const hits = [];
    for (const h of message.hits || []) {
      if (h && h.id && !seen.has(h.id)) {
        seen.add(h.id);
        hits.push({ id: h.id });
      }
    }
    const data = getTabData(sender.tab.id);
    data.subscriptionGuard = {
      gatePassed: !!message.gatePassed,
      gateReason: message.gateReason || null,
      hits,
      updatedAt: Date.now(),
    };
  }

  if (message.type === "GET_HISTORY") {
    chrome.storage.local.get(HISTORY_KEY, (stored) => {
      sendResponse(stored[HISTORY_KEY] || []);
    });
    return true;
  }

  if (message.type === "GET_SETTINGS") {
    chrome.storage.local.get(SETTINGS_KEY, (stored) => {
      sendResponse({ ...DEFAULT_SETTINGS, ...(stored[SETTINGS_KEY] || {}) });
    });
    return true;
  }

  if (message.type === "SAVE_SETTINGS") {
    const safe = {};
    for (const k of Object.keys(DEFAULT_SETTINGS)) {
      if (message.settings && k in message.settings) safe[k] = message.settings[k];
    }
    // 同步更新内存缓存，让 webRequest 等高频路径立即生效
    activeSettings = { ...DEFAULT_SETTINGS, ...safe };
    chrome.storage.local.set({ [SETTINGS_KEY]: safe }, () => sendResponse({ ok: true }));
    return true;
  }

  if (message.type === "COOKIE_CONSENT_SCAN" && sender.tab) {
    const data = getTabData(sender.tab.id);
    const patterns = (message.patterns || []).filter(
      (p) => typeof p === "string" && p.startsWith("cookie_")
    );
    data.cookieConsent = {
      vendor:      message.vendor || null,
      bannerFound: !!message.bannerFound,
      patterns,
      updatedAt:   Date.now(),
    };
  }

  if (message.type === "CONFIRMSHAMING_SCAN" && sender.tab) {
    const data = getTabData(sender.tab.id);
    const hits = Array.isArray(message.hits) ? message.hits.filter(
      (h) => h && typeof h.text === "string" && h.text.length > 0
    ) : [];
    data.confirmshaming = {
      hits,
      updatedAt: Date.now(),
    };
  }

  if (message.type === "ANTI_GEO_SCAN" && sender.tab) {
    const data = getTabData(sender.tab.id);
    const incoming = Array.isArray(message.signals) ? message.signals.filter(
      (s) => s && typeof s.type === "string"
    ) : [];
    if (!data.antiGeo) data.antiGeo = { signals: [], updatedAt: Date.now() };
    for (const sig of incoming) {
      if (!data.antiGeo.signals.find((s) => s.type === sig.type)) {
        data.antiGeo.signals.push(sig);
      }
    }
    data.antiGeo.updatedAt = Date.now();
  }
});

// ── Anti-GEO：llms.txt 检测（Tab 加载完成时异步触发）────────────────────────────
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete" || !tab.url) return;
  if (!tab.url.startsWith("http")) return;
  if (!activeSettings.mod_aiSafety) return;

  let origin;
  try { origin = new URL(tab.url).origin; } catch { return; }

  try {
    // 用 GET 读取正文：很多站点对不存在的路径返回「软 404」(状态码 200 + HTML 错误页)，
    // 仅凭 res.ok 会误报。这里额外校验 content-type 和正文，确认确实是文本型 llms.txt。
    const res = await fetch(`${origin}/llms.txt`, {
      method: "GET",
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return;

    const ctype = (res.headers.get("content-type") || "").toLowerCase();
    // HTML 类型一律排除（软 404 / SPA 兜底页）
    if (ctype.includes("text/html")) return;

    const body = (await res.text()).slice(0, 4000).trim();
    if (!isLikelyLlmsTxt(body)) return;

    const data = getTabData(tabId);
    if (!data.antiGeo) data.antiGeo = { signals: [], updatedAt: Date.now() };
    if (!data.antiGeo.signals.find((s) => s.type === "llms_txt")) {
      data.antiGeo.signals.push({
        type: "llms_txt",
        en: "Has llms.txt — provides curated content to guide AI systems",
        zh: "存在 llms.txt——专门为 AI 系统提供结构化内容，引导 AI 引用",
      });
      data.antiGeo.updatedAt = Date.now();
    }
  } catch { /* 超时或 404，正常忽略 */ }
});

/**
 * 判断正文是否像真正的 llms.txt（Markdown 文本），而非 HTML 错误页。
 * llms.txt 规范：纯文本 / Markdown，通常以 # 标题开头并含链接列表。
 */
function isLikelyLlmsTxt(text) {
  if (!text || text.length < 10) return false;
  // 以 HTML 开头 → 是网页，不是 llms.txt
  if (/^\s*<(?:!doctype|html|head|body|script|meta)/i.test(text)) return false;
  // 正文中含明显的 HTML 文档标记 → 排除
  if (/<html[\s>]|<\/html>|<head[\s>]|<body[\s>]/i.test(text)) return false;
  // 常见软 404 文案 → 排除
  if (/页面.*(找不到|不存在|无法显示)|页面已删除|not\s+found|404\b|page\s+not\s+found/i.test(text)) return false;
  // 正向特征：Markdown 标题或链接（llms.txt 规范的典型结构）
  const hasMarkdownHeading = /^#\s+\S/m.test(text);
  const hasMarkdownLink = /\[[^\]]+\]\([^)]+\)/.test(text);
  return hasMarkdownHeading || hasMarkdownLink;
}
