# Claude Code Skills 功能速查

> 已安装 21 个 skills，按场景分类。
> 做项目时对照此表，有对应 skill 就用，不要造轮子。

---

## 一、设计 & 前端

| Skill | 什么时候用 | 示例场景 |
|-------|-----------|---------|
| `frontend-design` | 做网页、落地页、Web App UI | "做个产品首页"、"设计登录页" |
| `huashu-design` | 高保真 HTML 原型、交互 Demo、幻灯片 | "做个 App 原型"、"做个 PPT" |
| `huashu-md-html` | Markdown 转精美 HTML 文档 | "把这篇文档排版成网页" |
| `guizang-ppt-skill` | 浏览器演示稿/PPT | "做个演讲幻灯片" |
| `html-ppt` | HTML 方式的 PPT | "用 HTML 做 PPT" |

## 二、文档 & 办公

| Skill | 什么时候用 | 示例场景 |
|-------|-----------|---------|
| `pptx` | 生成/编辑 .pptx 文件 | "生成一个 PowerPoint" |
| `docx` | 生成/编辑 .docx 文件 | "写个合同文档" |
| `xlsx` | 生成/编辑 .xlsx 文件 | "做个数据报表" |

## 三、图片 & 媒体 & 图表

| Skill | 什么时候用 | 示例场景 |
|-------|-----------|---------|
| `baoyu-image-gen` | AI 生成图片 | "生成一张海报" |
| `baoyu-infographic` | 信息图、可视化 | "做个数据信息图" |
| `baoyu-diagram` | 技术图表、流程图 | "画个架构图" |
| `fireworks-tech-graph` | 技术图表 | "画个系统架构图" |
| `baoyu-url-to-markdown` | 网页转 Markdown | "把这篇文章抓下来" |

## 四、动画 & 交互

| Skill | 什么时候用 | 示例场景 |
|-------|-----------|---------|
| `gsap-core` | GSAP 动画核心 | "加个滚动动画" |
| `gsap` (hyperframes) | GSAP 高级动画 | "做个页面过渡动画" |

## 五、浏览器 & 自动化

| Skill | 什么时候用 | 示例场景 |
|-------|-----------|---------|
| `web-access` | 网页研究、信息获取 | "搜一下这个产品的信息" |
| `opencli-usage` | 浏览器自动化 | "自动填表"、"抓取数据" |
| `webapp-testing` | Web 应用测试 | "测试一下这个页面" |

## 六、安全

| Skill | 什么时候用 | 示例场景 |
|-------|-----------|---------|
| `slowmist-agent-security` | 安全审计 | "审计一下代码安全性" |

## 七、元能力

| Skill | 什么时候用 | 示例场景 |
|-------|-----------|---------|
| `skill-creator` | 创建新 skill | "把这个流程保存为 skill" |

---

## 使用原则

1. **先查表再动手** — 有 skill 就用，不要从零写
2. **小程序开发不用这些** — 微信小程序用原生 WXML/WXSS，这些 skills 主要面向 Web
3. **设计稿用 huashu-design** — 需要先看设计效果时，用 HTML 做原型
4. **图表用 baoyu-diagram 或 fireworks** — 不要自己手画 SVG
5. **文档转换用 baoyu 系列** — Markdown/HTML/信息图都有对应 skill
