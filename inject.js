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
    return origFetch.apply(this, arguments);
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
    checkAIUrl(typeof url === "string" ? url : "");
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
      checkAIUrl(typeof url === "string" ? url : "");
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

})();
