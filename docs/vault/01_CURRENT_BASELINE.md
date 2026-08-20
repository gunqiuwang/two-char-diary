---
type: baseline
status: active
confidence: high
last_updated: 2026-07-10
owner: agent
reviewed_by: agent
---

# Current Baseline

## Current State

| Key | Value |
|---|---|
| Branch | `master` |
| Audit HEAD | `8338457` |
| Production | 未发布 |
| Phase | Release Candidate 0 |
| Build | 微信开发者工具原生编译 |
| Base Library | `3.15.0` 稳定版 |
| Static Test | Passed |
| Lunar Test | 6 passed / 0 failed / 2 info |
| Static Size | 163.0 KB |

## Capabilities

1. 米字框二字输入、双字粘贴、灵感词与自动保存
2. 公历、农历、节日/节气和连续记录统计
3. 一日一卦、六爻、卦名、卦辞和完整六条爻辞
4. 年历历史记录和历史分享
5. 四种分享纸张、Canvas 海报、相册保存
6. 好友与朋友圈分享，支持无本地数据的接收者
7. 本地数据概览和清除确认
8. 宣纸、绢帛、竹简、素黑全局主题
9. 标准/减弱动效偏好，并同步作用于全部页面
10. “分享小程序”与“关于二字爻记”；关于弹窗包含必要的数据与隐私说明和版本信息

## Passed Checks

- JS syntax
- JSON parse
- app route files
- WXML event handlers
- common mojibake scan
- 64 hexagrams / 6 yao texts per hexagram
- lunar sample dates

Run:

```bash
node test-project.js
node test-lunar.js
```

## Open Risks

| Risk | Priority | Status |
|---|---|---|
| 微信后台隐私保护配置 | P0 | Manual verification required |
| 服务类目与审核文案 | P0 | Manual verification required |
| iOS/Android/HarmonyOS 真机 | P0 | Manual verification required |
| 双账号好友/朋友圈分享 | P0 | Manual verification required |
| 节气算法近似且支持 ±1 日 | P1 | Open |
| 数据仅保存在本机，换机或清缓存可能丢失 | P1 | Accepted for MVP |
| 分享 query 含基础记录快照 | P1 | Accepted for MVP |
| 自定义导航未统一胶囊坐标 | P1 | Manual device test first |

## Must Not Regress

- 二字始终是视觉主体
- 分享参数优先于接收者本地记录
- 分享页不提供独立背景选择，背景统一由设置页控制
- 外部分享页返回按钮必须可回首页
- 一日只能起一卦
- 记录默认只存在本机
- 不引入外部字体或不必要网络依赖
