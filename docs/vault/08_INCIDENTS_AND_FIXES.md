---
type: incidents
status: active
confidence: high
last_updated: 2026-07-10
owner: agent
reviewed_by: agent
---

# Incidents and Fixes

## 2026-07-10｜年历页爻辞正文被挤成竖列

- 现象：六条爻辞的爻位标签显示在左侧，正文被压缩到页面最右侧并逐字竖排。
- 根因：旧版两列布局中的 `.record-yao text { width: 100%; }` 仍在生效，覆盖了新版单列布局中标签的固定宽度，导致正文 flex 项宽度被压缩到接近 0。
- 修复：删除旧两列布局规则；标签改为固定 `76rpx`；正文改用普通 `view` 容器并明确 `flex: 1`、横向书写和自动换行。
- 验证：项目静态检查、农历测试和 `git diff --check` 均通过。


## [2026-07-10] 首页递归更新与模板数组访问异常

- **现象**：点击米字格后出现 `recursive update detected`，并报 `Cannot read property '0' of undefined`；分享保存出现 `showLoading 与 hideLoading 必须配对使用`。
- **根因**：米字格输入框通过 `wx:if` 动态创建后又在 `nextTick` 二次 `setData` 聚焦；推荐词保存后又立即调用统计更新形成第二次 `setData`；WXML 直接访问 `chars[0] / chars[1]`；分享页依赖全局 loading 状态。
- **修复**：输入框改为始终存在，锁定态禁用触摸；一次点击只做一次 `setData`；模板改用稳定的 `char1 / char2` 字段；推荐词提交把统计数据并入同一次更新；保存图片以按钮文案显示“生成中”，移除 `showLoading / hideLoading`。
- **验证**：`node test-project.js`、`node test-lunar.js`、`git diff --check` 全部通过；自动测试覆盖点击米字格和选择“盛夏”后状态及本地存储。

## [2026-07-10] 推荐词点击后未显示到米字格

- **现象**：灵感词可以正常出现，但点击推荐的两个字后，米字格仍显示旧内容或空白。
- **根因**：`setData()` 尚未完成时立即调用 `saveWords()`，保存函数读取到旧的 `this.data.chars`。
- **修复**：推荐词选择、双字粘贴、单字补全全部改为在 `setData` 回调中执行保存。
- **验证**：`node test-project.js`、`node test-lunar.js`、`git diff --check` 均通过；仍需开发者工具与真机点击确认。

## [2026-07-10] 点击米字格后灵感词不稳定显示

- **现象**：点击已有记录的米字格后，灵感词可能不出现、闪一下后消失，或输入框立即失焦。
- **根因**：条件渲染的 `input` 与 `focus=true` 在同一次 `setData` 中执行，部分基础库/机型无法稳定聚焦；随后 `blur` 的 80ms 自动恢复逻辑又关闭了提示词。
- **修复**：先渲染 input，再通过 `wx.nextTick` 聚焦；提示词区域触摸时取消 blur 定时器；自动恢复延时调整为 320ms；编辑开始后 600ms 内忽略伪 blur。
- **验证**：`node test-project.js` 通过；仍需在 iOS、Android 真机点击已有记录米字格验证。


## 2026-07-10 · Share page mojibake

### Symptom

Static labels on `pages/share/share` displayed as strings such as `浜屽瓧`, `淇濆瓨`, and `鍒嗕韩`, while dynamic diary content remained normal.

### Root Cause

The Chinese source text in `share.wxml` had already been corrupted. Font fallback changes could not repair corrupted source characters.

### Fix

- Rewrote `share.wxml` as valid UTF-8.
- Removed custom/external font assumptions.
- Added common mojibake scanning to `test-project.js`.

### Verification

- Static labels display as `二字爻记`, `保存`, and `分享`.
- Source code points validated.
- Project static check passes.

## 2026-07-10 · Gray base library DevTools error

### Symptom

DevTools reported an internal `__subPageFrameEndTime__` error while using gray base library `3.16.0`.

### Root Cause

Stack pointed to `WAServiceMainContext.js`, not project source. The selected base library was marked gray.

### Fix

- Switched project baseline to stable `3.15.0`.
- Removed deprecated `getSystemInfoSync` fallback from project code.

### Verification

- Shared and private DevTools configs aligned to the stable baseline before the private config was removed from Git tracking.
- Project uses `wx.getWindowInfo()`.

## 2026-07-10 · Receiver local data overrode sender share

### Symptom

A receiver who had a local diary record on the same date could see their own record instead of the sender's shared snapshot.

### Root Cause

Share page loaded local storage before checking share query data.

### Fix

Share query data now has priority. Local storage is only used for internal navigation without a shared snapshot.

### Verification

Requires two-account real-device confirmation before release.
