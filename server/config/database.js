const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 初始化数据库表
async function initDatabase() {
  try {
    // 创建用户表
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        building_number VARCHAR(10),
        unit_number VARCHAR(10),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建违停记录表
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS violation_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        license_plate VARCHAR(20) NOT NULL,
        reporter_id INT NOT NULL,
        photo_url VARCHAR(255),
        violation_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        location VARCHAR(100),
        description TEXT,
        FOREIGN KEY (reporter_id) REFERENCES users(id)
      )
    `);

    console.log('数据库表初始化完成');
  } catch (error) {
    console.error('数据库初始化错误:', error);
  }
}

module.exports = { pool, initDatabase };