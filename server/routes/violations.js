const express = require('express');
const multer = require('multer');
const path = require('path');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { findOwnerVehicleByLicense } = require('../utils/vehicleHelper');

const router = express.Router();

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'violation-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB限制
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件'));
    }
  }
});

// 上传违停记录
router.post('/report', authenticateToken, upload.single('photo'), async (req, res) => {
  try {
    const { license_plate, location, description = '' } = req.body;
    const reporter_id = req.user.userId;
    const photo_url = req.file ? `/uploads/${req.file.filename}` : null;

    console.log('举报信息:', { license_plate, reporter_id, location, description });

    // 验证必填字段
    if (!license_plate || !location) {
      return res.status(400).json({ message: '车牌号和违停位置为必填项' });
    }

    // 检查举报用户是否存在
    const [reporterCheck] = await pool.execute(
      'SELECT id FROM users WHERE id = ?',
      [reporter_id]
    );

    if (reporterCheck.length === 0) {
      console.log('用户不存在，reporter_id:', reporter_id);
      return res.status(400).json({ message: '用户信息无效，请重新登录' });
    }

    // 检查车牌是否为业主车辆 - 使用辅助函数支持逗号分隔的车牌号
    const ownerVehicles = await findOwnerVehicleByLicense(license_plate);

    if (ownerVehicles.length === 0) {
      return res.status(400).json({ message: '该车牌不属于业主车辆，无法举报' });
    }

    console.log('找到业主车辆:', ownerVehicles[0]);

    // 检查今天是否已经举报过该车辆
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const [todayReports] = await pool.execute(
      'SELECT id FROM violation_records WHERE license_plate = ? AND reporter_id = ? AND violation_time >= ? AND violation_time < ?',
      [license_plate, reporter_id, todayStart, todayEnd]
    );

    if (todayReports.length > 0) {
      return res.status(400).json({ 
        message: `您今天已经举报过车牌 ${license_plate} 的违停行为，每天只能举报同一车辆一次` 
      });
    }

    // 插入违停记录，description可以为空
    const [result] = await pool.execute(
      'INSERT INTO violation_records (license_plate, reporter_id, photo_url, location, description) VALUES (?, ?, ?, ?, ?)',
      [license_plate, reporter_id, photo_url, location, description || null]
    );

    res.status(201).json({
      message: '违停记录上传成功',
      recordId: result.insertId,
      photo_url: photo_url
    });
  } catch (error) {
    console.error('上传违停记录错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取违停记录列表
router.get('/list', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, license_plate } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    console.log('查询参数:', { page: pageNum, limit: limitNum, offset, license_plate });

    // 先检查是否有违停记录
    const [recordCount] = await pool.execute('SELECT COUNT(*) as count FROM violation_records');
    console.log('违停记录总数:', recordCount[0].count);

    if (recordCount[0].count === 0) {
      return res.json({
        violations: [],
        total: 0,
        page: pageNum,
        limit: limitNum
      });
    }

    // 使用字符串拼接而不是参数化查询来处理LIMIT和OFFSET
    let query = 'SELECT * FROM violation_records';
    let params = [];

    if (license_plate) {
      query += ' WHERE license_plate = ?';
      params.push(license_plate);
    }

    query += ` ORDER BY violation_time DESC LIMIT ${limitNum} OFFSET ${offset}`;

    console.log('执行SQL:', query);
    console.log('参数:', params);

    const [violations] = await pool.execute(query, params);

    // 为每个违停记录获取用户信息
    const violationsWithUser = await Promise.all(
      violations.map(async (violation) => {
        try {
          const [users] = await pool.execute(
            'SELECT username FROM users WHERE id = ?',
            [violation.reporter_id]
          );
          const [vehicles] = await pool.execute(
            'SELECT owner_name, building_number, unit_number FROM owner_vehicles WHERE license_plate = ?',
            [violation.license_plate]
          );
          
          return {
            ...violation,
            reporter_name: users[0]?.username || '未知用户',
            owner_name: vehicles[0]?.owner_name || null,
            building_number: vehicles[0]?.building_number || null,
            unit_number: vehicles[0]?.unit_number || null
          };
        } catch (error) {
          console.error('获取用户信息错误:', error);
          return {
            ...violation,
            reporter_name: '未知用户',
            owner_name: null,
            building_number: null,
            unit_number: null
          };
        }
      })
    );

    // 获取总数
    let countQuery = 'SELECT COUNT(*) as total FROM violation_records';
    let countParams = [];
    
    if (license_plate) {
      countQuery += ' WHERE license_plate = ?';
      countParams.push(license_plate);
    }

    const [countResult] = await pool.execute(countQuery, countParams);

    res.json({
      violations: violationsWithUser,
      total: countResult[0].total,
      page: pageNum,
      limit: limitNum
    });
  } catch (error) {
    console.error('获取违停记录错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除违停记录
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // 检查记录是否存在且属于当前用户
    const [records] = await pool.execute(
      'SELECT * FROM violation_records WHERE id = ? AND reporter_id = ?',
      [id, userId]
    );

    if (records.length === 0) {
      return res.status(404).json({ message: '记录不存在或无权限删除' });
    }

    // 删除记录
    await pool.execute('DELETE FROM violation_records WHERE id = ?', [id]);

    res.json({ message: '违停记录删除成功' });
  } catch (error) {
    console.error('删除违停记录错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;