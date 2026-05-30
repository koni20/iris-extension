# Iris Roadmap

## 当前版本 v1.7.0（最新）

- ✅ **本地历史记录**：📊 按钮进入历史面板，保留近 30 天每日数据；顶部展示近 7 天汇总；「本周 Insights」展示追踪器最多的网站、后台使用 AI 的网站、低可信引用最多的 AI 平台、Spend Guard 触发次数、Cookie 暗模式站点数；底部每日条形图
- ✅ **Sticky 卡片标题**：展开的 Section Card（如 Trackers）标题在滚动时固定在顶部，不再随内容滑走

## 历史版本

### v1.6.0（已发布）

- ✅ **浏览会话汇总栏**：popup 顶部实时显示本次浏览累计数据——追踪器总数、AI 调用次数、低可信引用数，跨 Tab 聚合，给用户全局感知
- ✅ **用户设置页**：Header 齿轮按钮进入设置面板；6 个模块独立开关（追踪器 / 浏览器 API / AI 安全 / 内容安全 / Spend Guard / Cookie 同意）；Spend Guard 灵敏度选择（标准/严格）；设置持久化至 `chrome.storage.local`
- ✅ **AI 低可信引用域名库扩充**：citationLowTrust.js 从 9 个扩充至 167 个，分 4 个分类（薄内容 / 阴谋论 / 伪科学 / 假新闻），数据来源 OpenSources (CC BY 4.0)、MBFC、iffy.news (MIT)
- ✅ **Spend Guard 中日文模式补充**：新增连续包月/包年/自动扣费、随时取消、限时优惠等中文信号；自動更新/自動課金/初月無料/いつでも解約 等日文信号；URL 门控新增中文（套餐/续费）和日文（購入/料金/プラン）关键词

## 历史版本

### v1.5.0（已发布）
- ✅ **导航重构**：Tabs → 可折叠 Section Cards，每个模块独立展开，卡片头部实时显示风险角标
- ✅ **Cookie 同意暗模式检测**（新模块）：识别 OneTrust / Cookiebot / TrustArc / Didomi 等主流 CMP，检测「缺少拒绝按钮」「非必要项默认勾选」两类暗模式，6 语言支持

### v1.4.0（已上架 Chrome Web Store）
- ✅ AI 引用来源可信度（v1.3）：在 Perplexity / ChatGPT / Kimi / Gemini 等页面采集引用域名，三维度评分
- ✅ Spend Guard 订阅消费陷阱检测：URL 门控 + 多类订阅话术模式
- ✅ 安全修复：`esc()` HTML 转义，全 innerHTML 注入防护
- ✅ UI：移除 Google Fonts 外部依赖，改用系统字体栈

### v1.2.1（已上架 Chrome Web Store）
- ✅ 内容安全动态库：uBlock adult + StevenBlack 博彩 hosts + uBlock badware
- ✅ 追踪器 / AI 安全 / 内容安全（四标签）完整能力

### 项目近况（2026-05）
- 商店版已对外可用；GitHub 仓库持续开源协作。

---

## 更远期（愿景池）

- [ ] 历史记录（过去 30 天检测摘要，仅本机存储）
- [ ] 可分享隐私报告卡片（静态图片生成）
- [ ] 跨网站百分位对比（方案未定）
- [ ] 已安装扩展安全审计

---

*最后更新：2026-05-25*
