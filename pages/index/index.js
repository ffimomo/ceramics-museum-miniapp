/**
 * pages/index/index.js — 首页
 * ⚠️ 骨架占位：仅含页面生命周期与数据结构声明，不含界面实现逻辑。
 */

const app = getApp();

Page({
  /**
   * 页面数据
   */
  data: {
    // TODO: 待设计稿接入后补充
  },

  /**
   * 生命周期：页面加载
   */
  onLoad(options) {
    // TODO: 首页数据加载
  },

  /**
   * 生命周期：页面显示
   */
  onShow() {
    // TODO: 需要时刷新数据
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
});
