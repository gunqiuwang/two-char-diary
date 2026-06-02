---
type: commands-files
status: active
confidence: high
last_updated: 2026-06-02
owner: agent
reviewed_by: unreviewed
---

# Commands and Files

## Commands

### Safe Local

| Command | Purpose | Risk |
|---------|---------|------|
| 微信开发者工具「编译」 | Local preview | Safe |
| `git status` | Check changes | Safe |
| `git log --oneline -10` | Recent commits | Safe |

### Medium

| Command | Purpose | Risk |
|---------|---------|------|
| `git push origin master` | Push to GitHub | Medium |
| `git add . && git commit` | Commit changes | Medium |

### Deploy

| Command | Purpose | Risk |
|---------|---------|------|
| 微信开发者工具「上传」 | Upload to WeChat | Critical |

## File Inventory

| File | Purpose | Read When | Update When | Risk |
|------|---------|-----------|-------------|------|
| `app.js` | Entry + HEX_DATA | Understanding data model | Adding hexagram data | High |
| `app.json` | Route config | Adding/removing pages | New page added | Medium |
| `app.wxss` | Global styles | Style changes | Color/font changes | Medium |
| `pages/index/index.js` | Home logic | Bug fixes | Any home feature | High |
| `pages/share/share.js` | Share logic | Share bugs | Poster changes | High |
| `pages/calendar/calendar.js` | Calendar logic | Calendar bugs | Calendar features | Medium |
| `pages/settings/settings.js` | Settings logic | Settings bugs | New settings | Low |
| `utils/words.js` | Word library | Adding words | Word updates | Low |
| `PROJECT-REVIEW.md` | Project review | Before any task | After review | Low |
