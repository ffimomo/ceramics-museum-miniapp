/**
 * utils/util.js — 通用工具函数
 * --------------------------------------------------------------------------
 * ⚠️ 骨架阶段：提供常用格式化与适配工具，不含业务逻辑。
 */

/**
 * 尺寸换算：设计稿 px → vw
 * 说明：本项目样式采用 vw/vh 方案，设计稿标注的 px 需换算为 vw。
 * @param {number} px 设计稿像素值
 * @param {number} [designWidth=750] 设计稿基准宽度
 * @returns {string} 可直接用于内联样式的 vw 值，如 '4.2667vw'
 */
function pxToVw(px, designWidth = 750) {
  return ((px / designWidth) * 100).toFixed(4) + 'vw';
}

/**
 * 尺寸换算：设计稿 px → vh
 * @param {number} px
 * @param {number} [designHeight=1334]
 * @returns {string}
 */
function pxToVh(px, designHeight = 1334) {
  return ((px / designHeight) * 100).toFixed(4) + 'vh';
}

/**
 * 尺寸换算：设计稿 px → rpx（备选方案，750rpx = 屏宽）
 * @param {number} px
 * @param {number} [designWidth=750]
 * @returns {string} 如 '32rpx'
 */
function pxToRpx(px, designWidth = 750) {
  return Math.round((px / designWidth) * 750) + 'rpx';
}

/**
 * 格式化日期
 * @param {Date|string|number} date
 * @param {string} [format='YYYY-MM-DD HH:mm']
 * @returns {string}
 */
function formatDate(date, format = 'YYYY-MM-DD HH:mm') {
  const d = date instanceof Date ? date : new Date(date);

  if (isNaN(d.getTime())) return '';

  const pad = (n) => String(n).padStart(2, '0');

  const map = {
    YYYY: d.getFullYear(),
    MM: pad(d.getMonth() + 1),
    DD: pad(d.getDate()),
    HH: pad(d.getHours()),
    mm: pad(d.getMinutes()),
    ss: pad(d.getSeconds()),
  };

  return format.replace(/YYYY|MM|DD|HH|mm|ss/g, (key) => map[key]);
}

/**
 * 函数防抖
 * @param {Function} fn
 * @param {number} [wait=300]
 */
function debounce(fn, wait = 300) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), wait);
  };
}

/**
 * 函数节流
 * @param {Function} fn
 * @param {number} [wait=300]
 */
function throttle(fn, wait = 300) {
  let last = 0;
  return function (...args) {
    const now = Date.now();
    if (now - last >= wait) {
      last = now;
      fn.apply(this, args);
    }
  };
}

/**
 * 显示 Toast（统一提示风格）
 * @param {string} title
 * @param {'none'|'success'|'error'|'loading'} [icon='none']
 */
function toast(title, icon = 'none') {
  wx.showToast({ title, icon, duration: 2000 });
}

module.exports = {
  pxToVw,
  pxToVh,
  pxToRpx,
  formatDate,
  debounce,
  throttle,
  toast,
};
