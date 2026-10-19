# 二字爻记 · 全面审计报告（2026-10-19）

> 审计日期：2026-10-19
> 基线：`cc2f62b v1.x 线上基线`（工作区干净）
> 范围：`miniprogram/` 全部源码（4 页面 + 5 个 utils + 配置）、测试脚本、既有审计文档
> 上轮审计：`docs/PROJECT_AUDIT_2026-08-20.md`。本报告先复核其遗留项状态，再列本轮新发现。
> 方法：逐文件人工审阅 + 脚本实测（脚本逻辑见第 6 节，建议并入 `test-lunar.js`）

---

## 1. 总体结论

主流程（记字 → 起卦 → 年历回看 → 海报分享）完整，代码整洁，无网络请求、无密钥、包体 164.8 KB。卦象数据、起卦概率、农历主算法经脚本复核均正确。

**但本轮发现 1 个会在长期用户身上必然触发的数据丢失风险（P0），以及 3 个已可复现的显示错误（P1）。** 上轮遗留的 11 项全部仍未处理。

> **更新**：P0/P1（N1–N6）已在同日修复，修复中又发现并修复了夏令时导致的农历错日（N15）。详见第 7 节。下表「状态」列为修复后的状态。

| 级别 | 数量 | 摘要 |
|---|---|---|
| P0 | 1 | 单 key 存储 1 MB 上限 → 约 3.8–5.4 年后写入失败且无提示 |
| P1 | 5 | 节气多标 3 倍、闰月误报节日、分享链接可伪造任意文案、农历越界静默乱码、无备份/导出 |
| P2 | 8 | 灵感词重复 key、海报封面比例、权限错误识别、无更新管理/错误监控等 |
| P3 | 若干 | WXSS 重复定义、重复 setData、版本号硬编码等维护项 |

---

## 2. 自动化检查结果（本次实测）

```text
node test-project.js   → 包体 164.8 KB，项目静态检查通过
node test-lunar.js     → 6 passed / 0 failed / 2 info
补充脚本：
  HEX_DATA 64 卦 × 6 爻，键位与「九/六」爻题一致性 → 0 处不符 ✅
  农历：2020/2023 闰月、2026/2027/2030/2050 春节 → 全部正确 ✅
  除夕（2020–2050 每年）→ 0 漏判 ✅
  闰月误报节日（2020–2050）→ 7 处 ❌
  2026 年被标为节气的天数 → 72 天（应为 24）❌
  灵感词：节气/节日推荐词表与随机词库重叠 → 22 / 47 张表 ❌
  单条记录（含起卦）平均体积 → 750 字节 UTF-8 / 536 字符
  LUNAR_INFO 条目数 → 151（覆盖 1900–2050）
  solarToLunar(2051,6,1) → "辛未年 四月廿四"（静默错误结果）❌
```

---

## 3. 上轮（08-20）遗留项复核

| 编号 | 问题 | 状态 | 位置 |
|---|---|---|---|
| A1 | `project.config.json` description 仍为「二字日记」 | 未修 | `miniprogram/project.config.json:2` |
| A2 | 年历年份无上下界 | **已修**（N4，年份钳制 1900–2050） | `pages/calendar/calendar.js:172-178` |
| A3 | `libVersion` 3.15.0（仅 v2 AI 需要 ≥3.15.1） | 未修，v1 无影响 | `project.config.json:50` |
| A4 | 海报行数估算用 `text.length` | 未修 | `pages/share/share.js:446-449` |
| A5 | 无 `wx.onError` / `onUnhandledRejection` | 未修 | `app.js` |
| A6 | `parseInt` 缺 radix | **已修**（随 N1 改用 `Number`） | `pages/calendar/calendar.js:122` |
| 4.5 | 节气固定日期 + ±1 天 | **已修**（N2，实测原影响 72 天/年） | `utils/solarterm.js:109-118` |
| 4.6 | 数据仅存本机 | **已缓解**（N6 剪贴板导出/导入）；云同步留待 v2 | — |
| 4.7 | 分享 URL 明文携带内容 | **已修**（N3，入链只信任 date/w/l/s） | `pages/share/share.js:40-63` |
| 4.9 | 自定义导航未按胶囊坐标适配 | 未修（全项目无 `getMenuButtonBoundingClientRect`） | 4 个页面 `.json` 均 `navigationStyle: custom` |
| 4.10 | 本地数据无 schema version | **已修**（N1，`diary_schema` = 2） | `app.js:4-6` |

**对上轮报告的一处更正**：08-20 报告 4.2 节称「一年全勤 < 250 KB，远低于 10 MB 上限」。10 MB 是总配额，而全部记录存在**同一个 key** `diary_data` 下，适用的是**单 key 1 MB** 上限，结论需要修正（见 N1）。

---

## 4. 本轮新发现

### P0

#### N1. 单 key 存储上限：长期用户约 4–5 年后无法再保存，且无任何提示

**现象链路**

1. 所有记录存在一个 key：`wx.setStorageSync('diary_data', data)`（`pages/index/index.js:348`、`:436`）。
2. 微信本地缓存单个 key 上限为 1 MB。
3. 实测单条记录约 750 字节（UTF-8）/ 536 字符，主要体积来自冗余存储的 `yaoTexts`（6 条爻辞）、`hexagramText`、`hexagramName`、`hexagramSymbol`，以及 `yaos` 里的 `{type, moving, value}` 对象，这些都可以由 6 位阴阳串从 `HEX_DATA` 推导出来。
4. 每天记字 + 起卦，约 **1 400–1 950 天（3.8–5.4 年）** 触顶。文档没说明按字节还是按字符计算，所以给出区间。
5. 触顶后 `setStorageSync` 抛异常，没有 try/catch：
   - `commitWords` 中断于 `:348`，「已记下」toast 不弹，但输入框已显示两个字，用户以为保存了；
   - `saveHex` 在 setData 回调中抛错，卦象显示了却没落盘，下次进入消失。
6. 此外每次读写都整体序列化整个对象，记录越多越慢（`onShow` 一次就要 `getStorageSync('diary_data')` 2 次以上）。

**修复建议**

- 精简存储结构并加版本号（同时关闭 4.10）：

  ```js
  // 新结构：约 60 字节/条，1 MB 可存 40+ 年
  // diary_data = { v: 2, records: { '2026-10-19': { w: '平静', l: '100010', t: 1760000000000 } } }
  // l：自下而上 6 位，1=阳 0=阴；需要动爻时可存 '7896' 序列，如 l: '798777'
  ```

- 在 `app.js onLaunch` 做一次迁移：遍历旧记录，`yaos` 转 `l` 串，丢弃可推导字段。
- 读取侧同步改：`calendar.js loadDetail`（读 `d.yaoTexts`/`d.hexagramName`）、`share.js onLoad`（读 `stored.yaoTexts`/`stored.hexagramName`）都改为 `HEX_DATA[l]` 推导。旧记录里没有 `yaoTexts` 的，本来就显示「暂无爻辞记录」，迁移后也能补出来。
- 所有写入包一层：

  ```js
  function safeSet(key, value) {
    try { wx.setStorageSync(key, value); return true }
    catch (e) { wx.showModal({ title: '保存失败', content: '本地存储空间不足', showCancel: false }); return false }
  }
  ```

  `commitWords` 中只有 `safeSet` 返回 true 才进入「已记下」状态。
- 恢复「导出/备份」能力（见 N5）。

### P1

#### N2. 节气一年标注 72 天，是实际的 3 倍

`getSolarTerm` 在固定日期基础上又把前后各 1 天也算作节气（`utils/solarterm.js:115`），所以每个节气连续显示 3 天，推荐词也连续 3 天相同。同时固定日期本身在部分年份有 ±1 天误差。

- 立即修：删除 `:114-115` 的 ±1 匹配。
- 根治：`LUNAR_INFO` 出自经典 calendar.js 农历库，该库同时有 `sTermInfo` 节气表（1900–2100 每年 24 节气精确日）。直接引入可得到精确日期，体积约 6 KB。

#### N3. 分享链接可伪造任意文案，以小程序名义展示

`share.js onLoad` 对来自链接的 `hn`（卦名）、`ht`（卦辞，最长 160 字）、`ly`/`lm`（农历）原样展示（`:53-58`），还会据此生成海报。任何人改写分享 path 就能让「二字爻记」卡片上显示任意 160 字内容并继续转发，存在内容安全与品牌风险。

修复：入链路径只信任 `date`、`w`、`l`、`s` 四个参数，其余全部本地推导：

```js
const hex = HEX_DATA[lineString] // lineString 是 6 位
const lunar = solarToLunar(y, m, d)
hexagramName = hex ? hex.name : ''
hexagramText = hex ? hex.ci : ''
lunarYear = `${lunar.ganZhiYear}年`
// buildShareQuery 同步删掉 ly/lm/hn/ht
```

这样可注入内容只剩 2 个字。注意 `l` 是**自上而下**拼的（`hexLines` 已 reverse），查 `HEX_DATA` 前要先反转回自下而上。同时可以把爻辞也补给接收方（现在接收方 `displayYaos: []`，看到的卡片比发送方少一段）。

#### N4. 农历越界静默返回错误结果

`LUNAR_INFO` 只有 151 条（1900–2050）。越界时不报错，而是返回看似合理的错误值：

```text
solarToLunar(2051, 6, 1) → "辛未年 四月廿四"   （数据缺失下算出的错误月日）
solarToLunar(1899, 6, 1) → "己亥年 正月undefined"
```

年历可无限翻页（A2），`share.js normalizeDateKey` 上限 2050 是对的，其他入口没有统一约束。

修复：`solarToLunar` 入口加范围判断，越界返回 `null`，调用方兜底不显示农历；`calendar.js prevYear/nextYear` 钳制在 1900–2050。

#### N5. 闰月误报传统节日

`getLunarFestival(lunarMonth, lunarDay, lunarYear)` 没有接收 `isLeap`，闰月同日也会命中节日。2020–2050 实测 7 处：

```text
2023-03-23 闰二月初二 → 龙抬头      2028-06-27 闰五月初五 → 端午节
2039-06-26 闰五月初五 → 端午节      2042-03-23 闰二月初二 → 龙抬头
2044-08-29 闰七月初七 → 七夕        2044-09-06 闰七月十五 → 中元节
2047-06-27 闰五月初五 → 端午节
```

最近一次在 2028 年。修复：`getSpecialDate` / `getDailyWords` / `getLunarFestival` 增加 `isLeap` 参数，闰月直接返回 null；调用处 `index.js:93`、`:184` 传 `lunar.isLeap`。

#### N6. 无任何备份/迁移途径

`041a611` 移除了导出功能，现在换机、删小程序、清缓存都会丢掉全部记录（关于页已有提示）。对「日记」类产品，这是用户最在意的风险。最低成本的方案任选其一：

- 设置页「导出记录」：生成纯文本（`2026-10-19 平静 水雷屯`）后 `wx.setClipboardData`，不需要任何权限；
- 「导入」：从剪贴板粘贴同格式文本并合并；
- v2 接入云开发后再做云同步。

### P2

| # | 问题 | 位置 | 建议 |
|---|---|---|---|
| N7 | 灵感词可能重复：节气/节日词表与随机词库在 22/47 张表上有重叠（如春分表含「春分」，季节库也有「春分」），拼接后出现重复词，且 `wx:key="*this"` 会报 key 重复警告 | `index.js:189-190`、`index.wxml:524` | 拼接后去重：`[...new Set([...dailyWords, ...getRandomWords(8)])].slice(0, 8)` |
| N8 | 分享封面用的是长图海报（750×1500+），而微信卡片封面按 5:4 裁切，只能看到标题区 | `share.js:157-166, 500` | 另画一张 500×400 的封面（只画二字 + 卦名），海报保存逻辑不变 |
| N9 | 相册权限错误识别只匹配 `auth`/`deny`。隐私协议未声明时的报错（errno 112 类）不一定含这两个词，用户只会看到「保存失败」**（需真机验证）** | `share.js:180` | 同时判断 `error.errno`；确认公众平台《用户隐私保护指引》已声明「相册（仅写入）」 |
| N10 | 部分安卓输入法在拼音组合阶段就触发 `bindinput`，`maxlength=2` 可能截断拼音或提前提交字母 **（需真机验证）** | `index.wxml:505, 513` | 真机测搜狗/讯飞/Gboard；必要时只在 `bindconfirm`/`bindblur` 时提交，或过滤非汉字 |
| N11 | 没有 `wx.getUpdateManager`，发版后老用户要等冷启动才能拿到新版本 | `app.js` | `onLaunch` 中监听 `onUpdateReady` 后提示重启 |
| N12 | 空格可作为「字」保存（`' '` 为真值） | `index.js:336` | `chars.some(c => !c.trim())` |
| N13 | 只起卦没记字的日子：年历不显示、设置页「清除」判断 `days === 0` 时不会清掉这些数据 | `calendar.js:70`、`settings.js:446` | 清除时直接按 `Object.keys(diaryData).length` 判断 |
| N14 | 动爻（`moving`/`value`）已经生成并存储，但界面完全没用到 | `index.js:419-426` | 要么用来展示变卦和动爻高亮，要么不存（配合 N1 瘦身） |

### P3（维护性）

- **WXSS 层叠堆积**：同一文件里同一选择器重复定义，如 `index.wxss` 中 `.float-nav`（504、899 行）、`.seal`（68、1138 行），`share.wxss` 中 `.back-btn`（38、749 行）、`.float-nav`、`.seal`。纸纹 SVG、状态栏、返回按钮在 4 个页面各写一遍。这不是 bug，但改样式要同时找多处。建议把公共块（纸纹、`.status-bar`、`.back-btn`、`.float-nav`、`.seal`、米字格）收进 `app.wxss`，或抽成一个 `nav-bar` 组件。
- 背景色三元表达式在 4 个 WXML 中重复（`isDark ? '#2a2a28' : bgStyle === 'silk' ? ...`），而 `share.js:222` 还有一份颜色表。建议由 `common.js loadBgStyle()` 直接返回 `bgColor`。
- 首页 `onLoad` 与 `onShow` 都调用 `loadBgStyle`、`loadStats`，首屏重复 setData；年历同理。`onLoad` 只保留一次性初始化即可。
- 版本号「1.0.0」硬编码在 `settings.js:457` 和 `settings.wxml:543` 两处，可改用 `wx.getAccountInfoSync().miniProgram.version`（体验版和开发版返回空字符串，需要兜底）。
- `feTurbulence` SVG 噪点纹理在低端安卓上有渲染开销，`app.json` 也没开 `lazyCodeLoading`。都属于可选优化。
- 仓库根目录的文档较多（`PROJECT-REVIEW.md`、`SKILLS-GUIDE.md`、`skills-lock.json`、多份 ACCEPTANCE/AUDIT），可以归档到 `docs/archive/`。它们不进包体，只影响查阅效率。

---

## 5. 修复优先级清单

| 顺序 | 事项 | 改动量 |
|---|---|---|
| 1 | N1：存储瘦身 + `schemaVersion` 迁移 + `safeSet`，同时改 calendar/share 读取侧 | 中（约 80 行） |
| 2 | N6：剪贴板导出/导入 | 小 |
| 3 | N3：分享入链只信任 `date/w/l/s` | 小 |
| 4 | N2：删除 ±1 天匹配；之后换精确节气表 | 小 / 中 |
| 5 | N5：节日判断传入 `isLeap` | 小 |
| 6 | N4 + A2：农历越界返回 null，年历钳制年份 | 小 |
| 7 | N7、N12、N13、A4、A6、A1 等一行级修复 | 小 |
| 8 | N8 封面图、N11 更新管理、A5 错误监控 | 小 |
| 9 | 真机验证 N9、N10、4.9 胶囊适配 | 测试 |
| 10 | P3 样式收敛 | 中，可延后 |

---

## 6. 建议补充的回归测试

把本轮的验证脚本并入 `test-lunar.js`（或新建 `test-calendar.js`），之后每次改农历/节气/存储都能自动跑：

- 64 卦键位与「九/六」爻题逐爻一致；
- 2020–2050 每年除夕判定正确；
- 2020–2050 闰月日不得命中任何农历节日（当前会失败 7 处）；
- 任意一年被标注为节气的天数 = 24（当前 72）；
- `solarToLunar` 对 1899、2051 返回 null（当前返回错误文本）；
- 单条记录序列化后 < 100 字节（N1 修复后）；
- 灵感词结果无重复。

---

## 7. 修复记录（2026-10-19，同日）

已修复 P0 / P1（N1–N6），未修改 P2 / P3。

| 编号 | 修复方式 | 主要文件 |
|---|---|---|
| N1 | 新增 `utils/diary.js`：记录精简为 `{ words, yao, timestamp }`（`yao` 为自下而上 6 位 6/7/8/9，保留动爻信息），卦名、卦辞、爻辞、农历都按需推导；`app.js` 启动时按 `diary_schema` 版本号迁移一次；全部写入改为 `saveDiary`，失败时弹窗提示并返回 false，首页不会再进入「已记下」/起卦结果状态。读取侧兼容 v1 结构，迁移失败也能正常显示 | `utils/diary.js`、`app.js`、`pages/index/index.js`、`pages/calendar/calendar.js`、`pages/share/share.js`、`pages/settings/settings.js` |
| N2 | 节气改为按太阳视黄经计算（北京时间判日），交节贴近午夜的 13 个日期按香港天文台历表校正。1901–2050 共 3 600 个节气与天文台逐日一致，每年正好 24 天 | `utils/solarterm.js` |
| N3 | 分享入链只信任 `date / w / l / s`，卦名、卦辞、爻辞、农历都在本地推导；`buildShareQuery` 不再输出 `ly / lm / hn / ht`。旧链接里仍带这些参数的，也会被忽略。接收方现在也能看到爻辞 | `pages/share/share.js` |
| N4 | `solarToLunar` 超出 1900-01-31 ~ 2050-12-31 时返回 null，调用方兜底；年历翻页钳制在 1900–2050 | `utils/lunar.js`、`pages/calendar/calendar.js` |
| N5 | `getLunarFestival` 增加 `isLeap`，闰月不过节；`getSpecialDate` / `getDailyWords` 改为接收 `(year, month, day, lunar)` | `utils/solarterm.js`、`pages/index/index.js` |
| N6 | 设置页新增「导出备份」（剪贴板文本，每行 `日期|二字|爻|卦名`）和「从剪贴板导入」（只补缺失内容，不覆盖本机）。**上线前需在公众平台《用户隐私保护指引》中补充声明「剪切板」**，已加入 `WECHAT_SUBMISSION_CHECKLIST.md` | `pages/settings/settings.js/.wxml`、`utils/diary.js` |

### 修复过程中新发现并一并修复

- **N15 农历换算受夏令时影响（P1）**：`solarToLunar` 用本地时间午夜相减再除以 86400000 后向下取整。在中国时区，1919、1940–1949、1986–1991 年的夏令时段会少算一天，3 254 天农历错 1 日。已改为 `Date.UTC` 计算。现在的用户记录不涉及这些年份，但年历回看旧日期会出错。
- **1933 年数据表**：闰五月与六月的大小月和天文台相反（天文台为 30/29，原表为 29/30），已改正 `LUNAR_INFO[33]`。修正后 1901–2050 共 54 787 天的农历与天文台历表逐日一致。

### 回归测试

新增 `node test-regression.js`（6 037 项检查，约 0.3 秒），参考数据为 `test-fixtures/hko-calendar-1901-2050.txt`（香港天文台对照表摘录）：

- 64 卦键位与爻题一致；
- 1901–2050 每个农历初一及其前一天与天文台一致（含闰月）；
- 农历范围边界返回 null；
- 1901–2050 每年节气日期与天文台完全一致；
- 闰月不过节、每年除夕判定正确；
- v1 → v2 迁移结果、单条小于 100 字节、只迁移一次、读取侧兼容 v1；
- 存储写满时 `saveDiary` 返回 false 并提示，首页不进入「已记下」；
- 备份导出 / 解析 / 合并（不覆盖本机、拒绝 1900-01-31 之前或晚于今天的日期）；设置页导出后导入的完整流程；
- 首页起卦只存爻码且显示与存储一致；
- 分享页忽略伪造的 `hn / ht / ly / lm`，生成的参数只含 `date / w / l / s`。

已做变异验证：去掉闰月判断，或还原 1933 年数据，测试都会失败。在 Asia/Shanghai、UTC、America/New_York 三个时区下均通过。

### 仍需真机验证

- 老用户升级后的迁移（建议用体验版装旧版本，写入数据后再覆盖安装新版）；
- 剪贴板导出 / 导入，以及隐私弹窗；
- 回滚风险：若发布后回退到 v1 代码，v1 读不到 `yao` 字段，当天会显示为未起卦（字仍可见）。
