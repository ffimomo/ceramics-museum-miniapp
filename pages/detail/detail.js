/**
 * pages/detail/detail.js — 文物详情页
 * --------------------------------------------------------------------------
 * 设计稿：Figma node 41-110
 * 入口：导览页「热门文物」第 3 张卡（data-id = 3）
 *
 * ⚠️ 数据说明
 *   目前只有这一件文物的设计稿，所以 relic 默认取设计稿上的这一件。
 *   接入后端后把 RELICS 换成接口数据、onLoad 里按 options.id 查表即可，
 *   WXML / WXSS 不用改。
 */

/** 文物数据表（key 对应导览页文物卡的 data-id） */
const RELICS = {
  3: {
    id: 3,
    name: '乾隆粉地料彩缠枝莲方',
    dynasty: '清代',
    desc:
      '口内侧饰细卷草纹。颈部绘尖长莲叶纹与缠枝小花。腹部主题纹饰为莲池鸳鸯图，' +
      '莲花盛放、荷叶舒展，一对鸳鸯相向游弋于池水之间',
    category: '瓷器',
    level: '国家一级文物',
    size: '高 15cm，口径 17.7cm，底径 5cm',
    usage: '经典食器',
  },
};

/** 语言选项（顺序与设计稿一致） */
const LANGS = ['zh', 'en', 'fr', 'ja'];

const transition = require('../../utils/transition');

Page({
  data: {
    /** 当前文物数据 */
    relic: RELICS[3],
    /** 当前语言（设计稿只给了中文文案，其余语言待补） */
    currentLang: 'zh',
    /** 状态栏高度 CSS 变量（供左上角返回键避开状态栏） */
    safeAreaStyle: '--status-bar-h: 44px;',

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

  /**
   * 生命周期：页面加载
   * @param {Object} options 路由参数，id 为文物编号
   */
  onLoad(options) {
    this.applySafeArea();

    const id = Number(options && options.id);

    // 有对应数据才替换，否则保留设计稿这件（避免打开空白页）
    if (RELICS[id]) {
      this.setData({ relic: RELICS[id] });
    }
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
   * 返回上一页
   * 说明：本页是自定义导航栏，返回键要自己画。
   *      正常从导览页进来说有页面栈，navigateBack 即可；
   *      若从分享卡直接打开（栈里只有这一页），回退失败时兜底回首页，
   *      避免停在死路。
   */
  onBack() {
    transition.leave(this, () => {
      wx.navigateBack({
        fail: () => {
          wx.reLaunch({ url: '/pages/index/index' });
        },
      });
    });
  },

  /**
   * 3D 视图
   * TODO: 接入 3D 模型 / 全景查看
   */
  on3DView() {},

  /**
   * 语音讲解
   * TODO: 接入音频播放
   */
  onPlay() {},

  /**
   * 切换语言
   * TODO: 接入多语言文案后按 lang 换文案
   */
  onLangTap(e) {
    const { lang } = e.currentTarget.dataset;
    if (!lang || LANGS.indexOf(lang) < 0 || lang === this.data.currentLang) return;
    this.setData({ currentLang: lang });
  },

  /**
   * 页面分享
   */
  onShareAppMessage() {
    const { relic } = this.data;
    return {
      title: relic.name,
      path: `/pages/detail/detail?id=${relic.id}`,
    };
  },
});
