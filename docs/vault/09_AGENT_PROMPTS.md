---
type: agent-prompts
status: active
confidence: high
last_updated: 2026-06-02
owner: both
reviewed_by: human
---

## 🔴 VAULT STARTUP SYNC (每次开工必做)

**在做任何事情之前，先检查 vault 是否过期：**

```
1. cat docs/vault/00_HOME.md → 获取 last_updated 日期
2. git log --oneline --since=<last_updated> | grep -v "chore: update news" | grep -v "docs:"
3. 如果有未同步的 commit → 先执行 vault sync，再开始干活
```

**vault sync 流程：**
```
1. git log --oneline --since=<vault_last_updated> | grep -v "chore: update news"
2. 按 commit 类型归类: feat/fix/refactor/remove
3. 更新受影响的 vault 文件（参考 VAULT_CHANGELOG 中的变更→文件映射）
4. git commit -m "docs: vault sync — <简述>"
```

**为什么：** 世界杯项目 37 个 commit 没同步的教训。vault 腐烂的原因不是没有 cron job，而是 agent 做完活忘了更新。这个检查让 vault 同步变成每个 session 的第一个动作，零额外成本。


# Agent Prompts

## New Task Startup (ALWAYS first)

```
Read docs/vault/00_HOME.md, docs/vault/01_CURRENT_BASELINE.md,
docs/vault/03_DO_NOT_TOUCH.md, and docs/vault/05_COMMANDS_AND_FILES.md
before making changes. Then read VAULT_SCHEMA.md for project rules.
Summarize your plan before editing.
```

## Bugfix

```
Read vault. Identify the bug in the specific page/JS file.
Propose a fix with affected files listed.
Do not refactor unrelated code. Test in WeChat DevTools.
Write incident report to assets/intake/reports/.
```

## Feature

```
Read vault. Identify which pages are affected.
Follow Kami design style (warm white, copper, serif, minimal).
Do not change info hierarchy (two chars > hexagram > oracle).
Test in WeChat DevTools after implementation.
```

## Task Completion (ALWAYS last)

```
Task complete. Update vault:
1. Update 01_CURRENT_BASELINE.md if status changed
2. If report generated -> assets/intake/reports/, summary in 10_REPORT_INDEX.md
3. Append to VAULT_CHANGELOG.md
4. Commit with prefix "docs:"
```