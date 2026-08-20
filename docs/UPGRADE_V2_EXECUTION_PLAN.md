# 二字爻记 v2.0 · 执行计划与验收标准（目标模式用）

> 日期：2026-08-20
> 上游文档：`docs/PROJECT_AUDIT_2026-08-20.md`、`docs/UPGRADE_V2_AI_DESIGN.md`
> 用法：每个任务含【目标】【步骤】【验收标准】三块。验收标准全部可客观判定，全部通过才算任务完成。
> 全局约束：任何阶段完成后 `node test-project.js && node test-lunar.js` 必须通过；断网/无云环境下 v1 功能不得回退。

---

## 阶段总览

| 阶段 | 任务 | 预估 |
|---|---|---|
| P0 前置 | T01 基线提交、T02 基础库升级、T03 审计修复、T04 schemaVersion、T05 节气算法、T06 成长计划资源 | 0.5–1 天 |
| P1 文本 AI | T07 云开发初始化、T08 utils/ai.js 封装、T09 爻解、T10 动态灵感词 | 2–3 天 |
| P2 生图 | T11 genImage 云函数、T12 AI 笺纸海报、T13 频控与安全检测 | 2–3 天 |
| P3 留存 | T14 岁物集、T15 云同步 | 2 天 |
| P4 收尾 | T16 合规与文案、T17 真机验收、T18 提审物料 | 1–2 天 |

---

## P0 前置

### T01 建立 v1 可回滚基线

**目标**：大改之前有一个随时能退回的干净版本。

**步骤**：
1. 审查工作区 30 个未提交改动（`git status`），确认全部为 v1 线上版本内容
2. `git add -A && git commit -m "v1.x 线上基线"` 提交
3. 打 tag：`git tag v1.x-baseline`
4. 从该 tag 切升级分支：`git checkout -b v2-ai-upgrade`

**验收标准**：
- [ ] `git status` 干净，无未跟踪/未提交文件
- [ ] `git tag` 可见 `v1.x-baseline`
- [ ] 当前分支为 `v2-ai-upgrade`
- [ ] `git checkout v1.x-baseline` 后 `node test-project.js` 通过（验证基线可用），再切回升级分支

### T02 基础库与项目配置升级

**目标**：满足 `createModel("cloudbase")` 的 ≥ 3.15.1 硬性要求。

**步骤**：
1. `miniprogram/project.config.json`：`libVersion` 改为 `3.15.1`（或当时最新稳定版）；`description` 中「二字日记」改为「二字爻记」
2. `app.json` 增加 `"lazyCodeLoading": "requiredComponents"`
3. 在开发者工具中切换调试基础库至 3.15.1+，重新编译

**验收标准**：
- [ ] `project.config.json` 中 `libVersion` ≥ 3.15.1，description 无「二字日记」字样
- [ ] `app.json` 含 `lazyCodeLoading: "requiredComponents"` 且 JSON 合法
- [ ] 开发者工具编译无报错，四页面可正常打开
- [ ] `node test-project.js` 通过

### T03 审计遗留修复（A2 / A4 / A6）

**目标**：清掉审计报告 §3 的三处代码问题。

**步骤**：
1. **A2 年界钳制**：`calendar.js` 的 `prevYear`/`nextYear` 加范围判断 `1900 ≤ year ≤ 2050`，越界时 toast「已到最早/最晚年份」或直接不响应
2. **A4 海报行数估算**：`share.js` 的 `estimateLineCount` 改用 `Array.from(text).length`
3. **A6 代码规范**：`calendar.js` 所有 `parseInt(x)` 改为 `parseInt(x, 10)`；顺带全局 grep 确认无其他缺 radix 调用

**验收标准**：
- [ ] 年历翻到 1900 年 1 月/2050 年 12 月后无法继续向界外翻页
- [ ] `estimateLineCount` 对含 emoji 字符串返回按字符数计算的行数
- [ ] `grep -n "parseInt(" miniprogram/` 结果全部带 `, 10`
- [ ] 静态检查通过

### T04 本地数据 schemaVersion

**目标**：为 v2 新增字段（annotation、aiImageFileID）建立迁移机制。

**步骤**：
1. `app.js onLaunch` 增加迁移逻辑：读取 `diary_data`，若 `meta.schemaVersion` 不存在则视为 v1，写入 `schemaVersion: 2` 标记（v1 记录无需改动，新字段读取时全部做可选兜底）
2. 所有读取记录处对 `annotation` / `aiImageFileID` 用 `|| ''` 兜底
3. `test-project.js` 增加一条检查：写入 v1 格式记录 → 触发迁移 → 断言 `schemaVersion === 2` 且原记录字段无损

**验收标准**：
- [ ] 模拟 v1 数据启动小程序，迁移后记录完整可见
- [ ] 新增测试用例通过，`test-project.js` 全绿
- [ ] 年历、分享页读 v1 旧记录无任何缺失显示

### T05 节气算法精确化

**目标**：消除「非节气日显示节气名」的 ±1 天误报。

**步骤**：
1. 替换 `solarterm.js` 的 `SOLAR_TERMS` 固定日期表为按年计算版本（太阳黄经近似公式或 1900–2100 权威对照表）
2. `getSolarTerm` 仅当天精确命中才返回节气名；`getDailyWords` 允许「节气前后 1 天」继续使用节气推荐词（展示与推荐分离）
3. `test-project.js` 或 `test-lunar.js` 增加节气断言：2026 年立春 = 2 月 4 日、冬至 = 12 月 22 日等至少 8 个已知节气日

**验收标准**：
- [ ] 节气仅在实际日期显示，前后一天不再误标
- [ ] 节气前后一天的灵感词仍含节气词（验证推荐未退化）
- [ ] 新增节气测试全部通过

### T06 成长计划资源确认（人工任务）

**目标**：确认免费额度已到账可用。此任务只能由你在微信公众平台/云开发控制台操作，Agent 无法代做。

**步骤**：
1. 微信公众平台 → 行业能力 → 小程序成长计划，确认已报名（未报名则报名，类目须为文娱/工具/社交/深度合成/资讯类）
2. 云开发控制台 → AI → 大模型目录，确认 hy3 / hy3-preview Token 包与混元生图包到账
3. 云开发控制台手动开启 `hy3`、`hy3-preview` 模型开关（`cloudbase` provider 需要）
4. 记录额度数值与到期日（自到账起 6 个月）

**验收标准**：
- [ ] 控制台可见 Token 与生图额度非零
- [ ] hy3 / hy3-preview 开关已开
- [ ] 环境 ID 确认为 `cloud1-d6gfjpnx82bd1357a`

---

## P1 文本 AI

### T07 云开发初始化

**目标**：小程序端联通云环境，为所有 AI/云函数能力打底。

**步骤**：
1. `app.js`：`wx.cloud.init({ env: 'cloud1-d6gfjpnx82bd1357a', traceUser: true })`，加 try/catch，失败时置全局 `cloudReady = false`
2. `project.config.json` 增加 `"cloudfunctionRoot": "cloudfunctions/"`，根目录新建 `cloudfunctions/`
3. 新增全局降级约定：`utils/ai.js` 暴露 `isAIAvailable()`（cloudReady && 基础库 ≥ 3.15.1），所有 AI 入口先查它
4. 增加 `wx.onError` / `wx.onUnhandledRejection` 基础采集（本地计数写入 storage，设置页概览可选展示）

**验收标准**：
- [ ] 开发者工具云开发面板显示已连接环境
- [ ] 云开发关闭/无网模拟下，`isAIAvailable()` 返回 false，v1 全流程不受影响
- [ ] 静态检查通过

### T08 utils/ai.js 调用封装

**目标**：所有文本 AI 调用走统一封装，内置节流、重试、降级、缓存。

**步骤**：
1. 封装 `createModel('cloudbase')`，默认 `model: 'hy3'`
2. 实现 `callText({ system, user, cacheKey, onToken })`：
   - 有 `cacheKey` 先查本地缓存（按日），命中直接返回
   - 流式 `streamText`，`onToken` 回调按 200ms 节流
   - `EXCEED_CONCURRENT_REQUEST_LIMIT` → 1s/3s 退避重试 2 次 → 切 `hy3-preview` 再试 1 次 → 抛 `AIUnavailableError`
   - 其他错误直接抛 `AIUnavailableError`，调用方静默降级
3. system prompt 按设计文档 §F1 固化「克制注脚」人格与红线（不预测吉凶、不提财运疾病婚姻）

**验收标准**：
- [ ] 同一 cacheKey 当日第二次调用不发请求（可用调试器 network 面板验证）
- [ ] 模拟并发超限（或断网）时按约定降级，页面无报错无白屏
- [ ] 封装层单元自测脚本（可并入 test-project.js）通过

### T09 F1 爻解

**目标**：起卦结果页出现「爻解」栏，生成当日 AI 注脚。

**步骤**：
1. `index.js`：`startCasting` 完成保存后，若 `isAIAvailable()`，调 `callText`，入参为当日二字、卦名、卦辞、节气/节日，cacheKey = `annotation:{date}`
2. `index.wxml/wxss`：卦辞下方新增「爻解」区，流式打字效果（复用现有动画体系，尊重 reduceMotion），底部常驻浅灰小字「AI 生成 · 仅供文化参考」
3. 生成完成的文本写入 `diary_data[date].annotation`，年历详情与分享海报同步展示
4. 降级：AI 不可用时爻解区整体不渲染（不留空框、不显示错误）

**验收标准**：
- [ ] 起卦完成后 5 秒内爻解开始流出，风格克制、无预测性表述（抽测 10 卦）
- [ ] 退出重进/跨页面（年历→详情）爻解仍在，且不重复消耗 Token
- [ ] 断网起卦：卦象正常，爻解区不出现
- [ ] 「AI 生成 · 仅供文化参考」标识可见
- [ ] reduceMotion 开启时无打字动画但文本正常

### T10 F2 动态灵感词

**目标**：灵感词由 AI 按日生成，静态词库兜底。

**步骤**：
1. `initCandidates` 改造：先查 `inspire_cache`（`{ date, words[] }`），命中直接用
2. 未命中且 AI 可用：调 `callText` 生成 8 个二字词（prompt 含季节、节气、干支），与静态节气词合并展示，写缓存
3. 生成失败或未返回合法 8 个二字词（逐词校验长度=2）→ 退回现有静态逻辑
4. 「换一批」按钮维持本地随机，不走 AI

**验收标准**：
- [ ] 当日首次进入编辑态出现新词，且与节气/季节相关（人工抽验）
- [ ] 同日再次进入不重复请求
- [ ] 断网/AI 不可用时展示静态词库，行为与 v1 一致
- [ ] AI 返回非法词（非二字、含标点）时被过滤且不影响展示

---

## P2 生图

### T11 genImage 云函数

**目标**：服务端生图能力上线，带频控与安全检测。

**步骤**：
1. 新建 `cloudfunctions/genImage/`（`index.js` + `package.json`，依赖 `wx-server-sdk`）
2. 流程：openid+date 查 `image_quota` 集合频控（每日 1 张）→ `cloud.extend.AI.createImageModel('hunyuan-image')` 调 `HY-Image-3.0-Plus-4090-Tob-v1.0`（1024x1024，prompt 模板见设计文档 §3.3）→ `imgSecCheck` 安全检测 → 上传云存储 → 写频控记录 → 返回 fileID
3. 开发者工具右键上传并部署云函数

**验收标准**：
- [ ] 云函数本地/云端调试返回有效 fileID，图片可访问
- [ ] 同日第二次调用被频控拒绝并返回明确错误码
- [ ] 安全检测不通过时返回错误而非下发图片
- [ ] 云函数日志可在控制台查询，无未捕获异常

### T12 F3 AI 笺纸海报

**目标**：分享页新增「AI 笺纸」风格，生成带水墨底图的当日海报。

**步骤**：
1. 分享页纸张选择区新增「笺纸」项（位置排在四种静态纸张之后）
2. 选中后：`wx.cloud.callFunction({ name: 'genImage' })` → `wx.cloud.downloadFile` 取底图 → 本地 `image_cache` 按日缓存
3. `generateCard` 增加笺纸分支：Canvas 先绘底图（适配裁切），再叠加现有米字格/卦线/卦辞排版，右下角盖「AI 绘」小印
4. 生成中显示「研墨中…」占位动画（尊重 reduceMotion）；失败/频控拒绝 → toast 提示并自动回退到当前静态纸张
5. `onShareAppMessage` 的 `imageUrl` 在笺纸海报生成后自动使用之

**验收标准**：
- [ ] 真机/模拟器生成海报含 AI 底图且文字排版无错位，30 秒内完成
- [ ] 同日重复进入分享页使用缓存，不重复调云函数
- [ ] 频控触发/生图失败/断网三种场景均优雅回退静态纸张
- [ ] 海报含「AI 绘」标识
- [ ] 保存相册与好友分享图片正常

### T13 额度监控与兜底

**目标**：生图额度可观测、耗尽可兜底。

**步骤**：
1. 云函数响应中附带当日剩余配额估算（读 `image_quota` 计数），客户端低配额时隐藏「笺纸」入口
2. 控制台配置用量告警（80%/90%/100% 公众号提醒为平台自带，确认开启即可）
3. 文档化：额度耗尽时的运营预案（切静态纸张为默认、公告）

**验收标准**：
- [ ] 剩余配额为 0 时分享页不出现笺纸入口
- [ ] 控制台告警确认已开

---

## P3 留存

### T14 F4 岁物集 · 月度回顾

**目标**：年历页可按月生成 AI 小传。

**步骤**：
1. 年历页头部新增「岁物」按钮（仅当上上月记录 ≥ 5 天时点亮）
2. 点击调 `callText`：入参为该月全部「日期+二字」列表，prompt 要求 150 字内散文式回顾，cacheKey = `monthly:{year}-{month}`
3. 结果以卡片形式展示（复用分享卡视觉），可保存/分享
4. 不足 5 天记录时按钮置灰，提示「再记几天就有小传了」

**验收标准**：
- [ ] 5 天记录门槛逻辑正确（4 天不可生成，5 天可）
- [ ] 生成结果提及的意象来自当月真实二字，无编造日期（人工抽验 3 个月）
- [ ] 按月缓存，重复查看不耗 Token
- [ ] 断网时按钮不可点且无报错

### T15 F5 云同步 · 匿名备份

**目标**：换机/重装不丢记录，根治审计 4.6。

**步骤**：
1. 新建 `cloudfunctions/syncDiary/`：匿名登录态下按 openid 读写 `diary` 集合（openid 由 `cloud.getWXContext()` 服务端获取，客户端不传人）
2. 客户端：`commitWords`/`saveHex`/清除记录后静默增量推送；启动时拉取云端并与本地按 `timestamp` 合并（冲突以新者为准）
3. 设置页新增「云端备份」开关（默认开）与「上次同步时间」展示；隐私指引文案同步更新
4. 合并逻辑并入 test-project.js：本地 v1 数据 + 云端 v2 数据合并后无丢失、无重复

**验收标准**：
- [ ] 模拟器 A 记录 → 同号另一环境（或清本地缓存）后首次打开自动恢复
- [ ] 关闭开关后不再产生任何云请求
- [ ] 合并单元测试通过
- [ ] 断网时记录正常写本地，恢复联网后自动补同步

---

## P4 收尾

### T16 合规与文案

**步骤**：
1. 公众平台：确认/调整类目覆盖 AI 生成相关要求；更新《隐私保护指引》（新增 AI 数据发送说明 + 云同步说明）
2. 全量文案扫描：爻解、岁物集、海报、设置页无任何预测/改运/承诺类表述
3. 检查两处 AI 标识（爻解角标、海报「AI 绘」印）在所有路径可见

**验收标准**：
- [ ] 隐私指引与实际 API 行为逐条一致
- [ ] 文案红线清单零命中
- [ ] AI 标识截图存档

### T17 真机验收

**步骤**：iOS + Android 各一轮完整链路。

**验收标准**（每台机器全过）：
- [ ] 记录二字 → 起卦 → 爻解流出 → 生成笺纸海报 → 保存相册（含权限拒绝再授权路径）→ 好友分享 → 朋友圈分享 → 接收方打开正常
- [ ] 飞行模式下 v1 全流程完整可用，AI 区静默隐藏
- [ ] 跨午夜：日期、灵感词、爻解缓存键正确滚动
- [ ] 素黑主题 + reduceMotion 下所有新 UI 无异常

### T18 提审物料与上传

**步骤**：
1. 开发者工具跑「代码质量」「体验评分」「上传前预检」
2. 准备审核说明：产品为传统文化记录工具，AI 仅生成文化注脚与意境插画，不做预测
3. 稳定基础库上传，填写版本号 2.0.0 与更新日志
4. 合并 `v2-ai-upgrade` 回 master 并打 `v2.0.0` tag

**验收标准**：
- [ ] 质量/体验扫描无红项
- [ ] 提审通过或被驳回项有记录与修复计划
- [ ] master 上 `v2.0.0` tag 存在，`node test-project.js && node test-lunar.js` 全绿

---

## 全局红线（任何阶段不得违反）

1. 免费 AI 额度只经 `wx.cloud.extend.AI`（小程序端）与 `wx-server-sdk`（云函数）消耗；**禁止**在小程序/云函数之外直连 `api.tcloudbasegateway.com` 网关
2. AI 输出必须先过内容安全检测再展示/下发
3. 所有 AI 功能必须有无网/无额度降级路径，v1 功能任何时候完整可用
4. 每个任务完成后在 `docs/vault/VAULT_CHANGELOG.md` 追加一条记录
