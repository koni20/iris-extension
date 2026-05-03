importScripts("trackers.js", "contentSafety.js");

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
      // 缓存有效：直接合并，不再请求网络
      const added = mergeTrackerData(cache.data);
      console.log(`[Iris] Tracker DB loaded from cache (+${added} domains, updated ${new Date(cache.timestamp).toLocaleDateString()})`);
      return;
    }

    console.log("[Iris] Fetching latest tracker list from Disconnect.me...");
    const resp = await fetch(DISCONNECT_URL, { cache: "no-store" });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

    const json   = await resp.json();
    const parsed = parseDisconnectList(json);
    const added  = mergeTrackerData(parsed);

    await chrome.storage.local.set({
      [DB_CACHE_KEY]: { data: parsed, timestamp: now, count: Object.keys(parsed).length }
    });

    console.log(`[Iris] Tracker DB refreshed: +${added} new domains (total dynamic: ${Object.keys(parsed).length})`);
  } catch (err) {
    // 网络失败时静默降级，使用静态数据库
    console.warn("[Iris] Tracker DB refresh failed, using built-in data:", err.message);
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
  } catch (err) {
    console.warn(`[Iris] Content safety list "${label}" failed:`, err.message);
    return {};
  }
}

async function refreshContentSafetyDB() {
  try {
    const stored = await chrome.storage.local.get(CS_CACHE_KEY);
    const cache = stored[CS_CACHE_KEY];
    const now = Date.now();

    if (cache && (now - cache.timestamp) < DB_TTL_MS) {
      const added = mergeContentSafetySeed(cache.data);
      console.log(
        `[Iris] Content safety DB from cache (+${added} domains, updated ${new Date(cache.timestamp).toLocaleDateString()})`
      );
      return;
    }

    console.log("[Iris] Fetching content safety lists (adult + gambling hosts + badware)...");

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
    const added = mergeContentSafetySeed(parsed);

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

    console.log(
      `[Iris] Content safety DB refreshed: +${added} new domains (merged ${Object.keys(parsed).length}: adult ${Object.keys(adultMap).length}, gambling ${Object.keys(gambleMap).length}, scam ${Object.keys(scamMap).length})`
    );
  } catch (err) {
    console.warn("[Iris] Content safety refresh failed:", err.message);
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

// ── 内存存储：每个 tab 的检测数据 ──────────────────────────────────────────────
// tabId → { requests: Set, trackers: [], apiCalls: [], timestamp }
const tabData = new Map();

function getTabData(tabId) {
  if (!tabData.has(tabId)) {
    tabData.set(tabId, {
      requests: new Set(),
      trackers: [],
      apiCalls: [],
      aiCalls:  [],        // AI 服务调用记录
      totalRequests: 0,
      timestamp: Date.now(),
      contentSafety: {
        domainMatches: [],
        keywords: [],
        manipulation: [],
      },
    });
  }
  return tabData.get(tabId);
}

// ── 网络请求监控 ────────────────────────────────────────────────────────────────
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
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
  );

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
    tabData.delete(details.tabId);
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
    tabData.delete(tabId);
    chrome.action.setBadgeText({ text: "", tabId }).catch(() => {});
    chrome.runtime.sendMessage({ type: "TAB_LOADING" }).catch(() => {});
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  tabData.delete(tabId);
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

      // 每次 popup 拉取时都同步 badge，防止 service worker 休眠后 badge 残留
      updateBadge(tabs[0].id, data);

      sendResponse({
        trackers: data.trackers,
        totalRequests: data.totalRequests,
        apiCalls: data.apiCalls,
        aiCalls,
        phishing,
        dbMeta,
        csMeta,
        contentSafety,
        url: tabUrl
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
});
