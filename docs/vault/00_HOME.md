---
type: home
status: active
confidence: high
last_updated: 2026-06-02
owner: both
reviewed_by: human
---

# 🏠 二字日记 — Agent Vault

> 每天用「两个字」和「一个爻卦」记录当天。微信小程序。

## Quick Facts

| Key | Value |
|-----|-------|
| **Project** | 二字日记 (two-char-diary) |
| **Type** | 微信小程序 |
| **Stable Branch** | master |
| **HEAD Commit** | `e5242c1` — init: 二字爻记微信小程序 |
| **Production Status** | 未发布（开发中） |
| **Phase** | mvp |
| **GitHub** | https://github.com/gunqiuwang/two-char-diary |
| **Vault Schema** | [[VAULT_SCHEMA]] v4.1.0 |
| **Last Updated** | 2026-06-02 |

## Most Important Files

| File | Why It Matters | Confidence |
|------|---------------|------------|
| `miniprogram/app.js` | 入口 + 六十四卦数据 (HEX_DATA) | high |
| `miniprogram/pages/index/index.js` | 首页核心逻辑：米字框输入 + 铜钱动画 + 爻卦生成 | high |
| `miniprogram/app.wxss` | 全局 Kami 样式（暖米白底色） | high |
| `miniprogram/utils/words.js` | 二字词库 | high |
| `PROJECT-REVIEW.md` | 完整项目评估报告（已知问题清单） | high |

## Most Important Commands

| Command | Purpose | Risk |
|---------|---------|------|
| 微信开发者工具「编译」 | 本地预览 | 🟢 Safe |
| 微信开发者工具「上传」 | 上传到微信后台 | 🔴 Deploy |
| `git push origin master` | 推送到 GitHub | 🟡 Medium |

## 🔴 Agent Entry Page

> **Every new Agent MUST read this page first.**

**Mandatory reading order:**
1. [[00_HOME]] — You are here
2. [[01_CURRENT_BASELINE]] — Source of truth
3. [[03_DO_NOT_TOUCH]] — Danger zones + security rules
4. [[05_COMMANDS_AND_FILES]] — What you can run
5. [[VAULT_SCHEMA]] — Vault rules + write protocol
6. Task-specific vault note

**After completing any task, you MUST:**
- Update [[01_CURRENT_BASELINE]] if branch/commit/status changed
- Append to [[10_REPORT_INDEX]] if a report was generated (full report → assets/intake/reports/)
- Append to [[VAULT_CHANGELOG]]

## Current Known Risks

| Risk | Severity | Confidence | Mitigation |
|------|----------|------------|------------|
| 分享页二字偶发丢失 | 🔴 High | high | 统一从存储读取所有数据 |
| Canvas 海报二字可能为空 | 🔴 High | high | generateCard() 需从存储兜底 |
| 爻辞数据不完整 | 🟡 Medium | high | HEX_DATA 缺完整六爻爻辞 |
| 铜钱 result 态 opacity 太淡 | 🟢 Low | medium | 可调至 0.6-0.7 |

## Next Recommended Action

修复 PROJECT-REVIEW.md 中的高优先级问题：分享页二字丢失 + Canvas 空值。

## Vault Navigation

- [[01_CURRENT_BASELINE]] — Where we are now
- [[02_DECISION_LOG]] — Why we made key choices
- [[03_DO_NOT_TOUCH]] — Danger zones
- [[04_ARCHITECTURE]] — How it all fits together
- [[05_COMMANDS_AND_FILES]] — What you can run and touch
- [[06_DEPLOYMENT]] — How to ship it
- [[07_TESTING_AND_VERIFICATION]] — How to verify it works
- [[08_INCIDENTS_AND_FIXES]] — What broke and how we fixed it
- [[09_AGENT_PROMPTS]] — Reusable prompts
- [[10_REPORT_INDEX]] — Reports at a glance
- [[VAULT_SCHEMA]] — Vault rules
- [[VAULT_CHANGELOG]] — Vault log
