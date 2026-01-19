// 车牌号处理工具函数

/**
 * 格式化车牌号
 * @param {string} licensePlate - 原始车牌号
 * @returns {string} 格式化后的车牌号
 */
export const formatLicensePlate = (licensePlate) => {
  if (!licensePlate) return '';
  
  // 移除空格和特殊字符，保留汉字、字母、数字
  const cleaned = licensePlate.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '');
  
  // 将字母转为大写，保持汉字不变
  return cleaned.replace(/[a-zA-Z]/g, (match) => match.toUpperCase());
};

/**
 * 验证车牌号格式
 * @param {string} licensePlate - 车牌号
 * @returns {boolean} 是否为有效格式
 */
export const validateLicensePlate = (licensePlate) => {
  if (!licensePlate) return false;
  
  // 基本长度检查
  if (licensePlate.length < 6 || licensePlate.length > 8) {
    return false;
  }
  
  // 简单的车牌号格式检查（汉字开头，后面是字母数字组合）
  const plateRegex = /^[\u4e00-\u9fa5][a-zA-Z][a-zA-Z0-9]{4,6}$/;
  return plateRegex.test(licensePlate);
};

/**
 * 获取车牌号输入提示
 * @param {string} licensePlate - 当前输入的车牌号
 * @returns {string} 提示信息
 */
export const getLicensePlateHint = (licensePlate) => {
  if (!licensePlate) {
    return '请输入车牌号，如：京A12345';
  }
  
  if (licensePlate.length < 6) {
    return '车牌号长度不足';
  }
  
  if (licensePlate.length > 8) {
    return '车牌号长度过长';
  }
  
  if (!validateLicensePlate(licensePlate)) {
    return '车牌号格式不正确';
  }
  
  return '车牌号格式正确';
};

/**
 * 实时格式化车牌号输入（移动端优化版）
 * @param {string} value - 输入值
 * @param {string} prevValue - 之前的值
 * @returns {string} 格式化后的值
 */
export const formatLicensePlateInput = (value, prevValue = '') => {
  // 如果是删除操作，直接返回
  if (value.length < prevValue.length) {
    return value;
  }
  
  // 移除非法字符，保留汉字、字母、数字
  let cleaned = value.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '');
  
  // 限制长度
  if (cleaned.length > 8) {
    cleaned = cleaned.substring(0, 8);
  }
  
  // 将英文字母转为大写，但不影响输入过程中的汉字
  cleaned = cleaned.replace(/[a-zA-Z]/g, (match) => match.toUpperCase());
  
  return cleaned;
};

/**
 * 移动端友好的车牌号输入处理（带延迟格式化）
 * @param {string} value - 输入值
 * @param {boolean} immediate - 是否立即格式化
 * @returns {string} 处理后的值
 */
export const handleMobileLicensePlateInput = (value, immediate = false) => {
  // 移除非法字符，保留汉字、字母、数字
  let cleaned = value.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '').substring(0, 8);
  
  // 如果是立即格式化或者输入完成，则转换大写
  if (immediate || cleaned.length >= 2) {
    cleaned = cleaned.replace(/[a-zA-Z]/g, (match) => match.toUpperCase());
  }
  
  return cleaned;
};

/**
 * 车牌号输入完成时的格式化处理
 * @param {string} value - 输入值
 * @returns {string} 格式化后的值
 */
export const finalizeLicensePlateInput = (value) => {
  let cleaned = value.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '').substring(0, 8);
  // 最终格式化时一定要转换大写
  return cleaned.replace(/[a-zA-Z]/g, (match) => match.toUpperCase());
};