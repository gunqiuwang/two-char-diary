---
type: deployment
status: active
confidence: high
last_updated: 2026-07-10
owner: agent
reviewed_by: agent
---

# Deployment

## Release Gate

Do not upload until all P0 items in `docs/WECHAT_SUBMISSION_CHECKLIST.md` are complete.

## Environment

| Requirement | Current Baseline |
|---|---|
| 微信开发者工具 | Latest stable |
| Base Library | `3.15.0` stable |
| Framework | Native mini program |
| Backend | None |
| Package | ~163.0 KB static files |

## Pre-upload

1. Run:

```bash
node test-project.js
node test-lunar.js
```

2. In DevTools:

- 清除文件缓存并编译
- 代码质量
- 体验评分
- iOS/Android 真机预览
- 上传前预检

3. In WeChat backend:

- 核对 AppID、主体和服务类目
- 更新隐私保护指引
- 更新名称、头像、简介和截图
- 版本文案避免确定性占卜承诺

4. Create a clean Git snapshot or release tag.

## Upload and Review

1. DevTools → 上传
2. 微信公众平台 → 版本管理
3. 填写版本说明和测试路径
4. 提交审核
5. 审核通过后先小范围观察
6. 确认分享和保存图片无异常后发布

## Rollback

- 微信公众平台版本管理中回退上一稳定版本
- Git 回到对应 tag/commit
- 不在未备份情况下使用 destructive Git commands

## Suggested Versioning

- `v0.9.0-rc1`：完成静态审计，等待真机/后台验收
- `v1.0.0`：完成双账号分享、隐私、类目、设备矩阵后首次公开发布
