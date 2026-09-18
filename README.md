# 陶瓷博物馆 · 微信小程序

微信原生小程序项目。工程架构参考同级目录 `../优医问诊` 的组织约定。

> **当前状态：骨架阶段。**
> 目录结构、全局配置、设计令牌、工具层已就绪；**所有页面均为占位，不含界面实现代码**，等待 Figma 设计规范接入。

---

## 一、技术选型

| 项目 | 选择 | 说明 |
| --- | --- | --- |
| 平台 | 微信小程序（原生） | WXML + WXSS + JS + JSON |
| 开发方式 | **Trae 写码 + 微信开发者工具预览** | Trae 中编辑，开发者工具导入目录运行 |
| 尺寸单位 | **vw / vh** | 设计稿 750px 基准，1px ≈ 0.1333vw |
| 样式组织 | 全局令牌 + 页面样式 | `app.wxss` 定义令牌，页面只引用语义令牌 |
| 模块规范 | CommonJS | 小程序原生支持 `require` / `module.exports` |
| 组件库 | 暂不引入 | 视设计稿复杂度再定（TDesign / Vant Weapp） |

**为什么不用 rpx？**
按你的选择采用 vw/vh，与参考项目 H5 端的适配思路保持一致，便于后续两端共用设计标注换算规则。

---

## 二、目录结构

```
陶瓷博物馆/
├── app.js                    小程序入口逻辑
├── app.json                  全局配置（页面路由 / 窗口 / tabBar）
├── app.wxss                  全局样式：设计令牌 + 全局重置 + 工具类
├── sitemap.json              搜索索引配置
├── project.config.json       项目配置（需填 appid）
├── project.private.config.json  个人配置
├── pages/
│   ├── index/                首页
│   ├── list/                 展品列表
│   ├── detail/               详情
│   ├── search/               搜索
│   └── mine/                 我的
│       └── 每个页面含 4 个文件：.js / .wxml / .wxss / .json
├── components/               自定义组件（待按设计稿创建）
├── utils/
│   ├── request.js            网络请求封装
│   ├── util.js               通用工具（尺寸换算/日期/防抖节流）
│   └── storage.js            本地存储封装
├── styles/                   样式片段（如需拆分主题）
├── assets/
│   ├── images/               位图素材
│   └── icons/                SVG / 图标资源
├── img/ iconfont/ font/      素材目录（备用）
└── docs/
    └── 设计规范收集清单.md      Figma 规范填写模板
```

---

## 三、在微信开发者工具中运行

1. 打开**微信开发者工具** → 选择「导入项目」
2. 目录选择 `C:\Users\xingzi\Desktop\前端\陶瓷博物馆`
3. AppID 填写你的小程序 AppID（或选「测试号」）
4. 导入后即可预览骨架，页面会显示空白占位

> `project.config.json` 中的 `appid` 当前为空，导入时按上面第 3 步填写即可。

---

## 四、尺寸换算规则（vw 方案）

设计稿基准宽度 **750px**，换算公式：

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

**推荐做法**：把 750px 设计稿标注的尺寸直接用 `calc()` 写清楚，可读性更好：

```css
/* 方式一：直接写换算结果 */
.card { padding: 4.2667vw; }

/* 方式二：用 calc 保留设计稿原值，便于对照 */
.card { padding: calc(32 / 750 * 100vw); }
```

也可以在 JS 里用 `utils/util.js` 的 `pxToVw()` 生成内联样式。

---

## 五、设计令牌使用约定

**业务代码只允许引用语义令牌，不直接写色值。**

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
  padding: 32rpx;
  border-radius: 24rpx;
}
```

改设计规范时只需改 `app.wxss` 一处，全站生效。

令牌两层结构：
- **原始令牌** `--c-neutral-500` —— 只存色值
- **语义令牌** `--color-text-tertiary` —— 业务代码只引用这一层

---

## 六、页面开发步骤

1. 在 `pages/xxx/xxx.wxss` 中编写样式，只引用语义令牌
2. 在 `pages/xxx/xxx.json` 中按需配置导航栏、下拉刷新、组件引用
3. 在 `pages/xxx/xxx.js` 中编写页面逻辑（生命周期、事件处理）
4. 交互元素补齐无障碍属性（`aria-label`、`role`、`aria-hidden`）

**已预留的生命周期骨架**：
- 首页：`onLoad` / `onShow` / `onShareAppMessage`
- 列表页：已开启下拉刷新 + 上拉触底（`list.json` 中配置）
- 搜索页：已预留 `onInput` / `onConfirm`

---

## 七、待办（等待 Figma 设计规范）

- [ ] 确认设计稿基准宽度（默认按 750px 处理）
- [ ] 用设计稿真实色值替换 `app.wxss` 中的占位色板
- [ ] 确认字体方案与字号阶梯
- [ ] 导出切图至 `assets/images/`
- [ ] 录入 iconfont 图标（tabBar 图标必需，否则需先移除 tabBar 配置）
- [ ] 确认页面清单与跳转关系
- [ ] 填写 AppID 后可在开发者工具中真机预览

> ⚠️ **注意**：`app.json` 的 `tabBar` 当前未配置图标，微信开发者工具会提示警告。待图标素材就绪后补上 `iconPath` / `selectedIconPath` 即可。
