/**
 * pages/index/index.js — 首页
 * --------------------------------------------------------------------------
 * 设计稿：Figma「首页1」（node 7-213）
 * 内容为静态渲染（图片直接以绝对路径写入 WXML），仅保留页面生命周期
 * 与底部导航 / 卡片的交互占位。
 */

const app = getApp();
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

  /**
   * 生命周期：页面加载
   */
  onLoad(options) {},

  /** 首帧上屏后触发淡入（见 utils/transition.js） */
  onReady() {
    transition.enter(this);
  },

  onUnload() {
    transition.clear(this);
  },

  /**
   * 页面重新显示：重置退场态
   * ⚠️ 必须调用 —— 上级页在跳去下级页时 data.leaving 被置成 true，
   *    navigateBack 回来时它还在，页面会带着 opacity:0 显示，表现为「一片空白」。
   */
  onShow() {
    transition.resume(this);
  },

  /**
   * 页面分享
   */
  onShareAppMessage() {
    return {
      title: '陶瓷博物馆',
      path: '/pages/index/index',
    };
  },

  /**
   * 底部导航点击（首页 / 导览 / 鉴赏 / 我的）
   * 说明：四个 Tab 均为独立页面（app.json 未配置原生 tabBar），
   *       切换用 reLaunch 清栈，避免来回点击导致页面栈无限堆叠。
   */
  onTabTap(e) {
    const { tab } = e.currentTarget.dataset;
    let url = '';
    switch (tab) {
      case 'guide':
        url = '/pages/guide/guide';
        break;
      case 'appreciate':
        url = '/pages/appreciate/appreciate';
        break;
      case 'mine':
        url = '/pages/mine/mine';
        break;
      // 当前页（首页）无需跳转
      default:
        break;
    }

    if (!url) return;
    transition.leave(this, () => {
      wx.reLaunch({ url });
    });
  },

  /**
   * 卡片点击（票务预约 / 博物馆介绍 / 预约讲解 / 近期特展 / ...）
   */
  onCardTap(e) {
    const { name } = e.currentTarget.dataset;
    if (name !== '票务预约') return; // 其余卡片待接入对应页面
    transition.leave(this, () => {
      wx.navigateTo({ url: '/pages/booking/booking' });
    });
  },
});
