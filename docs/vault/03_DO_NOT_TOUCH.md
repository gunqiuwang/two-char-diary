---
type: danger-zones
status: active
confidence: high
last_updated: 2026-06-02
owner: human
reviewed_by: human
---

# DO NOT TOUCH

## Files That Must NOT Be Changed Casually

| File | Why | Who Can Change |
|------|-----|---------------|
| `app.js` HEX_DATA section | 64 hexagram data, any change breaks all hexagrams | Human approval |
| `app.wxss` color variables | Kami design foundation, changing breaks visual identity | Human approval |
| `pages/index/index.js` coin animation | Core interaction, fragile timing logic | Agent with testing |

## Business Logic — Hands Off

| System | Rule | Exception |
|--------|------|-----------|
| 爻线生成算法 | Do not change 6-round casting logic | Bug fix with human approval |
| 二字信息层级 | Two chars > hexagram > oracle text | Never reorder |
| 铜钱三态 | idle/casting/result must all exist | Never remove a state |

## Security Rules

**Never include in any vault file:**
- WeChat AppID or AppSecret
- Any API keys or tokens
- User data (recorded two-char entries)
- Personal information

## Known Fragile Systems

| System | What Breaks | How to Avoid |
|--------|-------------|--------------|
| 铜钱动画时序 | Animation may desync | Don't change setTimeout values without testing |
| Canvas poster generation | Empty poster if data missing | Always read from storage, not page data |
| 米字框自动跳转 | Input may lose focus | Don't change focus() timing |

## Commands Requiring Approval

| Command | Why |
|---------|-----|
| 微信开发者工具「上传」 | Pushes to production |
| `git push --force` | Overwrites history |
