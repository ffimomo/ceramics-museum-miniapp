/**
 * pages/list/list.js — 展品列表页
 * ⚠️ 骨架占位：仅含页面生命周期与数据结构声明，不含界面实现逻辑。
 */

Page({
  data: {
    // TODO: 待设计稿接入后补充（列表数据、筛选条件、分页状态等）
  },

  onLoad(options) {
    // TODO: 列表数据加载
  },

  onShow() {
    // TODO: 需要时刷新数据
  },

  /**
   * 生命周期：下拉刷新
   */
  onPullDownRefresh() {
    // TODO: 下拉刷新逻辑
    wx.stopPullDownRefresh();
  },

  /**
   * 生命周期：上拉触底
   */
  onReachBottom() {
    // TODO: 分页加载逻辑
  },
});
