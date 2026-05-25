// 引用可信度：静态低可信域名库（v1.5+）
// 数据来源：OpenSources (CC BY 4.0)、Media Bias/Fact Check、iffy.news (MIT)
// 仅作 caution 级启发式提示，不代表事实判决。

const CITATION_LOW_TRUST_DB = {};

(function seedCitationLowTrust() {
  const groups = [

    // ── 薄内容 / 内容农场 / 聚合转载 ──────────────────────────────────────────
    {
      reasonKey: "aiCitationReason_thinContent",
      domains: [
        // 英文内容农场 / SEO 聚合
        "answers.com", "ehow.com", "hubpages.com", "ezinearticles.com",
        "articlesbase.com", "selfgrowth.com", "buzzle.com", "triond.com",
        "allvoices.com", "wisegeek.com", "cgaa.org", "reference.com",
        "suite101.com", "helium.com",
        // 病毒式薄内容
        "viralnova.com", "shareably.net", "distractify.com", "providr.com",
        "auntyacid.com", "mediamass.net", "mediatakeout.com",
        // 中文内容农场 / 聚合平台
        "baijiahao.baidu.com", "haokan.baidu.com", "kknews.cc", "360doc.com",
        "kuaihao.360.cn",
      ],
    },

    // ── 阴谋论 / 虚假信息 / 宣传媒体 ──────────────────────────────────────────
    {
      reasonKey: "aiCitationReason_conspiracy",
      domains: [
        // 高流量阴谋论网站（OpenSources conspiracy / MBFC Low Credibility）
        "infowars.com", "prisonplanet.com", "prisonplanet.tv",
        "globalresearch.ca", "activistpost.com", "abovetopsecret.com",
        "godlikeproductions.com", "rumormillnews.com", "rense.com",
        "whatreallyhappened.com", "21stcenturywire.com", "dcclothesline.com",
        "henrymakow.com", "nomorefakenews.com", "nowtheendbegins.com",
        "thedailysheeple.com", "theeconomiccollapseblog.com",
        "theeventchronicle.com", "thelibertybeacon.com",
        "themindunleashed.com", "themindunleashed.org",
        "worldtruth.tv", "x22report.com", "zerohedge.com",
        "endoftheamericandream.com", "fellowshipoftheminds.com",
        "informationclearinghouse.info", "investmentresearchdynamics.com",
        "neonnettle.com", "thegoldwater.com",
        "alt-market.com", "americanfreepress.net", "canadafreepress.com",
        "corbettreport.com", "humansarefree.com",
        "pamelageller.com", "shoebat.com", "jihadwatch.org",
        "govtslaves.info", "stevequayle.com",
        "freedomoutpost.com", "thefreepatriot.org",
        "libertyblitzkrieg.com", "intellihub.com",
        "naturalnews.net", "blacklistednews.com", "disclose.tv",
        "wnd.com", "conspiracyplanet.com", "vigilantcitizen.com",
        // 已知国家背景虚假信息媒体
        "sputniknews.com", "rt.com", "presstv.com",
        "southfront.org", "strategic-culture.org", "abna24.com",
        // 仇恨内容（OpenSources hate）
        "dailystormer.com", "davidduke.com", "amren.com",
        "nationalvanguard.org", "barenakedislam.com", "eutimes.net",
        "gatesofvienna.net", "barnesreview.org", "therightstuff.biz",
        "ihr.org", "whitepower.com",
        // 极端偏向 / 不可靠来源
        "thepoliticalinsider.com", "allnewspipeline.com",
        "anonhq.com", "anonnews.co", "theantimedia.org",
        "madworldnews.com", "coasttocoastam.com",
        // 其他来源有记录的阴谋论聚合
        "investmentwatchblog.com",
        "beforeitsnews.com",
      ],
    },

    // ── 伪科学 / 健康虚假信息 ──────────────────────────────────────────────────
    {
      reasonKey: "aiCitationReason_pseudoscience",
      domains: [
        // 反疫苗 / 医疗虚假信息（MBFC Low Credibility / iffy.news）
        "mercola.com", "naturalnews.com", "healthimpactnews.com",
        "childrenshealthdefense.org", "greenmedinfo.com",
        "thetruthaboutcancer.com", "cancertutor.com",
        "thehealthyhomeeconomist.com", "responsibletechnology.org",
        "healthnutnews.com", "naturalblaze.com", "preventdisease.com",
        "naturalsociety.com", "realfarmacy.com", "drsircus.com",
        "modernalternativemama.com", "theheartysoul.com",
        "organicconsumers.org",
        // 化学阴谋 / 替代医学
        "geoengineeringwatch.org", "foodbabe.com",
        // 新纪元 / 意识形态伪科学
        "wakeupworld.com", "educateinspirechange.org",
        "spiritscienceandmetaphysics.com", "spiritscience.net",
        "collective-evolution.com", "in5d.com",
        "consciousreminder.com", "powerofpositivity.com",
        "trueactivist.com", "ewao.com",
      ],
    },

    // ── 已知编造 / 严重误导性新闻 ────────────────────────────────────────────
    {
      reasonKey: "aiCitationReason_fakenews",
      domains: [
        // 已知创作完全虚构新闻（OpenSources fake）
        "worldnewsdailyreport.com", "nationalreport.net", "empirenews.net",
        "huzlers.com", "prntly.com", "realnewsrightnow.com",
        "wtoe5news.com", "now8news.com", "stormcloudsgathering.com",
        "newslo.com", "denverguardian.com", "weeklyworldnews.com",
        "channel-7-news.com", "channel18news.com",
        // 伪装成主流媒体的克隆站
        "abcnews.com.co", "abcnewsgo.co", "cbsnews.com.co", "nbc.com.co",
        "usatoday.com.co", "washingtonpost.com.co", "drudgereport.com.co",
        "msnbc.website", "buzzfeedusa.com",
        // 严重虚假政治信息（OpenSources fake，有记录）
        "yournewswire.com", "newspunch.com",
        "conservativedailypost.com", "thelastgreatstand.com",
        "usanewsflash.com", "americannews.com", "downtrend.com",
        "pakalertpress.com", "thecommonsenseshow.com",
        // 讽刺类——AI 常无法识别（citingとして误用）
        "clickhole.com", "babylonbee.com", "duffelblog.com",
      ],
    },

  ];

  for (const { reasonKey, domains } of groups) {
    for (const d of domains) {
      CITATION_LOW_TRUST_DB[d.toLowerCase()] = { reasonKey };
    }
  }
})();

/**
 * 命中静态低可信引用列表（含父域名后缀匹配）
 * @returns {{ reasonKey: string } | null}
 */
function matchCitationLowTrust(hostname) {
  const clean = String(hostname || "")
    .replace(/^www\./, "")
    .toLowerCase();

  const lookup = (host) => CITATION_LOW_TRUST_DB[host];

  let hit = lookup(clean);
  if (hit) return hit;

  const parts = clean.split(".");
  for (let i = 1; i < parts.length - 1; i++) {
    const parent = parts.slice(i).join(".");
    hit = lookup(parent);
    if (hit) return hit;
  }
  return null;
}
