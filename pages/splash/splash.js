/**
 * pages/splash/splash.js — 启动页
 * --------------------------------------------------------------------------
 * 职责：停留展示 + 引导用户向上滑动，渐隐后进入登录页
 *
 * 多机型适配要点：
 *   启动页为全屏沉浸式布局（navigationStyle: custom），
 *   需自行获取状态栏高度并注入 CSS 变量 --status-bar-h，
 *   使顶部 LOGO 区避开状态栏与胶囊按钮，适配 iPhone 15 Pro / 17 Pro Max 等不同机型。
 */

const transition = require('../../utils/transition');

Page({
  data: {
    /** 是否已触发跳转，防止重复跳转 */
    hasNavigated: false,
    /** 转场：退场中（绑定 .page-fade--hidden，整页淡出后跳转） */
    leaving: false,
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
    transition.clear(this);
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

      const statusBarHeight = windowInfo.statusBarHeight || 44;

      /*
       * ⚠️ 这里【不并入胶囊按钮底部】，只用状态栏高度
       * ------------------------------------------------------------------
       * 早期版本取 max(状态栏, 胶囊底)，iPhone 15 Pro 上胶囊底约 86，
       * 于是顶部留白变成 82 —— 整块内容被下推约 46px，
       * 主标题从设计稿的 y≈176 掉到 y≈218，构图明显偏低。
       *
       * 之所以可以只用状态栏高度：本页 LOGO 区是【左对齐】的
       * （设计稿 x 45.8–69.7），而胶囊在【右上角】（x 约 278–365），
       * 两者横向完全不重叠，不存在遮挡或误触风险。
       * 若以后把品牌区改成通栏或右对齐，需要把胶囊判断加回来。
       */
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
     交互：向上滑动，渐隐后进入登录页
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
      this.navigateToLogin();
    }
  },

  /**
   * 点击任意区域也可进入（兜底交互，兼顾不使用滑动的用户）
   */
  onTap() {
    this.navigateToLogin();
  },

  /**
   * 渐隐后跳转登录页并卸载启动页
   * 说明：
   *   - 先触发整页淡出动画（leaving → .page-fade--hidden），
   *     待动画结束（FADE_MS）再跳转，避免生硬切换；
   *     登录页 onLoad 时会从 opacity:0 淡入，两段接力即为设计稿的交叉溶解；
   *   - 使用 redirectTo 而非 navigateTo，避免用户可回退到启动页。
   */
  navigateToLogin() {
    if (this.data.hasNavigated) return;

    this.setData({ hasNavigated: true });

    // 先淡出（FADE_MS），再跳转；登录页随后淡入，两段接力成一次溶解
    transition.leave(this, () => {
      wx.redirectTo({
        url: '/pages/login/login',
        fail: (err) => {
          console.error('[splash] 跳转失败:', err);
          // 跳转失败时重置状态，允许用户重试
          this.setData({ hasNavigated: false, leaving: false });
        },
      });
    });
  },
});
