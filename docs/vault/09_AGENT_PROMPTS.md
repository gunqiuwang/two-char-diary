---
type: agent-prompts
status: active
confidence: high
last_updated: 2026-06-02
owner: both
reviewed_by: human
---

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
