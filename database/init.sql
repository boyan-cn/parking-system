-- 创建数据库
CREATE DATABASE IF NOT EXISTS community_parking CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE community_parking;

-- 业主车辆信息表（使用现有表结构）
-- 假设这个表已经存在，如果不存在可以创建：
CREATE TABLE IF NOT EXISTS owner_vehicles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  license_plate VARCHAR(20) NOT NULL COMMENT '车牌号',
  owner_name VARCHAR(100) NOT NULL COMMENT '车主姓名',
  phone VARCHAR(25) NOT NULL COMMENT '联系电话',
  building_number VARCHAR(10) NOT NULL COMMENT '楼号',
  unit_number VARCHAR(10) NOT NULL COMMENT '单元号',
  parking_space VARCHAR(20) COMMENT '车位号',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_license_plate (license_plate),
  INDEX idx_owner_info (building_number, unit_number)
) COMMENT='业主车辆信息表';

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名',
  password VARCHAR(255) NOT NULL COMMENT '密码',
  phone VARCHAR(20) COMMENT '手机号',
  building_number VARCHAR(10) COMMENT '楼号',
  unit_number VARCHAR(10) COMMENT '单元号',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_username (username)
) COMMENT='用户表';

-- 违停记录表
CREATE TABLE IF NOT EXISTS violation_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  license_plate VARCHAR(20) NOT NULL COMMENT '车牌号',
  reporter_id INT NOT NULL COMMENT '举报人ID',
  photo_url VARCHAR(255) COMMENT '违停照片路径',
  violation_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '违停时间',
  location VARCHAR(100) COMMENT '违停位置',
  description TEXT COMMENT '违停描述',
  FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_license_plate (license_plate),
  INDEX idx_reporter (reporter_id),
  INDEX idx_violation_time (violation_time),
  INDEX idx_daily_report (license_plate, reporter_id, violation_time)
) COMMENT='违停记录表';


-- 创建管理员用户（密码：admin123）
INSERT INTO users (username, password, phone, building_number, unit_number) VALUES
('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '13900139001', '管理', '001'),
('zhangsan', '$2a$10$jLn1W4Nve5w9HzP0CGHDk.5g6oM1nZmVdnDZc8CLLx0CD0z/gZii6', '13900139001', '管理', '002'),
('yanbo', '$2b$10$bm6jgaEgxKem9L8Kb1CH4OCI3hepKKIyAGPeFE1g67DIoujqziiMe', '13915596329', '管理', '003')
ON DUPLICATE KEY UPDATE 
  phone = VALUES(phone),
  building_number = VALUES(building_number),
  unit_number = VALUES(unit_number);