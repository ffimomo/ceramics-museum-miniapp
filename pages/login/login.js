/**
 * pages/login/login.js — 登录页
 * --------------------------------------------------------------------------
 * 职责：手机号 / 密码输入、密码明暗文切换、记住密码、登录提交、跳转注册与忘记密码
 *
 * ⚠️ 图片资源说明
 *   所有图片路径集中在 data 里（bgImage / logoImage / iconBookmark / iconLock /
 *   eyeIconOpen / eyeIconClose / iconWechat / iconQQ）。
 *   换图时只需改对应字段的路径，无需改 WXML。
 *   背景图已转 WebP（原 PNG 560.8KB -> 21.0KB，原图备份在 assets/_originals_png/）。
 *
 * ⚠️ 接口说明
 *   登录接口待后端提供，当前 doLogin() 中已留出请求位置（带 TODO 注释），
 *   现在走的是「本地模拟」分支，方便你先把交互跑通。
 */

const storage = require('../../utils/storage');
const util = require('../../utils/util');

/** 记住密码的存储 key */
const REMEMBER_KEY = 'remember_login';

Page({
  data: {
    /* ======================================================================
       图片资源路径
       ----------------------------------------------------------------------
       ⚠️ 修改图片只需改这里，不用动 WXML
       ====================================================================== */
    /** 背景图：米黄宣纸 / 陶瓷质感
     *  ⚠️ 已转为 WebP（原 PNG 560.8KB -> WebP 21.0KB，省 96.3%，PSNR 41.6dB）
     *     原图备份在 assets/_originals_png/ */
    bgImage: '/assets/images/login-bg.webp',
    /** 品牌 Logo：花瓶线稿 */
    logoImage: '/assets/icons/login-logo.png',
    /** 手机号输入框左侧 icon：书签样式（Bookmark） */
    iconBookmark: '/assets/icons/icon-bookmark.png',
    /** 密码输入框左侧 icon：锁 */
    iconLock: '/assets/icons/icon-lock.png',
    /**
     * 密码框右侧眼睛 icon：跟随 showPassword 自动切换
     * 初始 showPassword = false（密文态），故取「闭眼」图
     */
    eyeIcon: '/assets/icons/icon-eye-close.png',
    /**
     * 眼睛图标（睁眼）：showPassword = true 时使用 ——
     * 语义为「密码当前是明文，点它可隐藏」。
     * 两张图同源同色（RGB 183,170,154 = --icon-secondary #B7AA9A），
     * 按同一尺寸渲染时视觉重心一致（差 0.26px），切换不跳动。
     */
    eyeIconOpen: '/assets/icons/icon-eye.png',
    /**
     * 眼睛图标（闭眼）：showPassword = false 时使用 ——
     * 语义为「密码当前是密文，点它可显示」。
     */
    eyeIconClose: '/assets/icons/icon-eye-close.png',
    /** 微信登录 icon */
    iconWechat: '/assets/icons/icon-wechat.png',
    /** QQ 登录 icon */
    iconQQ: '/assets/icons/icon-qq.png',

    /* ======================================================================
       表单数据
       ====================================================================== */
    /** 手机号 */
    phone: '',
    /** 密码 */
    password: '',
    /** 是否明文显示密码 */
    showPassword: false,
    /** 是否记住密码 */
    rememberPwd: false,

    /* ======================================================================
       UI 状态
       ====================================================================== */
    /** 手机号框是否聚焦（用于描边高亮） */
    phoneFocus: false,
    /** 密码框是否聚焦 */
    pwdFocus: false,
    /** 登录请求进行中 */
    logging: false,

    /** 状态栏高度 CSS 变量，绑定到根节点 style */
    safeAreaStyle: '--status-bar-h: 44px;',
  },

  /* ========================================================================
     生命周期
     ======================================================================== */

  onLoad() {
    this.applySafeArea();
    this.restoreRememberedAccount();
  },

  /**
   * 页面卸载：清理可能存在的定时器
   */
  onUnload() {
    if (this._loginTimer) {
      clearTimeout(this._loginTimer);
    }
  },

  /* ========================================================================
     机型适配
     ======================================================================== */

  /**
   * 注入状态栏高度，使顶部品牌区避开状态栏与胶囊按钮
   * 与启动页 splash.js 保持一致的实现方式
   */
  applySafeArea() {
    try {
      const windowInfo =
        typeof wx.getWindowInfo === 'function'
          ? wx.getWindowInfo()
          : wx.getSystemInfoSync();

      let statusBarHeight = windowInfo.statusBarHeight || 44;

      if (typeof wx.getMenuButtonBoundingClientRect === 'function') {
        try {
          const capsule = wx.getMenuButtonBoundingClientRect();
          if (capsule && capsule.height) {
            const capsuleBottom = capsule.top + capsule.height;
            statusBarHeight = Math.max(statusBarHeight, capsuleBottom);
          }
        } catch (capErr) {
          console.warn('[login] 获取胶囊位置失败，回退状态栏高度:', capErr);
        }
      }

      this.setData({
        safeAreaStyle: `--status-bar-h: ${statusBarHeight}px;`,
      });
    } catch (err) {
      console.error('[login] 获取状态栏信息失败:', err);
      this.setData({ safeAreaStyle: '--status-bar-h: 44px;' });
    }
  },

  /* ========================================================================
     输入绑定
     ======================================================================== */

  /**
   * 手机号输入
   */
  onPhoneInput(e) {
    this.setData({ phone: e.detail.value });
  },

  /**
   * 密码输入
   */
  onPasswordInput(e) {
    this.setData({ password: e.detail.value });
  },

  onPhoneFocus() {
    this.setData({ phoneFocus: true });
  },

  onPhoneBlur() {
    this.setData({ phoneFocus: false });
  },

  onPwdFocus() {
    this.setData({ pwdFocus: true });
  },

  onPwdBlur() {
    this.setData({ pwdFocus: false });
  },

  /* ========================================================================
     交互：密码明暗文切换
     ======================================================================== */

  /**
   * 切换密码明文 / 密文
   * 说明：input 的 type 在 text / password 之间切换即可实现；
   *      小程序中改动 type 会导致输入框短暂重建，故同时更新 eyeIcon。
   */
  togglePassword() {
    const showPassword = !this.data.showPassword;

    this.setData({
      showPassword,
      // 眼睛图标跟随状态切换；素材未填时为空字符串，不影响逻辑
      eyeIcon: showPassword ? this.data.eyeIconOpen : this.data.eyeIconClose,
    });
  },

  /* ========================================================================
     交互：记住密码
     ======================================================================== */

  /**
   * 切换「记住密码」勾选状态
   */
  toggleRemember() {
    const rememberPwd = !this.data.rememberPwd;
    this.setData({ rememberPwd });

    // 取消勾选时立即清除本地记录
    if (!rememberPwd) {
      storage.remove(REMEMBER_KEY);
    }
  },

  /**
   * 读取本地「记住密码」记录并回填
   */
  restoreRememberedAccount() {
    try {
      const saved = storage.get(REMEMBER_KEY, null);
      if (saved && saved.phone) {
        this.setData({
          phone: saved.phone || '',
          password: saved.password || '',
          rememberPwd: true,
        });
      }
    } catch (err) {
      console.error('[login] 回填记住的账号失败:', err);
    }
  },

  /* ========================================================================
     表单校验
     ======================================================================== */

  /**
   * 校验手机号格式（中国大陆 11 位）
   * @returns {boolean}
   */
  validatePhone(phone) {
    if (!phone) {
      util.toast('请输入手机号');
      return false;
    }
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      util.toast('请输入正确的手机号');
      return false;
    }
    return true;
  },

  /**
   * 校验密码
   * @returns {boolean}
   */
  validatePassword(password) {
    if (!password) {
      util.toast('请输入密码');
      return false;
    }
    if (password.length < 6) {
      util.toast('密码至少 6 位');
      return false;
    }
    return true;
  },

  /* ========================================================================
     交互：登录
     ======================================================================== */

  /**
   * 点击「登陆」按钮
   * 流程：校验 → 记住密码处理 → 发起登录 → 成功跳转
   */
  onLogin() {
    if (this.data.logging) return;

    const { phone, password, rememberPwd } = this.data;

    if (!this.validatePhone(phone)) return;
    if (!this.validatePassword(password)) return;

    // 记住密码：勾选则存，未勾选则不存
    if (rememberPwd) {
      storage.set(REMEMBER_KEY, { phone, password });
    } else {
      storage.remove(REMEMBER_KEY);
    }

    this.doLogin(phone, password);
  },

  /**
   * 执行登录请求
   *
   * ⚠️ 后端接口待接入：把下面「本地模拟」整段换成真实请求即可。
   *    项目中已有 utils/request.js，可直接使用，例如：
   *
   *      const request = require('../../utils/request');
   *      const res = await request.post('/api/login', { phone, password });
   *      storage.token.set(res.token);
   *      storage.userInfo.set(res.userInfo);
   *
   * @param {string} phone
   * @param {string} password
   */
  doLogin(phone, password) {
    this.setData({ logging: true });

    // ---------------------------------------------------------------------
    // 本地模拟（接口接好后删除这一段）
    // ---------------------------------------------------------------------
    this._loginTimer = setTimeout(() => {
      this.setData({ logging: false });

      // 模拟：任意合法手机号 + 6 位以上密码即登录成功
      storage.token.set('mock_token_' + Date.now());
      storage.userInfo.set({ phone, nickname: '陶瓷爱好者' });

      util.toast('登录成功', 'success');

      setTimeout(() => {
        wx.reLaunch({ url: '/pages/index/index' });
      }, 800);
    }, 800);
    // ---------------------------------------------------------------------
  },

  /* ========================================================================
     交互：跳转
     ======================================================================== */

  /**
   * 跳转注册页
   */
  goRegister() {
    wx.navigateTo({
      url: '/pages/register/register',
      fail: (err) => {
        console.error('[login] 跳转注册页失败:', err);
        util.toast('注册页尚未创建');
      },
    });
  },

  /**
   * 跳转忘记密码页
   */
  goForgetPassword() {
    wx.navigateTo({
      url: '/pages/forgetPassword/forgetPassword',
      fail: (err) => {
        console.error('[login] 跳转忘记密码页失败:', err);
        util.toast('忘记密码页尚未创建');
      },
    });
  },

  /* ========================================================================
     交互：第三方登录
     ======================================================================== */

  /**
   * 微信登录
   * ⚠️ 真实流程需 wx.login 拿 code → 后端换取 openid，
   *    并需在 app.json / 小程序后台完成用户隐私协议配置。
   */
  onWechatLogin() {
    util.toast('微信登录待接入');
  },

  /**
   * QQ 登录
   * ⚠️ 小程序内 QQ 登录需走 QQ 互联的开放能力，待接入。
   */
  onQQLogin() {
    util.toast('QQ 登录待接入');
  },
});
