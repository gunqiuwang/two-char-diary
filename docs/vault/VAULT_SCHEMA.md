---
type: schema
status: active
confidence: high
last_updated: 2026-06-02
owner: human
reviewed_by: human
---

# Vault Schema

## Project Identity

**Project:** 二字日记 (two-char-diary)
**Description:** WeChat mini-program for daily two-char diary with hexagram divination

## Vault Version

```yaml
vault_version: 4.1.0
vault_created: 2026-06-02
last_upgraded: 2026-06-02
```

## Project Phase

```yaml
project_phase: mvp
```

## Staleness Thresholds

```yaml
staleness_threshold_days: 30
review_threshold_days: 14
audit_interval_days: 30
```

## Multi-Agent Write Protocol

| File | Primary Writer | Rule |
|------|---------------|------|
| 00_HOME | Human | Agent can suggest |
| 01_BASELINE | Last committer | Read before write |
| 02_DECISIONS | Human decides | Append only |
| 03_DO_NOT_TOUCH | Human | Agent cannot override |
| 04_ARCHITECTURE | Agent | Human reviews |
| 05_COMMANDS | Agent | Auto-generated |
| VAULT_SCHEMA | Human | Agent cannot modify |
| VAULT_CHANGELOG | Any | Append only |

## Page Thresholds

| Action | Condition |
|--------|-----------|
| Split | File exceeds 300 lines |
| Archive | Feature removed, incident resolved |

## Vault Score Formula

```
score = confidence * 0.35 + freshness * 0.30 + completeness * 0.20 + review * 0.15
```
