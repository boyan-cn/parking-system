# 群晖停车管理系统 Docker 部署指南

## 系统要求

- 群晖 NAS (DSM 7.0+)
- Docker 和 Docker Compose
- 至少 2GB 可用内存
- 至少 5GB 可用存储空间

## 快速部署

### 1. 准备环境

在群晖 DSM 中安装 Docker 套件：
1. 打开套件中心
2. 搜索并安装 "Docker"
3. 启动 Docker 套件

### 2. 上传项目文件

将整个项目文件夹上传到群晖的共享文件夹中，例如：
```
/volume1/docker/parking-system/
```

### 3. SSH 连接群晖

使用 SSH 连接到群晖：
```bash
ssh admin@your-synology-ip
```

### 4. 进入项目目录

```bash
cd /volume1/docker/parking-system/
```

### 5. 配置环境变量

```bash
# 复制环境变量模板
cp .env.docker .env

# 编辑环境变量
nano .env
```

修改以下配置：
```env
# 数据库配置
DB_USER=parking_user
DB_PASSWORD=your_secure_password_123  # 修改为强密码
DB_NAME=community_parking

# JWT 密钥（必须修改）
JWT_SECRET=your_random_jwt_secret_key_here_change_this

# 端口配置
PORT=5000
```

### 6. 执行部署

```bash
# 给部署脚本执行权限
chmod +x deploy.sh

# 执行部署
./deploy.sh
```

或者手动执行：
```bash
# 构建并启动所有服务
docker-compose up -d --build

# 查看服务状态
docker-compose ps
```

## 访问系统

部署完成后，可以通过以下地址访问：

- **前端界面**: `http://群晖IP地址`
- **API接口**: `http://群晖IP地址/api`

### 默认管理员账号
- 用户名: `admin`
- 密码: `admin123`

**⚠️ 重要：首次登录后请立即修改密码！**

## 端口配置

如果需要修改端口，编辑 `docker-compose.yml` 文件：

```yaml
services:
  client:
    ports:
      - "8080:80"  # 修改前端端口为 8080
  
  server:
    ports:
      - "5001:5000"  # 修改后端端口为 5001
  
  mysql:
    ports:
      - "3307:3306"  # 修改数据库端口为 3307
```

## 数据持久化

系统数据存储在以下位置：
- **数据库数据**: Docker volume `mysql_data`
- **上传文件**: `./server/uploads/` 目录

### 备份数据

```bash
# 备份数据库
docker-compose exec mysql mysqldump -u root -p community_parking > backup.sql

# 备份上传文件
tar -czf uploads_backup.tar.gz server/uploads/
```

### 恢复数据

```bash
# 恢复数据库
docker-compose exec -T mysql mysql -u root -p community_parking < backup.sql

# 恢复上传文件
tar -xzf uploads_backup.tar.gz
```

## 管理命令

### 查看服务状态
```bash
docker-compose ps
```

### 查看日志
```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f server
docker-compose logs -f client
docker-compose logs -f mysql
```

### 重启服务
```bash
# 重启所有服务
docker-compose restart

# 重启特定服务
docker-compose restart server
```

### 停止服务
```bash
docker-compose down
```

### 更新系统
```bash
# 停止服务
docker-compose down

# 拉取最新代码
git pull

# 重新构建并启动
docker-compose up -d --build
```

## 故障排除

### 1. 端口冲突
如果遇到端口冲突，修改 `docker-compose.yml` 中的端口映射。

### 2. 数据库连接失败
检查 `.env` 文件中的数据库配置是否正确。

### 3. 文件上传失败
确保 `server/uploads` 目录有写入权限：
```bash
chmod 755 server/uploads
```

### 4. 前端无法访问后端
检查 nginx 配置和网络连接。

### 5. 查看详细错误
```bash
# 查看容器详细信息
docker-compose logs server

# 进入容器调试
docker-compose exec server sh
```

## 性能优化

### 1. 数据库优化
在 `docker-compose.yml` 中添加 MySQL 配置：
```yaml
mysql:
  command: >
    --default-authentication-plugin=mysql_native_password
    --innodb-buffer-pool-size=256M
    --max-connections=100
```

### 2. 内存限制
```yaml
services:
  server:
    mem_limit: 512m
  client:
    mem_limit: 256m
  mysql:
    mem_limit: 1g
```

## 安全建议

1. **修改默认密码**: 首次登录后立即修改管理员密码
2. **使用强密码**: 数据库和 JWT 密钥使用强随机密码
3. **防火墙配置**: 只开放必要的端口
4. **定期备份**: 设置自动备份计划
5. **更新系统**: 定期更新 Docker 镜像和系统代码

## 监控和维护

### 设置自动重启
```yaml
services:
  server:
    restart: unless-stopped
  client:
    restart: unless-stopped
  mysql:
    restart: unless-stopped
```

### 日志轮转
```yaml
services:
  server:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## 技术支持

如遇到问题，请检查：
1. Docker 和 Docker Compose 版本
2. 系统资源使用情况
3. 网络连接状态
4. 日志文件内容

更多技术支持，请查看项目文档或提交 Issue。