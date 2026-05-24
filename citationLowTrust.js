// 引用可信度：静态「薄内容 / 采集聚合」域名（v1.3+），仅作 caution 级别启发式。

const CITATION_LOW_TRUST_DB = {};

(function seedCitationLowTrust() {
  /** @type {string[]} */
  const domains = [
    // 典型 MFA / 问答农场 / 旧式采集站
    "answers.com",
    "ehow.com",
    "hubpages.com",
    "ezinearticles.com",
    // 常见阴谋论 / 未经核实聚合（易被子引用）
    "beforeitsnews.com",
    "naturalnews.com",
    "investmentwatchblog.com",
    // 中文常见营销号 / 转载载体（易被子引用）
    "baijiahao.baidu.com",
    "haokan.baidu.com",
  ];
  const reasonKey = "aiCitationReason_thinContent";
  domains.forEach((d) => {
    CITATION_LOW_TRUST_DB[d] = { reasonKey };
  });
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
