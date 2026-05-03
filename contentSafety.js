// 内容安全域名库（v1.2）— 与追踪器库分离；条目：domain → { category, plain_en, plain_zh }
// 动态列表见 background：uBlock adult.txt 等合并为 Adult 类

const CONTENT_SAFETY_CATEGORY_META = {
  Adult: {
    severity: 3,
    label_en: "Adult content",
    label_zh: "成人内容",
    plain_en: "This domain is classified as adult-oriented content.",
    plain_zh: "该域名被归类为成人向内容来源。",
  },
  Gambling: {
    severity: 3,
    label_en: "Gambling",
    label_zh: "赌博",
    plain_en: "This domain is associated with online gambling or betting.",
    plain_zh: "该域名与在线博彩或投注相关。",
  },
  Scam: {
    severity: 3,
    label_en: "Scam / high risk",
    label_zh: "诈骗 / 高风险",
    plain_en: "This domain is often reported in scam or malware blocklists.",
    plain_zh: "该域名常出现在诈骗或恶意软件黑名单中。",
  },
  Violence: {
    severity: 2,
    label_en: "Violence / harmful",
    label_zh: "暴力 / 有害内容",
    plain_en: "This domain may host violent or harmful material.",
    plain_zh: "该域名可能包含暴力或有害内容。",
  },
  Extreme: {
    severity: 3,
    label_en: "Extreme content",
    label_zh: "极端内容",
    plain_en: "May include extremist or extremely harmful material.",
    plain_zh: "可能包含极端主义或极度有害内容。",
  },
};

function plainForCategory(category) {
  const m = CONTENT_SAFETY_CATEGORY_META[category];
  if (!m) return { plain_en: "Flagged for content safety review.", plain_zh: "已标记供内容安全参考。" };
  return { plain_en: m.plain_en, plain_zh: m.plain_zh };
}

// 静态种子（后续由网络列表扩充）；同一结构会用于动态合并条目
const CONTENT_SAFETY_DB = {};

function addCS(domain, category) {
  const p = plainForCategory(category);
  CONTENT_SAFETY_DB[domain] = { category, plain_en: p.plain_en, plain_zh: p.plain_zh };
}

(function seedContentSafetyDB() {
  const adult = [
    "pornhub.com", "xvideos.com", "xnxx.com", "redtube.com", "youporn.com",
    "chaturbate.com", "onlyfans.com", "xhamster.com", "spankbang.com", "eporner.com",
  ];
  adult.forEach(d => addCS(d, "Adult"));

  const gamble = [
    "bet365.com", "draftkings.com", "fanduel.com", "stake.com", "pokerstars.com",
    "888casino.com", "betway.com", "unibet.com", "williamhill.com", "bovada.lv",
    "ignitioncasino.eu",
  ];
  gamble.forEach(d => addCS(d, "Gambling"));

  const violence = ["liveleak.com"];
  violence.forEach(d => addCS(d, "Violence"));
})();

/** 运行时合并的动态域名（与 TRACKER_DB 动态部分同理） */
let CONTENT_SAFETY_DYNAMIC = {};

function mergeContentSafetySeed(dynamic) {
  let added = 0;
  for (const [domain, info] of Object.entries(dynamic)) {
    if (!CONTENT_SAFETY_DB[domain] && !CONTENT_SAFETY_DYNAMIC[domain]) {
      CONTENT_SAFETY_DYNAMIC[domain] = info;
      added++;
    }
  }
  return added;
}

/**
 * 命中内容安全域名（含父域名）；优先静态库，再动态库
 */
function matchContentSafety(hostname) {
  const clean = hostname.replace(/^www\./, "");

  const tryLookup = (host) => CONTENT_SAFETY_DB[host] || CONTENT_SAFETY_DYNAMIC[host];

  let hit = tryLookup(clean);
  if (hit) return { domain: clean, ...hit };

  const parts = clean.split(".");
  for (let i = 1; i < parts.length - 1; i++) {
    const parent = parts.slice(i).join(".");
    hit = tryLookup(parent);
    if (hit) return { domain: parent, ...hit };
  }
  return null;
}
