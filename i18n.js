// i18n.js — 多语言支持模块
// 自动检测浏览器语言，回退到英语

const TRANSLATIONS = {

  // ── 英语（默认）────────────────────────────────────────────────────────────
  en: {
    // Header
    scanning: "Scanning...",
    loadingData: "Loading page data",

    // Stats
    trackers: "Trackers",
    requests: "Requests",
    apiCalls: "API Calls",

    // Verdict titles
    highExposure:   "High data exposure",
    mediumTracking: "Moderate tracking detected",
    lightTracking:  "Light tracking detected",
    noTracking:     "No tracking detected",

    // Verdict subtexts
    noIssues: "No known trackers or API calls detected.",

    // Comparison bar
    compLabel: (pct) => `More trackers than <strong>${pct}%</strong> of websites analyzed`,
    privacyFriendly: "Privacy-friendly",
    mostInvasive:    "Most invasive",

    // Tabs
    tabTrackers:   "Trackers",
    tabBrowserAPIs: "Browser APIs",

    // Empty states
    noTrackersTitle: "No known trackers detected",
    noTrackersSub:   "This page hasn't contacted any domains in our database yet.",
    noApisTitle: "No sensitive API calls detected",
    noApisSub:   "No fingerprinting, location, or camera access on this page.",

    // Tracker list
    expandHint: "Tap any row to learn more",

    // Risk labels
    highRisk:   "High Risk",
    mediumRisk: "Medium Risk",
    lowRisk:    "Low Risk",

    // Tracker categories
    categories: {
      Advertising:       "Advertising",
      Analytics:         "Analytics",
      Social:            "Social",
      Fingerprinting:    "Fingerprinting",
      "Data Broker":     "Data Broker",
      "Session Recording": "Session Recording",
      "Support/CRM":     "Support / CRM",
    },

    // API call labels & descriptions
    apis: {
      "canvas-fingerprint":  {
        label: "Canvas Fingerprinting",
        plain: "This site read your canvas rendering to create a unique ID for your device."
      },
      "webgl-fingerprint":   {
        label: "WebGL Fingerprinting",
        plain: "Your GPU model was accessed — a key data point for device fingerprinting."
      },
      "audio-fingerprint":   {
        label: "Audio Fingerprinting",
        plain: "Your audio hardware was profiled to help identify your device."
      },
      "geolocation":         {
        label: "Location Request",
        plain: "This site requested your precise geographic location."
      },
      "media-access":        {
        label: "Camera / Microphone",
        plain: "This site attempted to access your camera or microphone."
      },
      "webrtc-leak":         {
        label: "WebRTC IP Exposure",
        plain: "A peer-to-peer connection was opened — this can reveal your real IP even if you use a VPN."
      },
      "clipboard-read":      {
        label: "Clipboard Access",
        plain: "This site attempted to read the contents of your clipboard."
      },
      "battery-fingerprint": {
        label: "Battery Fingerprinting",
        plain: "Your battery status was accessed — sometimes used to track you across sessions."
      }
    },

    // buildSub helpers
    dataSentTo: (count, companies) => `Data sent to ${count} tracker${count > 1 ? "s" : ""} (${companies})`,
    detected:   (names) => `${names} detected`,

    // AI Safety
    tabAiSafety:      "AI Safety",
    noAiTitle:        "No AI services detected",
    noAiSub:          "This page doesn't appear to be sending your data to any AI APIs.",
    aiWarningBanner:  "⚠️ This page is sending data to AI services. Any text you enter may be processed by these AI models.",
    aiWebsiteBanner:  "🧠 You are on an AI service website. Your conversations and inputs are processed by their AI models.",
    aiCallOnce:       "Detected on this page",
    aiCallCount:      (n) => `${n} requests sent`,
    aiCallWebsite:    "You are currently using this AI service",
    phishingTitle:    (brand) => `⚠️ Possible fake ${brand} site`,
    phishingSub:      (domain) => `"${domain}" is NOT the official domain. This may be a phishing site designed to steal your account or AI conversations.`,
    phishingLegitPrefix: "✅ Official domain: ",
    dbBuiltIn:        "built-in database · fetching latest…",
    dbUpdated:        (d) => d === 0 ? "updated today" : `updated ${d}d ago`,
  },

  // ── 简体中文 ────────────────────────────────────────────────────────────────
  zh: {
    scanning: "正在扫描...",
    loadingData: "正在加载页面数据",

    trackers:  "追踪器",
    requests:  "请求数",
    apiCalls:  "API 调用",

    highExposure:   "数据暴露风险高",
    mediumTracking: "检测到中等追踪",
    lightTracking:  "检测到轻度追踪",
    noTracking:     "未检测到追踪行为",

    noIssues: "未发现已知追踪器或可疑 API 调用。",

    compLabel: (pct) => `追踪程度超过已分析网站的 <strong>${pct}%</strong>`,
    privacyFriendly: "隐私友好",
    mostInvasive:    "追踪最严重",

    tabTrackers:    "追踪器",
    tabBrowserAPIs: "浏览器 API",

    noTrackersTitle: "未发现已知追踪器",
    noTrackersSub:   "该页面尚未连接到我们数据库中的任何追踪域名。",
    noApisTitle: "未检测到敏感 API 调用",
    noApisSub:   "该页面未发现指纹采集、位置获取或摄像头访问行为。",

    expandHint: "点击任意行查看详情",

    highRisk:   "高风险",
    mediumRisk: "中风险",
    lowRisk:    "低风险",

    categories: {
      Advertising:         "广告网络",
      Analytics:           "数据分析",
      Social:              "社交追踪",
      Fingerprinting:      "设备指纹",
      "Data Broker":       "数据经纪商",
      "Session Recording": "行为录制",
      "Support/CRM":       "客服 / CRM",
    },

    apis: {
      "canvas-fingerprint":  {
        label: "Canvas 指纹采集",
        plain: "该网站通过读取 Canvas 渲染结果为你的设备生成唯一 ID。"
      },
      "webgl-fingerprint":   {
        label: "WebGL 指纹采集",
        plain: "你的 GPU 型号被读取——这是设备指纹识别的关键数据点。"
      },
      "audio-fingerprint":   {
        label: "音频指纹采集",
        plain: "你的音频硬件信息被采集，用于设备识别。"
      },
      "geolocation":         {
        label: "地理位置请求",
        plain: "该网站请求获取你的精确地理位置。"
      },
      "media-access":        {
        label: "摄像头 / 麦克风",
        plain: "该网站尝试访问你的摄像头或麦克风。"
      },
      "webrtc-leak":         {
        label: "WebRTC IP 泄露",
        plain: "页面建立了点对点连接——即使开启 VPN，你的真实 IP 也可能被暴露。"
      },
      "clipboard-read":      {
        label: "剪贴板读取",
        plain: "该网站尝试读取你剪贴板中的内容。"
      },
      "battery-fingerprint": {
        label: "电池指纹采集",
        plain: "你的电池状态被读取——有时被用于跨会话追踪你的身份。"
      }
    },

    dataSentTo: (count, companies) => `数据已发送至 ${count} 个追踪器（${companies}）`,
    detected:   (names) => `检测到 ${names}`,

    // AI Safety
    tabAiSafety:      "AI 安全",
    noAiTitle:        "未检测到 AI 服务",
    noAiSub:          "此页面似乎未向任何 AI API 发送你的数据。",
    aiWarningBanner:  "⚠️ 此页面正在向 AI 服务发送数据。你输入的任何内容都可能被这些 AI 模型处理。",
    aiWebsiteBanner:  "🧠 你正在使用一个 AI 服务网站。你的对话和输入内容将由该平台的 AI 模型处理。",
    aiCallOnce:       "在此页面检测到",
    aiCallCount:      (n) => `检测到 ${n} 次请求`,
    aiCallWebsite:    "你正在使用此 AI 服务",
    phishingTitle:    (brand) => `⚠️ 疑似仿冒 ${brand} 的钓鱼网站`,
    phishingSub:      (domain) => `"${domain}" 不是官方域名。这可能是一个钓鱼网站，旨在窃取你的账户或 AI 对话内容。`,
    phishingLegitPrefix: "✅ 官方域名：",
    dbBuiltIn:        "内置数据库 · 正在拉取最新数据…",
    dbUpdated:        (d) => d === 0 ? "今日已更新" : `${d} 天前更新`,
  },

  // ── 日语 ────────────────────────────────────────────────────────────────────
  ja: {
    scanning: "スキャン中...",
    loadingData: "データを読み込み中",

    trackers:  "トラッカー",
    requests:  "リクエスト",
    apiCalls:  "API 呼び出し",

    highExposure:   "データ露出リスクが高い",
    mediumTracking: "中程度のトラッキングを検出",
    lightTracking:  "軽度のトラッキングを検出",
    noTracking:     "トラッキングは検出されませんでした",

    noIssues: "既知のトラッカーや不審なAPI呼び出しは検出されませんでした。",

    compLabel: (pct) => `分析済みサイトの <strong>${pct}%</strong> より多くのトラッカー`,
    privacyFriendly: "プライバシー重視",
    mostInvasive:    "最も侵襲的",

    tabTrackers:    "トラッカー",
    tabBrowserAPIs: "ブラウザ API",

    noTrackersTitle: "既知のトラッカーは検出されませんでした",
    noTrackersSub:   "このページはデータベース内のドメインに接続していません。",
    noApisTitle: "機密 API 呼び出しは検出されませんでした",
    noApisSub:   "フィンガープリント、位置情報、カメラへのアクセスはありません。",

    expandHint: "行をタップして詳細を表示",

    highRisk:   "高リスク",
    mediumRisk: "中リスク",
    lowRisk:    "低リスク",

    categories: {
      Advertising:         "広告",
      Analytics:           "分析",
      Social:              "ソーシャル",
      Fingerprinting:      "フィンガープリント",
      "Data Broker":       "データブローカー",
      "Session Recording": "セッション録画",
      "Support/CRM":       "サポート / CRM",
    },

    apis: {
      "canvas-fingerprint":  { label: "Canvas フィンガープリント", plain: "サイトがCanvas描画を読み取り、デバイスの固有IDを生成しました。" },
      "webgl-fingerprint":   { label: "WebGL フィンガープリント", plain: "GPUモデルが読み取られました — デバイス識別の重要なデータです。" },
      "audio-fingerprint":   { label: "音声フィンガープリント", plain: "オーディオハードウェア情報がデバイス識別に使用されました。" },
      "geolocation":         { label: "位置情報リクエスト", plain: "サイトが正確な位置情報を要求しました。" },
      "media-access":        { label: "カメラ / マイク", plain: "サイトがカメラまたはマイクにアクセスしようとしました。" },
      "webrtc-leak":         { label: "WebRTC IP 露出", plain: "P2P接続が確立されました — VPN使用時でも実際のIPが漏洩する可能性があります。" },
      "clipboard-read":      { label: "クリップボード読み取り", plain: "サイトがクリップボードの内容を読み取ろうとしました。" },
      "battery-fingerprint": { label: "バッテリーフィンガープリント", plain: "バッテリー状態が読み取られました — セッション間の追跡に使用されることがあります。" }
    },

    dataSentTo: (count, companies) => `${count}件のトラッカーにデータ送信（${companies}）`,
    detected:   (names) => `${names} を検出`,
    tabAiSafety:      "AI セキュリティ",
    noAiTitle:        "AIサービスは検出されませんでした",
    noAiSub:          "このページはAI APIにデータを送信していないようです。",
    aiWarningBanner:  "⚠️ このページはAIサービスにデータを送信しています。入力した内容がAIモデルに処理される可能性があります。",
    aiCallOnce:       "このページで検出",
    aiCallCount:      (n) => `${n} 件のリクエストを検出`,
    aiCallWebsite:    "現在このAIサービスを使用しています",
    phishingTitle:    (brand) => `⚠️ 偽の${brand}サイトの可能性`,
    phishingSub:      (domain) => `"${domain}"は公式ドメインではありません。アカウントやAI会話を盗むフィッシングサイトの可能性があります。`,
    phishingLegitPrefix: "✅ 公式ドメイン：",
    dbBuiltIn:        "内蔵データベース · 最新データを取得中…",
    dbUpdated:        (d) => d === 0 ? "今日更新" : `${d}日前に更新`,
  },

  // ── 西班牙语 ────────────────────────────────────────────────────────────────
  es: {
    scanning: "Escaneando...",
    loadingData: "Cargando datos",

    trackers:  "Rastreadores",
    requests:  "Solicitudes",
    apiCalls:  "Llamadas API",

    highExposure:   "Alta exposición de datos",
    mediumTracking: "Rastreo moderado detectado",
    lightTracking:  "Rastreo leve detectado",
    noTracking:     "Sin rastreo detectado",

    noIssues: "No se detectaron rastreadores ni llamadas API sospechosas.",

    compLabel: (pct) => `Más rastreadores que el <strong>${pct}%</strong> de los sitios analizados`,
    privacyFriendly: "Respetuoso con la privacidad",
    mostInvasive:    "Más invasivo",

    tabTrackers:    "Rastreadores",
    tabBrowserAPIs: "APIs del navegador",

    noTrackersTitle: "No se detectaron rastreadores conocidos",
    noTrackersSub:   "Esta página no ha contactado dominios de nuestra base de datos.",
    noApisTitle: "No se detectaron llamadas API sensibles",
    noApisSub:   "Sin huella digital, ubicación ni acceso a cámara en esta página.",

    expandHint: "Toca cualquier fila para más detalles",

    highRisk:   "Alto riesgo",
    mediumRisk: "Riesgo medio",
    lowRisk:    "Bajo riesgo",

    categories: {
      Advertising:         "Publicidad",
      Analytics:           "Analítica",
      Social:              "Social",
      Fingerprinting:      "Huella digital",
      "Data Broker":       "Broker de datos",
      "Session Recording": "Grabación de sesión",
      "Support/CRM":       "Soporte / CRM",
    },

    apis: {
      "canvas-fingerprint":  { label: "Huella Canvas", plain: "El sitio leyó el renderizado canvas para crear un ID único de tu dispositivo." },
      "webgl-fingerprint":   { label: "Huella WebGL", plain: "Se accedió al modelo de tu GPU — dato clave para identificar dispositivos." },
      "audio-fingerprint":   { label: "Huella de audio", plain: "Se perfiló tu hardware de audio para identificar tu dispositivo." },
      "geolocation":         { label: "Solicitud de ubicación", plain: "El sitio solicitó tu ubicación geográfica exacta." },
      "media-access":        { label: "Cámara / Micrófono", plain: "El sitio intentó acceder a tu cámara o micrófono." },
      "webrtc-leak":         { label: "Exposición IP WebRTC", plain: "Se abrió una conexión P2P — puede revelar tu IP real aunque uses VPN." },
      "clipboard-read":      { label: "Acceso al portapapeles", plain: "El sitio intentó leer el contenido de tu portapapeles." },
      "battery-fingerprint": { label: "Huella de batería", plain: "Se accedió al estado de la batería — usado a veces para rastrearte." }
    },

    dataSentTo: (count, companies) => `Datos enviados a ${count} rastreador${count > 1 ? "es" : ""} (${companies})`,
    detected:   (names) => `${names} detectado`,
    tabAiSafety:      "Seguridad IA",
    noAiTitle:        "No se detectaron servicios de IA",
    noAiSub:          "Esta página no parece enviar datos a APIs de IA.",
    aiWarningBanner:  "⚠️ Esta página envía datos a servicios de IA. El texto que escribas puede ser procesado por estos modelos.",
    aiCallOnce:       "Detectado en esta página",
    aiCallCount:      (n) => `${n} solicitudes detectadas`,
    aiCallWebsite:    "Estás usando este servicio de IA ahora mismo",
    phishingTitle:    (brand) => `⚠️ Posible sitio falso de ${brand}`,
    phishingSub:      (domain) => `"${domain}" no es el dominio oficial. Este sitio puede ser una trampa de phishing para robar tu cuenta o conversaciones de IA.`,
    phishingLegitPrefix: "✅ Dominio oficial: ",
    dbBuiltIn:        "base de datos integrada · obteniendo datos…",
    dbUpdated:        (d) => d === 0 ? "actualizado hoy" : `actualizado hace ${d}d`,
  },

  // ── 法语 ────────────────────────────────────────────────────────────────────
  fr: {
    scanning: "Analyse en cours...",
    loadingData: "Chargement des données",

    trackers:  "Traceurs",
    requests:  "Requêtes",
    apiCalls:  "Appels API",

    highExposure:   "Exposition élevée des données",
    mediumTracking: "Suivi modéré détecté",
    lightTracking:  "Suivi léger détecté",
    noTracking:     "Aucun suivi détecté",

    noIssues: "Aucun traceur connu ni appel API suspect détecté.",

    compLabel: (pct) => `Plus de traceurs que <strong>${pct}%</strong> des sites analysés`,
    privacyFriendly: "Respectueux de la vie privée",
    mostInvasive:    "Très invasif",

    tabTrackers:    "Traceurs",
    tabBrowserAPIs: "APIs navigateur",

    noTrackersTitle: "Aucun traceur connu détecté",
    noTrackersSub:   "Cette page n'a contacté aucun domaine de notre base de données.",
    noApisTitle: "Aucun appel API sensible détecté",
    noApisSub:   "Aucune empreinte, géolocalisation ou accès caméra sur cette page.",

    expandHint: "Appuyez sur une ligne pour en savoir plus",

    highRisk:   "Risque élevé",
    mediumRisk: "Risque moyen",
    lowRisk:    "Faible risque",

    categories: {
      Advertising:         "Publicité",
      Analytics:           "Analytique",
      Social:              "Social",
      Fingerprinting:      "Empreinte",
      "Data Broker":       "Courtier de données",
      "Session Recording": "Enregistrement de session",
      "Support/CRM":       "Support / CRM",
    },

    apis: {
      "canvas-fingerprint":  { label: "Empreinte Canvas", plain: "Le site a lu le rendu canvas pour créer un identifiant unique de votre appareil." },
      "webgl-fingerprint":   { label: "Empreinte WebGL", plain: "Le modèle de votre GPU a été accédé — donnée clé pour l'empreinte digitale." },
      "audio-fingerprint":   { label: "Empreinte audio", plain: "Votre matériel audio a été profilé pour identifier votre appareil." },
      "geolocation":         { label: "Demande de localisation", plain: "Le site a demandé votre localisation géographique précise." },
      "media-access":        { label: "Caméra / Microphone", plain: "Le site a tenté d'accéder à votre caméra ou microphone." },
      "webrtc-leak":         { label: "Exposition IP WebRTC", plain: "Une connexion P2P a été ouverte — peut révéler votre vraie IP même avec un VPN." },
      "clipboard-read":      { label: "Accès presse-papiers", plain: "Le site a tenté de lire le contenu de votre presse-papiers." },
      "battery-fingerprint": { label: "Empreinte batterie", plain: "L'état de la batterie a été accédé — parfois utilisé pour vous tracer." }
    },

    dataSentTo: (count, companies) => `Données envoyées à ${count} traceur${count > 1 ? "s" : ""} (${companies})`,
    detected:   (names) => `${names} détecté`,
    tabAiSafety:      "Sécurité IA",
    noAiTitle:        "Aucun service IA détecté",
    noAiSub:          "Cette page ne semble pas envoyer de données à des API d'IA.",
    aiWarningBanner:  "⚠️ Cette page envoie des données à des services IA. Le texte que vous saisissez peut être traité par ces modèles.",
    aiCallOnce:       "Détecté sur cette page",
    aiCallCount:      (n) => `${n} requêtes détectées`,
    aiCallWebsite:    "Vous utilisez ce service IA en ce moment",
    phishingTitle:    (brand) => `⚠️ Faux site ${brand} possible`,
    phishingSub:      (domain) => `"${domain}" n'est pas le domaine officiel. Ce site pourrait être conçu pour voler votre compte ou vos conversations IA.`,
    phishingLegitPrefix: "✅ Domaine officiel : ",
    dbBuiltIn:        "base intégrée · récupération en cours…",
    dbUpdated:        (d) => d === 0 ? "mis à jour aujourd'hui" : `mis à jour il y a ${d}j`,
  },

  // ── 德语 ────────────────────────────────────────────────────────────────────
  de: {
    scanning: "Wird gescannt...",
    loadingData: "Daten werden geladen",

    trackers:  "Tracker",
    requests:  "Anfragen",
    apiCalls:  "API-Aufrufe",

    highExposure:   "Hohes Datenschutzrisiko",
    mediumTracking: "Mäßiges Tracking erkannt",
    lightTracking:  "Leichtes Tracking erkannt",
    noTracking:     "Kein Tracking erkannt",

    noIssues: "Keine bekannten Tracker oder verdächtigen API-Aufrufe erkannt.",

    compLabel: (pct) => `Mehr Tracker als <strong>${pct}%</strong> der analysierten Websites`,
    privacyFriendly: "Datenschutzfreundlich",
    mostInvasive:    "Am invasivsten",

    tabTrackers:    "Tracker",
    tabBrowserAPIs: "Browser-APIs",

    noTrackersTitle: "Keine bekannten Tracker erkannt",
    noTrackersSub:   "Diese Seite hat keine Domains aus unserer Datenbank kontaktiert.",
    noApisTitle: "Keine sensiblen API-Aufrufe erkannt",
    noApisSub:   "Kein Fingerprinting, Standortzugriff oder Kamerazugriff auf dieser Seite.",

    expandHint: "Zeile antippen für Details",

    highRisk:   "Hohes Risiko",
    mediumRisk: "Mittleres Risiko",
    lowRisk:    "Geringes Risiko",

    categories: {
      Advertising:         "Werbung",
      Analytics:           "Analytik",
      Social:              "Soziale Medien",
      Fingerprinting:      "Fingerprinting",
      "Data Broker":       "Datenhändler",
      "Session Recording": "Sitzungsaufzeichnung",
      "Support/CRM":       "Support / CRM",
    },

    apis: {
      "canvas-fingerprint":  { label: "Canvas-Fingerprinting", plain: "Die Seite hat das Canvas-Rendering gelesen, um eine eindeutige Geräte-ID zu erstellen." },
      "webgl-fingerprint":   { label: "WebGL-Fingerprinting", plain: "Ihr GPU-Modell wurde abgerufen — ein wichtiger Datenpunkt für Geräteerkennung." },
      "audio-fingerprint":   { label: "Audio-Fingerprinting", plain: "Ihre Audio-Hardware wurde profiliert, um Ihr Gerät zu identifizieren." },
      "geolocation":         { label: "Standortanfrage", plain: "Die Seite hat Ihren genauen geografischen Standort angefordert." },
      "media-access":        { label: "Kamera / Mikrofon", plain: "Die Seite hat versucht, auf Ihre Kamera oder Ihr Mikrofon zuzugreifen." },
      "webrtc-leak":         { label: "WebRTC-IP-Exposition", plain: "Eine P2P-Verbindung wurde geöffnet — kann Ihre echte IP auch bei VPN-Nutzung enthüllen." },
      "clipboard-read":      { label: "Zwischenablage-Zugriff", plain: "Die Seite hat versucht, den Inhalt Ihrer Zwischenablage zu lesen." },
      "battery-fingerprint": { label: "Batterie-Fingerprinting", plain: "Der Akkustand wurde abgerufen — manchmal zur sitzungsübergreifenden Verfolgung genutzt." }
    },

    dataSentTo: (count, companies) => `Daten an ${count} Tracker gesendet (${companies})`,
    detected:   (names) => `${names} erkannt`,
    tabAiSafety:      "KI-Sicherheit",
    noAiTitle:        "Keine KI-Dienste erkannt",
    noAiSub:          "Diese Seite scheint keine Daten an KI-APIs zu senden.",
    aiWarningBanner:  "⚠️ Diese Seite sendet Daten an KI-Dienste. Ihr eingegebener Text kann von diesen KI-Modellen verarbeitet werden.",
    aiCallOnce:       "Auf dieser Seite erkannt",
    aiCallCount:      (n) => `${n} Anfragen erkannt`,
    aiCallWebsite:    "Sie nutzen gerade diesen KI-Dienst",
    phishingTitle:    (brand) => `⚠️ Mögliche gefälschte ${brand}-Website`,
    phishingSub:      (domain) => `"${domain}" ist nicht die offizielle Domain. Diese Seite könnte eine Phishing-Seite sein, die Ihr Konto oder Ihre KI-Gespräche stehlen will.`,
    phishingLegitPrefix: "✅ Offizielle Domain: ",
    dbBuiltIn:        "eingebaute Datenbank · wird aktualisiert…",
    dbUpdated:        (d) => d === 0 ? "heute aktualisiert" : `vor ${d}T aktualisiert`,
  }
};

// ── 语言检测 ────────────────────────────────────────────────────────────────────
function detectLang() {
  const lang = (navigator.language || navigator.userLanguage || "en")
    .toLowerCase()
    .split("-")[0];

  // 支持的语言列表
  const supported = Object.keys(TRANSLATIONS);
  return supported.includes(lang) ? lang : "en";
}

// ── 获取翻译实例 ────────────────────────────────────────────────────────────────
function getT() {
  const lang = detectLang();
  return TRANSLATIONS[lang] || TRANSLATIONS.en;
}

// 导出（popup.js 直接调用 getT()）
const t = getT();
