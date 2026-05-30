// inject.js — 运行在页面的主世界（Main World）
// 拦截浏览器敏感 API，检测指纹采集和权限请求
// 通过 window.postMessage 把检测结果发给 content.js

(function () {
  if (window.__uncloakInjected) return;
  window.__uncloakInjected = true;

  // ── 接收来自 content.js 的用户设置 ────────────────────────────────────────
  let __irisSettings = null;
  window.addEventListener("message", (e) => {
    if (e.data?.__irisSettings) __irisSettings = e.data.settings || null;
  });

  // 模块是否启用（未收到设置前默认全部启用）
  function isMod(key) {
    return __irisSettings === null || __irisSettings[key] !== false;
  }

  // 指纹相关 API 集合，用于在 report() 统一拦截
  const FINGERPRINT_APIS = new Set([
    "canvas-fingerprint", "webgl-fingerprint", "audio-fingerprint",
    "geolocation", "media-access", "webrtc-leak", "clipboard-read", "battery-fingerprint",
  ]);

  function report(api, detail) {
    // 指纹类 API 受 mod_fingerprinting 控制
    if (FINGERPRINT_APIS.has(api) && !isMod("mod_fingerprinting")) return;
    // AI 调用受 mod_aiSafety 控制
    if (api === "ai-api-call" && !isMod("mod_aiSafety")) return;
    window.postMessage({
      __uncloak: true,
      api,
      detail: detail || null
    }, "*");
  }

  // ── Canvas 指纹检测 ──────────────────────────────────────────────────────────
  const origToDataURL = HTMLCanvasElement.prototype.toDataURL;
  HTMLCanvasElement.prototype.toDataURL = function (...args) {
    // 指纹采集的 canvas 通常很小（< 300px），大尺寸 canvas 一般是正常渲染
    // 避免对游戏/图表等正常用途误报，同时减少 postMessage 频率
    if (this.width > 0 && this.width < 300 && this.height > 0 && this.height < 100) {
      report("canvas-fingerprint", "toDataURL called");
    }
    return origToDataURL.apply(this, args);
  };

  const origGetImageData = CanvasRenderingContext2D.prototype.getImageData;
  CanvasRenderingContext2D.prototype.getImageData = function (...args) {
    report("canvas-fingerprint", "getImageData called");
    return origGetImageData.apply(this, args);
  };

  // ── WebGL 指纹检测 ───────────────────────────────────────────────────────────
  const origGetParameter = WebGLRenderingContext.prototype.getParameter;
  let webglReported = false;
  WebGLRenderingContext.prototype.getParameter = function (param) {
    // RENDERER / VENDOR 参数是 WebGL 指纹的核心
    if (!webglReported && (param === 0x1F01 || param === 0x1F00)) {
      webglReported = true;
      report("webgl-fingerprint", "GPU info accessed");
    }
    return origGetParameter.call(this, param);
  };

  // WebGL2
  if (typeof WebGL2RenderingContext !== "undefined") {
    const orig2 = WebGL2RenderingContext.prototype.getParameter;
    let webgl2Reported = false;
    WebGL2RenderingContext.prototype.getParameter = function (param) {
      if (!webgl2Reported && (param === 0x1F01 || param === 0x1F00)) {
        webgl2Reported = true;
        report("webgl-fingerprint", "GPU info accessed via WebGL2");
      }
      return orig2.call(this, param);
    };
  }

  // ── AudioContext 指纹检测 ────────────────────────────────────────────────────
  const OrigAudioContext = window.AudioContext || window.webkitAudioContext;
  if (OrigAudioContext) {
    const OrigCreateOscillator = OrigAudioContext.prototype.createOscillator;
    let audioReported = false;
    OrigAudioContext.prototype.createOscillator = function (...args) {
      if (!audioReported) {
        audioReported = true;
        report("audio-fingerprint", "AudioContext oscillator created");
      }
      return OrigCreateOscillator.apply(this, args);
    };
  }

  // ── 地理位置请求 ─────────────────────────────────────────────────────────────
  if (navigator.geolocation) {
    const origGetCurrentPosition = navigator.geolocation.getCurrentPosition.bind(navigator.geolocation);
    navigator.geolocation.getCurrentPosition = function (success, error, options) {
      report("geolocation", "getCurrentPosition called");
      return origGetCurrentPosition(success, error, options);
    };

    const origWatchPosition = navigator.geolocation.watchPosition.bind(navigator.geolocation);
    navigator.geolocation.watchPosition = function (success, error, options) {
      report("geolocation", "watchPosition called");
      return origWatchPosition(success, error, options);
    };
  }

  // ── 摄像头 / 麦克风请求 ──────────────────────────────────────────────────────
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    const origGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = function (constraints) {
      const types = [];
      if (constraints?.video) types.push("camera");
      if (constraints?.audio) types.push("microphone");
      report("media-access", types.join(" + ") || "media");
      return origGetUserMedia(constraints);
    };
  }

  // ── WebRTC IP 泄露检测 ───────────────────────────────────────────────────────
  const OrigRTC = window.RTCPeerConnection || window.webkitRTCPeerConnection;
  if (OrigRTC) {
    let rtcReported = false;
    const PatchedRTC = function (...args) {
      if (!rtcReported) {
        rtcReported = true;
        report("webrtc-leak", "RTCPeerConnection created — real IP may be exposed");
      }
      return new OrigRTC(...args);
    };
    PatchedRTC.prototype = OrigRTC.prototype;
    window.RTCPeerConnection = PatchedRTC;
    if (window.webkitRTCPeerConnection) window.webkitRTCPeerConnection = PatchedRTC;
  }

  // ── AI API 调用检测（fetch + XHR）────────────────────────────────────────────
  const AI_DOMAINS = [
    // 国际主流
    "api.openai.com", "oaiusercontent.com",
    "api.anthropic.com",
    "generativelanguage.googleapis.com", "aiplatform.googleapis.com",
    "openai.azure.com",
    "api.mistral.ai", "api.groq.com", "api.perplexity.ai",
    "api.cohere.ai", "huggingface.co",
    "api.replicate.com", "api.together.xyz", "api.stability.ai",
    // 中国 AI 厂商
    "api.deepseek.com",
    "dashscope.aliyuncs.com",
    "aip.baidubce.com", "qianfan.baidubce.com",
    "hunyuan.tencentcloudapi.com",
    "ark.cn-beijing.volces.com", "maas-api.ml-platform-cn-beijing.volces.com",
    "open.bigmodel.cn",
    "api.moonshot.cn",
    "api.baichuan-ai.com",
    "api.minimax.chat",
    "spark-api.xf-yun.com", "spark-api-open.xf-yun.com",
    "api.lingyiwanwu.com",
    "api.sensenova.cn"
  ];

  function checkAIUrl(url) {
    if (!url) return;
    let hostname;
    try { hostname = new URL(url).hostname; } catch { return; }

    const matched = AI_DOMAINS.find(d => hostname === d || hostname.endsWith("." + d));
    if (matched) {
      report("ai-api-call", JSON.stringify({ url, domain: matched }));
    }
  }

  // 拦截 fetch
  const origFetch = window.fetch;
  window.fetch = function (input, init) {
    const url = typeof input === "string" ? input : (input?.url || "");
    checkAIUrl(url);
    const promise = origFetch.apply(this, arguments);
    // 防止页面未捕获的 fetch 错误被 Chrome 归到 inject.js（扩展报错）
    // 加空 catch 标记为"已处理"，不影响页面自身的 .catch() 继续运行
    promise.catch(() => {});
    return promise;
  };

  // 拦截 XMLHttpRequest
  const origXhrOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url) {
    checkAIUrl(typeof url === "string" ? url : "");
    return origXhrOpen.apply(this, arguments);
  };

  // 拦截 WebSocket（AI 流式响应常用）
  const OrigWebSocket = window.WebSocket;
  window.WebSocket = function (url, ...args) {
    try { checkAIUrl(typeof url === "string" ? url : ""); } catch {}
    return new OrigWebSocket(url, ...args);
  };
  window.WebSocket.prototype = OrigWebSocket.prototype;
  Object.defineProperty(window.WebSocket, "CONNECTING", { value: OrigWebSocket.CONNECTING });
  Object.defineProperty(window.WebSocket, "OPEN",       { value: OrigWebSocket.OPEN });
  Object.defineProperty(window.WebSocket, "CLOSING",    { value: OrigWebSocket.CLOSING });
  Object.defineProperty(window.WebSocket, "CLOSED",     { value: OrigWebSocket.CLOSED });

  // 拦截 EventSource（SSE 流式传输）
  const OrigEventSource = window.EventSource;
  if (OrigEventSource) {
    window.EventSource = function (url, init) {
      try { checkAIUrl(typeof url === "string" ? url : ""); } catch {}
      return new OrigEventSource(url, init);
    };
    window.EventSource.prototype = OrigEventSource.prototype;
  }

  // ── 剪贴板读取 ───────────────────────────────────────────────────────────────
  if (navigator.clipboard && navigator.clipboard.read) {
    const origRead = navigator.clipboard.read.bind(navigator.clipboard);
    navigator.clipboard.read = function (...args) {
      report("clipboard-read", "Clipboard read attempted");
      return origRead(...args);
    };

    const origReadText = navigator.clipboard.readText.bind(navigator.clipboard);
    navigator.clipboard.readText = function (...args) {
      report("clipboard-read", "Clipboard readText attempted");
      return origReadText(...args);
    };
  }

  // ── Battery API 指纹检测 ─────────────────────────────────────────────────────
  if (navigator.getBattery) {
    const origGetBattery = navigator.getBattery.bind(navigator);
    navigator.getBattery = function () {
      report("battery-fingerprint", "Battery status accessed — used for fingerprinting");
      return origGetBattery();
    };
  }

  // ── 内容安全：可见文本与诱导行为（v1.2，仅本地）──────────────────────────────
  const CS_ZH_SEVERE = [
    "色情直播", "裸体视频", "成人影片", "一夜情交友", "同城约炮", "裸聊",
  ];
  const CS_ZH_MODERATE = [
    "网络赌博", "博彩网站", "投注平台", "在线赌场", "棋牌捕鱼", "菠菜平台",
    "杀猪盘", "兼职刷单", "血腥场面",
  ];
  const CS_ZH_MILD = ["彩票投注", "电竞投注"];

  const CS_EN_SEVERE = [];
  const CS_EN_MODERATE = [
    "online casino", "sports betting", "poker room", "slots bonus",
  ];
  const CS_EN_MILD = ["gambling site", "bet now"];

  function scanKeywords(text) {
    const hits = [];
    const push = (level, phrase) => {
      if (!hits.some((h) => h.match === phrase && h.level === level)) {
        hits.push({ level, match: phrase });
      }
    };

    for (const phrase of CS_ZH_SEVERE) {
      if (text.includes(phrase)) push("severe", phrase);
    }
    for (const phrase of CS_ZH_MODERATE) {
      if (text.includes(phrase)) push("moderate", phrase);
    }
    for (const phrase of CS_ZH_MILD) {
      if (text.includes(phrase)) push("mild", phrase);
    }

    const lower = text.toLowerCase();
    for (const phrase of CS_EN_SEVERE) {
      if (lower.includes(phrase)) push("severe", phrase);
    }
    for (const phrase of CS_EN_MODERATE) {
      if (lower.includes(phrase)) push("moderate", phrase);
    }
    for (const phrase of CS_EN_MILD) {
      if (lower.includes(phrase)) push("mild", phrase);
    }

    return hits;
  }

  function detectManipulation(text) {
    const out = [];
    if (/打赏|送礼物|礼物榜|送火箭|嘉年华/.test(text) && /充值|支付|微信|支付宝|付款|\d+\s*元/.test(text)) {
      out.push({ type: "live_monetization", hint: "live_tip_payment" });
    }
    if (/限时|仅此一天|错过再等|倒计时/.test(text) && /会员|VIP|订阅|解锁|付费观看/.test(text)) {
      out.push({ type: "urgency_paywall", hint: "urgency_membership" });
    }
    if (/小黄车|橱窗|同款好物|视频同款/.test(text) && /秒杀|限时抢|仅剩|下单|抢购/.test(text)) {
      out.push({ type: "commerce_push", hint: "live_commerce_urgency" });
    }
    if (/粉丝团|加入粉丝|灯牌|贵族/.test(text) && /元|钻|币|充值/.test(text)) {
      out.push({ type: "fan_monetization", hint: "live_fan_payment" });
    }
    return out;
  }

  function postContentSafetyScan() {
    try {
      const root = document.body;
      if (!root) return;
      const text = (root.innerText || "").slice(0, 100000);
      if (text.length < 40) return;

      const keywords = scanKeywords(text);
      const manipulation = detectManipulation(text);
      if (keywords.length === 0 && manipulation.length === 0) return;

      window.postMessage(
        {
          __uncloak: true,
          api: "content-safety-scan",
          detail: JSON.stringify({ keywords, manipulation }),
        },
        "*"
      );
    } catch (e) {}
  }

  function scheduleContentSafetyScan() {
    function run() {
      if (!isMod("mod_contentSafety")) return;
      if (!document.body) {
        setTimeout(run, 400);
        return;
      }
      postContentSafetyScan();
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        setTimeout(run, 1800);
        setTimeout(run, 6000);
      });
    } else {
      setTimeout(run, 1800);
      setTimeout(run, 6000);
    }
  }

  scheduleContentSafetyScan();

  // ── v1.4：消费与订阅信号（收窄场景，主世界可见文本）──────────────────────────
  const SUB_URL_KEYS = [
    "checkout", "pricing", "subscribe", "subscription", "trial", "payment", "cart",
    "order", "billing", "membership", "vip", "renew",
    "signup", "sign-up", "register", "upgrade", "plan", "plans", "purchase",
    "buy", "offer", "deals",
    // 中文 URL 关键词
    "开通", "付费", "充值", "会员", "订阅", "套餐", "续费", "年费", "购买",
    // 日文 URL 关键词
    "購入", "料金", "プラン", "定期", "定期購入", "申込",
  ];

  function subscriptionUrlGate() {
    const u = (location.pathname + location.search + location.hash).toLowerCase();
    return SUB_URL_KEYS.some((k) => u.includes(k));
  }

  function subscriptionCheckoutFormGate() {
    const cc = document.querySelector(
      'input[autocomplete="cc-number"], input[autocomplete="cc-exp"], input[name*="cardnumber" i], input[id*="cardnumber" i], input[placeholder*="card number" i]'
    );
    const pw = document.querySelector('input[type="password"]');
    return !!(cc && pw);
  }

  function collectSubscriptionHits(text) {
    const hits = [];
    const add = (id) => {
      if (!hits.some((h) => h.id === id)) hits.push({ id });
    };

    const lower = text.toLowerCase();

    const trialZh = /免费试用|免費試用|(?:^|[^\w\u4e00-\u9fff])试用(?:期)?|試用/.test(text);
    const trialEn = /\bfree\s*trial\b/i.test(lower);
    const payZh = /支付|付款|信用卡|银行卡|支付宝|微信支付|绑定(?:银行卡)?|付款方式/;
    const payEn =
      /payment\s*method|credit\s*card|debit\s*card|card\s*number|\bbilling\b|\bsubscribe\s+with/i.test(lower);

    if ((trialZh || trialEn) && (payZh.test(text) || payEn)) add("subSig_trial_payment");

    if (
      /自动续订|自动续费|自動續訂|自動續費|到期(?:自动)?扣款|连续包月|连续包年|自动扣费|自动扣款|\bauto[\s\-]?renew/i.test(text) ||
      /自動更新|自動課金|継続課金|定期購入|自動的に課金|毎月自動/i.test(text)
    ) {
      add("subSig_auto_renew");
    }

    if (
      (/\bcancel\s*anytime\b/i.test(lower) && /\b(subscription|renew|trial|billing|membership)\b/i.test(lower)) ||
      (/随时取消|随时退订|随时退款|随时终止|随时解约/i.test(text) && /会员|订阅|服务|续费/i.test(text)) ||
      (/いつでも解約|いつでもキャンセル|いつでも退会/i.test(text) && /プラン|会員|サービス|定期/i.test(text))
    ) {
      add("subSig_cancel_framing");
    }

    if (
      (
        /(?:首月|第一个月|首\s*\d+\s*个月|first\s*(?:month|months?))\s*[^\n]{0,60}(?:\$|￥|£|€|\d+\s*(?:元|美金|美元)?)/i.test(text) &&
        /(?:然后|之后|此后|then|after|\/\s*month|每月|\/mo\b|per\s*month)/i.test(text)
      ) ||
      (
        /(?:前\s*\d+\s*(?:天|日間?|日)|初回|最初の\s*\d+\s*(?:日|ヶ月|か月))\s*[^\n]{0,40}(?:無料|无料|免費|免费)/i.test(text) &&
        /(?:その後|以降|以后|然后|after)/i.test(text)
      ) ||
      (
        /(?:首年|第一年|活动价)\s*[^\n]{0,60}(?:\$|￥|£|€|\d+\s*(?:元|美金|美元)?)/i.test(text) &&
        /(?:然后|之后|此后|之后恢复|原价)/i.test(text)
      ) ||
      (
        /初月無料|初月\d+円|最初の\d+(?:日|ヶ月|か月)(?:は)?無料/i.test(text) &&
        /(?:その後|以降)\s*[^\n]{0,60}(?:円|¥)/i.test(text)
      )
    ) {
      add("subSig_price_intro");
    }

    if (
      /(?:仅需|只需|低至)?\s*[\d.,]+\s*(?:元|\$|usd)?\s*\/\s*(?:天|day)\b/i.test(text) &&
      /(?:subscribe|trial|plan|会员|订阅)/i.test(text)
    ) {
      add("subSig_daily_equiv");
    }

    // 日文：1日あたり / 日額
    if (
      /(?:1日|一日)あたり\s*[\d.,]+\s*円/i.test(text) &&
      /(?:プラン|会員|サービス|サブスク)/i.test(text)
    ) {
      add("subSig_daily_equiv");
    }

    if (
      (
        /\bmonthly\s*price\b/i.test(lower) &&
        /(?:\$|€|£|￥|¥|cny|usd|eur)\s*\d|\d\s*(?:\$|€|£|￥|¥)/i.test(text)
      ) ||
      (
        /(?:月费|月付|每月|\/月|按月)/i.test(text) &&
        /\d+\s*(?:元|¥|￥)/i.test(text)
      ) ||
      (
        /月額\s*[\d,]+\s*円|毎月\s*[\d,]+\s*円|月\s*[\d,]+\s*円\s*(?:から|〜)/i.test(text) &&
        /(?:プラン|会員|定期|サービス)/i.test(text)
      )
    ) {
      add("subSig_monthly_pricing");
    }

    // ── 中文：限时优惠 + 价格信号 ──────────────────────────────────────────
    if (
      /限时(?:优惠|特惠|折扣|活动)|限時(?:優惠|特惠|折扣)|限时抢购|倒计时优惠/i.test(text) &&
      /\d+\s*(?:元|¥|￥|\$)|会员|订阅|开通/i.test(text)
    ) {
      add("subSig_urgency_discount");
    }

    // ── 日文：限定価格 / キャンペーン + 価格信号 ───────────────────────────
    if (
      /期間限定|今だけ|特別価格|キャンペーン価格|割引キャンペーン/i.test(text) &&
      /[\d,]+\s*円|月額|プラン|会員/i.test(text)
    ) {
      add("subSig_urgency_discount");
    }

    // ── 日文：無料試用 + 支払情報入力 ────────────────────────────────────────
    const trialJa = /無料トライアル|無料体験|初回無料|お試し無料/i.test(text);
    const payJa = /クレジットカード|デビットカード|お支払い方法|カード番号|クレカ/i.test(text);
    if (trialJa && payJa) {
      add("subSig_trial_payment");
    }

    return hits;
  }

  function postSubscriptionScan(payload) {
    try {
      window.postMessage(
        {
          __uncloak: true,
          api: "subscription-scan",
          detail: JSON.stringify(payload),
        },
        "*"
      );
    } catch (e) {}
  }

  let subScanTimer = null;
  function runSubscriptionScanOnce() {
    try {
      // 模块禁用时直接上报空结果
      if (!isMod("mod_spendGuard")) {
        postSubscriptionScan({ gatePassed: false, gateReason: null, hits: [] });
        return;
      }
      const sensitivity = __irisSettings?.spendSensitivity || "normal";
      // strict 模式跳过 URL 门控，扫描所有页面
      const urlOk  = sensitivity === "strict" || subscriptionUrlGate();
      const formOk = subscriptionCheckoutFormGate();
      if (!urlOk && !formOk) {
        postSubscriptionScan({ gatePassed: false, gateReason: null, hits: [] });
        return;
      }
      ensureSubObserver();
      const gateReason = urlOk ? (sensitivity === "strict" ? "strict_mode" : "url") : "checkout_form";
      const root = document.body;
      if (!root) return;
      const text = (root.innerText || "").slice(0, 100000);
      const hits = text.length >= 24 ? collectSubscriptionHits(text) : [];
      postSubscriptionScan({ gatePassed: true, gateReason, hits });
    } catch (e) {}
  }

  function scheduleSubscriptionRescan() {
    clearTimeout(subScanTimer);
    subScanTimer = setTimeout(runSubscriptionScanOnce, 450);
  }

  let subObs = null;
  function ensureSubObserver() {
    if (subObs) return;
    if (!subscriptionUrlGate() && !subscriptionCheckoutFormGate()) return;
    subObs = new MutationObserver(() => scheduleSubscriptionRescan());
    subObs.observe(document.documentElement, { childList: true, subtree: true });
  }

  function scheduleSubscriptionScan() {
    function hookHistory() {
      const hook = (name) => {
        const orig = history[name];
        if (typeof orig !== "function") return;
        history[name] = function () {
          const r = orig.apply(this, arguments);
          scheduleSubscriptionRescan();
          return r;
        };
      };
      hook("pushState");
      hook("replaceState");
      window.addEventListener("popstate", scheduleSubscriptionRescan);
    }

    function boot() {
      if (!document.body) {
        setTimeout(boot, 400);
        return;
      }
      hookHistory();
      runSubscriptionScanOnce();
      setTimeout(runSubscriptionScanOnce, 3200);
      setTimeout(runSubscriptionScanOnce, 7500);
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => setTimeout(boot, 900));
    } else {
      setTimeout(boot, 900);
    }
  }

  scheduleSubscriptionScan();

  // ── v1.5：Cookie 同意暗模式检测 ─────────────────────────────────────────────
  // 注意：必须在主 IIFE 内部，才能访问 report() 函数
  (function setupCookieConsentScanner() {
  // 已知 CMP 框架检测
  const CMP_CHECKS = {
    OneTrust:    () => !!(window.OneTrust    || document.getElementById("onetrust-banner-sdk")),
    Cookiebot:   () => !!(window.Cookiebot   || document.getElementById("CybotCookiebotDialog")),
    TrustArc:    () => !!(window._truste_api || document.querySelector('[id*="truste"]')),
    Quantcast:   () => !!(window.__qcCmpapi  || document.querySelector('[id*="qc-cmp"]')),
    Didomi:      () => !!(window.Didomi      || window.didomiOnReady),
    Osano:       () => !!window.Osano,
    Usercentrics:() => !!(window.usercentrics || document.getElementById("usercentrics-root")),
    Axeptio:     () => !!(window._axcb       || document.querySelector('[id*="axeptio"]')),
  };

  const BANNER_SELECTORS = [
    "#onetrust-banner-sdk", "#CybotCookiebotDialog",
    '[id*="cookie-banner"]', '[id*="cookiebanner"]', '[class*="cookie-banner"]',
    '[id*="consent-banner"]', '[class*="consent-banner"]',
    '[id*="gdpr"]', '[class*="gdpr"]',
    "#cookie-law-info-bar", ".cc-banner", ".cc-window", ".cc-nb",
    '[id*="cookie-notice"]', '[class*="cookie-notice"]',
    '[id*="cookie-popup"]', '[class*="cookie-popup"]',
    '[aria-label*="cookie"]', '[aria-label*="Cookie"]',
    '[role="dialog"][aria-label*="consent" i]',
  ];

  const REJECT_TEXT = [
    /\breject\b/i, /\bdecline\b/i, /\bdeny\b/i, /\brefuse\b/i,
    /\bnecessary only\b/i, /\bessential only\b/i, /\bopt.?out\b/i,
    /拒绝|仅必要|拒絕|只接受必要/, /拒否|必要なのみ/,
    /\bablehnen\b/i, /\bnur notwendige\b/i,
    /\brefuser\b/i, /\bessentiels uniquement\b/i,
    /\brechazar\b/i, /\bsolo esenciales\b/i,
  ];

  function detectVendor() {
    for (const [name, check] of Object.entries(CMP_CHECKS)) {
      try { if (check()) return name; } catch {}
    }
    return null;
  }

  function findBanner() {
    for (const sel of BANNER_SELECTORS) {
      try {
        const el = document.querySelector(sel);
        if (el && el.offsetParent !== null) return el;
      } catch {}
    }
    return null;
  }

  function hasRejectButton(banner) {
    const root = banner || document;
    const btns = root.querySelectorAll('button, a[role="button"], [role="button"]');
    return Array.from(btns).some((b) => REJECT_TEXT.some((r) => r.test(b.textContent.trim())));
  }

  function detectPatterns(banner) {
    const patterns = [];
    if (banner && !hasRejectButton(banner)) {
      patterns.push("cookie_no_reject");
    }
    const boxes = (banner || document).querySelectorAll('input[type="checkbox"]');
    const preTicked = Array.from(boxes).filter((c) => {
      if (!c.checked || c.disabled) return false;
      const nameId = (c.name + c.id).toLowerCase();
      return !nameId.includes("necessary") && !nameId.includes("essential") && !nameId.includes("required");
    });
    if (preTicked.length > 0) patterns.push("cookie_pre_ticked");
    return patterns;
  }

  let lastResult = null;

  function scan() {
    if (!isMod("mod_cookieConsent")) return;
    const vendor     = detectVendor();
    const banner     = findBanner();
    const bannerFound = !!(vendor || banner);
    const patterns   = detectPatterns(banner);
    const result     = JSON.stringify({ vendor, bannerFound, patterns });
    if (result === lastResult) return;
    lastResult = result;
    report("cookie-consent-scan", result);
  }

  function debounce(fn, ms) {
    let id;
    return (...a) => { clearTimeout(id); id = setTimeout(() => fn(...a), ms); };
  }

  const debouncedScan = debounce(scan, 900);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      setTimeout(scan, 1200);
      setTimeout(scan, 3500);
    });
  } else {
    setTimeout(scan, 1200);
    setTimeout(scan, 3500);
  }

  new MutationObserver(debouncedScan).observe(document.documentElement, {
    childList: true, subtree: true,
  });
  })(); // end setupCookieConsentScanner

})(); // end main IIFE
