/**
 * utils/request.js — 网络请求封装
 * --------------------------------------------------------------------------
 * ⚠️ 骨架阶段：提供统一请求入口与错误处理，业务接口待接入。
 */

/** 接口基础地址（待后端确定后填写） */
const BASE_URL = '';

/** 请求超时时间 */
const TIMEOUT = 10000;

/**
 * 统一请求方法
 * @param {Object} options
 * @param {string} options.url    接口路径（相对 BASE_URL）
 * @param {string} [options.method='GET']
 * @param {Object} [options.data]
 * @param {Object} [options.header]
 * @param {boolean} [options.loading=false] 是否显示加载提示
 * @param {boolean} [options.showError=true] 是否自动提示错误
 * @returns {Promise<any>}
 */
function request(options) {
  const {
    url,
    method = 'GET',
    data = {},
    header = {},
    loading = false,
    showError = true,
  } = options;

  if (loading) {
    wx.showLoading({ title: '加载中', mask: true });
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url: BASE_URL + url,
      method,
      data,
      timeout: TIMEOUT,
      header: {
        'content-type': 'application/json',
        ...header,
      },
      success(res) {
        const { statusCode, data: body } = res;

        if (statusCode >= 200 && statusCode < 300) {
          // TODO: 按后端约定调整业务码判断
          resolve(body);
        } else {
          const err = new Error(`请求失败：HTTP ${statusCode}`);
          err.statusCode = statusCode;
          err.body = body;
          handleError(err, showError);
          reject(err);
        }
      },
      fail(err) {
        handleError(err, showError);
        reject(err);
      },
      complete() {
        if (loading) {
          wx.hideLoading();
        }
      },
    });
  });
}

/**
 * 统一错误处理
 * @param {Error|Object} err
 * @param {boolean} showError 是否弹出提示
 */
function handleError(err, showError = true) {
  console.error('[request]', err);

  if (!showError) return;

  let message = '网络异常，请稍后重试';

  if (err && err.errMsg) {
    if (err.errMsg.indexOf('timeout') > -1) {
      message = '请求超时，请检查网络';
    } else if (err.errMsg.indexOf('fail') > -1) {
      message = '网络连接失败';
    }
  }

  wx.showToast({
    title: message,
    icon: 'none',
    duration: 2000,
  });
}

/** 语法糖 */
request.get = (url, data, options = {}) =>
  request({ url, method: 'GET', data, ...options });

request.post = (url, data, options = {}) =>
  request({ url, method: 'POST', data, ...options });

module.exports = request;
