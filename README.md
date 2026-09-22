# 陶瓷博物馆 · 微信小程序

博物馆导览小程序：启动页、登录、首页、参观指南、展品鉴赏、票务预约、讲解预约、个人中心等，共 10 个页面。

---

## 一、开发工作流

### 1.1 工具链

| 环节 | 工具 |
| --- | --- |
| 设计稿 | Figma |
| AI 生成代码 | **Figma MCP + Claude Code** |
| 编辑器（查看 / 手改） | Trae |
| 预览验收 | 微信开发者工具 |
| 版本管理 | Git + GitHub |

> 早期搭项目骨架时用的是 workbuddy + Trae；进入界面还原阶段后，改为把 Figma 设计稿通过 MCP 接入 Claude Code 生成代码，生成结果在 Trae 中查看和修改。

### 1.2 一次界面改动的完整流程

```
Figma 设计稿
   │  ① 提取设计令牌（色值 / 字号 / 间距 / 圆角）
   ▼
app.wxss 写入语义令牌
   │  ② Figma MCP 把设计稿信息交给 Claude Code
   ▼
Claude Code 生成页面代码（WXML / WXSS / JS / JSON）
   │  ③ 在 Trae 中查看，按需人工修改
   ▼
微信开发者工具 真机预览验收
   │  ④ 验收通过
   ▼
开分支提交 → 提 Pull Request → 合并进 master
```

### 1.3 为什么用 Git 分支兜底

AI 单次生成的改动量往往很大——一个页面的 WXSS 动辄两三百行。
如果直接改 `master`，一旦生成效果不对，回退成本很高。

所以实际流程是：

- **不直接改 `master`**，每次改动先开一个 `feat/xxx` 分支
- 在分支上生成代码，在微信开发者工具里真机验收
- 验收通过 → 提 PR → review → 合并
- **验收不通过 → 直接删掉分支**，`master` 毫发无伤

> 本仓库「预约 / 讲解 / 鉴赏」这批页面即走此流程交付，见 **PR #1**（106 个文件，+4580 / -427）。

### 1.4 字体子集化

思源宋体完整版 11MB+，超出小程序 2MB 主包限制。用 `tools/subset_font.py` 裁剪为 227KB 的子集，只保留项目实际用到的字。

⚠️ **每次新增页面或改文案后必须重跑该脚本。** 历史上出现过「先裁字体、后写登录页」，导致 `陆/住/还/欢/迎` 等字缺失，真机上被系统黑体兜底，表现为宋体与黑体混用。脚本末尾有覆盖率校验，缺字会直接报错。

---

## 二、Git 协作规范

### 2.1 分支命名

| 前缀 | 用途 | 示例 |
| --- | --- | --- |
| `feat/` | 新功能、新页面 | `feat/pages-and-assets` |
| `fix/` | 修 bug | `fix/login-bg-path` |
| `docs/` | 文档 | `docs/update-readme` |
| `chore/` | 配置、依赖、杂项 | `chore/gitignore` |

### 2.2 提交说明（Conventional Commits）

格式：`类型(范围): 说明`

```
feat(login): 新增登录页（还原 Figma 设计稿）
fix(login): 修正背景图 src 反斜杠被转义导致真机 500 无法加载
perf: 背景图转 WebP，主包体积 1.88MB -> 0.47MB
chore: 停止跟踪 project.private.config.json（本地私有配置不入库）
```

常用类型：`feat` 新功能 / `fix` 修 bug / `refactor` 重构 / `perf` 性能 / `docs` 文档 / `chore` 杂项

### 2.3 开发流程

```bash
git pull                              # 1. 先同步远程
git checkout -b feat/xxx              # 2. 开分支，不动 master
#   ... 生成 / 修改代码 ...
#   ... 微信开发者工具真机验收 ...
git add <文件>                         # 3. 暂存（按逻辑分组，不用一把梭）
git commit -m "feat(xxx): 说明"        # 4. 提交
git push -u origin feat/xxx           # 5. 推送分支
#   6. 在 GitHub 网页开 Pull Request
#   7. review 通过后合并，删除分支
git checkout master && git pull       # 8. 回主干并同步
```

### 2.4 什么不进版本库

| 内容 | 原因 | 处理方式 |
| --- | --- | --- |
| `project.private.config.json` | 开发者工具个人配置，每次调试都会变，会产生无意义 diff | `.gitignore` 排除 |
| `assets/_originals_png/` | 已转 WebP 的原始素材，仅本地留存 | `.gitignore` 排除 |
| `node_modules/`、`dist/` | 依赖与构建产物，可由源码还原 | `.gitignore` 排除 |

> 文件若已被提交，需先 `git rm --cached <文件>` 才能停止跟踪（保留本地文件，只从 Git 记录中移除）。

---

## 三、页面进度

| 页面 | 路径 | 状态 | 代码量 |
| --- | --- | --- | --- |
| 启动页 | `pages/splash/` | ✅ 完成 | 700 行 |
| 登录 | `pages/login/` | ✅ 完成 | 1170 行 |
| 首页 | `pages/index/` | ✅ 完成 | 592 行 |
| 参观指南 | `pages/guide/` | ✅ 完成 | 923 行 |
| 展品鉴赏 | `pages/appreciate/` | ✅ 完成 | 521 行 |
| 展品详情 | `pages/detail/` | ✅ 完成 | 550 行 |
| 票务预约 | `pages/booking/` | ✅ 完成 | 514 行 |
| 讲解预约 | `pages/booking-person/` | ✅ 完成 | 672 行 |
| 个人中心 | `pages/mine/` | ✅ 完成 | 665 行 |
| 展品列表 | `pages/list/` | 🚧 骨架 | 52 行 |
| 搜索 | `pages/search/` | 🚧 骨架（未接入路由） | 57 行 |

**已完成 9 个页面**，样式集中在各页面 `.wxss`；`app.wxss` 提供 251 行全局设计令牌。

---

## 四、技术选型

| 项目 | 选择 | 说明 |
| --- | --- | --- |
| 平台 | 微信小程序（原生） | WXML + WXSS + JS + JSON |
| 尺寸单位 | **vw / vh** | 设计稿 750px 基准，1px ≈ 0.1333vw |
| 样式组织 | 全局令牌 + 页面样式 | `app.wxss` 定义令牌，页面只引用语义令牌 |
| 模块规范 | CommonJS | 小程序原生支持 `require` / `module.exports` |
| 组件库 | 不引入 | 页面结构由设计稿决定，手写 WXSS 更可控 |

工程架构参考同级目录 `../优医问诊` 的组织约定。

---

## 五、目录结构

```
陶瓷博物馆/
├── app.js / app.json / app.wxss      入口逻辑 / 全局配置 / 全局样式（设计令牌）
├── pages/                            页面（每个含 .js / .wxml / .wxss / .json）
├── components/                       自定义组件
├── utils/
│   ├── request.js                    网络请求封装
│   ├── util.js                       尺寸换算 / 日期 / 防抖节流
│   ├── storage.js                    本地存储封装
│   └── transition.js                 页面过渡动效
├── styles/                           样式片段
├── assets/
│   ├── images/                       位图素材
│   ├── icons/                        图标资源
│   └── fonts/                        字体子集
├── tools/                            构建脚本（字体子集化等）
└── docs/                             设计规范与结构说明
```

---

## 六、在微信开发者工具中运行

1. 打开**微信开发者工具** → 选择「导入项目」
2. 目录选择本仓库根目录
3. AppID 填写自己的小程序 AppID（或选「测试号」）
4. 导入后即可预览

> `project.private.config.json` 是个人本地配置，**不在版本库中**。导入时按第 3 步填写 AppID 即可，开发者工具会自动生成该文件。

---

## 七、设计令牌与尺寸约定

### 7.1 业务代码只引用语义令牌，不直接写色值

```css
/* ✅ 正确 */
.card {
  color: var(--color-text-primary);
  background-color: var(--color-bg-surface);
  padding: var(--space-base);
  border-radius: var(--radius-lg);
}

/* ❌ 禁止 */
.card {
  color: #1a1c20;
  background-color: #fff;
}
```

改设计规范时只需改 `app.wxss` 一处，全站生效。

> ⚠️ **例外**：`pages/*/*.json` 中的 `backgroundColor` 必须写字面色值——这是微信平台的页面配置要求，不支持 CSS 变量。

### 7.2 尺寸换算（设计稿基准 750px）

```
vw 值 = 设计稿 px ÷ 750 × 100
```

| 设计稿 px | vw 值 |
| --- | --- |
| 16px | 2.1333vw |
| 24px | 3.2vw |
| 32px | 4.2667vw |
| 48px | 6.4vw |
| 88px | 11.7333vw |

推荐用 `calc()` 保留设计稿原值，便于对照：

```css
.card { padding: calc(32 / 750 * 100vw); }
```
