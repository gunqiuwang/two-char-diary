# 二字爻记

一个原生微信小程序：每天用两个字记录当天，再以一卦作为注脚。

> 产品定位：传统文化灵感日记，而不是命运预测或结果承诺工具。

## 当前功能

- 今日二字：米字格输入、灵感词、自动保存
- 今日一卦：三枚铜钱概率模型、六爻、卦名、卦辞、六条爻辞
- 年历记录：按年月查看历史二字与卦象
- 分享卡片：四种纸张风格、Canvas 海报、保存相册、好友与朋友圈分享
- 数据管理：本地存储、记录概览、清除确认
- 主题：宣纸、绢帛、竹简、素黑
- 动效偏好：标准与减弱两档，设置会同步作用于首页、年历和分享页

## 技术栈

- 微信小程序原生：WXML + WXSS + JavaScript
- 本地存储：`wx.getStorageSync` / `wx.setStorageSync`
- 海报：Canvas 2D
- 当前调试基础库：`3.15.0` 稳定版
- 无后端、无登录、无网络请求、无第三方运行时依赖

## 目录结构

```text
miniprogram/
├── app.js
├── app.json
├── app.wxss
├── project.config.json
├── sitemap.json
├── pages/
│   ├── index/       # 今日二字 + 起卦
│   ├── calendar/    # 年历与历史详情
│   ├── share/       # 分享卡片与 Canvas 海报
│   └── settings/    # 主题、动效、记录概览、清除、关于
└── utils/
    ├── common.js
    ├── hexdata.js   # 六十四卦、卦辞、爻辞
    ├── lunar.js
    ├── solarterm.js
    └── words.js

test-project.js      # 项目静态验证
test-lunar.js        # 农历换算样例验证
test-regression.js   # 回归测试（农历/节气对照天文台、存储迁移、备份、分享参数）
test-fixtures/       # 香港天文台 1901–2050 历表摘录
docs/                # 验收、审计和 Agent Vault
```

## 本地运行

1. 微信开发者工具导入 `miniprogram` 目录。
2. 使用稳定基础库 `3.15.0`，不要使用标记为灰度的基础库做最终验收。
3. 点击“编译”。
4. 至少进行一次 iOS、Android 真机预览。

## 自动检查

```bash
node test-project.js
node test-lunar.js
node test-regression.js
```

`test-project.js` 检查：

- JS 语法
- JSON 格式
- 页面路由完整性
- WXML 事件绑定
- 常见中文乱码
- 六十四卦数量与六爻数据
- 推荐词写入与本地保存
- 备份导入校验、冲突统计和合并保护
- 当前静态包体大小

2026-07-10 检查结果：

```text
包体静态文件总大小：163.0 KB
项目静态检查通过
农历测试：6 passed / 0 failed / 2 info
```

## 本地数据结构

存储键：`diary_data`

```js
{
  "2026-07-10": {
    words: "盛夏",
    yaos: [
      { type: "yang", moving: false, value: 7 }
    ],
    yaoTexts: [],
    hexagramSymbol: "䷎",
    hexagramName: "地山谦",
    hexagramText: "亨，君子有终",
    lunarYear: "丙午年",
    lunarMonthDay: "五月廿六",
    timestamp: 1783650000000
  }
}
```

## 分享说明

- 从首页或年历内部进入分享页时，分享页读取本地记录。
- 分享给其他用户时，二字、农历、卦名、卦辞和爻线会作为分享参数传递。
- 接收者即使没有本地记录，也能看到基础分享内容。
- 六条完整爻辞不会写入分享 URL；海报图片生成成功时，完整内容体现在图片中。
- 分享页不再提供重复的背景选择；背景统一在设置页修改，并同步应用到分享页和生成海报。

## 发布前必须完成

- 微信公众平台配置正确服务类目、名称、简介、头像和截图
- 核对《小程序用户隐私保护指引》与实际 API 行为一致
- 真机验证保存相册权限、好友分享、朋友圈分享
- 运行开发者工具“代码质量”和“体验评分”
- 使用稳定基础库完成上传前验收
- 文案坚持“传统文化记录/灵感”，避免“算准、改运、保证结果”等承诺

完整审计：`docs/PROJECT_AUDIT_2026-07-10.md`

提审清单：`docs/WECHAT_SUBMISSION_CHECKLIST.md`
