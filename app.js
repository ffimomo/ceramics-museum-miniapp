/**
 * app.js — 小程序入口逻辑
 * --------------------------------------------------------------------------
 * 骨架阶段：仅含全局基础设施，不含任何业务与界面逻辑。
 */

/*
 * 思源宋体子集（base64 data URL）
 * --------------------------------------------------------------------------
 * 由 tools/build_font_dataurl.py 生成，内容为
 * assets/fonts/SourceHanSerifCN-Regular.subset.woff2 的 base64 编码。
 *
 * ⚠️ 为什么用 data URL 而不是文件路径：
 *   小程序真机上 wx.loadFontFace 对「包内相对路径」的支持不稳定，
 *   部分基础库/机型会加载失败并静默回退系统字体（表现为黑体）。
 *   data URL 直接内联字体数据，无需网络请求与路径解析，兼容性最好。
 *
 * ⚠️ 体积影响：base64 会比原文件大约 33%（236KB → ~315KB），
 *   仍在主包 2MB 限制内，可接受。
 */
const fontSource = require('./utils/font-source');

App({
  /**
   * 全局数据
   */
  globalData: {
    /** 用户信息（登录后写入） */
    userInfo: null,
    /** 系统信息：状态栏高度、胶囊位置等，用于自定义导航栏 */
    systemInfo: null,
    /** 是否已登录 */
    isLogin: false,
    /** 自定义字体是否加载成功（供页面按需降级） */
    fontLoaded: false,
  },

  /**
   * 小程序启动
   */
  onLaunch() {
    this.initSystemInfo();
    this.loadCustomFont();
  },

  /**
   * 小程序显示到前台
   */
  onShow() {
    // TODO: 需要时在此处理前后台切换逻辑
  },

  /**
   * 小程序隐藏到后台
   */
  onHide() {
    // TODO: 需要时在此处理数据暂存逻辑
  },

  /**
   * 全局错误监听
   */
  onError(err) {
    console.error('[app] error:', err);
  },

  /**
   * 生命周期：初始化系统信息
   * 说明：新版本基础库推荐 wx.getWindowInfo / wx.getDeviceInfo 等细分 API，
   *      此处做了降级兼容，保证低版本基础库可用。
   */
  initSystemInfo() {
    try {
      const windowInfo =
        typeof wx.getWindowInfo === 'function'
          ? wx.getWindowInfo()
          : wx.getSystemInfoSync();

      const deviceInfo =
        typeof wx.getDeviceInfo === 'function' ? wx.getDeviceInfo() : null;

      this.globalData.systemInfo = {
        ...windowInfo,
        brand: deviceInfo ? deviceInfo.brand : undefined,
        model: deviceInfo ? deviceInfo.model : undefined,
        platform: deviceInfo ? deviceInfo.platform : undefined,
      };
    } catch (err) {
      console.error('[app] 获取系统信息失败:', err);
    }
  },

  /**
   * ------------------------------------------------------------------------
   * 自定义字体加载（思源宋体子集）
   * ------------------------------------------------------------------------
   * 背景：
   *   设计稿使用「华文中宋 / 华文宋体」，但 iOS 真机 <text> 实测不认
   *   系统字体名（STSong 等），最终落到系统无衬线体（黑体）。
   *   因此改用 wx.loadFontFace 加载「思源宋体子集」。
   *
   * 字体数据：
   *   utils/font-source.js —— 思源宋体 CN Regular 子集的 base64 data URL
   *   由 tools/build_font_dataurl.py 从 woff2 子集（236 KB）生成
   *
   * ⚠️ 关键约束（三条必须同时满足，否则字体不生效）：
   *   1. family 名必须与 app.wxss 中 --font-serif 的链首完全一致（CeramicsSerif）
   *   2. source 用完整的 data URL（含 url("") 包裹）
   *   3. 在小程序启动早期调用（onLaunch），确保首屏即可用
   *
   * ⚠️ 子集缺字处理：
   *   若后续页面出现「豆腐块/方框」，说明子集缺字。
   *   把缺的字补进 tools/subset_font.py 的 SCENE_CHARS，
   *   重跑 subset_font.py 与 build_font_dataurl.py 即可。
   * ------------------------------------------------------------------------
   */
  loadCustomFont() {
    // 兜底：字体数据缺失时直接跳过，避免抛错中断启动流程
    if (!fontSource) {
      console.warn('[app] 字体数据为空，跳过自定义字体加载');
      return;
    }

    wx.loadFontFace({
      family: 'CeramicsSerif',
      source: 'url("' + fontSource + '")',
      global: true,
      scopes: ['webview'],
      success: () => {
        this.globalData.fontLoaded = true;
        console.log('[app] 思源宋体子集加载成功');
      },
      fail: (err) => {
        this.globalData.fontLoaded = false;
        console.warn('[app] 思源宋体子集加载失败，将回退系统字体链:', err);
      },
    });
  },
});
