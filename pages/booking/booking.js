/**
 * pages/booking/booking.js — 预约页（票务预约）
 * --------------------------------------------------------------------------
 * 设计稿：Figma「预约页」（node 15-254）
 * 内容静态渲染；导航栏为自定义（navigationStyle: custom），需注入状态栏高度。
 */

const transition = require('../../utils/transition');

Page({
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
   * 返回上一页
   */
  onBack() {
    transition.leave(this, () => {
      wx.navigateBack();
    });
  },

  /**
   * Tab 切换（普通参馆 / 特色展览参馆）
   * 说明：占位，后续按 data-tab 切换下方预约选项。
   */
  onTabTap(e) {
    const { tab } = e.currentTarget.dataset;
    // TODO: 切换普通参馆 / 特色展览参馆
  },

  /**
   * 预约选项卡片点击（个人预约 / 团队预约 / 志愿者服务）
   */
  onCardTap(e) {
    const { name } = e.currentTarget.dataset;
    switch (name) {
      case '个人预约':
        transition.leave(this, () => {
          wx.navigateTo({ url: '/pages/booking-person/booking-person' });
        });
        break;
      // 团队预约 / 志愿者服务：对应页面待实现
      default:
        break;
    }
  },

  /**
   * 用户中心按钮点击
   */
  onUserCenter() {
    // TODO: 进入用户中心
  },
});
