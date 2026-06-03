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
    aiServiceLabel:   "AI Service",
    aiSourcesHeading: "Citation sources (AI answers)",
    aiSourcesSummary: (c) =>
      `${c.total} outbound domains · ${c.low} low-trust · ${c.caution} review carefully`,
    aiSourcesDisclaimer: "Heuristic signals only — not a verdict on factual accuracy.",
    aiSourcesEmpty: "No external citation links detected yet.",
    aiSourceTier_low: "Low trust",
    aiSourceTier_caution: "Review",
    aiSourceTier_ok: "Looks OK",
    aiCitationReason_thinContent: "Thin / aggregator-style source",
    aiCitationReason_conspiracy: "Conspiracy / state-sponsored disinformation source",
    aiCitationReason_pseudoscience: "Pseudoscience or health misinformation source",
    aiCitationReason_fakenews: "Known fabricated or heavily misleading news source",
    phishingTitle:    (brand) => `⚠️ Possible fake ${brand} site`,
    phishingSub:      (domain) => `"${domain}" is NOT the official domain. This may be a phishing site designed to steal your account or AI conversations.`,
    phishingLegitPrefix: "✅ Official domain: ",
    dbBuiltIn:        "built-in database · fetching latest…",
    dbUpdated:        (d) => d === 0 ? "updated today" : `updated ${d}d ago`,

    tabContentSafety: "Content",
    tabSpendGuard: "Spend",
    tabCookieConsent: "Cookie",
    clean: "Clean",
    cookieNeutralTitle: "Scanning for consent banners…",
    cookieNeutralSub: "Will update when a cookie consent banner is detected on this page.",
    cookieGreenTitle: "No cookie banner detected",
    cookieGreenSub: "This page doesn't appear to use a consent management platform.",
    cookieBannerCleanTitle: "Cookie banner — no dark patterns",
    cookieBannerCleanSub: "A consent banner was found but no manipulative patterns were detected.",
    cookieYellowTitle: "Consent dark patterns detected",
    cookieYellowSub: "This page's cookie banner uses patterns that may make it harder to decline tracking.",
    cookiePatternTag: "Pattern",
    cookiePattern_cookie_no_reject: "No \"Reject All\" button visible at the top level of the consent dialog.",
    cookiePattern_cookie_pre_ticked: "Non-essential consent options are pre-checked by default.",
    sessionReplayTitle: "Session Recording",
    sessionReplaySubtitle: "This site is recording your session",
    sessionReplayWarning: "This site loaded a session recording tool. Your mouse movements, clicks, scrolls, and potentially form inputs are being captured and sent to a third party.",
    sessionReplayDomain: "Recording service",
    subEmptyScanningTitle: "Waiting for scan…",
    subEmptyScanningSub: "Open a pricing or checkout page to evaluate subscription wording.",
    subSummary_neutralTitle: "Not in checkout context",
    subSummary_neutralSub:
      "This URL doesn't match checkout/pricing paths and no card + password form pair was found — subscription wording scan is skipped.",
    subSummary_greenTitle: "No patterns flagged",
    subSummary_greenSub: "In this narrowed context we didn't detect common trial/billing wording combos.",
    subSummary_yellowTitle: "Review billing terms",
    subSummary_yellowSub:
      "Common subscription-related wording patterns appeared — verify renewal and cancellation in the site's terms.",
    subDisclaimer: "Heuristic patterns only — not legal advice or a fraud verdict.",
    subSigTag: "Signal",
    subSig_trial_payment: "Free trial mentioned near payment or card wording.",
    subSig_auto_renew: "Auto-renewal or automatic billing wording detected.",
    subSig_cancel_framing: "\"Cancel anytime\" appears alongside subscription or renewal wording.",
    subSig_price_intro: "Intro/first-month pricing appears with a higher ongoing rate nearby.",
    subSig_daily_equiv: "Daily price framing appears near subscribe/plan wording.",
    subSig_monthly_pricing: "Monthly pricing table or per-month charges displayed.",
    subSig_urgency_discount: "Limited-time discount combined with subscription or membership wording.",
    // Session bar
    sessionLabel: "SESSION",
    // Settings panel
    settingsTitle:          "Settings",
    settingsModules:        "Modules",
    settingsSensitivity:    "Spend Guard",
    settingsSensTitle:      "Detection Sensitivity",
    settingsSensNormal:     "Normal",
    settingsSensStrict:     "Strict",
    settingsSensNormalDesc: "Subscription & checkout pages only.",
    settingsSensStrictDesc: "Scan all pages for subscription signals.",
    settingsSavedNote:      "Changes saved automatically.",
    moduleDisabledBadge:    "Off",
    csRating_greenTitle:  "Looks OK for general audiences",
    csRating_greenSub:    "No blocked domains or strong risk phrases detected in visible text.",
    csRating_yellowTitle: "Parental caution",
    csRating_yellowSub:   "Some signals suggest reviewing this page with a caregiver.",
    csRating_redTitle:    "Not recommended for minors",
    csRating_redSub:      "High-risk domains or phrases were detected.",
    csEmptyTitle:         "Nothing flagged",
    csEmptySub:           "No risky domains or phrases detected on this page.",
    csCategories: {
      Adult: "Adult content",
      Gambling: "Gambling",
      Scam: "Scam / high risk",
      Violence: "Violence / harmful",
      Extreme: "Extreme content",
    },
    csLevel_severe: "Severe",
    csLevel_moderate: "Moderate",
    csLevel_mild: "Mild",
    csKeywordMatch: (m) => `Matched phrase: “${m}”`,
    csManipType: "Behavior pattern",
    csManip_live_tip_payment: "Streaming tip / recharge prompts (monetization pattern).",
    csManip_urgency_membership: "Urgent membership or paywall messaging.",
    csManip_live_commerce_urgency: "Shop or same-style links plus rush-buy wording (short-video commerce pattern).",
    csManip_live_fan_payment: "Fan club / badge prompts tied to paid coins or top-ups.",
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
    aiServiceLabel:   "AI 服务",
    aiSourcesHeading: "AI 回答中的引用域名",
    aiSourcesSummary: (c) =>
      `检出 ${c.total} 个外链域名 · 低可信 ${c.low} · 建议复核 ${c.caution}`,
    aiSourcesDisclaimer: "仅为启发式信号，不代表事实真伪判决。",
    aiSourcesEmpty: "暂未发现外向引用链接。",
    aiSourceTier_low: "低可信",
    aiSourceTier_caution: "建议复核",
    aiSourceTier_ok: "暂无告警",
    aiCitationReason_thinContent: "薄内容 / 聚合转载类来源",
    aiCitationReason_conspiracy: "阴谋论 / 国家背景虚假信息媒体",
    aiCitationReason_pseudoscience: "伪科学或健康虚假信息来源",
    aiCitationReason_fakenews: "已知编造新闻或严重误导性信息来源",
    phishingTitle:    (brand) => `⚠️ 疑似仿冒 ${brand} 的钓鱼网站`,
    phishingSub:      (domain) => `"${domain}" 不是官方域名。这可能是一个钓鱼网站，旨在窃取你的账户或 AI 对话内容。`,
    phishingLegitPrefix: "✅ 官方域名：",
    dbBuiltIn:        "内置数据库 · 正在拉取最新数据…",
    dbUpdated:        (d) => d === 0 ? "今日已更新" : `${d} 天前更新`,

    tabContentSafety: "内容安全",
    tabSpendGuard: "消费",
    tabCookieConsent: "Cookie",
    clean: "正常",
    cookieNeutralTitle: "扫描 Cookie 同意弹窗…",
    cookieNeutralSub: "检测到 Cookie 同意弹窗后将在此显示结果。",
    cookieGreenTitle: "未检测到 Cookie 弹窗",
    cookieGreenSub: "此页面似乎未使用同意管理平台（CMP）。",
    cookieBannerCleanTitle: "Cookie 弹窗 — 未发现暗模式",
    cookieBannerCleanSub: "发现了同意弹窗，但未检测到操控性设计模式。",
    cookieYellowTitle: "检测到同意暗模式",
    cookieYellowSub: "此页面的 Cookie 弹窗使用了可能使拒绝追踪变得困难的设计模式。",
    cookiePatternTag: "模式",
    cookiePattern_cookie_no_reject: "同意弹窗顶层未提供「全部拒绝」按钮。",
    cookiePattern_cookie_pre_ticked: "非必要选项默认已勾选。",
    sessionReplayTitle: "会话录制",
    sessionReplaySubtitle: "此网站正在录制你的操作",
    sessionReplayWarning: "此网站加载了会话录制工具。你的鼠标移动、点击、滚动，以及可能的表单输入，正被捕获并发送给第三方。",
    sessionReplayDomain: "录制服务",
    subEmptyScanningTitle: "等待页面扫描…",
    subEmptyScanningSub: "打开定价、结账或含订阅/试用语的页面后，此处会显示启发式信号。",
    subSummary_neutralTitle: "不在结账/订阅上下文",
    subSummary_neutralSub:
      "当前路径不匹配结账/定价等关键词，也未检测到信用卡与密码表单项同时出现，已跳过话术扫描以降低资讯页误报。",
    subSummary_greenTitle: "未发现典型话术组合",
    subSummary_greenSub: "在收窄场景下未检测到常见的试用、绑卡与续费等表述组合。",
    subSummary_yellowTitle: "建议核对条款",
    subSummary_yellowSub: "出现与订阅、试用或自动续费相关的常见表述模式，请自行核对条款与取消路径。",
    subDisclaimer: "仅为常见话术模式提示，不构成法律意见或欺诈认定。",
    subSigTag: "信号",
    subSig_trial_payment: "「免费试用」等与支付方式/绑卡表述邻近出现。",
    subSig_auto_renew: "出现自动续费、到期扣款或 auto-renew 等表述。",
    subSig_cancel_framing: "「随时取消」与订阅/续费相关用语同时出现。",
    subSig_price_intro: "首月/首期低价与后续更高费用表述同时出现。",
    subSig_daily_equiv: "出现「每天仅需××」类日均折价表述，且邻近订阅/会员语义。",
    subSig_monthly_pricing: "页面展示了月费价格表，请核对是否含自动续费条款。",
    subSig_urgency_discount: "页面出现「限时优惠」等紧迫折扣表述，邻近会员/订阅购买流程。",
    sessionLabel: "本次会话",
    settingsTitle:          "设置",
    settingsModules:        "模块",
    settingsSensitivity:    "消费守卫",
    settingsSensTitle:      "检测灵敏度",
    settingsSensNormal:     "标准",
    settingsSensStrict:     "严格",
    settingsSensNormalDesc: "仅在订阅/付款页面扫描。",
    settingsSensStrictDesc: "在所有页面扫描订阅相关信号。",
    settingsSavedNote:      "设置已自动保存。",
    moduleDisabledBadge:    "已关闭",
    csRating_greenTitle:  "适龄观感良好",
    csRating_greenSub:    "未发现黑名单域名或高风险关键词（基于可见文本）。",
    csRating_yellowTitle: "建议家长陪同",
    csRating_yellowSub:   "检测到部分值得关注的内容或诱导行为信号。",
    csRating_redTitle:    "不适合未成年人",
    csRating_redSub:      "检测到高风险域名或敏感短语。",
    csEmptyTitle:         "暂无告警",
    csEmptySub:           "此页暂未发现风险域名或敏感短语。",
    csCategories: {
      Adult: "成人内容",
      Gambling: "赌博",
      Scam: "诈骗 / 高风险",
      Violence: "暴力 / 有害",
      Extreme: "极端内容",
    },
    csLevel_severe: "严重",
    csLevel_moderate: "中度",
    csLevel_mild: "轻度",
    csKeywordMatch: (m) => `命中短语：「${m}」`,
    csManipType: "行为模式",
    csManip_live_tip_payment: "直播打赏 / 充值引导（常见变现话术）。",
    csManip_urgency_membership: "限时会员 / 付费墙紧迫感话术。",
    csManip_live_commerce_urgency: "小黄车 / 橱窗与限时秒杀、抢购等带货紧迫感组合。",
    csManip_live_fan_payment: "粉丝团、灯牌等与充值、虚拟币组合的话术。",
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
    aiServiceLabel:   "AIサービス",
    aiSourcesHeading: "AI回答の引用ドメイン",
    aiSourcesSummary: (c) =>
      `外部 ${c.total} ドメイン · 低信頼 ${c.low} · 要確認 ${c.caution}`,
    aiSourcesDisclaimer: "ヒューリスティックのみ。真偽の判定ではありません。",
    aiSourcesEmpty: "外向き引用リンクがまだ見つかりません。",
    aiSourceTier_low: "低信頼",
    aiSourceTier_caution: "要確認",
    aiSourceTier_ok: "問題なし",
    aiCitationReason_thinContent: "薄いコンテンツ／まとめ・聚合型ソース",
    aiCitationReason_conspiracy: "陰謀論または国家主導の偽情報発信元",
    aiCitationReason_pseudoscience: "疑似科学または健康系デマ情報源",
    aiCitationReason_fakenews: "捏造記事または著しく誤解を招くニュースサイト",
    phishingTitle:    (brand) => `⚠️ 偽の${brand}サイトの可能性`,
    phishingSub:      (domain) => `"${domain}"は公式ドメインではありません。アカウントやAI会話を盗むフィッシングサイトの可能性があります。`,
    phishingLegitPrefix: "✅ 公式ドメイン：",
    dbBuiltIn:        "内蔵データベース · 最新データを取得中…",
    dbUpdated:        (d) => d === 0 ? "今日更新" : `${d}日前に更新`,

    tabContentSafety: "コンテンツ",
    tabSpendGuard: "決済",
    tabCookieConsent: "Cookie",
    clean: "問題なし",
    cookieNeutralTitle: "同意バナーをスキャン中…",
    cookieNeutralSub: "Cookieの同意バナーが検出されると、ここに結果が表示されます。",
    cookieGreenTitle: "Cookieバナーは検出されませんでした",
    cookieGreenSub: "このページはCMP（同意管理プラットフォーム）を使用していないようです。",
    cookieBannerCleanTitle: "Cookieバナーあり — ダークパターンなし",
    cookieBannerCleanSub: "同意バナーが見つかりましたが、操作的なパターンは検出されませんでした。",
    cookieYellowTitle: "同意のダークパターンを検出",
    cookieYellowSub: "このページのCookieバナーは、追跡を拒否しにくくするパターンを使用しています。",
    cookiePatternTag: "パターン",
    cookiePattern_cookie_no_reject: "同意ダイアログのトップに「すべて拒否」ボタンがありません。",
    cookiePattern_cookie_pre_ticked: "必須以外のオプションがデフォルトでチェックされています。",
    subEmptyScanningTitle: "スキャン待ち…",
    subEmptyScanningSub: "料金・チェックアウトなどのページでサブスク関連の文言を確認します。",
    subSummary_neutralTitle: "決済コンテキスト外",
    subSummary_neutralSub:
      "URL がチェックアウト／料金パターンに一致せず、カード欄＋パスワード欄の組み合わせも見つかりませんでした（誤検知抑制のため深度スキャン省略）。",
    subSummary_greenTitle: "該当パターンなし",
    subSummary_greenSub: "絞り込み後のページで、典型的な試用・課金の組み合わせ文言は検出されませんでした。",
    subSummary_yellowTitle: "利用規約を確認してください",
    subSummary_yellowSub: "サブスク／自動更新に関する一般的な文言パターンが見られます。更新・解約条件をご自身で確認してください。",
    subDisclaimer: "あくまでヒューリスティックであり、法的判断や詐欺認定ではありません。",
    subSigTag: "シグナル",
    subSig_trial_payment: "無料トライアルが決済・カード関連の文言の近くにあります。",
    subSig_auto_renew: "自動更新・自動課金に関する表現が検出されました。",
    subSig_cancel_framing: "「いつでもキャンセル」とサブスク／更新関連語が一緒に出ています。",
    subSig_price_intro: "初月などの低価格表示と、その後の通常料金の表示が近くにあります。",
    subSig_daily_equiv: "1日あたり換算の安さの強調が、プラン／購読の近くにあります。",
    subSig_monthly_pricing: "月額料金表が表示されています。自動更新条件をご確認ください。",
    subSig_urgency_discount: "「期間限定」などの緊急割引表現とサブスク購入フローが同時に検出されました。",
    sessionLabel: "セッション",
    settingsTitle:          "設定",
    settingsModules:        "モジュール",
    settingsSensitivity:    "サブスク監視",
    settingsSensTitle:      "検出感度",
    settingsSensNormal:     "標準",
    settingsSensStrict:     "厳格",
    settingsSensNormalDesc: "サブスク・決済ページのみスキャン。",
    settingsSensStrictDesc: "全ページでサブスク関連シグナルをスキャン。",
    settingsSavedNote:      "設定は自動的に保存されます。",
    moduleDisabledBadge:    "オフ",
    csRating_greenTitle:  "一般的な利用に問題なし",
    csRating_greenSub:    "ブロック対象ドメインや強いリスク語は検出されませんでした。",
    csRating_yellowTitle: "保護者の確認を推奨",
    csRating_yellowSub:   "注意すべきシグナルが一部見つかりました。",
    csRating_redTitle:    "未成年には非推奨",
    csRating_redSub:      "高リスクのドメインまたはフレーズが検出されました。",
    csEmptyTitle:         "問題なし",
    csEmptySub:           "リスクのあるドメインやフレーズは検出されませんでした。",
    csCategories: {
      Adult: "成人向け",
      Gambling: "ギャンブル",
      Scam: "詐欺 / 高リスク",
      Violence: "暴力 / 有害",
      Extreme: "過激な内容",
    },
    csLevel_severe: "重大",
    csLevel_moderate: "中程度",
    csLevel_mild: "軽微",
    csKeywordMatch: (m) => `一致: 「${m}」`,
    csManipType: "行動パターン",
    csManip_live_tip_payment: "配信・投げ銭 / 課金の誘導パターン。",
    csManip_urgency_membership: "期間限定・会員登録の煽り文句。",
    csManip_live_commerce_urgency: "ショート動画の「同款」ショップと限定セール煽りの組み合わせ。",
    csManip_live_fan_payment: "ファンクラブ・バッジとコイン課金を組み合わせた誘導。",
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
    aiServiceLabel:   "Servicio IA",
    aiSourcesHeading: "Dominios citados (respuestas IA)",
    aiSourcesSummary: (c) =>
      `${c.total} dominios externos · ${c.low} baja confianza · ${c.caution} revisar`,
    aiSourcesDisclaimer: "Solo heurísticas — no es un veredicto de veracidad.",
    aiSourcesEmpty: "Aún no hay enlaces de citas externos.",
    aiSourceTier_low: "Baja confianza",
    aiSourceTier_caution: "Revisar",
    aiSourceTier_ok: "OK",
    aiCitationReason_thinContent: "Contenido superficial / fuente agregadora",
    aiCitationReason_conspiracy: "Fuente de conspiraciones o desinformación patrocinada por el Estado",
    aiCitationReason_pseudoscience: "Fuente de pseudociencia o desinformación sobre salud",
    aiCitationReason_fakenews: "Fuente de noticias fabricadas o gravemente engañosas",
    phishingTitle:    (brand) => `⚠️ Posible sitio falso de ${brand}`,
    phishingSub:      (domain) => `"${domain}" no es el dominio oficial. Este sitio puede ser una trampa de phishing para robar tu cuenta o conversaciones de IA.`,
    phishingLegitPrefix: "✅ Dominio oficial: ",
    dbBuiltIn:        "base de datos integrada · obteniendo datos…",
    dbUpdated:        (d) => d === 0 ? "actualizado hoy" : `actualizado hace ${d}d`,

    tabContentSafety: "Contenido",
    tabSpendGuard: "Pagos",
    tabCookieConsent: "Cookie",
    clean: "Sin incidencias",
    cookieNeutralTitle: "Escaneando banners de consentimiento…",
    cookieNeutralSub: "Los resultados aparecerán cuando se detecte un banner de consentimiento de cookies.",
    cookieGreenTitle: "No se detectó banner de cookies",
    cookieGreenSub: "Esta página no parece usar una plataforma de gestión del consentimiento.",
    cookieBannerCleanTitle: "Banner de cookies — sin patrones oscuros",
    cookieBannerCleanSub: "Se encontró un banner de consentimiento sin patrones manipuladores.",
    cookieYellowTitle: "Patrones oscuros de consentimiento detectados",
    cookieYellowSub: "El banner de cookies de esta página usa patrones que dificultan rechazar el rastreo.",
    cookiePatternTag: "Patrón",
    cookiePattern_cookie_no_reject: "No hay botón \"Rechazar todo\" visible en el nivel superior del diálogo.",
    cookiePattern_cookie_pre_ticked: "Las opciones no esenciales están marcadas por defecto.",
    subEmptyScanningTitle: "Esperando análisis…",
    subEmptyScanningSub: "Abre una página de precios o checkout para evaluar el texto de suscripción.",
    subSummary_neutralTitle: "Fuera de contexto de pago",
    subSummary_neutralSub:
      "La URL no coincide con rutas típicas de checkout/precios y no vimos formulario con tarjeta + contraseña — se omite el escaneo profundo.",
    subSummary_greenTitle: "Sin patrones marcados",
    subSummary_greenSub: "En este contexto acotado no detectamos combinaciones típicas de prueba/facturación.",
    subSummary_yellowTitle: "Revisa los términos de facturación",
    subSummary_yellowSub:
      "Aparecieron patrones habituales ligados a suscripciones — verifica renovación y cancelación en los términos del sitio.",
    subDisclaimer: "Solo patrones heurísticos — no es asesoramiento legal ni veredicto de fraude.",
    subSigTag: "Señal",
    subSig_trial_payment: "Mención de prueba gratuita cerca de texto de pago o tarjeta.",
    subSig_auto_renew: "Texto de renovación automática o cargo recurrente detectado.",
    subSig_cancel_framing: "«Cancela cuando quieras» junto a suscripción o renovación.",
    subSig_price_intro: "Precio introductorio/primer mes junto a una tarifa posterior más alta.",
    subSig_daily_equiv: "Precio por día cerca de texto de plan o suscripción.",
    subSig_monthly_pricing: "Tabla de precios mensuales visible. Verifica si incluye renovación automática.",
    subSig_urgency_discount: "Descuento por tiempo limitado junto a texto de suscripción o membresía.",
    sessionLabel: "SESIÓN",
    settingsTitle:          "Ajustes",
    settingsModules:        "Módulos",
    settingsSensitivity:    "Spend Guard",
    settingsSensTitle:      "Sensibilidad de detección",
    settingsSensNormal:     "Normal",
    settingsSensStrict:     "Estricto",
    settingsSensNormalDesc: "Solo páginas de suscripción y pago.",
    settingsSensStrictDesc: "Escaneaer señales de suscripción en todas las páginas.",
    settingsSavedNote:      "Los cambios se guardan automáticamente.",
    moduleDisabledBadge:    "Off",
    csRating_greenTitle:  "Parece adecuado para público general",
    csRating_greenSub:    "No se detectaron dominios bloqueados ni frases de alto riesgo.",
    csRating_yellowTitle: "Precaución parental",
    csRating_yellowSub:   "Hay señales que conviene revisar con un adulto.",
    csRating_redTitle:    "No recomendado para menores",
    csRating_redSub:      "Se detectaron dominios o frases de alto riesgo.",
    csEmptyTitle:         "Sin alertas",
    csEmptySub:           "No se detectaron dominios o frases arriesgadas.",
    csCategories: {
      Adult: "Contenido adulto",
      Gambling: "Apuestas",
      Scam: "Estafa / alto riesgo",
      Violence: "Violencia / daño",
      Extreme: "Contenido extremo",
    },
    csLevel_severe: "Grave",
    csLevel_moderate: "Moderado",
    csLevel_mild: "Leve",
    csKeywordMatch: (m) => `Frase coincidente: “${m}”`,
    csManipType: "Patrón",
    csManip_live_tip_payment: "Propinas en vivo / recarga (patrón de monetización).",
    csManip_urgency_membership: "Mensajes urgentes de membresía o muro de pago.",
    csManip_live_commerce_urgency: "Tienda en video corto + urgencia de compra (patrón típico).",
    csManip_live_fan_payment: "Club de fans / insignias ligados a moneda de pago o recarga.",
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
    aiServiceLabel:   "Service IA",
    aiSourcesHeading: "Sources citées (réponses IA)",
    aiSourcesSummary: (c) =>
      `${c.total} domaines externes · ${c.low} faible confiance · ${c.caution} à revoir`,
    aiSourcesDisclaimer: "Heuristique seulement — pas un jugement de vérité.",
    aiSourcesEmpty: "Aucun lien de citation externe détecté.",
    aiSourceTier_low: "Faible confiance",
    aiSourceTier_caution: "À revoir",
    aiSourceTier_ok: "OK",
    aiCitationReason_thinContent: "Source superficielle / type agrégateur",
    aiCitationReason_conspiracy: "Source de théories conspirationnistes ou désinformation d'État",
    aiCitationReason_pseudoscience: "Source de pseudoscience ou de désinformation sanitaire",
    aiCitationReason_fakenews: "Source de fausses nouvelles fabriquées ou très trompeuses",
    phishingTitle:    (brand) => `⚠️ Faux site ${brand} possible`,
    phishingSub:      (domain) => `"${domain}" n'est pas le domaine officiel. Ce site pourrait être conçu pour voler votre compte ou vos conversations IA.`,
    phishingLegitPrefix: "✅ Domaine officiel : ",
    dbBuiltIn:        "base intégrée · récupération en cours…",
    dbUpdated:        (d) => d === 0 ? "mis à jour aujourd'hui" : `mis à jour il y a ${d}j`,

    tabContentSafety: "Contenu",
    tabSpendGuard: "Paiements",
    tabCookieConsent: "Cookie",
    clean: "Rien à signaler",
    cookieNeutralTitle: "Scan des bannières de consentement…",
    cookieNeutralSub: "Les résultats s'afficheront dès qu'une bannière de cookies sera détectée.",
    cookieGreenTitle: "Aucune bannière de cookies détectée",
    cookieGreenSub: "Cette page ne semble pas utiliser une plateforme de gestion du consentement.",
    cookieBannerCleanTitle: "Bannière cookies — aucun patron sombre",
    cookieBannerCleanSub: "Une bannière de consentement a été trouvée, sans motifs manipulateurs.",
    cookieYellowTitle: "Patrons sombres de consentement détectés",
    cookieYellowSub: "La bannière de cookies utilise des pratiques pouvant rendre le refus plus difficile.",
    cookiePatternTag: "Patron",
    cookiePattern_cookie_no_reject: "Aucun bouton « Tout refuser » visible au premier niveau de la boîte de dialogue.",
    cookiePattern_cookie_pre_ticked: "Des options non essentielles sont pré-cochées par défaut.",
    subEmptyScanningTitle: "En attente d’analyse…",
    subEmptyScanningSub: "Ouvrez une page tarifs ou paiement pour évaluer le wording d’abonnement.",
    subSummary_neutralTitle: "Hors contexte paiement",
    subSummary_neutralSub:
      "L’URL ne correspond pas aux chemins checkout/tarifs et aucune paire champ carte + mot de passe — analyse poussée ignorée.",
    subSummary_greenTitle: "Aucun motif détecté",
    subSummary_greenSub: "Dans ce contexte restreint, pas de combinaisons typiques essai/facturation.",
    subSummary_yellowTitle: "Vérifiez les conditions",
    subSummary_yellowSub:
      "Des formulations liées aux abonnements sont apparues — vérifiez renouvellement et résiliation dans les conditions.",
    subDisclaimer: "Heuristique seulement — pas un conseil juridique ni un jugement sur une fraude.",
    subSigTag: "Signal",
    subSig_trial_payment: "Essai gratuit mentionné près du paiement ou de la carte.",
    subSig_auto_renew: "Formulation de renouvellement automatique ou prélèvement récurrent.",
    subSig_cancel_framing: "« Annulez à tout moment » avec abonnement ou renouvellement à proximité.",
    subSig_price_intro: "Prix d’intro/premier mois avec un tarif régulier plus élevé à côté.",
    subSig_daily_equiv: "Prix par jour mis en avant près d’un plan ou abonnement.",
    subSig_monthly_pricing: "Tableau de tarifs mensuels affiché. Vérifiez s'il inclut un renouvellement automatique.",
    subSig_urgency_discount: "Réduction à durée limitée détectée avec du texte sur un abonnement ou une adhésion.",
    sessionLabel: "SESSION",
    settingsTitle:          "Paramètres",
    settingsModules:        "Modules",
    settingsSensitivity:    "Spend Guard",
    settingsSensTitle:      "Sensibilité de détection",
    settingsSensNormal:     "Normal",
    settingsSensStrict:     "Strict",
    settingsSensNormalDesc: "Pages d'abonnement et de paiement uniquement.",
    settingsSensStrictDesc: "Scanner les signaux d'abonnement sur toutes les pages.",
    settingsSavedNote:      "Modifications enregistrées automatiquement.",
    moduleDisabledBadge:    "Off",
    csRating_greenTitle:  "Semble adapté au grand public",
    csRating_greenSub:    "Aucun domaine bloqué ni phrase à fort risque détectée.",
    csRating_yellowTitle: "Prudence parentale",
    csRating_yellowSub:   "Certains signaux méritent un regard adulte.",
    csRating_redTitle:    "Non recommandé aux mineurs",
    csRating_redSub:      "Domaines ou phrases à haut risque détectés.",
    csEmptyTitle:         "Rien signalé",
    csEmptySub:           "Aucun domaine ou phrase risquée détectée.",
    csCategories: {
      Adult: "Contenu adulte",
      Gambling: "Jeu d'argent",
      Scam: "Arnaque / haut risque",
      Violence: "Violence / nuisible",
      Extreme: "Contenu extrême",
    },
    csLevel_severe: "Grave",
    csLevel_moderate: "Modéré",
    csLevel_mild: "Léger",
    csKeywordMatch: (m) => `Expression correspondante : « ${m} »`,
    csManipType: "Schéma",
    csManip_live_tip_payment: "Pourboires live / recharge (monétisation type streaming).",
    csManip_urgency_membership: "Message urgent d'abonnement ou paywall.",
    csManip_live_commerce_urgency: "Boutique vidéo courte + urgence d'achat (schéma fréquent).",
    csManip_live_fan_payment: "Club de fans / badges liés aux pièces payantes ou recharges.",
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
    aiServiceLabel:   "KI-Dienst",
    aiSourcesHeading: "Zitierte Domains (KI-Antworten)",
    aiSourcesSummary: (c) =>
      `${c.total} externe Domains · ${c.low} geringes Vertrauen · ${c.caution} prüfen`,
    aiSourcesDisclaimer: "Nur Heuristik — kein Wahrheitsurteil.",
    aiSourcesEmpty: "Noch keine externen Zitat-Links gefunden.",
    aiSourceTier_low: "Geringes Vertrauen",
    aiSourceTier_caution: "Prüfen",
    aiSourceTier_ok: "OK",
    aiCitationReason_thinContent: "Dünner Inhalt / Aggregator-Quelle",
    aiCitationReason_conspiracy: "Verschwörungstheorie oder staatlich gesponserte Desinformationsquelle",
    aiCitationReason_pseudoscience: "Pseudowissenschaft oder Gesundheitsdesinformationsquelle",
    aiCitationReason_fakenews: "Bekannte Quelle für erfundene oder stark irreführende Nachrichten",
    phishingTitle:    (brand) => `⚠️ Mögliche gefälschte ${brand}-Website`,
    phishingSub:      (domain) => `"${domain}" ist nicht die offizielle Domain. Diese Seite könnte eine Phishing-Seite sein, die Ihr Konto oder Ihre KI-Gespräche stehlen will.`,
    phishingLegitPrefix: "✅ Offizielle Domain: ",
    dbBuiltIn:        "eingebaute Datenbank · wird aktualisiert…",
    dbUpdated:        (d) => d === 0 ? "heute aktualisiert" : `vor ${d}T aktualisiert`,

    tabContentSafety: "Inhalt",
    tabSpendGuard: "Zahlung",
    tabCookieConsent: "Cookie",
    clean: "Unauffällig",
    cookieNeutralTitle: "Scanne Cookie-Einwilligungsbanner…",
    cookieNeutralSub: "Ergebnisse erscheinen, sobald ein Cookie-Banner erkannt wird.",
    cookieGreenTitle: "Kein Cookie-Banner erkannt",
    cookieGreenSub: "Diese Seite scheint keine Einwilligungsverwaltungsplattform zu verwenden.",
    cookieBannerCleanTitle: "Cookie-Banner — keine Dark Patterns",
    cookieBannerCleanSub: "Ein Einwilligungsbanner wurde gefunden, jedoch ohne manipulative Muster.",
    cookieYellowTitle: "Einwilligungs-Dark-Patterns erkannt",
    cookieYellowSub: "Der Cookie-Banner dieser Seite nutzt Muster, die das Ablehnen erschweren.",
    cookiePatternTag: "Muster",
    cookiePattern_cookie_no_reject: "Kein 'Alle ablehnen'-Button auf der obersten Ebene des Dialogs sichtbar.",
    cookiePattern_cookie_pre_ticked: "Nicht notwendige Optionen sind standardmäßig vorausgewählt.",
    subEmptyScanningTitle: "Warte auf Scan…",
    subEmptyScanningSub: "Öffnen Sie eine Preis- oder Checkout-Seite, um Abo-Formulierungen zu prüfen.",
    subSummary_neutralTitle: "Kein Checkout-Kontext",
    subSummary_neutralSub:
      "URL passt nicht zu typischen Checkout-/Preis-Pfaden und kein Karte+Passwort-Formularpaar — tiefer Scan ausgelassen.",
    subSummary_greenTitle: "Keine Muster",
    subSummary_greenSub: "In diesem eingeschränkten Kontext keine typischen Test-/Abrechnungs-Kombinationen.",
    subSummary_yellowTitle: "Konditionen prüfen",
    subSummary_yellowSub:
      "Übliche Abo-/Verlängerungs-Formulierungen erkannt — Verlängerung und Kündigung in den AGB prüfen.",
    subDisclaimer: "Nur Heuristik — keine Rechtsberatung und kein Betrugsurteil.",
    subSigTag: "Signal",
    subSig_trial_payment: "Kostenlose Testphase nahe Zahlungs- oder Kartenwortlaut.",
    subSig_auto_renew: "Auto-Verlängerung oder wiederkehrende Abbuchung erwähnt.",
    subSig_cancel_framing: "„Jederzeit kündbar“ zusammen mit Abo-/Verlängerungstext.",
    subSig_price_intro: "Einstiegspreis/erster Monat mit höherem Folgepreis in der Nähe.",
    subSig_daily_equiv: "Tagespreis-Nennung nahe Abo-/Plan-Text.",
    subSig_monthly_pricing: "Monatliche Preistabelle sichtbar. Prüfen Sie, ob automatische Verlängerung enthalten ist.",
    subSig_urgency_discount: "Befristetes Rabattangebot zusammen mit Abo- oder Mitgliedschaftstext entdeckt.",
    sessionLabel: "SITZUNG",
    settingsTitle:          "Einstellungen",
    settingsModules:        "Module",
    settingsSensitivity:    "Spend Guard",
    settingsSensTitle:      "Erkennungsempfindlichkeit",
    settingsSensNormal:     "Normal",
    settingsSensStrict:     "Streng",
    settingsSensNormalDesc: "Nur Abo- und Zahlungsseiten scannen.",
    settingsSensStrictDesc: "Alle Seiten auf Abo-Signale scannen.",
    settingsSavedNote:      "Einstellungen werden automatisch gespeichert.",
    moduleDisabledBadge:    "Aus",
    csRating_greenTitle:  "Wirkt für breite Zielgruppen unbedenklich",
    csRating_greenSub:    "Keine blockierten Domains oder stark riskanten Texte gefunden.",
    csRating_yellowTitle: "Eltern: bitte prüfen",
    csRating_yellowSub:   "Einige Hinweise können gemeinsam besprochen werden.",
    csRating_redTitle:    "Nicht für Minderjährige empfohlen",
    csRating_redSub:      "Riskante Domains oder Ausdrücke erkannt.",
    csEmptyTitle:         "Keine Hinweise",
    csEmptySub:           "Keine riskanten Domains oder Ausdrücke auf dieser Seite.",
    csCategories: {
      Adult: "Erwachseneninhalt",
      Gambling: "Glücksspiel",
      Scam: "Betrug / hohes Risiko",
      Violence: "Gewalt / schädlich",
      Extreme: "Extremistischer Inhalt",
    },
    csLevel_severe: "Schwer",
    csLevel_moderate: "Mittel",
    csLevel_mild: "Leicht",
    csKeywordMatch: (m) => `Treffer: „${m}“`,
    csManipType: "Verhaltensmuster",
    csManip_live_tip_payment: "Live-Trinkgeld / Aufladung (Streaming-Monetarisierung).",
    csManip_urgency_membership: "Dringende Mitgliedschaft / Paywall-Dringlichkeit.",
    csManip_live_commerce_urgency: "Kurzvideo-Shop plus Schnäppchen-/Countdown-Druck.",
    csManip_live_fan_payment: "Fanclub-/Badge-Hinweise mit bezahlten Coins oder Aufladung.",
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
