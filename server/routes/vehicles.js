const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { findOwnerVehicleByLicense } = require('../utils/vehicleHelper');

const router = express.Router();

// 查询车牌是否为业主车辆
router.get('/check/:licensePlate', authenticateToken, async (req, res) => {
  try {
    const { licensePlate } = req.params;
    const reporter_id = req.user.userId;

    console.log('查询车牌:', licensePlate);

    // 查询业主车辆信息 - 使用辅助函数支持逗号分隔的车牌号
    const ownerVehicles = await findOwnerVehicleByLicense(licensePlate);

    if (ownerVehicles.length === 0) {
      return res.json({
        isOwner: false,
        message: '该车牌不属于业主车辆'
      });
    }

    const vehicle = ownerVehicles[0];
    console.log('找到业主车辆:', vehicle);

    // 查询违停次数
    const [violationCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM violation_records WHERE license_plate = ?',
      [licensePlate]
    );

    // 查询违停记录
    const [violations] = await pool.execute(
      `SELECT vr.*, u.username as reporter_name 
       FROM violation_records vr 
       JOIN users u ON vr.reporter_id = u.id 
       WHERE vr.license_plate = ? 
       ORDER BY vr.violation_time DESC`,
      [licensePlate]
    );

    // 检查今天是否已经举报过该车辆
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const [todayReports] = await pool.execute(
      'SELECT id FROM violation_records WHERE license_plate = ? AND reporter_id = ? AND violation_time >= ? AND violation_time < ?',
      [licensePlate, reporter_id, todayStart, todayEnd]
    );

    const hasReportedToday = todayReports.length > 0;

    res.json({
      isOwner: true,
      vehicle: {
        license_plate: vehicle.license_plate,
        owner_name: vehicle.owner_name,
        phone: vehicle.phone,
        building_number: vehicle.building_number,
        unit_number: vehicle.unit_number,
        parking_space: vehicle.parking_space
      },
      violationCount: violationCount[0].count,
      violations: violations,
      hasReportedToday: hasReportedToday
    });
  } catch (error) {
    console.error('查询车辆错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取所有业主车辆列表
router.get('/owners', authenticateToken, async (req, res) => {
  try {
    const [vehicles] = await pool.execute(
      'SELECT * FROM owner_vehicles ORDER BY building_number, unit_number'
    );

    res.json(vehicles);
  } catch (error) {
    console.error('获取业主车辆列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;