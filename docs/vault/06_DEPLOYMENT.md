---
type: deployment
status: active
confidence: medium
last_updated: 2026-06-02
owner: agent
reviewed_by: unreviewed
---

# Deployment

## Build

微信开发者工具自动编译，无独立 build 命令。

## Deploy

1. 微信开发者工具 → 「上传」
2. 登录 mp.weixin.qq.com → 版本管理 → 提交审核
3. 审核通过后 → 发布

## Environment Requirements

| Requirement | Version |
|------------|---------|
| 微信开发者工具 | Latest stable |
| 小程序基础库 | >= 2.25.0 |

## Health Check

发布后在微信搜索「二字日记」，验证：
- 首页加载正常
- 二字输入 + 铜钱动画正常
- 分享海报生成正常

## Rollback

mp.weixin.qq.com → 版本管理 → 回退到上一版本

## Tagging Convention

尚未建立。建议：v0.1.0 (MVP), v0.2.0 (calendar), v1.0.0 (first public)
