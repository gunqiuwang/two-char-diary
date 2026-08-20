---
type: commands-and-files
status: active
confidence: high
last_updated: 2026-07-10
owner: agent
reviewed_by: agent
---

# Commands and Files

## Safe Verification Commands

```bash
node test-project.js
node test-lunar.js
```

Additional read-only checks:

```bash
git status --short
git diff --stat
find miniprogram -maxdepth 4 -type f | sort
```

## Developer Tool Actions

| Action | Purpose | Risk |
|---|---|---|
| 编译 | Simulator preview | Low |
| 预览 | Real-device QR preview | Low |
| 真机调试 | Device console and behavior | Low |
| 代码质量 | Static platform checks | Low |
| 体验评分 | UI/performance checks | Low |
| 上传 | Send version to WeChat backend | High |

## Important Files

| File | Notes |
|---|---|
| `README.md` | Current project overview |
| `PROJECT-REVIEW.md` | Current review summary |
| `docs/PROJECT_AUDIT_2026-07-10.md` | Full audit |
| `docs/WECHAT_SUBMISSION_CHECKLIST.md` | Manual release checklist |
| `test-project.js` | Static project verification |
| `test-lunar.js` | Lunar sample verification |
| `miniprogram/project.config.json` | Shared DevTools config |
| `miniprogram/project.private.config.json` | Local-only; must stay ignored |

## Do Not Run Without Explicit Approval

```bash
git reset --hard
git clean -fd
git push --force
```

Do not click “上传” or submit a review solely because static tests pass. Real-device and WeChat backend checks remain mandatory.
