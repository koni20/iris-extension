importScripts("trackers.js");

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

// 扩展启动时立即执行一次更新
refreshTrackerDB();

// 每隔 7 天自动重新拉取（用 alarm 保证 service worker 被唤醒）
chrome.alarms.create("refreshTrackerDB", { periodInMinutes: 7 * 24 * 60 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "refreshTrackerDB") refreshTrackerDB();
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
      timestamp: Date.now()
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

  chrome.action.setBadgeText({ text, tabId });
  if (text) chrome.action.setBadgeBackgroundColor({ color, tabId });
}

// service worker 被唤醒后 tabData 已丢失时，强制清除遗留 badge
function clearStaleBadge(tabId) {
  if (!tabData.has(tabId)) {
    chrome.action.setBadgeText({ text: "", tabId });
  }
}

// ── Tab 导航时重置数据 ─────────────────────────────────────────────────────────
chrome.webNavigation.onCommitted.addListener((details) => {
  if (details.frameId === 0) {
    tabData.delete(details.tabId);
    chrome.action.setBadgeText({ text: "", tabId: details.tabId });
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
    chrome.action.setBadgeText({ text: "", tabId });
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
      if (!tabs[0]) return sendResponse({ trackers: [], totalRequests: 0, apiCalls: [] });
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

      // 每次 popup 拉取时都同步 badge，防止 service worker 休眠后 badge 残留
      updateBadge(tabs[0].id, data);

      sendResponse({
        trackers: data.trackers,
        totalRequests: data.totalRequests,
        apiCalls: data.apiCalls,
        aiCalls,
        phishing,
        dbMeta,
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
});
