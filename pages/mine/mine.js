/**
 * pages/mine/mine.js — 我的（个人信息页）
 * --------------------------------------------------------------------------
 * 设计稿：Figma「个人信息页」（node 65:268）
 * 内容为静态渲染（图片直接以绝对路径写入 WXML），仅保留各交互入口的事件占位。
 */

const transition = require('../../utils/transition');

Page({
  /**
   * 页面数据
   */
  data: {
    /** 转场：入场中（首帧透明，再淡入） */
    entering: true,
    /** 转场：退场中（跳转前先淡出） */
    leaving: false,
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
     交互
     ======================================================================== */

  /**
   * 右上角设置
   * TODO: 接入设置页后打开
   */
  onSettings() {},

  /**
   * 全部订单
   * TODO: 接入订单列表后打开
   */
  onAllOrders() {},

  /**
   * 单个订单状态（待付款 / 待使用 / 已完成 / 已取消）
   */
  onOrderTap(e) {
    // TODO: 按订单状态筛选后打开订单列表
    // const { status } = e.currentTarget.dataset;
  },

  /**
   * 功能菜单（我的预约 / 我的讲解 / 我的消息 / 帮助与反馈）
   */
  onMenuTap(e) {
    // TODO: 各菜单对应页面待实现
    // const { name } = e.currentTarget.dataset;
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
        : tab === 'guide' ? '/pages/guide/guide'
          : tab === 'appreciate' ? '/pages/appreciate/appreciate'
            : '';
    if (!url) return; // 命中当前页（我的），无需跳转
    transition.leave(this, () => {
      wx.reLaunch({ url });
    });
  },
});
