---
type: architecture
status: active
confidence: high
last_updated: 2026-07-10
owner: agent
reviewed_by: agent
---

# Architecture

## Stack

| Layer | Technology |
|---|---|
| Platform | 微信小程序 |
| Framework | Native WXML + WXSS + JavaScript |
| Storage | 同步本地 Storage |
| Canvas | Canvas 2D node API |
| Share | 好友分享 + 朋友圈 query 快照 |
| Backend | None |
| Network | None |
| Runtime dependencies | None |

## Routes

```text
pages/index/index       # 首页：二字、日期、起卦
pages/share/share       # 分享卡、Canvas、保存相册
pages/calendar/calendar # 年历、历史详情、历史分享
pages/settings/settings # 主题、导出、清除、关于
```

## Utilities

```text
utils/common.js      # 日期键、主题、窗口信息
utils/hexdata.js     # 64 卦、卦辞、每卦 6 条爻辞
utils/lunar.js       # 公历转农历
utils/solarterm.js   # 节日、近似节气、推荐词
utils/words.js       # 二字词库
```

## Core Data Flow

```text
输入二字
  -> diary_data[YYYY-MM-DD].words

点击起课
  -> 生成 6 爻
  -> 查 HEX_DATA
  -> 保存 yaos / yaoTexts / hexagramName / hexagramText

进入分享页（内部）
  -> 按 date 从本地 Storage 读取

打开好友分享（外部）
  -> 分享 query 优先
  -> 本地记录不覆盖发送者快照

生成海报
  -> Canvas 2D
  -> DPR capped at 2
  -> temp file
  -> album / share image
```

## Storage

### `diary_data`

```js
{
  "YYYY-MM-DD": {
    words,
    yaos,
    yaoTexts,
    hexagramSymbol,
    hexagramName,
    hexagramText,
    lunarYear,
    lunarMonthDay,
    timestamp
  }
}
```

### `settings`

```js
{
  bgStyle: 'xuan' | 'silk' | 'bamboo' | 'dark'
}
```

## Share Trade-off

MVP 无后端，因此跨设备分享把以下基础快照放入 query：

- date
- two characters
- lunar date
- hexagram name
- hexagram text
- six binary lines

完整六条爻辞不写入 query，以控制长度。长期方案是云端短期 token。

## Architectural Risks

| Risk | Mitigation |
|---|---|
| Local-only data loss | 已支持导出；下一步增加导入 |
| Query snapshot privacy | 仅主动分享；长期改为短期 token |
| Approximate solar terms | 下一步替换准确算法 |
| No schema migration | 增加 storage schema version |
| Custom navigation variants | 真机矩阵测试后统一胶囊坐标 |
