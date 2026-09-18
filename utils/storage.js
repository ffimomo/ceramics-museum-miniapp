/**
 * utils/storage.js — 本地存储封装
 * --------------------------------------------------------------------------
 * ⚠️ 骨架阶段：统一 key 管理与异常兜底，业务数据待接入。
 */

/** 存储 key 统一管理，避免散落各处 */
const KEYS = {
  TOKEN: 'token',
  USER_INFO: 'user_info',
  SEARCH_HISTORY: 'search_history',
};

/**
 * 写入
 */
function set(key, value) {
  try {
    wx.setStorageSync(key, value);
    return true;
  } catch (err) {
    console.error('[storage] set failed:', key, err);
    return false;
  }
}

/**
 * 读取
 */
function get(key, defaultValue = null) {
  try {
    const value = wx.getStorageSync(key);
    return value === '' || value === undefined ? defaultValue : value;
  } catch (err) {
    console.error('[storage] get failed:', key, err);
    return defaultValue;
  }
}

/**
 * 删除
 */
function remove(key) {
  try {
    wx.removeStorageSync(key);
    return true;
  } catch (err) {
    console.error('[storage] remove failed:', key, err);
    return false;
  }
}

/**
 * 清空
 */
function clear() {
  try {
    wx.clearStorageSync();
    return true;
  } catch (err) {
    console.error('[storage] clear failed:', err);
    return false;
  }
}

/* --- 常用快捷方法 --- */
const token = {
  get: () => get(KEYS.TOKEN, ''),
  set: (v) => set(KEYS.TOKEN, v),
  remove: () => remove(KEYS.TOKEN),
};

const userInfo = {
  get: () => get(KEYS.USER_INFO, null),
  set: (v) => set(KEYS.USER_INFO, v),
  remove: () => remove(KEYS.USER_INFO),
};

module.exports = {
  KEYS,
  set,
  get,
  remove,
  clear,
  token,
  userInfo,
};
