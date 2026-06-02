---
type: decision-log
status: active
confidence: high
last_updated: 2026-06-02
owner: both
reviewed_by: human
---

# Decision Log

## Decision: Kami Design Style

**Date:** 2026-05 | **Status:** Accepted
**Decision:** Kami style: warm white #f5f4ed, copper #B8A88A, serif, minimal whitespace
**Why:** User prefers clean elegant design. "Ugly = redraw, don't patch"
**Do not reverse unless:** User explicitly requests style change
**Related files:** `app.wxss`, all page wxss

## Decision: Two-char primary, hexagram secondary

**Date:** 2026-05 | **Status:** Accepted
**Decision:** Info hierarchy: two chars > hexagram > oracle text. No oracle text on home page.
**Why:** Core concept is "two-char recording", hexagram is supplementary
**Do not reverse unless:** Product positioning changes
**Related files:** `pages/index/index.wxml`

## Decision: Coin always visible

**Date:** 2026-05 | **Status:** Accepted
**Decision:** Coin button always shown on home page. Three states: idle/casting/result
**Why:** Coin is the core interaction, must not be hidden
**Related files:** `pages/index/index.js`, `pages/index/index.wxss`

## Decision: Separate input per grid cell

**Date:** 2026-05 | **Status:** Accepted
**Decision:** Two grid cells each use independent input, auto-advance after one char
**Why:** More natural writing experience
**Related files:** `pages/index/index.wxml`, `pages/index/index.js`
