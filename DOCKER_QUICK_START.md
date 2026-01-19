# 🚀 Docker 快速部署指南

## 一键部署（推荐）

### 群晖 NAS 用户
```bash
# 1. 下载项目到群晖
# 2. SSH 连接群晖
# 3. 进入项目目录
cd /volume1/docker/parking-system/

# 4. 执行群晖专用部署脚本
chmod +x synology-deploy.sh
./synology-deploy.sh
```

### 普通 Linux 服务器
```bash
# 1. 克隆项目
git clone <项目地址>
cd parking-system

# 2. 执行部署脚本
chmod +x deploy.sh
./deploy.sh
```

## 手动部署

### 1. 环境准备
```bash
# 安装 Docker 和 Docker Compose
curl -fsSL https://get.docker.com | sh
sudo pip3 install docker-compose
```

### 2. 配置环境变量
```bash
# 复制环境变量模板
cp .env.docker .env

# 编辑配置（重要！）
nano .env
```

必须修改的配置：
```env
DB_PASSWORD=your_secure_password_123
JWT_SECRET=your_random_jwt_secret_key
```

### 3. 启动服务
```bash
# 构建并启动
docker-compose up -d --build

# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

## 访问系统

- **前端**: http://你的IP地址
- **后端API**: http://你的IP地址/api
- **默认账号**: admin / admin123

## 常用命令

```bash
# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f [service_name]

# 重启服务
docker-compose restart

# 停止服务
docker-compose down

# 更新服务
docker-compose down
docker-compose up -d --build

# 备份数据
docker-compose exec mysql mysqldump -u root -p community_parking > backup.sql

# 进入容器调试
docker-compose exec server sh
docker-compose exec mysql mysql -u root -p
```

## 端口配置

默认端口：
- 前端：80
- 后端：5000  
- 数据库：3306

如需修改，编辑 `docker-compose.yml`：
```yaml
services:
  client:
    ports:
      - "8080:80"  # 改为 8080 端口
```

## 故障排除

### 端口冲突
```bash
# 查看端口占用
netstat -tuln | grep :80

# 修改端口
nano docker-compose.yml
```

### 数据库连接失败
```bash
# 检查数据库状态
docker-compose logs mysql

# 重置数据库
docker-compose down
docker volume rm parking-system_mysql_data
docker-compose up -d
```

### 前端无法访问后端
```bash
# 检查网络连接
docker-compose exec client ping server

# 检查 nginx 配置
docker-compose exec client cat /etc/nginx/conf.d/default.conf
```

## 生产环境部署

使用生产环境配置：
```bash
# 使用生产环境配置文件
docker-compose -f docker-compose.prod.yml up -d --build
```

生产环境特性：
- 资源限制
- 日志轮转
- 健康检查
- Redis 缓存
- 性能优化

## 数据备份

### 自动备份脚本
```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p backups

# 备份数据库
docker-compose exec -T mysql mysqldump -u root -p${DB_PASSWORD} community_parking > "backups/db_$DATE.sql"

# 备份上传文件
tar -czf "backups/uploads_$DATE.tar.gz" server/uploads/

# 清理旧备份（保留7天）
find backups/ -name "*.sql" -mtime +7 -delete
find backups/ -name "*.tar.gz" -mtime +7 -delete

echo "备份完成: $DATE"
```

### 定时备份（crontab）
```bash
# 每天凌晨2点备份
0 2 * * * /path/to/parking-system/backup.sh
```

## 监控和维护

### 系统监控
```bash
# 查看资源使用
docker stats

# 查看磁盘使用
docker system df

# 清理无用镜像
docker system prune -f
```

### 日志管理
```bash
# 查看日志大小
docker-compose logs --tail=0 | wc -l

# 清理日志
docker-compose down
docker system prune -f
docker-compose up -d
```

## 安全建议

1. **修改默认密码**
2. **使用强随机密钥**
3. **定期更新系统**
4. **配置防火墙**
5. **启用 HTTPS**
6. **定期备份数据**

## 技术支持

遇到问题？
1. 查看 `DEPLOYMENT.md` 详细文档
2. 检查 Docker 日志
3. 确认网络连接
4. 验证配置文件

更多帮助请查看项目文档或提交 Issue。