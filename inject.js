// inject.js — 运行在页面的主世界（Main World）
// 拦截浏览器敏感 API，检测指纹采集和权限请求
// 通过 window.postMessage 把检测结果发给 content.js

(function () {
  if (window.__uncloakInjected) return;
  window.__uncloakInjected = true;

  function report(api, detail) {
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

})();
