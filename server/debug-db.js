const { pool } = require('./config/database');

async function checkDatabase() {
  try {
    console.log('=== 数据库状态检查 ===');
    
    // 检查用户表
    const [users] = await pool.execute('SELECT id, username FROM users');
    console.log('用户表记录:', users);
    
    // 检查业主车辆表
    const [vehicles] = await pool.execute('SELECT license_plate, owner_name FROM owner_vehicles LIMIT 5');
    console.log('业主车辆表记录 (前5条):', vehicles);
    
    // 检查违停记录表
    const [violations] = await pool.execute('SELECT id, license_plate, reporter_id FROM violation_records LIMIT 5');
    console.log('违停记录表记录 (前5条):', violations);
    
    console.log('=== 检查完成 ===');
    process.exit(0);
  } catch (error) {
    console.error('数据库检查错误:', error);
    process.exit(1);
  }
}

checkDatabase();