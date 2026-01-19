# 开发环境启动指南

## 快速启动

### 方法1: 使用启动脚本 (推荐)
```bash
# Windows
dev-start.bat

# 或者使用原来的方式
npm run dev
```

### 方法2: 手动分别启动

#### 1. 启动后端服务器
```bash
cd server
npm install
npm run dev
```
后端将运行在: http://localhost:5000

#### 2. 启动前端服务器 (新开一个命令窗口)
```bash
cd client
npm install
npm start
```
前端将运行在: http://localhost:3000

## 环境配置

### 后端配置 (server/.env)
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=community_parking
JWT_SECRET=your_jwt_secret_key
PORT=5000
```

### 前端配置 (client/.env)
```env
GENERATE_SOURCEMAP=false
SKIP_PREFLIGHT_CHECK=true
WDS_SOCKET_HOST=localhost
WDS_SOCKET_PORT=3000
REACT_APP_API_URL=http://localhost:5000
```

## 数据库初始化

1. 确保MySQL服务运行
2. 执行初始化脚本:
```bash
mysql -u root -p < database/init.sql
```

## 常见问题

### 1. 前端启动失败
如果遇到 "Invalid options object" 错误：
- 确保 client/.env 文件存在
- 删除 client/node_modules 重新安装: `cd client && npm install`

### 2. 后端连接数据库失败
- 检查 server/.env 中的数据库配置
- 确保MySQL服务正在运行
- 确保数据库 community_parking 已创建

### 3. 端口冲突
如果端口被占用，可以修改：
- 后端端口: 修改 server/.env 中的 PORT
- 前端端口: 设置环境变量 PORT=3001

## 默认账号

- 用户名: admin
- 密码: admin123

## 开发工具

推荐使用以下工具进行开发：
- VS Code
- MySQL Workbench
- Postman (API测试)

## API测试

后端启动后可以访问：
- 健康检查: http://localhost:5000/api/health
- API文档: 查看 README.md 中的接口说明