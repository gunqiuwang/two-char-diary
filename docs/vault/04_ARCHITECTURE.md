---
type: architecture
status: active
confidence: high
last_updated: 2026-06-02
owner: agent
reviewed_by: unreviewed
---

# Architecture

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Platform** | WeChat Mini Program |
| **Framework** | Native WXML + WXSS + JS |
| **Storage** | wx.setStorageSync (local) |
| **Canvas** | wx.canvas 2D |
| **Hosting** | WeChat Cloud |

## Main Folders

```
miniprogram/
├── app.js              # Entry + HEX_DATA (64 hexagrams)
├── app.json            # Routes (5 pages)
├── app.wxss            # Global Kami styles
├── utils/
│   ├── words.js        # Two-char word library
│   ├── lunar.js        # Lunar calendar
│   └── hexdata.js      # Hexagram data extension
└── pages/
    ├── index/          # Home (grid input + coin + hexagram)
    ├── share/          # Share (Canvas poster)
    ├── calendar/       # Calendar (12-month grid)
    ├── history/        # DEPRECATED, replaced by calendar
    └── settings/       # Settings (reminder/export/clear)
```

## Data Flow

```
User types two chars -> wx.setStorageSync(key, data)
                             |
Coin click -> 6 rounds animation -> generate lines -> lookup HEX_DATA -> show hexagram
                             |
Share page -> read storage -> render Canvas -> save to album
```

## Key Modules

| Module | Path | Responsibility |
|--------|------|---------------|
| Char input | `pages/index/index.js` | Grid input, auto-advance |
| Coin animation | `pages/index/index.js` | 6-round casting, 3 states |
| Hex generation | `pages/index/index.js` | Line calculation, HEX_DATA lookup |
| Poster gen | `pages/share/share.js` | Canvas draw, save image |
| Calendar | `pages/calendar/calendar.js` | 12-month grid, record marks |
| Word lib | `utils/words.js` | Two-char candidates |

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| No backend, local-only storage | Data loss on device change | Settings has export |
| history page residue | Code bloat | Safe to delete |
| HEX_DATA hardcoded in app.js | Large file | Split to utils/ |
