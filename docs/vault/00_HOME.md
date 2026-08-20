---
type: home
status: active
confidence: high
last_updated: 2026-07-10
owner: both
reviewed_by: agent
aliases: ["二字爻记", "二字日记", "two-char-diary"]
---

# 🏠 二字爻记 — Agent Vault

> 每天用两个字记录当天，再以一卦作为传统文化注脚。原生微信小程序。

## Quick Facts

| Key | Value |
|---|---|
| Project | 二字爻记 (`two-char-diary`) |
| Platform | 微信小程序原生 WXML/WXSS/JS |
| Stable Branch | `master` |
| Audit HEAD | `8338457` |
| Production | 未发布 |
| Phase | Release Candidate 0 |
| Storage | 本地 Storage，无后端、无登录 |
| Base Library | `3.15.0` 稳定版 |
| Latest Audit | `docs/PROJECT_AUDIT_2026-07-10.md` |
| Submission Checklist | `docs/WECHAT_SUBMISSION_CHECKLIST.md` |

## Source of Truth

1. `README.md` — 项目概览与命令
2. `PROJECT-REVIEW.md` — 当前评估摘要
3. `docs/PROJECT_AUDIT_2026-07-10.md` — 详细审计
4. `docs/WECHAT_SUBMISSION_CHECKLIST.md` — 提审验收
5. `docs/vault/01_CURRENT_BASELINE.md` — Agent 当前基线

## Critical Files

| File | Responsibility |
|---|---|
| `miniprogram/pages/index/index.js` | 今日二字、统计、起卦 |
| `miniprogram/pages/share/share.js` | 跨设备分享、Canvas、相册 |
| `miniprogram/pages/calendar/calendar.js` | 年历与历史记录 |
| `miniprogram/pages/settings/settings.js` | 主题、导出、清除 |
| `miniprogram/utils/hexdata.js` | 六十四卦与六爻 |
| `miniprogram/utils/lunar.js` | 农历换算 |
| `test-project.js` | 项目静态验证 |
| `test-lunar.js` | 农历样例测试 |

## Mandatory Agent Reading Order

1. `00_HOME.md`
2. `01_CURRENT_BASELINE.md`
3. `03_DO_NOT_TOUCH.md`
4. `04_ARCHITECTURE.md`
5. `05_COMMANDS_AND_FILES.md`
6. 与任务相关的审计或验收文档

## Current Release Blockers

- 微信后台隐私保护指引未在本地代码审计中验证
- 服务类目、名称、简介、截图仍需后台核对
- iOS / Android / HarmonyOS 真机未完成最终验收
- 好友与朋友圈需两个微信账号交叉验证
- 开发者工具代码质量、体验评分和上传前预检待执行

## Next Recommended Action

按 `docs/WECHAT_SUBMISSION_CHECKLIST.md` 完成双设备真机回归和微信后台隐私/类目配置。
