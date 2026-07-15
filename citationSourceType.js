// 引用来源分类（v1.11）：把 AI 引用的来源归入可可靠识别的类别。
// 只做能确信的分类：官方/学术、主流媒体、论坛/UGC；其余归入 other。
// 不猜测「SEO/营销博客」——光凭域名无法可靠识别，硬猜会误伤正常站点。
// 低可信由 citationLowTrust.js / contentSafety 判定，不在此处。

const CITATION_SOURCE_TYPE_DB = {};

(function seedCitationSourceType() {
  const groups = [
    // ── 主流媒体 / 权威新闻机构 ────────────────────────────────────────────────
    {
      category: "news",
      domains: [
        // 国际
        "reuters.com", "apnews.com", "bbc.com", "bbc.co.uk",
        "nytimes.com", "washingtonpost.com", "theguardian.com",
        "wsj.com", "bloomberg.com", "ft.com", "economist.com",
        "npr.org", "cnn.com", "nbcnews.com", "abcnews.go.com",
        "cbsnews.com", "forbes.com", "time.com", "theatlantic.com",
        "newyorker.com", "politico.com", "axios.com", "vox.com",
        "aljazeera.com", "dw.com", "france24.com", "cnbc.com",
        "nature.com", "scientificamerican.com", "newscientist.com",
        // 中文
        "xinhuanet.com", "news.cn", "people.com.cn", "chinadaily.com.cn",
        "thepaper.cn", "caixin.com", "cctv.com", "cls.cn",
        "yicai.com", "jiemian.com", "21jingji.com", "stcn.com",
        "huanqiu.com", "guancha.cn", "zaobao.com",
        "news.qq.com", "news.sina.com.cn", "news.163.com", "ifeng.com",
        "chinanews.com", "chinanews.com.cn", "ce.cn", "gmw.cn", "youth.cn",
        "36kr.com", "huxiu.com", "nbd.com.cn", "cb.com.cn",
        "cnstock.com", "cs.com.cn", "bjnews.com.cn", "southcn.com",
        "ynet.com", "jfdaily.com", "sina.com.cn", "sohu.com", "163.com",
        "hexun.com", "eastmoney.com", "stcn.com", "infzm.com", "tmtpost.com",
        "china.com", "china.com.cn", "cqnews.net", "chinatimes.com",
        "takungpao.com", "mingpao.com", "hk01.com",
        // 其他亚洲 / 英文媒体
        "scmp.com", "straitstimes.com", "channelnewsasia.com", "bernama.com",
        "japantimes.co.jp", "thehindu.com", "timesofindia.indiatimes.com",
        "abc.net.au", "rte.ie", "cbc.ca",
        // 日文
        "nhk.or.jp", "asahi.com", "yomiuri.co.jp", "nikkei.com",
        "mainichi.jp", "kyodonews.net",
      ],
    },

    // ── 论坛 / 用户生成内容（UGC）──────────────────────────────────────────────
    {
      category: "ugc",
      domains: [
        // 国际
        "reddit.com", "quora.com", "stackoverflow.com",
        "stackexchange.com", "superuser.com", "serverfault.com",
        "askubuntu.com", "news.ycombinator.com", "ycombinator.com",
        "medium.com", "substack.com", "github.com", "gitlab.com",
        "discord.com", "tumblr.com", "blogspot.com", "wordpress.com",
        "x.com", "twitter.com", "facebook.com", "linkedin.com",
        "pinterest.com", "tiktok.com", "youtube.com",
        // 中文
        "zhihu.com", "tieba.baidu.com", "douban.com", "v2ex.com",
        "weibo.com", "xiaohongshu.com", "jianshu.com", "csdn.net",
        "segmentfault.com", "cnblogs.com", "juejin.cn", "oschina.net",
        "bilibili.com", "tianya.cn", "hupu.com", "ruliweb.com",
        "baijiahao.baidu.com", "mp.weixin.qq.com", "toutiao.com",
        // 日文
        "note.com", "hatena.ne.jp", "ameblo.jp", "5ch.net",
        "qiita.com", "togetter.com",
      ],
    },

    // ── 官方 / 学术 / 权威参考（域名级补充；TLD 规则在 classify 内单独处理）────
    {
      category: "official",
      domains: [
        "wikipedia.org", "wikimedia.org", "wiktionary.org",
        "arxiv.org", "sciencedirect.com", "springer.com",
        "ncbi.nlm.nih.gov", "pubmed.ncbi.nlm.nih.gov",
        "who.int", "un.org", "worldbank.org", "imf.org",
        "oecd.org", "europa.eu", "ieee.org", "acm.org",
        "jstor.org", "researchgate.net", "ssrn.com",
        "doi.org", "plos.org", "cell.com", "bmj.com",
        "thelancet.com", "nejm.org", "mayoclinic.org",
        "cdc.gov", "nih.gov", "fda.gov", "nasa.gov",
        "gov.cn", "edu.cn", "ac.cn",
      ],
    },
  ];

  for (const { category, domains } of groups) {
    for (const d of domains) {
      CITATION_SOURCE_TYPE_DB[d.toLowerCase()] = category;
    }
  }
})();

// 通过 TLD/后缀判定官方/学术（最可靠的一类）
function isOfficialByTld(host) {
  return (
    /\.gov$/.test(host) ||
    /\.gov\.[a-z.]+$/.test(host) ||
    /\.mil$/.test(host) ||
    /\.mil\.[a-z.]+$/.test(host) ||
    /\.edu$/.test(host) ||
    /\.edu\.[a-z.]+$/.test(host) ||
    /\.ac\.[a-z.]+$/.test(host) ||      // .ac.uk / .ac.jp / .ac.cn 等
    /\.gouv\.[a-z.]+$/.test(host) ||    // 法国政府
    /\.go\.jp$/.test(host)              // 日本政府
  );
}

/**
 * 来源分类（含父域名后缀匹配）
 * @returns {"official" | "news" | "ugc" | "other"}
 */
function classifyCitationSource(hostname) {
  const clean = String(hostname || "")
    .replace(/^www\./, "")
    .toLowerCase();
  if (!clean) return "other";

  if (isOfficialByTld(clean)) return "official";

  const lookup = (host) => CITATION_SOURCE_TYPE_DB[host];

  let hit = lookup(clean);
  if (hit) return hit;

  const parts = clean.split(".");
  for (let i = 1; i < parts.length - 1; i++) {
    const parent = parts.slice(i).join(".");
    hit = lookup(parent);
    if (hit) return hit;
  }
  return "other";
}
