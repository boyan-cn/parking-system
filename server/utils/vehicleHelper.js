const { pool } = require('../config/database');

/**
 * 查询车牌是否为业主车辆（支持逗号分隔的多车牌）
 * @param {string} licensePlate - 要查询的车牌号
 * @returns {Promise<Array>} 匹配的业主车辆记录
 */
async function findOwnerVehicleByLicense(licensePlate) {
  try {
    // 使用FIND_IN_SET函数和LIKE查询的组合来处理逗号分隔的车牌号
    const [vehicles] = await pool.execute(
      `SELECT * FROM owner_vehicles 
       WHERE FIND_IN_SET(?, REPLACE(license_plate, ' ', '')) > 0
       OR license_plate = ?
       OR license_plate LIKE ?
       OR license_plate LIKE ?
       OR license_plate LIKE ?`,
      [
        licensePlate,                     // FIND_IN_SET查询
        licensePlate,                     // 精确匹配
        `${licensePlate},%`,             // 开头匹配
        `%,${licensePlate}`,             // 结尾匹配  
        `%,${licensePlate},%`            // 中间匹配
      ]
    );
    
    return vehicles;
  } catch (error) {
    console.error('查询业主车辆错误:', error);
    throw error;
  }
}

/**
 * 解析车牌号字符串，返回车牌号数组
 * @param {string} licensePlateStr - 车牌号字符串（可能包含逗号）
 * @returns {Array<string>} 车牌号数组
 */
function parseLicensePlates(licensePlateStr) {
  if (!licensePlateStr) return [];
  
  return licensePlateStr
    .split(',')
    .map(plate => plate.trim())
    .filter(plate => plate.length > 0);
}

/**
 * 检查指定车牌是否在车牌列表中
 * @param {string} targetPlate - 目标车牌号
 * @param {string} licensePlateStr - 车牌号字符串（可能包含逗号）
 * @returns {boolean} 是否匹配
 */
function isLicensePlateMatch(targetPlate, licensePlateStr) {
  const plates = parseLicensePlates(licensePlateStr);
  return plates.includes(targetPlate);
}

module.exports = {
  findOwnerVehicleByLicense,
  parseLicensePlates,
  isLicensePlateMatch
};