/**
 * utils/transition.js — 页面转场（渐隐渐现）
 * --------------------------------------------------------------------------
 * 设计稿录屏里所有页面切换都是「交叉溶解」：旧页淡出的同时新页淡入，全程约
 * 300ms、缓出曲线、没有位移。实测（30fps 逐帧量顶部条亮度）：
 *     旧页 217 → 新页 44，跨 9 帧 ≈ 300ms，前快后慢 = ease-out
 *
 * ⚠️ 小程序做不到两页同屏
 * --------------------------------------------------------------------------
 * navigateTo / reLaunch 都是「先销毁旧页、再创建新页」，没法真正同时叠化。
 * 所以这里拆成两段接力，拼出连续的观感：
 *     旧页淡出（FADE_MS）→ 跳转 → 新页淡入（FADE_MS）
 *
 * 用法（三个动作，四行代码）
 * --------------------------------------------------------------------------
 *   1. WXML 根节点：
 *        <view class="page page-fade {{entering || leaving ? 'page-fade--hidden' : ''}}">
 *      ⚠️ page-fade 必须和 page-fade--hidden 在【同一个元素】上，
 *         过渡属性写在元素自身，换到父级就不生效了。
 *   2. data 里声明：entering: true, leaving: false
 *      （entering 初值 true → 首帧就是透明，再淡入，避免闪一下）
 *   3. onReady 里          transition.enter(this)
 *      onUnload 里         transition.clear(this)
 *      跳转的地方           transition.leave(this, () => wx.xxx({...}))
 *
 * 节奏（FADE_MS）需与 app.wxss 的 .page-fade 过渡时长保持一致。
 */

/** 单段淡入 / 淡出时长（ms） */
const FADE_MS = 260;

/**
 * 入场延时（ms）
 * ⚠️ 必须在 onReady（首帧已上屏）之后再摘掉入场态。
 *    若在 onLoad 里直接 setData，会和首帧渲染合并成一帧，动画不触发。
 *    留一帧的余量是为了确保初始的透明态确实被绘制过。
 */
const ENTER_DELAY = 20;

/**
 * 页面入场：把 entering 置 false，触发淡入
 * @param {Object} vm 页面实例（在 onReady 里传 this）
 */
function enter(vm) {
  clear(vm);
  vm._enterTimer = setTimeout(() => {
    vm.setData({ entering: false });
  }, ENTER_DELAY);
}

/**
 * 页面退场：先淡出，FADE_MS 后再执行跳转
 * @param {Object}   vm       页面实例
 * @param {Function} navigate 真正执行跳转的函数，例如 () => wx.reLaunch({url})
 */
function leave(vm, navigate) {
  // 防重入：淡出期间连点不会跳两次
  if (vm.data.leaving) return;

  vm.setData({ leaving: true });

  if (vm._leaveTimer) clearTimeout(vm._leaveTimer);
  vm._leaveTimer = setTimeout(() => {
    if (typeof navigate === 'function') navigate();

    /*
     * 兜底：跳转失败时必须把 leaving 复位
     * ----------------------------------------------------------------
     * 若目标页不存在 / 被拒绝 / 页面栈已满，跳转会静默失败，
     * 而页面此刻停在 opacity:0 —— 用户看到的就是「卡死 + 一片空白」。
     * 这里在跳转之后再看一眼：页面还活着且仍处于退场态，就复位。
     * 跳转成功的话页面已被销毁或隐藏，这个 setData 无副作用。
     */
    if (vm._fallbackTimer) clearTimeout(vm._fallbackTimer);
    vm._fallbackTimer = setTimeout(() => {
      if (vm.data && vm.data.leaving) {
        vm.setData({ leaving: false });
      }
    }, FADE_MS + 80);
  }, FADE_MS);
}

/**
 * 页面重新显示：重置退场态（⚠️ 每个用到 leave() 的页面都必须在 onShow 里调用）
 * --------------------------------------------------------------------------
 * 不调用会「返回后整页空白」，原因：
 *   A 页调 leave() 跳去 B 页时，A 的 data.leaving 被置成 true。
 *   navigateTo 不会销毁 A，只是把它隐藏（onHide），data 原样保留。
 *   从 B 返回时 A 走 onShow 重新显示 —— 此时 leaving 还是 true，
 *   于是 A 带着 opacity:0 回来，看起来就是「卡死 + 一片空白」。
 *
 * 置回 false 的同时还会顺带触发一次淡入（0 → 1），正好是返回时的渐现效果。
 *
 * @param {Object} vm 页面实例
 */
function resume(vm) {
  if (vm.data.leaving) {
    vm.setData({ leaving: false });
  }
}

/**
 * 清理定时器（在 onUnload 里调用，避免页面销毁后回调仍触发 setData）
 * @param {Object} vm 页面实例
 */
function clear(vm) {
  if (vm._enterTimer) {
    clearTimeout(vm._enterTimer);
    vm._enterTimer = null;
  }
  if (vm._leaveTimer) {
    clearTimeout(vm._leaveTimer);
    vm._leaveTimer = null;
  }
  if (vm._fallbackTimer) {
    clearTimeout(vm._fallbackTimer);
    vm._fallbackTimer = null;
  }
}

module.exports = {
  FADE_MS: FADE_MS,
  enter: enter,
  leave: leave,
  resume: resume,
  clear: clear,
};
