---
type: baseline
status: active
confidence: high
last_updated: 2026-06-02
owner: agent
reviewed_by: unreviewed
---

# Current Baseline

## Current State

| Key | Value | Confidence |
|-----|-------|------------|
| **Current Branch** | master | high |
| **HEAD Commit** | `e5242c1` | high |
| **Production** | Not deployed | high |
| **Build Status** | Unknown | low |
| **Test Status** | No test suite | high |

## Capabilities

1. 米字框二字输入（自动跳转）
2. 铜钱抛卦动画（6轮，~4.2秒）
3. 六十四卦映射（卦名+卦辞）
4. Canvas 分享海报（750x1000）
5. 年历视图（12个月网格）
6. 设置页（提醒/导出/清除）

## Known Issues

| Issue | Severity | Status |
|-------|----------|--------|
| 分享页二字偶发丢失 | High | Open |
| Canvas 海报二字可能为空 | High | Open |
| 爻辞数据不完整 | Medium | Open |
| history 页面未清理 | Low | Open |

## Must NOT Regress

- 铜钱三态动画
- 米字框自动跳转
- 暖米白底色
- 二字为主体、卦象为注脚
