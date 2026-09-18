/**
 * pages/splash/splash.js — 启动页
 * --------------------------------------------------------------------------
 * 职责：停留展示 + 引导用户向上滑动进入首页
 *
 * 多机型适配要点：
 *   启动页为全屏沉浸式布局（navigationStyle: custom），
 *   需自行获取状态栏高度并注入 CSS 变量 --status-bar-h，
 *   使顶部 LOGO 区避开状态栏与胶囊按钮，适配 iPhone 15 Pro / 17 Pro Max 等不同机型。
 */

Page({
  data: {
    /** 是否已触发跳转，防止重复跳转 */
    hasNavigated: false,
    /** 状态栏高度 CSS 变量（由 applySafeArea 注入，绑定到根节点 style） */
    safeAreaStyle: '--status-bar-h: 44px;',
  },

  /**
   * 记录触摸起始 Y 坐标，用于判断滑动方向
   */
  _touchStartY: 0,

  /* ========================================================================
     生命周期
     ======================================================================== */

  onLoad() {
    this.applySafeArea();
  },

  /**
   * 页面卸载时清理定时器，避免内存泄漏
   */
  onUnload() {
    if (this._redirectTimer) {
      clearTimeout(this._redirectTimer);
    }
  },

  /* ========================================================================
     机型适配：状态栏高度注入
     ======================================================================== */

  /**
   * 获取状态栏高度与胶囊按钮位置，写入 CSS 变量供 WXSS 使用。
   *
   * 说明：
   *   - 不同机型状态栏高度差异明显（iPhone 15 Pro = 54 / 部分机型 = 44 / 47 / 59）
   *   - 胶囊按钮（右上角「...」）位置也可用于计算顶部安全区
   *   - 通过 setData 把值绑定到内联 style 的 CSS 变量上
   */
  applySafeArea() {
    try {
      const windowInfo =
        typeof wx.getWindowInfo === 'function'
          ? wx.getWindowInfo()
          : wx.getSystemInfoSync();

      let statusBarHeight = windowInfo.statusBarHeight || 44;

      /*
       * 胶囊按钮是最可靠的「右上安全区」参考：
       *   capsuleBottom = capsule.top + capsule.height
       * 若胶囊底部比状态栏更低，取其差值作为额外顶部留白，
       * 保证 LOGO 区不与胶囊（右上「...」）视觉冲突。
       */
      if (typeof wx.getMenuButtonBoundingClientRect === 'function') {
        try {
          const capsule = wx.getMenuButtonBoundingClientRect();
          if (capsule && capsule.height) {
            const capsuleBottom = capsule.top + capsule.height;
            // 取较大值，确保状态栏与胶囊都被避开
            statusBarHeight = Math.max(statusBarHeight, capsuleBottom);
          }
        } catch (capErr) {
          console.warn('[splash] 获取胶囊位置失败，回退状态栏高度:', capErr);
        }
      }

      this.setData({
        safeAreaStyle: `--status-bar-h: ${statusBarHeight}px;`,
      });
    } catch (err) {
      console.error('[splash] 获取状态栏信息失败:', err);
      // 失败时给出兜底值，不影响页面渲染
      this.setData({
        safeAreaStyle: '--status-bar-h: 44px;',
      });
    }
  },

  /* ========================================================================
     交互：向上滑动进入首页
     ======================================================================== */

  /**
   * 触摸开始
   */
  onTouchStart(e) {
    const touch = e.touches && e.touches[0];
    if (touch) {
      this._touchStartY = touch.clientY;
    }
  },

  /**
   * 触摸结束：判断是否为「向上滑动」
   * 阈值 30px，避免误触
   */
  onTouchEnd(e) {
    const touch = e.changedTouches && e.changedTouches[0];
    if (!touch) return;

    const deltaY = this._touchStartY - touch.clientY;

    if (deltaY > 30) {
      this.navigateToHome();
    }
  },

  /**
   * 点击任意区域也可进入（兜底交互，兼顾不使用滑动的用户）
   */
  onTap() {
    this.navigateToHome();
  },

  /**
   * 跳转首页并卸载启动页
   * 说明：使用 redirectTo 而非 navigateTo，避免用户可回退到启动页
   */
  navigateToHome() {
    if (this.data.hasNavigated) return;

    this.setData({ hasNavigated: true });

    wx.redirectTo({
      url: '/pages/index/index',
      fail: (err) => {
        console.error('[splash] 跳转失败:', err);
        // 跳转失败时重置状态，允许用户重试
        this.setData({ hasNavigated: false });
      },
    });
  },
});
