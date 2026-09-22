/**
 * pages/booking-person/booking-person.js — 个人预约界面
 * --------------------------------------------------------------------------
 * 设计稿：Figma「个人预约界面」（node 25-154）
 * 内容静态渲染；导航栏为自定义（navigationStyle: custom），需注入状态栏高度。
 */

const transition = require('../../utils/transition');

Page({
  data: {
    /** 状态栏高度 CSS 变量（由 applySafeArea 注入，绑定到根节点 style） */
    safeAreaStyle: '--status-bar-h: 44px;',

    /**
     * 参观日期（六天，前两天已约满）
     * disabled = true 的格子走灰底、不响应点击
     */
    dates: [
      { date: '06-08', week: '星期一', disabled: true },
      { date: '06-09', week: '星期二', disabled: true },
      { date: '06-10', week: '星期三', disabled: false },
      { date: '06-11', week: '星期四', disabled: false },
      { date: '06-12', week: '星期五', disabled: false },
      { date: '06-13', week: '星期六', disabled: false },
    ],

    /** 参观时段（上午 / 下午） */
    times: [
      { key: 'morning', label: '上午9:00-11:30' },
      { key: 'afternoon', label: '下午13:00-15:30' },
    ],

    /** 当前选中的日期，空串表示未选（单选） */
    selectedDate: '',
    /** 当前选中的时段，空串表示未选（单选） */
    selectedTime: '',

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
     机型适配：状态栏高度注入
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
   * 选择参观日期（单选）
   * --------------------------------------------------------------------------
   * · 约满的格子直接忽略
   * · 点另一个 → 原来那个自动回默认（靠 selectedDate 单一数据源实现）
   * · 点已选中的那个 → 保持不变（「限定只能选择一个」，不允许选空）
   */
  onPickDate(e) {
    const { date, disabled } = e.currentTarget.dataset;
    if (disabled) return;
    if (this.data.selectedDate === date) return;
    this.setData({ selectedDate: date });
  },

  /**
   * 选择参观时段（单选，规则同上）
   */
  onPickTime(e) {
    const { time } = e.currentTarget.dataset;
    if (!time || this.data.selectedTime === time) return;
    this.setData({ selectedTime: time });
  },

  /**
   * 添加游客
   */
  onAddVisitor() {
    // TODO: 进入添加游客流程（最多 8 人）
  },

  /**
   * 提交预约
   * --------------------------------------------------------------------------
   * 日期 / 时段都选了才提交；成功后弹「预约成功」，点确定回首页。
   * TODO: 接口就绪后，把 showModal 之前补上真实的下单请求。
   */
  onSubmit() {
    const { selectedDate, selectedTime, times } = this.data;

    if (!selectedDate) {
      wx.showToast({ title: '请选择参观日期', icon: 'none' });
      return;
    }
    if (!selectedTime) {
      wx.showToast({ title: '请选择参观时段', icon: 'none' });
      return;
    }

    const picked = times.filter((t) => t.key === selectedTime)[0];

    wx.showModal({
      title: '预约成功',
      content: `参观日期：${selectedDate}\n参观时段：${picked ? picked.label : ''}`,
      showCancel: false,
      confirmText: '确定',
      success: (res) => {
        if (res.confirm) {
          transition.leave(this, () => {
            wx.reLaunch({ url: '/pages/index/index' });
          });
        }
      },
    });
  },
});
