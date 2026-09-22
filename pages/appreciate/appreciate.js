/**
 * pages/appreciate/appreciate.js — 鉴赏页
 * --------------------------------------------------------------------------
 * 设计稿：Figma「鉴赏页」（node 61:121）
 * 内容为静态渲染（图片直接以绝对路径写入 WXML），仅保留页面生命周期
 * 与各交互入口的事件占位。
 * 导航栏为自定义（navigationStyle: custom），需注入状态栏高度。
 */

const transition = require('../../utils/transition');

Page({
  /**
   * 页面数据
   */
  data: {
    /** 状态栏高度 CSS 变量（由 applySafeArea 注入，绑定到根节点 style） */
    safeAreaStyle: '--status-bar-h: 44px;',

    /** 转场：入场中（首帧透明，再淡入） */
    entering: true,
    /** 转场：退场中（跳转前先淡出） */
    leaving: false,
  },

  /* ========================================================================
     生命周期
     ======================================================================== */

  onLoad() {
    this.applySafeArea();
  },

  /** 首帧上屏后触发淡入（见 utils/transition.js） */
  onReady() {
    transition.enter(this);
  },

  /**
   * 页面重新显示：重置退场态
   * ⚠️ 必须调用 —— 上级页在跳去下级页时 data.leaving 被置成 true，
   *    navigateBack 回来时它还在，页面会带着 opacity:0 显示，表现为「一片空白」。
   */
  onShow() {
    transition.resume(this);
  },


  onUnload() {
    transition.clear(this);
  },

  /* ========================================================================
     机型适配：状态栏高度注入（自定义导航栏需避开状态栏）
     ======================================================================== */

  applySafeArea() {
    try {
      const windowInfo =
        typeof wx.getWindowInfo === 'function'
          ? wx.getWindowInfo()
          : wx.getSystemInfoSync();

      const statusBarHeight = (windowInfo && windowInfo.statusBarHeight) || 44;
      this.setData({
        safeAreaStyle: `--status-bar-h: ${statusBarHeight}px;`,
      });
    } catch (err) {
      this.setData({ safeAreaStyle: '--status-bar-h: 44px;' });
    }
  },

  /* ========================================================================
     交互
     ======================================================================== */

  /**
   * 搜索入口
   * TODO: 接入搜索页（/pages/search/search）后打开
   */
  onSearch() {},

  /**
   * 上一件 / 下一件展品
   * TODO: 接入展品数据源后切换索引
   */
  onPrev() {},
  onNext() {},

  /**
   * 底部导航点击（首页 / 导览 / 鉴赏 / 我的）
   * 说明：四个 Tab 均为独立页面（app.json 未配置原生 tabBar），
   *       切换用 reLaunch 清栈，避免来回点击导致页面栈无限堆叠。
   */
  onTabTap(e) {
    const { tab } = e.currentTarget.dataset;
    const url =
      tab === 'index' ? '/pages/index/index'
        : tab === 'guide' ? '/pages/guide/guide'
          : tab === 'mine' ? '/pages/mine/mine'
            : '';
    if (!url) return; // 命中当前页（鉴赏），无需跳转
    transition.leave(this, () => {
      wx.reLaunch({ url });
    });
  },
});
