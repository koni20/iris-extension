// 追踪器数据库
// 数据来源：DuckDuckGo Tracker Radar + Disconnect.me + EasyPrivacy（精选子集）
// 每条记录：domain → { category, company, plain }
// plain: 给普通用户看的一句话解释

const TRACKER_DB = {
  // ── 广告网络 ────────────────────────────────────────────────────────────────
  "doubleclick.net":       { category: "Advertising", company: "Google",       plain: "Google's ad network, used to show you targeted ads across websites." },
  "googlesyndication.com": { category: "Advertising", company: "Google",       plain: "Delivers Google ads and tracks ad performance." },
  "googleadservices.com":  { category: "Advertising", company: "Google",       plain: "Measures whether you click ads and what you buy afterward." },
  "adnxs.com":             { category: "Advertising", company: "Xandr",        plain: "A major ad exchange that builds profiles based on your browsing." },
  "criteo.com":            { category: "Advertising", company: "Criteo",        plain: "Tracks products you viewed to show retargeted ads elsewhere." },
  "criteo.net":            { category: "Advertising", company: "Criteo",        plain: "Tracks products you viewed to show retargeted ads elsewhere." },
  "rubiconproject.com":    { category: "Advertising", company: "Rubicon",       plain: "An ad marketplace that sells access to your attention." },
  "pubmatic.com":          { category: "Advertising", company: "PubMatic",      plain: "Auctions your ad impressions in real time." },
  "openx.net":             { category: "Advertising", company: "OpenX",         plain: "Sells ad space to the highest bidder using your profile." },
  "taboola.com":           { category: "Advertising", company: "Taboola",       plain: "The 'recommended content' widget that tracks your interests." },
  "outbrain.com":          { category: "Advertising", company: "Outbrain",      plain: "Tracks reading behavior to recommend (and profit from) content." },
  "adsrvr.org":            { category: "Advertising", company: "The Trade Desk", plain: "Buys and places ads using your browsing data." },
  "turn.com":              { category: "Advertising", company: "Amobee",         plain: "Uses behavioral data to target ads across devices." },
  "moatads.com":           { category: "Advertising", company: "Oracle Moat",    plain: "Tracks whether you actually saw an ad (viewability measurement)." },
  "advertising.com":       { category: "Advertising", company: "Oath/Verizon",  plain: "Verizon's ad network, tracks browsing for targeting." },
  "adtechus.com":          { category: "Advertising", company: "Oath/Verizon",  plain: "Part of Verizon's advertising ecosystem." },
  "casalemedia.com":       { category: "Advertising", company: "Index Exchange", plain: "A programmatic ad marketplace using your browsing history." },
  "smartadserver.com":     { category: "Advertising", company: "Smart",          plain: "Tracks and targets ads based on browsing behavior." },
  "lijit.com":             { category: "Advertising", company: "Sovrn",          plain: "Ad network that tracks reading patterns." },
  "sovrn.com":             { category: "Advertising", company: "Sovrn",          plain: "Ad network that builds interest profiles from your reading." },

  // ── 分析统计 ────────────────────────────────────────────────────────────────
  "google-analytics.com":  { category: "Analytics",   company: "Google",        plain: "Tracks every page you visit, how long you stay, and what you click." },
  "googletagmanager.com":  { category: "Analytics",   company: "Google",        plain: "A container that can load any number of tracking tools." },
  "googletagservices.com": { category: "Analytics",   company: "Google",        plain: "Coordinates multiple Google tracking services." },
  "hotjar.com":            { category: "Analytics",   company: "Hotjar",        plain: "Records your mouse movements, scrolls, and clicks as a video." },
  "fullstory.com":         { category: "Analytics",   company: "FullStory",     plain: "Records exactly what you do on the page, keystroke by keystroke." },
  "mixpanel.com":          { category: "Analytics",   company: "Mixpanel",      plain: "Tracks detailed user behavior and builds user profiles." },
  "segment.com":           { category: "Analytics",   company: "Segment",       plain: "Collects and forwards your data to dozens of other services." },
  "segment.io":            { category: "Analytics",   company: "Segment",       plain: "Collects and forwards your data to dozens of other services." },
  "amplitude.com":         { category: "Analytics",   company: "Amplitude",     plain: "Tracks how you use the product, page by page." },
  "heap.io":               { category: "Analytics",   company: "Heap",          plain: "Automatically records every interaction on the page." },
  "newrelic.com":          { category: "Analytics",   company: "New Relic",     plain: "Monitors app performance — may collect browser and user data." },
  "clarity.ms":            { category: "Analytics",   company: "Microsoft",     plain: "Microsoft's session recording tool — records your interactions." },
  "quantserve.com":        { category: "Analytics",   company: "Quantcast",     plain: "Measures audience demographics and browsing patterns." },
  "scorecardresearch.com": { category: "Analytics",   company: "Comscore",      plain: "Measures website audiences — your visit is counted and profiled." },
  "chartbeat.com":         { category: "Analytics",   company: "Chartbeat",     plain: "Tracks real-time reading behavior for news publishers." },
  "parsely.com":           { category: "Analytics",   company: "Parse.ly",      plain: "Analyzes what content you read and for how long." },
  "mxpnl.com":             { category: "Analytics",   company: "Mixpanel",      plain: "Tracks detailed user behavior and builds profiles." },

  // ── 社交追踪 ────────────────────────────────────────────────────────────────
  "facebook.com":          { category: "Social",      company: "Meta",          plain: "Facebook tracks you across the web even when you're not on Facebook." },
  "facebook.net":          { category: "Social",      company: "Meta",          plain: "Loads Facebook widgets that track your presence on this site." },
  "connect.facebook.net":  { category: "Social",      company: "Meta",          plain: "The Facebook 'Like' button tracks you even if you don't click it." },
  "twitter.com":           { category: "Social",      company: "X (Twitter)",   plain: "Twitter's tracking pixel records your visit and associates it with your account." },
  "t.co":                  { category: "Social",      company: "X (Twitter)",   plain: "Twitter's URL shortener used to track link clicks." },
  "linkedin.com":          { category: "Social",      company: "LinkedIn",      plain: "LinkedIn's insight tag tracks professionals for ad targeting." },
  "snap.licdn.com":        { category: "Social",      company: "LinkedIn",      plain: "LinkedIn tracks this page visit for advertising purposes." },
  "pinterest.com":         { category: "Social",      company: "Pinterest",     plain: "Pinterest's tag tracks what you view for ad retargeting." },
  "tiktok.com":            { category: "Social",      company: "TikTok",        plain: "TikTok tracks your browsing behavior outside of TikTok." },
  "ads-twitter.com":       { category: "Social",      company: "X (Twitter)",   plain: "Tracks conversions from Twitter ads." },

  // ── 设备指纹 ────────────────────────────────────────────────────────────────
  "fingerprintjs.com":     { category: "Fingerprinting", company: "FingerprintJS", plain: "Identifies your device uniquely without cookies — hard to block." },
  "fingerprint.com":       { category: "Fingerprinting", company: "FingerprintJS", plain: "Creates a unique ID for your device using browser characteristics." },
  "iovation.com":          { category: "Fingerprinting", company: "TransUnion",    plain: "Identifies your device for fraud detection — also used in tracking." },
  "threatmetrix.com":      { category: "Fingerprinting", company: "LexisNexis",    plain: "Device fingerprinting used for 'fraud prevention' — collects extensive data." },
  "kochava.com":           { category: "Fingerprinting", company: "Kochava",       plain: "Mobile and web fingerprinting for cross-device tracking." },

  // ── 数据经纪商 ───────────────────────────────────────────────────────────────
  "acuityads.com":         { category: "Data Broker",  company: "AcuityAds",    plain: "Buys and sells audience data — your browsing habits are the product." },
  "bluekai.com":           { category: "Data Broker",  company: "Oracle",        plain: "Oracle's data marketplace — aggregates data from thousands of sources." },
  "krxd.net":              { category: "Data Broker",  company: "Salesforce",    plain: "Salesforce's data platform that profiles users across the web." },
  "exelator.com":          { category: "Data Broker",  company: "Nielsen",       plain: "Collects and sells behavioral data for ad targeting." },
  "demdex.net":            { category: "Data Broker",  company: "Adobe",         plain: "Adobe's data marketplace — shares your profile across their clients." },
  "everesttech.net":       { category: "Data Broker",  company: "Adobe",         plain: "Part of Adobe's ad tech ecosystem." },
  "adsymptotic.com":       { category: "Data Broker",  company: "Oracle",        plain: "Aggregates data to build detailed consumer profiles." },

  // ── 用户行为录制 ─────────────────────────────────────────────────────────────
  "logrocket.com":         { category: "Session Recording", company: "LogRocket",  plain: "Records your entire session including what you type in forms." },
  "inspectlet.com":        { category: "Session Recording", company: "Inspectlet", plain: "Records mouse movements and clicks as a video replay." },
  "mouseflow.com":         { category: "Session Recording", company: "Mouseflow",  plain: "Records where you click, move, and scroll on the page." },
  "luckyorange.com":       { category: "Session Recording", company: "Lucky Orange", plain: "Live chat + session recording that watches your every move." },
  "smartlook.com":         { category: "Session Recording", company: "Smartlook",  plain: "Records your interactions and builds heatmaps of user behavior." },

  // ── 客户支持工具（附带追踪）─────────────────────────────────────────────────
  "intercom.io":           { category: "Support/CRM",  company: "Intercom",      plain: "Chat widget that also tracks your behavior and enriches your profile." },
  "intercom.com":          { category: "Support/CRM",  company: "Intercom",      plain: "Tracks page views and user behavior for CRM and support purposes." },
  "zendesk.com":           { category: "Support/CRM",  company: "Zendesk",       plain: "Customer support tool that records interaction data." },
  "hubspot.com":           { category: "Support/CRM",  company: "HubSpot",       plain: "Tracks your visits to connect web behavior with CRM records." },
  "hubspot.net":           { category: "Support/CRM",  company: "HubSpot",       plain: "HubSpot's tracking pixel — associates your visit with CRM data." },
  "marketo.net":           { category: "Support/CRM",  company: "Adobe Marketo", plain: "Marketing automation that tracks you for lead generation." },
  "pardot.com":            { category: "Support/CRM",  company: "Salesforce",    plain: "Salesforce marketing tool that tracks visitor behavior for sales teams." }
};

// 类别对应的风险等级和颜色
const CATEGORY_META = {
  "Advertising":        { risk: "medium", color: "#f59e0b", icon: "📢" },
  "Analytics":          { risk: "medium", color: "#3b82f6", icon: "📊" },
  "Social":             { risk: "medium", color: "#8b5cf6", icon: "👤" },
  "Fingerprinting":     { risk: "high",   color: "#ef4444", icon: "🔍" },
  "Data Broker":        { risk: "high",   color: "#ef4444", icon: "🗄️" },
  "Session Recording":  { risk: "high",   color: "#ef4444", icon: "🎥" },
  "Support/CRM":        { risk: "low",    color: "#6b7280", icon: "💬" }
};

// 根据追踪器数量估算百分位（基于真实网站统计数据的近似值）
function getPercentile(trackerCount) {
  if (trackerCount === 0) return 5;
  if (trackerCount <= 2)  return 20;
  if (trackerCount <= 5)  return 40;
  if (trackerCount <= 10) return 60;
  if (trackerCount <= 20) return 78;
  if (trackerCount <= 35) return 89;
  return 96;
}

// ── AI 服务域名数据库 ──────────────────────────────────────────────────────────
// 检测网页是否在向 AI 服务发送数据（你的输入可能被 AI 处理）
const AI_SERVICES_DB = {
  // OpenAI
  "api.openai.com": {
    company: "OpenAI",
    model: "GPT series",
    risk: "high",
    plain_en: "Your input on this page may be sent to OpenAI's servers and processed by GPT models.",
    plain_zh: "你在此页面的输入内容可能被发送到 OpenAI 服务器，由 GPT 模型处理。",
    plain_ja: "このページへの入力がOpenAIのサーバーに送信され、GPTモデルで処理される可能性があります。",
    plain_es: "Tu entrada en esta página puede enviarse a los servidores de OpenAI y procesarse con modelos GPT.",
    plain_fr: "Votre saisie sur cette page peut être envoyée aux serveurs d'OpenAI et traitée par des modèles GPT.",
    plain_de: "Ihre Eingabe auf dieser Seite kann an OpenAI-Server gesendet und von GPT-Modellen verarbeitet werden."
  },
  "oaiusercontent.com": {
    company: "OpenAI",
    model: "GPT series",
    risk: "medium",
    plain_en: "This site is using OpenAI infrastructure for content generation or processing.",
    plain_zh: "该网站正在使用 OpenAI 基础设施生成或处理内容。",
    plain_ja: "このサイトはコンテンツ生成または処理にOpenAIインフラを使用しています。",
    plain_es: "Este sitio usa la infraestructura de OpenAI para generar o procesar contenido.",
    plain_fr: "Ce site utilise l'infrastructure OpenAI pour générer ou traiter du contenu.",
    plain_de: "Diese Seite verwendet OpenAI-Infrastruktur zur Inhaltsgenerierung oder -verarbeitung."
  },
  // Anthropic / Claude
  "api.anthropic.com": {
    company: "Anthropic",
    model: "Claude",
    risk: "high",
    plain_en: "Your input may be processed by Anthropic's Claude AI model.",
    plain_zh: "你的输入内容可能由 Anthropic 的 Claude AI 模型处理。",
    plain_ja: "あなたの入力がAnthropicのClaude AIモデルによって処理される可能性があります。",
    plain_es: "Tu entrada puede ser procesada por el modelo Claude AI de Anthropic.",
    plain_fr: "Votre saisie peut être traitée par le modèle Claude AI d'Anthropic.",
    plain_de: "Ihre Eingabe kann vom Claude AI-Modell von Anthropic verarbeitet werden."
  },
  // Google AI
  "generativelanguage.googleapis.com": {
    company: "Google",
    model: "Gemini",
    risk: "high",
    plain_en: "Your input may be sent to Google's Gemini AI for processing.",
    plain_zh: "你的输入内容可能被发送至 Google Gemini AI 进行处理。",
    plain_ja: "あなたの入力がGoogleのGemini AIに送信される可能性があります。",
    plain_es: "Tu entrada puede enviarse al AI Gemini de Google para procesamiento.",
    plain_fr: "Votre saisie peut être envoyée à Google Gemini AI pour traitement.",
    plain_de: "Ihre Eingabe kann zur Verarbeitung an Googles Gemini AI gesendet werden."
  },
  "aiplatform.googleapis.com": {
    company: "Google",
    model: "Vertex AI",
    risk: "high",
    plain_en: "This page uses Google's Vertex AI platform — your data may be processed by Google AI.",
    plain_zh: "此页面使用 Google Vertex AI 平台，你的数据可能被 Google AI 处理。",
    plain_ja: "このページはGoogle Vertex AIを使用しており、データがGoogle AIで処理される可能性があります。",
    plain_es: "Esta página usa la plataforma Vertex AI de Google — tus datos pueden ser procesados por Google AI.",
    plain_fr: "Cette page utilise la plateforme Vertex AI de Google — vos données peuvent être traitées par Google AI.",
    plain_de: "Diese Seite verwendet Googles Vertex AI-Plattform — Ihre Daten können von Google AI verarbeitet werden."
  },
  // Microsoft / Azure OpenAI
  "openai.azure.com": {
    company: "Microsoft Azure",
    model: "Azure OpenAI",
    risk: "high",
    plain_en: "Your input may be processed by Microsoft Azure's OpenAI service.",
    plain_zh: "你的输入内容可能由 Microsoft Azure 的 OpenAI 服务处理。",
    plain_ja: "あなたの入力がMicrosoft AzureのOpenAIサービスで処理される可能性があります。",
    plain_es: "Tu entrada puede procesarse con el servicio Azure OpenAI de Microsoft.",
    plain_fr: "Votre saisie peut être traitée par le service Azure OpenAI de Microsoft.",
    plain_de: "Ihre Eingabe kann vom Azure OpenAI-Dienst von Microsoft verarbeitet werden."
  },
  // Mistral
  "api.mistral.ai": {
    company: "Mistral AI",
    model: "Mistral",
    risk: "high",
    plain_en: "This page connects to Mistral AI — your input may be processed by their models.",
    plain_zh: "此页面连接至 Mistral AI，你的输入可能由其模型处理。",
    plain_ja: "このページはMistral AIに接続しており、入力がモデルで処理される可能性があります。",
    plain_es: "Esta página conecta con Mistral AI — tu entrada puede procesarse con sus modelos.",
    plain_fr: "Cette page se connecte à Mistral AI — votre saisie peut être traitée par leurs modèles.",
    plain_de: "Diese Seite verbindet sich mit Mistral AI — Ihre Eingabe kann von deren Modellen verarbeitet werden."
  },
  // Groq
  "api.groq.com": {
    company: "Groq",
    model: "Groq LPU",
    risk: "high",
    plain_en: "This page uses Groq's ultra-fast AI inference — your input is being sent to Groq's servers.",
    plain_zh: "此页面使用 Groq 的超快速 AI 推理服务，你的输入被发送至 Groq 服务器。",
    plain_ja: "このページはGroqの超高速AI推論を使用しており、入力がGroqサーバーに送信されています。",
    plain_es: "Esta página usa la inferencia de IA de Groq — tu entrada se envía a sus servidores.",
    plain_fr: "Cette page utilise l'inférence IA ultra-rapide de Groq — votre saisie est envoyée aux serveurs Groq.",
    plain_de: "Diese Seite nutzt Groqs ultraschnelle KI-Inferenz — Ihre Eingabe wird an Groq-Server gesendet."
  },
  // Perplexity
  "api.perplexity.ai": {
    company: "Perplexity AI",
    model: "Perplexity",
    risk: "high",
    plain_en: "Your input may be processed by Perplexity AI's search and answer models.",
    plain_zh: "你的输入可能由 Perplexity AI 的搜索和问答模型处理。",
    plain_ja: "あなたの入力がPerplexity AIの検索・回答モデルで処理される可能性があります。",
    plain_es: "Tu entrada puede procesarse con los modelos de búsqueda de Perplexity AI.",
    plain_fr: "Votre saisie peut être traitée par les modèles de Perplexity AI.",
    plain_de: "Ihre Eingabe kann von den Modellen von Perplexity AI verarbeitet werden."
  },
  // Cohere
  "api.cohere.ai": {
    company: "Cohere",
    model: "Command",
    risk: "high",
    plain_en: "This page sends data to Cohere's AI — your input may be used for text generation.",
    plain_zh: "此页面向 Cohere AI 发送数据，你的输入可能用于文本生成。",
    plain_ja: "このページはCohere AIにデータを送信しており、入力がテキスト生成に使用される可能性があります。",
    plain_es: "Esta página envía datos a Cohere AI — tu entrada puede usarse para generación de texto.",
    plain_fr: "Cette page envoie des données à Cohere AI — votre saisie peut être utilisée pour la génération de texte.",
    plain_de: "Diese Seite sendet Daten an Cohere AI — Ihre Eingabe kann für die Texterstellung verwendet werden."
  },
  // Hugging Face
  "huggingface.co": {
    company: "Hugging Face",
    model: "Various",
    risk: "medium",
    plain_en: "This page uses Hugging Face's AI platform — data may be processed by open-source models.",
    plain_zh: "此页面使用 Hugging Face AI 平台，数据可能由开源模型处理。",
    plain_ja: "このページはHugging FaceのAIプラットフォームを使用しており、データがオープンソースモデルで処理される可能性があります。",
    plain_es: "Esta página usa la plataforma AI de Hugging Face — los datos pueden procesarse con modelos de código abierto.",
    plain_fr: "Cette page utilise la plateforme AI de Hugging Face — les données peuvent être traitées par des modèles open-source.",
    plain_de: "Diese Seite verwendet Hugging Faces KI-Plattform — Daten können von Open-Source-Modellen verarbeitet werden."
  },
  // Replicate
  "api.replicate.com": {
    company: "Replicate",
    model: "Various",
    risk: "medium",
    plain_en: "This page uses Replicate to run AI models in the cloud — your data is sent to their servers.",
    plain_zh: "此页面使用 Replicate 在云端运行 AI 模型，你的数据被发送至其服务器。",
    plain_ja: "このページはReplicateを使用してクラウドでAIモデルを実行しており、データがサーバーに送信されます。",
    plain_es: "Esta página usa Replicate para ejecutar modelos AI en la nube — tus datos se envían a sus servidores.",
    plain_fr: "Cette page utilise Replicate pour exécuter des modèles AI dans le cloud — vos données sont envoyées à leurs serveurs.",
    plain_de: "Diese Seite verwendet Replicate, um KI-Modelle in der Cloud auszuführen — Ihre Daten werden an deren Server gesendet."
  },
  // Together AI
  "api.together.xyz": {
    company: "Together AI",
    model: "Various open-source",
    risk: "medium",
    plain_en: "This page uses Together AI to run open-source language models on your data.",
    plain_zh: "此页面使用 Together AI 对你的数据运行开源语言模型。",
    plain_ja: "このページはTogether AIを使用してオープンソース言語モデルを実行しています。",
    plain_es: "Esta página usa Together AI para ejecutar modelos de lenguaje de código abierto con tus datos.",
    plain_fr: "Cette page utilise Together AI pour exécuter des modèles de langage open-source sur vos données.",
    plain_de: "Diese Seite verwendet Together AI, um Open-Source-Sprachmodelle auf Ihren Daten auszuführen."
  },
  // ── 中国 AI 厂商 ──────────────────────────────────────────────────────────────

  // DeepSeek（已在全球爆火）
  "api.deepseek.com": {
    company: "DeepSeek",
    model: "DeepSeek-V3 / R1",
    risk: "high",
    plain_en: "Your input may be processed by DeepSeek's AI models, developed in China.",
    plain_zh: "你的输入内容可能由深度求索（DeepSeek）的 AI 模型处理，该公司位于中国。",
    plain_ja: "あなたの入力が中国のDeepSeekのAIモデルで処理される可能性があります。",
    plain_es: "Tu entrada puede procesarse con los modelos AI de DeepSeek, desarrollados en China.",
    plain_fr: "Votre saisie peut être traitée par les modèles AI de DeepSeek, développés en Chine.",
    plain_de: "Ihre Eingabe kann von DeepSeeks KI-Modellen verarbeitet werden, die in China entwickelt wurden."
  },

  // 阿里云 通义千问（Qwen）
  "dashscope.aliyuncs.com": {
    company: "Alibaba Cloud",
    model: "Qwen (通义千问)",
    risk: "high",
    plain_en: "Your input may be sent to Alibaba Cloud's Qwen AI platform.",
    plain_zh: "你的输入内容可能被发送至阿里云通义千问 AI 平台。",
    plain_ja: "あなたの入力がアリババクラウドのQwen AIプラットフォームに送信される可能性があります。",
    plain_es: "Tu entrada puede enviarse a la plataforma AI Qwen de Alibaba Cloud.",
    plain_fr: "Votre saisie peut être envoyée à la plateforme AI Qwen d'Alibaba Cloud.",
    plain_de: "Ihre Eingabe kann an Alibaba Clouds Qwen AI-Plattform gesendet werden."
  },

  // 百度 文心一言（ERNIE）
  "aip.baidubce.com": {
    company: "Baidu",
    model: "ERNIE (文心一言)",
    risk: "high",
    plain_en: "Your input may be processed by Baidu's ERNIE AI model.",
    plain_zh: "你的输入内容可能由百度文心一言 AI 模型处理。",
    plain_ja: "あなたの入力が百度のERNIE AIモデルで処理される可能性があります。",
    plain_es: "Tu entrada puede procesarse con el modelo ERNIE AI de Baidu.",
    plain_fr: "Votre saisie peut être traitée par le modèle ERNIE AI de Baidu.",
    plain_de: "Ihre Eingabe kann vom ERNIE AI-Modell von Baidu verarbeitet werden."
  },
  "qianfan.baidubce.com": {
    company: "Baidu",
    model: "ERNIE / 千帆大模型",
    risk: "high",
    plain_en: "Your input may be processed by Baidu's Qianfan AI platform.",
    plain_zh: "你的输入内容可能由百度千帆大模型平台处理。",
    plain_ja: "あなたの入力が百度の千帆AIプラットフォームで処理される可能性があります。",
    plain_es: "Tu entrada puede procesarse con la plataforma AI Qianfan de Baidu.",
    plain_fr: "Votre saisie peut être traitée par la plateforme AI Qianfan de Baidu.",
    plain_de: "Ihre Eingabe kann von Baidus Qianfan AI-Plattform verarbeitet werden."
  },

  // 腾讯 混元
  "hunyuan.tencentcloudapi.com": {
    company: "Tencent",
    model: "Hunyuan (混元)",
    risk: "high",
    plain_en: "Your input may be processed by Tencent's Hunyuan AI model.",
    plain_zh: "你的输入内容可能由腾讯混元 AI 大模型处理。",
    plain_ja: "あなたの入力がテンセントのHunyuan AIモデルで処理される可能性があります。",
    plain_es: "Tu entrada puede procesarse con el modelo AI Hunyuan de Tencent.",
    plain_fr: "Votre saisie peut être traitée par le modèle AI Hunyuan de Tencent.",
    plain_de: "Ihre Eingabe kann vom Hunyuan AI-Modell von Tencent verarbeitet werden."
  },

  // 字节跳动 豆包 / 火山引擎
  "ark.cn-beijing.volces.com": {
    company: "ByteDance",
    model: "Doubao (豆包)",
    risk: "high",
    plain_en: "Your input may be processed by ByteDance's Doubao AI via Volcengine.",
    plain_zh: "你的输入内容可能通过火山引擎由字节跳动豆包 AI 处理。",
    plain_ja: "あなたの入力がバイトダンスのDubao AIで処理される可能性があります。",
    plain_es: "Tu entrada puede procesarse con el AI Doubao de ByteDance vía Volcengine.",
    plain_fr: "Votre saisie peut être traitée par l'AI Doubao de ByteDance via Volcengine.",
    plain_de: "Ihre Eingabe kann von ByteDances Doubao AI über Volcengine verarbeitet werden."
  },
  "maas-api.ml-platform-cn-beijing.volces.com": {
    company: "ByteDance",
    model: "Volcengine MaaS",
    risk: "high",
    plain_en: "This page uses ByteDance's Volcengine AI platform for model inference.",
    plain_zh: "此页面使用字节跳动火山引擎 AI 平台进行模型推理。",
    plain_ja: "このページはバイトダンスのVolcengine AIプラットフォームを使用しています。",
    plain_es: "Esta página usa la plataforma AI Volcengine de ByteDance para inferencia de modelos.",
    plain_fr: "Cette page utilise la plateforme AI Volcengine de ByteDance pour l'inférence de modèles.",
    plain_de: "Diese Seite verwendet ByteDances Volcengine AI-Plattform für Modellinferenz."
  },

  // 智谱 AI（GLM / ChatGLM）
  "open.bigmodel.cn": {
    company: "Zhipu AI (智谱AI)",
    model: "GLM / ChatGLM",
    risk: "high",
    plain_en: "Your input may be processed by Zhipu AI's GLM large language model.",
    plain_zh: "你的输入内容可能由智谱 AI 的 GLM 大语言模型处理。",
    plain_ja: "あなたの入力が智谱AIのGLM言語モデルで処理される可能性があります。",
    plain_es: "Tu entrada puede procesarse con el modelo GLM de Zhipu AI.",
    plain_fr: "Votre saisie peut être traitée par le modèle GLM de Zhipu AI.",
    plain_de: "Ihre Eingabe kann vom GLM-Modell von Zhipu AI verarbeitet werden."
  },

  // 月之暗面 Kimi
  "api.moonshot.cn": {
    company: "Moonshot AI (月之暗面)",
    model: "Kimi",
    risk: "high",
    plain_en: "Your input may be processed by Moonshot AI's Kimi model, known for long-context understanding.",
    plain_zh: "你的输入内容可能由月之暗面的 Kimi 模型处理，该模型擅长长文本理解。",
    plain_ja: "あなたの入力が月之暗面のKimiモデルで処理される可能性があります。",
    plain_es: "Tu entrada puede procesarse con el modelo Kimi de Moonshot AI.",
    plain_fr: "Votre saisie peut être traitée par le modèle Kimi de Moonshot AI.",
    plain_de: "Ihre Eingabe kann vom Kimi-Modell von Moonshot AI verarbeitet werden."
  },

  // 百川 AI
  "api.baichuan-ai.com": {
    company: "Baichuan AI (百川智能)",
    model: "Baichuan",
    risk: "high",
    plain_en: "Your input may be processed by Baichuan AI's language models.",
    plain_zh: "你的输入内容可能由百川智能的语言模型处理。",
    plain_ja: "あなたの入力が百川AIの言語モデルで処理される可能性があります。",
    plain_es: "Tu entrada puede procesarse con los modelos de lenguaje de Baichuan AI.",
    plain_fr: "Votre saisie peut être traitée par les modèles de langage de Baichuan AI.",
    plain_de: "Ihre Eingabe kann von den Sprachmodellen von Baichuan AI verarbeitet werden."
  },

  // MiniMax（稀宇科技）
  "api.minimax.chat": {
    company: "MiniMax (稀宇科技)",
    model: "abab series",
    risk: "high",
    plain_en: "Your input may be sent to MiniMax's AI platform for processing.",
    plain_zh: "你的输入内容可能被发送至稀宇科技（MiniMax）的 AI 平台处理。",
    plain_ja: "あなたの入力がMiniMaxのAIプラットフォームに送信される可能性があります。",
    plain_es: "Tu entrada puede enviarse a la plataforma AI de MiniMax para su procesamiento.",
    plain_fr: "Votre saisie peut être envoyée à la plateforme AI de MiniMax pour traitement.",
    plain_de: "Ihre Eingabe kann zur Verarbeitung an MiniMaxs AI-Plattform gesendet werden."
  },

  // 科大讯飞 星火
  "spark-api.xf-yun.com": {
    company: "iFlytek (科大讯飞)",
    model: "Spark (星火)",
    risk: "high",
    plain_en: "Your input may be processed by iFlytek's Spark AI model.",
    plain_zh: "你的输入内容可能由科大讯飞星火 AI 大模型处理。",
    plain_ja: "あなたの入力が科大訊飛のSpark AIモデルで処理される可能性があります。",
    plain_es: "Tu entrada puede procesarse con el modelo AI Spark de iFlytek.",
    plain_fr: "Votre saisie peut être traitée par le modèle AI Spark d'iFlytek.",
    plain_de: "Ihre Eingabe kann vom Spark AI-Modell von iFlytek verarbeitet werden."
  },
  "spark-api-open.xf-yun.com": {
    company: "iFlytek (科大讯飞)",
    model: "Spark (星火) Open",
    risk: "high",
    plain_en: "Your input may be processed by iFlytek's Spark AI open platform.",
    plain_zh: "你的输入内容可能由科大讯飞星火认知大模型开放平台处理。",
    plain_ja: "あなたの入力が科大訊飛のSpark AIオープンプラットフォームで処理される可能性があります。",
    plain_es: "Tu entrada puede procesarse en la plataforma abierta Spark AI de iFlytek.",
    plain_fr: "Votre saisie peut être traitée par la plateforme ouverte Spark AI d'iFlytek.",
    plain_de: "Ihre Eingabe kann von iFlyTeks offener Spark AI-Plattform verarbeitet werden."
  },

  // 零一万物（01.AI）
  "api.lingyiwanwu.com": {
    company: "01.AI (零一万物)",
    model: "Yi series",
    risk: "high",
    plain_en: "Your input may be processed by 01.AI's Yi large language model.",
    plain_zh: "你的输入内容可能由零一万物的 Yi 大语言模型处理。",
    plain_ja: "あなたの入力が零一万物のYi言語モデルで処理される可能性があります。",
    plain_es: "Tu entrada puede procesarse con el modelo Yi de 01.AI.",
    plain_fr: "Votre saisie peut être traitée par le modèle Yi de 01.AI.",
    plain_de: "Ihre Eingabe kann vom Yi-Modell von 01.AI verarbeitet werden."
  },

  // 商汤 日日新
  "api.sensenova.cn": {
    company: "SenseTime (商汤科技)",
    model: "SenseNova (日日新)",
    risk: "high",
    plain_en: "Your input may be processed by SenseTime's SenseNova AI platform.",
    plain_zh: "你的输入内容可能由商汤科技日日新 AI 大模型处理。",
    plain_ja: "あなたの入力が商汤科技のSenseNova AIプラットフォームで処理される可能性があります。",
    plain_es: "Tu entrada puede procesarse con la plataforma AI SenseNova de SenseTime.",
    plain_fr: "Votre saisie peut être traitée par la plateforme AI SenseNova de SenseTime.",
    plain_de: "Ihre Eingabe kann von SenseTimes SenseNova AI-Plattform verarbeitet werden."
  },

  // Stability AI
  "api.stability.ai": {
    company: "Stability AI",
    model: "Stable Diffusion",
    risk: "medium",
    plain_en: "This page sends data to Stability AI — likely for image generation using your input.",
    plain_zh: "此页面向 Stability AI 发送数据，可能根据你的输入生成图片。",
    plain_ja: "このページはStability AIにデータを送信しており、入力から画像が生成される可能性があります。",
    plain_es: "Esta página envía datos a Stability AI — probablemente para generar imágenes con tu entrada.",
    plain_fr: "Cette page envoie des données à Stability AI — probablement pour la génération d'images.",
    plain_de: "Diese Seite sendet Daten an Stability AI — wahrscheinlich zur Bildgenerierung mit Ihrer Eingabe."
  }
};

// ── AI 服务网站数据库（用户正在访问该 AI 产品本身）─────────────────────────────
// 和 AI_SERVICES_DB 的区别：这里是网站本身就是 AI 产品，不是第三方调用
const AI_WEBSITES_DB = {
  // 国际
  "chat.openai.com":        { company: "OpenAI",            model: "ChatGPT",          risk: "high" },
  "chatgpt.com":            { company: "OpenAI",            model: "ChatGPT",          risk: "high" },
  "claude.ai":              { company: "Anthropic",         model: "Claude",           risk: "high" },
  "gemini.google.com":      { company: "Google",            model: "Gemini",           risk: "high" },
  "bard.google.com":        { company: "Google",            model: "Bard / Gemini",    risk: "high" },
  "copilot.microsoft.com":  { company: "Microsoft",         model: "Copilot",          risk: "high" },
  "bing.com":               { company: "Microsoft",         model: "Bing AI / Copilot",risk: "medium" },
  "perplexity.ai":          { company: "Perplexity AI",     model: "Perplexity",       risk: "high" },
  "poe.com":                { company: "Quora",             model: "Poe (多模型聚合)",  risk: "high" },
  "character.ai":           { company: "Character.AI",      model: "Character AI",     risk: "high" },
  "pi.ai":                  { company: "Inflection AI",     model: "Pi",               risk: "high" },
  "you.com":                { company: "You.com",           model: "YouChat",          risk: "high" },

  // 中国
  "kimi.moonshot.cn":       { company: "Moonshot AI (月之暗面)", model: "Kimi",         risk: "high" },
  "kimi.ai":                { company: "Moonshot AI (月之暗面)", model: "Kimi",         risk: "high" },
  "chat.deepseek.com":      { company: "DeepSeek",          model: "DeepSeek-V3 / R1", risk: "high" },
  "yiyan.baidu.com":        { company: "Baidu",             model: "文心一言 ERNIE",   risk: "high" },
  "tongyi.aliyun.com":      { company: "Alibaba Cloud",     model: "通义千问 Qwen",    risk: "high" },
  "hunyuan.tencent.com":    { company: "Tencent",           model: "混元",             risk: "high" },
  "doubao.com":             { company: "ByteDance",         model: "豆包",             risk: "high" },
  "chatglm.cn":             { company: "Zhipu AI (智谱AI)", model: "ChatGLM",          risk: "high" },
  "bigmodel.cn":            { company: "Zhipu AI (智谱AI)", model: "GLM 系列",         risk: "high" },
  "xinghuo.xfyun.cn":       { company: "iFlytek (科大讯飞)","model": "星火",           risk: "high" },
  "chat.01.ai":             { company: "01.AI (零一万物)",   model: "Yi",              risk: "high" },
  "minimax.chat":           { company: "MiniMax (稀宇科技)", model: "abab 系列",        risk: "high" },
  "sensechat.sensetime.com":{ company: "SenseTime (商汤)",  model: "日日新 SenseNova", risk: "high" },
  "hailuoai.com":           { company: "MiniMax (稀宇科技)", model: "海螺 AI",          risk: "high" },
  "tiangong.cn":            { company: "Kunlun (昆仑万维)", model: "天工 AI",           risk: "high" },
  "baichuan.com":           { company: "Baichuan AI (百川)", model: "百川",            risk: "high" },
};

// 检测当前页面 URL 是否是 AI 服务网站
function matchAIWebsite(url) {
  let hostname;
  try { hostname = new URL(url).hostname.replace(/^www\./, ""); } catch { return null; }
  if (AI_WEBSITES_DB[hostname]) return { domain: hostname, ...AI_WEBSITES_DB[hostname] };
  // 子域名匹配
  const parts = hostname.split(".");
  for (let i = 1; i < parts.length - 1; i++) {
    const parent = parts.slice(i).join(".");
    if (AI_WEBSITES_DB[parent]) return { domain: hostname, ...AI_WEBSITES_DB[parent] };
  }
  return null;
}

// 匹配 AI 服务域名（支持子域名）
function matchAIService(url) {
  let hostname;
  try { hostname = new URL(url).hostname; } catch { return null; }

  // 精确匹配
  if (AI_SERVICES_DB[hostname]) return { domain: hostname, ...AI_SERVICES_DB[hostname] };

  // 子域名匹配（如 xxx.openai.azure.com）
  const parts = hostname.split(".");
  for (let i = 1; i < parts.length - 1; i++) {
    const parent = parts.slice(i).join(".");
    if (AI_SERVICES_DB[parent]) return { domain: hostname, ...AI_SERVICES_DB[parent] };
  }
  return null;
}

// ── AI 品牌钓鱼检测 ────────────────────────────────────────────────────────────
// 每条记录：已知 AI 品牌 → 合法域名白名单 + 触发关键词
const AI_BRAND_WHITELIST = [
  {
    brand: "ChatGPT / OpenAI",
    keywords: ["chatgpt", "openai"],
    legit: ["chat.openai.com", "chatgpt.com", "openai.com", "platform.openai.com", "api.openai.com"],
  },
  {
    brand: "Claude / Anthropic",
    keywords: ["claude", "anthropic"],
    legit: ["claude.ai", "anthropic.com", "api.anthropic.com"],
  },
  {
    brand: "Google Gemini",
    keywords: ["gemini"],
    legit: ["gemini.google.com", "bard.google.com", "aistudio.google.com"],
  },
  {
    brand: "Microsoft Copilot",
    keywords: ["copilot"],
    legit: ["copilot.microsoft.com", "bing.com", "microsoft.com"],
  },
  {
    brand: "Perplexity AI",
    keywords: ["perplexity"],
    legit: ["perplexity.ai", "www.perplexity.ai"],
  },
  {
    brand: "Mistral AI",
    keywords: ["mistral"],
    legit: ["mistral.ai", "chat.mistral.ai", "console.mistral.ai", "api.mistral.ai"],
  },
  {
    brand: "Groq",
    keywords: ["groq"],
    legit: ["groq.com", "console.groq.com", "api.groq.com"],
  },
  {
    brand: "Poe",
    keywords: ["poe.com"],
    legit: ["poe.com"],
  },
  {
    brand: "Character AI",
    keywords: ["characterai", "character.ai"],
    legit: ["character.ai", "beta.character.ai"],
  },
  // ── 中国 AI 品牌 ──
  {
    brand: "Kimi（月之暗面）",
    keywords: ["kimi"],
    legit: ["kimi.moonshot.cn", "kimi.ai", "moonshot.cn"],
  },
  {
    brand: "DeepSeek（深度求索）",
    keywords: ["deepseek"],
    legit: ["chat.deepseek.com", "deepseek.com", "api.deepseek.com"],
  },
  {
    brand: "文心一言（百度）",
    keywords: ["yiyan", "wenxin", "erniebot"],
    legit: ["yiyan.baidu.com", "aistudio.baidu.com"],
  },
  {
    brand: "通义千问（阿里云）",
    keywords: ["tongyi", "qianwen"],
    legit: ["tongyi.aliyun.com", "dashscope.aliyuncs.com"],
  },
  {
    brand: "混元（腾讯）",
    keywords: ["hunyuan"],
    legit: ["hunyuan.tencent.com"],
  },
  {
    brand: "豆包（字节跳动）",
    keywords: ["doubao"],
    legit: ["doubao.com", "www.doubao.com"],
  },
  {
    brand: "ChatGLM / 智谱 AI",
    keywords: ["chatglm", "bigmodel", "zhipuai", "zhipu"],
    legit: ["chatglm.cn", "bigmodel.cn", "open.bigmodel.cn"],
  },
  {
    brand: "星火（科大讯飞）",
    keywords: ["xinghuo", "xfyun"],
    legit: ["xinghuo.xfyun.cn", "spark-api.xf-yun.com"],
  },
  {
    brand: "海螺 / MiniMax",
    keywords: ["minimax", "hailuo"],
    legit: ["minimax.chat", "hailuoai.com", "api.minimax.chat"],
  },
  {
    brand: "天工 AI（昆仑万维）",
    keywords: ["tiangong"],
    legit: ["tiangong.cn", "www.tiangong.cn"],
  },
  {
    brand: "日日新（商汤）",
    keywords: ["sensechat", "sensenova", "sensetime"],
    legit: ["sensechat.sensetime.com", "platform.sensetime.com"],
  },
  {
    brand: "百川 AI",
    keywords: ["baichuan"],
    legit: ["baichuan.com", "www.baichuan.com", "api.baichuan-ai.com"],
  },
];

/**
 * 检测当前 URL 是否是已知 AI 品牌的钓鱼仿冒域名
 * 返回 null = 安全；返回对象 = 疑似钓鱼
 */
function detectAIPhishing(url) {
  let hostname;
  try { hostname = new URL(url).hostname.replace(/^www\./, ""); } catch { return null; }

  // 已知合法 AI 网站 → 不触发
  if (matchAIWebsite(url)) return null;

  // 检查是否包含 AI 品牌关键词，但不在该品牌的合法域名列表里
  for (const entry of AI_BRAND_WHITELIST) {
    for (const kw of entry.keywords) {
      if (hostname.includes(kw)) {
        const isLegit = entry.legit.some(legit =>
          hostname === legit || hostname.endsWith("." + legit)
        );
        if (!isLegit) {
          return {
            brand:            entry.brand,
            spoofedDomain:    hostname,
            legitimateDomains: entry.legit.slice(0, 2), // 最多展示两个
          };
        }
      }
    }
  }
  return null;
}

// 根据综合情况给出风险等级
function getRiskLevel(data) {
  const hasHighRisk = data.trackers.some(t =>
    ["Fingerprinting", "Data Broker", "Session Recording"].includes(t.category)
  );
  const trackerCount = data.trackers.length;
  if (hasHighRisk || trackerCount > 15) return "high";
  if (trackerCount > 5) return "medium";
  if (trackerCount > 0) return "low";
  return "safe";
}
