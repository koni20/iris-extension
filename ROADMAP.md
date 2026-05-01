# Iris Roadmap

## 当前版本 v1.1.0（已上架 Chrome Web Store）
- ✅ 追踪器检测（Disconnect.me，6000+ 域名，7天自动更新）
- ✅ 浏览器指纹检测（Canvas、WebGL、Audio、WebRTC、剪贴板等）
- ✅ AI 服务检测（27个服务商，含中国主流 AI 平台）
- ✅ AI 钓鱼网站识别（20个品牌白名单）
- ✅ 六国语言支持
- ✅ 开源（[github.com/koni20/iris-extension](https://github.com/koni20/iris-extension)）

### 项目近况（2026-05）
- 商店版已对外可用；GitHub 仓库持续开源协作（欢迎 star / Issue）。
- 已在少数派发布介绍文章，有一定读者与反馈，便于收集真实场景需求。
- **当前开发重心：v1.2.0「内容安全」**（见下节）。

---

## 下一版本 v1.2.0 — 内容安全（未成年保护）【开发中】

### 目标
给 Iris 新增第四个标签页"内容安全"，帮助家长了解当前网站是否适合未成年人访问。

### 产品定位
- 不是"拦截工具"，是"可观测性工具"——告诉家长发生了什么，而不是强制阻断
- 完全免费，和 Iris 核心理念一致
- 目标用户：有孩子的家长，在孩子常用设备上安装

### 功能规划

**功能一：危险域名检测**
- 数据来源：CleanBrowsing 开源分类列表、uBlock Origin 成人内容规则、Dan Pollock hosts 文件
- 分类：成人内容 / 赌博 / 诈骗 / 暴力 / 极端内容
- 和追踪器数据库一样，7天自动更新

**功能二：页面关键词扫描**
- 在页面可见文本中检测明显的危险关键词
- 分级：轻度警告 / 中度 / 严重
- 注意：只检测，不上报，完全本地运行

**功能三：诱导性行为检测**
- 检测直播打赏引导弹窗
- 检测过度推送付费内容的行为模式
- 主要针对中国直播/短视频平台

**功能四：网站内容评级展示**
- 在 popup 显示当前网站的内容安全等级
- 绿色：适合所有年龄 / 黄色：建议家长陪同 / 红色：不适合未成年人

### 技术实现
- 复用现有追踪器数据库框架，新增内容分类字段
- inject.js 扩展页面文本扫描能力
- 新增 `contentSafety.js` 数据库文件
- popup 新增第四个 tab

### 数据来源（全部开源）
- https://github.com/nicowillis/adult-domains（成人域名）
- https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/adult.txt
- https://cleanbrowsing.org/filters（分类 DNS 数据）

### 发布策略
- 免费功能，内置在 Iris
- 发布时重点推给家长群体
- 少数派已有传播基础，可与「知乎家长圈」等渠道结合二次推广

---

## v1.3.0 — AI 搜索来源可信度检测（GEO 投毒防护）

### 背景
GEO（Generative Engine Optimization）是 SEO 的 AI 版，有人专门优化垃圾内容让 AI 搜索优先引用。
用户看到的是 AI 口吻的答案，无法判断来源是否可靠。

### 目标
当用户使用 AI 搜索（Perplexity、ChatGPT Search、Kimi 搜索、Gemini 等）时，
自动检测 AI 回答所引用的来源链接的可信度，帮助用户判断 AI 的答案是否基于可靠内容。

### 功能规划

**核心功能：来源可信度评分**
- 自动识别 AI 搜索结果页面中的引用来源 URL
- 对每个来源域名进行可信度评估：
  - 是否在已知内容农场黑名单中
  - 是否是新注册域名（< 1年）
  - 是否有正常的网站结构（非 AI 批量生成站）
  - 是否在 Iris 追踪器数据库中有记录
- 在 popup 显示："本次回答引用了 X 个来源，其中 Y 个可信度低"

**支持的 AI 搜索平台**
- Perplexity AI（perplexity.ai）
- ChatGPT Search（chatgpt.com）
- Kimi 搜索（kimi.moonshot.cn）
- Google Gemini（gemini.google.com）
- 微软 Copilot（copilot.microsoft.com）
- 秘塔搜索（metaso.cn）

**可信度数据来源（开源）**
- 内容农场黑名单：uBlock Origin 的 `uAssets/filters/badware.txt`
- 域名黑名单：Spamhaus、SURBL
- 域名年龄：通过 WHOIS 数据判断（需服务端支持）

**UI 展示**
- AI Safety 标签内新增"搜索来源分析"子区域
- 绿色：所有来源可信 / 黄色：部分来源存疑 / 红色：多个来源为低可信度站点
- 点击展开查看每个来源的详细评分

### 技术实现
- content.js 扫描 AI 搜索结果页面中的 `<a>` 引用链接
- 提取域名后与可信度数据库匹配
- 结果通过 background.js 汇总后在 popup 展示

### 市场价值
- 目前没有任何工具在做这件事
- GEO 是 2025-2026 年最热的 SEO 新方向，"反 GEO"是天然对立面
- 话题传播性强：适合在 Hacker News、科技媒体发布

---

## 未来版本规划（v1.4.0+）

- [ ] 历史记录（过去 30 天的检测数据）
- [ ] 跨网站对比（基于真实用户数据的百分位统计）
- [ ] 可分享的隐私报告卡片
- [ ] 浏览器扩展安全审计（检测可疑已安装扩展）
- [ ] 公开网站隐私排行榜

---

*最后更新：2026-05-01*
