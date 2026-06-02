---
type: testing
status: active
confidence: medium
last_updated: 2026-06-02
owner: agent
reviewed_by: unreviewed
---

# Testing and Verification

## No Automated Test Suite

项目无自动化测试。验证依赖手动 QA。

## Manual QA Checklist

- [ ] 首页加载，暖米白底色正确
- [ ] 米字框输入一个字后自动跳转下一个
- [ ] 铜钱点击后 6 轮动画正常执行
- [ ] 动画完成后卦名+卦辞正确显示
- [ ] 分享页二字正确传递
- [ ] Canvas 海报生成完整（二字+卦象+卦名）
- [ ] 保存图片到相册成功
- [ ] 年历页 12 个月正确显示
- [ ] 有记录日期显示铜色小点
- [ ] 设置页提醒时间选择正常
- [ ] 导出数据到剪贴板成功
- [ ] 清除数据二次确认弹窗正常

## Critical User Flows

| Flow | Steps | Expected |
|------|-------|----------|
| 记录今日 | 输入二字 → 铜钱 → 等待动画 → 看到卦象 | 二字+卦象保存成功 |
| 分享 | 记录后 → 点击「记下这一日」→ 保存海报 | 海报完整，保存成功 |
| 查看历史 | 年历页 → 点击有记录日期 → 看到分享卡片 | 数据正确显示 |
