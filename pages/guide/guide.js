/**
 * pages/guide/guide.js — 馆内导览
 * --------------------------------------------------------------------------
 * 设计稿：Figma「导览页1」（node 33-162）
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

    /** 当前楼层（1–4） */
    floor: 1,
    /** 楼层面板是否展开 */
    floorOpen: false,

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
   * 楼层切换：展开 / 收起面板
   * 说明：收起态与展开态分别对应设计稿「导览页1」与「导览页2」。
   */
  onFloorToggle() {
    this.setData({ floorOpen: !this.data.floorOpen });
  },

  /**
   * 楼层选择（1F–4F）
   * 说明：设计稿只提供一张平面图，切换楼层目前只更新选中态；
   *       面板保持展开，便于看到高亮变化（点遮罩或悬浮按钮收起）。
   *       后续若按楼层出图，在此按 floor 切换地图图片即可。
   */
  onFloorTap(e) {
    const floor = Number(e.currentTarget.dataset.floor);
    this.setData({ floor });
  },

  /**
   * 快捷入口点击（找文物 / 找卫生间 / 找饮水间 / 票务中心）
   */
  onQuickTap(e) {
    const { name } = e.currentTarget.dataset;
    switch (name) {
      case '票务中心':
        transition.leave(this, () => {
          wx.navigateTo({ url: '/pages/booking/booking' });
        });
        break;
      // 找文物 / 找卫生间 / 找饮水间：地图内定位交互，待实现
      default:
        break;
    }
  },

  /**
   * 文物卡点击 → 文物详情
   * --------------------------------------------------------------------------
   * ⚠️ 目前只有第 3 件（乾隆粉地料彩缠枝莲芳）有详情页设计稿和文案，
   *    第 1、2 件点了暂不跳转 —— 否则会带着各自的 id 进详情页、
   *    页码对不上数据，反而显示成第 3 件的内容。
   *    后续补上这两件的数据后，把 id 白名单去掉即可恢复全部跳转。
   */
  onRelicTap(e) {
    const { id } = e.currentTarget.dataset;
    if (Number(id) !== 3) return;
    transition.leave(this, () => {
      wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
    });
  },

  /**
   * 「查看更多」点击 → 热门文物列表
   */
  onMoreTap() {
    transition.leave(this, () => {
      wx.navigateTo({ url: '/pages/list/list?type=hot' });
    });
  },

  /**
   * 底部导航点击（首页 / 导览 / 鉴赏 / 我的）
   * 说明：四个 Tab 均为独立页面（app.json 未配置原生 tabBar），
   *       切换用 reLaunch 清栈，避免来回点击导致页面栈无限堆叠。
   */
  onTabTap(e) {
    const { tab } = e.currentTarget.dataset;
    const url =
      tab === 'index' ? '/pages/index/index'
        : tab === 'appreciate' ? '/pages/appreciate/appreciate'
          : tab === 'mine' ? '/pages/mine/mine'
            : '';
    if (!url) return; // 命中当前页（导览），无需跳转
    transition.leave(this, () => {
      wx.reLaunch({ url });
    });
  },

  /* ========================================================================
     分享
     ======================================================================== */
  onShareAppMessage() {
    return {
      title: '陶瓷博物馆 · 馆内导览',
      path: '/pages/guide/guide',
    };
  },
});
