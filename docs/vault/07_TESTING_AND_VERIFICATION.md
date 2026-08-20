---
type: testing
status: active
confidence: high
last_updated: 2026-07-10
owner: agent
reviewed_by: agent
---

# Testing and Verification

## Automated Checks

```bash
node test-project.js
node test-lunar.js
```

Current result:

```text
包体静态文件总大小：163.0 KB
项目静态检查通过
农历测试：6 passed / 0 failed / 2 info
```

`test-project.js` validates:

- JavaScript syntax
- JSON parsing
- app route files
- WXML event handlers
- common mojibake patterns
- 64 hexagrams
- 6 yao texts per hexagram
- candidate-word write and local persistence
- static package size

## Manual Critical Flows

### Record today

1. Open home.
2. Enter or paste two characters.
3. Modify one saved character.
4. Blur an incomplete edit.
5. Cast once.

Expected:

- Focus behavior is usable.
- Incomplete edits restore saved content.
- Saved stats refresh immediately.
- Casting cannot be duplicated.
- Result survives page navigation.

### Calendar

1. Open calendar.
2. Select a recorded day.
3. Change month/year.
4. Return to the recorded month.
5. Generate a historical share card.

Expected:

- Record dots are correct.
- Old detail clears after changing month/year.
- Selected record opens the correct share date.

### Cross-device share

Use two different WeChat accounts:

1. Sender shares a record.
2. Receiver already has a different local record on the same date.
3. Receiver opens sender's share.

Expected:

- Sender content wins over receiver local storage.
- No local data is overwritten.
- External page back button returns home.

### Local data and clear

1. Confirm the overview shows record days, cast count and latest date.
2. Tap clear data and cancel once.
3. Confirm clear and reopen home and calendar.

Expected:

- The warning states that deletion cannot be recovered.
- Cancel leaves all records intact.
- Confirm clears home, calendar and the overview count.

### Reduced motion

1. Set motion to reduced.
2. Reopen home, calendar, share and settings.

Expected:

- Decorative motion is reduced across all pages.
- Functional state changes still complete normally.

### Album permission

Test on iOS and Android:

- first permission grant
- permission denial
- open settings recovery
- repeated save taps
- all four poster styles

## Device Matrix

- iPhone small screen
- iPhone notch / Dynamic Island
- Android common devices
- HarmonyOS WeChat
- large font accessibility setting
- light and dark themes
- offline mode

Full checklist: `docs/WECHAT_SUBMISSION_CHECKLIST.md`.
