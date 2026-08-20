---
type: changelog
status: active
confidence: high
last_updated: 2026-07-10
owner: both
reviewed_by: agent
---

# Vault Changelog

## [2026-07-14] ui | Simplify settings data tools

- 设置页保持正常比例与一屏布局，不再整体压缩背景卡片和功能栏
- 删除低价值的 JSON 导出、导入恢复、上次备份和恢复弹层
- 数据区仅保留记录天数、起卦次数、最近记录和清除全部记录
- 保留四种背景、标准/减弱动效、分享小程序与关于二字爻记
- 关于弹窗明确说明记录仅保存在本机以及清缓存、换机的丢失风险
- 同步删除导入恢复自动测试与过期文档描述
- 静态检查、农历测试和 diff 检查通过

## [2026-07-10] feat | Settings data recovery and motion preferences

- 设置页新增数据概览：记录天数、起卦次数、最近记录和上次备份时间
- 导出成功后记录备份时间，并在概览中即时更新
- 新增备份导入面板，支持 JSON 校验、异常项过滤、冲突统计
- 支持“合并记录”和“覆盖本机”两种恢复方式；合并默认保留本机同日记录
- 新增标准/减弱动效偏好，并同步作用于首页、年历、分享页和设置页
- 新增独立的数据与隐私说明及版本信息
- `test-project.js` 增加导入校验、冲突预览和安全合并回归测试

## [2026-07-10] ui | Calendar single-screen record layout

- 回滚误加在首页的单屏结果布局，首页恢复原有记录与起卦结构
- “记录”页改为连续纸面结构：上半屏为舒展月历，下半屏复用主页内容顺序
- 完整重写 `calendar.wxss`，清除多轮迭代遗留的重复选择器和覆盖冲突
- 12 个月改为极简刻度，当前月份使用文字加小圆点提示
- 月历固定为 42 个日期格的六周结构，切换月份时高度保持稳定
- 历史二字改为缩小版米字格，卦象改为真实六爻线、卦名和卦辞的居中组合
- 六爻线加长至 72rpx、线距增至 8rpx，阴爻断口同步放宽，避免卦象压缩成小图标
- 六条爻辞改为固定紧凑行高的主页式纵向列表，不再使用 `flex: 1` 平均拉伸
- 不使用卡片、省略或详情浮层，页面禁止纵向滚动并适配 720px 以下矮屏
- 分享入口以轻量线性图标放在日录标题行右侧
- 静态检查、农历测试和 diff 检查通过

## [2026-07-10] ui | 纸笺印记图标与微动效

- 首页记录、分享、设置、起课图标统一为细线纸笺风
- 分享页保存图标改为落印动作，分享节点增加按压反馈
- 年历与设置页返回箭头统一，年份导航移除字符箭头
- 设置列表箭头改为 CSS 细线箭头，背景选中加入朱砂点
- 动画仅用于页面进入、按压和工作状态，避免持续晃动

## [2026-07-10] ui | Remove duplicate share background selector

- Removed 宣纸、绢帛、竹简、素黑 options from the share page
- Removed unused share-page style data, handler and WXSS
- Background selection is now controlled only from Settings
- Share page and generated poster continue to follow the saved global background

## [2026-07-10] audit | Release candidate audit and documentation refresh

- Project name normalized to 二字爻记
- Full code, logic, UI, share and release audit completed
- Critical share precedence and external back-navigation issues fixed
- Midnight date refresh and calendar state issues fixed
- Canvas DPR and save concurrency hardened
- Touch targets and navigation contrast improved
- Added `test-project.js`
- Lunar test baseline corrected: 6 passed, 0 failed
- Added `docs/PROJECT_AUDIT_2026-07-10.md`
- Added `docs/WECHAT_SUBMISSION_CHECKLIST.md`
- Updated README, PROJECT-REVIEW and core Vault source-of-truth files
- Phase moved from MVP to Release Candidate 0

## [2026-07-10] incident | Share page mojibake and gray base library

- Rewrote corrupted share WXML as UTF-8
- Removed custom font dependency assumptions
- Added mojibake regression check
- Standardized final validation on stable base library 3.15.0

## [2026-06-02] init | Vault created

- Phase: mvp
- Files created: 12 vault files + 4 templates
- Commands inventoried: 5
- Dangerous commands found: 2 (upload, force push)
- Security rules added: 4 (AppID, API keys, user data, PII)
- Known issues documented: 4
