# 群晖 NAS 部署完整指南

## 📋 部署前准备

### 1. 群晖系统要求
- DSM 7.0 或更高版本
- 至少 2GB 可用内存
- 至少 5GB 可用存储空间
- 已安装 Docker 套件

### 2. 安装 Docker 套件
1. 打开 DSM 控制面板
2. 进入 **套件中心**
3. 搜索 "Docker"
4. 点击安装 Docker 套件
5. 等待安装完成并启动

## 📁 文件目录结构

建议在群晖中创建以下目录结构：
```
/volume1/docker/parking-system/
├── client/                    # 前端源码
├── server/                    # 后端源码
├── database/                  # 数据库初始化脚本
├── docker-compose.yml         # Docker 编排文件
├── Dockerfile.client          # 前端 Docker 文件
├── Dockerfile.server          # 后端 Docker 文件
├── nginx.conf                 # Nginx 配置
├── .env                       # 环境变量配置
├── synology-deploy.sh         # 群晖部署脚本
└── manage.sh                  # 管理脚本
```

## 🚀 详细部署步骤

### 步骤 1: 创建项目目录

1. 打开 **File Station**
2. 导航到 `/docker/` 目录（如果不存在则创建）
3. 创建新文件夹 `parking-system`

### 步骤 2: 上传项目文件

#### 方法一：通过 File Station 上传
1. 在 File Station 中进入 `/docker/parking-system/`
2. 点击 **上传** 按钮
3. 选择并上传整个项目文件夹

#### 方法二：通过 SSH 上传（推荐）
```bash
# 在本地电脑上，使用 scp 命令上传
scp -r ./parking-system admin@群晖IP:/volume1/docker/

# 或者使用 rsync
rsync -avz ./parking-system/ admin@群晖IP:/volume1/docker/parking-system/
```

### 步骤 3: SSH 连接群晖

1. 在 DSM 中启用 SSH：
   - 控制面板 → 终端机和 SNMP
   - 勾选 "启动 SSH 功能"
   - 端口保持默认 22

2. 使用 SSH 客户端连接：
```bash
ssh admin@群晖IP地址
# 输入管理员密码
```

### 步骤 4: 进入项目目录并设置权限

```bash
# 进入项目目录
cd /volume1/docker/parking-system/

# 查看文件列表
ls -la

# 设置脚本执行权限
chmod +x synology-deploy.sh
chmod +x deploy.sh
chmod +x manage.sh

# 创建必要的目录
mkdir -p server/uploads
mkdir -p logs
chmod 755 server/uploads
```

### 步骤 5: 配置环境变量

```bash
# 复制环境变量模板
cp .env.docker .env

# 编辑环境变量文件
nano .env
```

**重要配置项**（必须修改）：
```env
# 数据库配置
DB_USER=parking_user
DB_PASSWORD=你的安全密码123        # 修改为强密码
DB_NAME=community_parking

# JWT 密钥（必须修改为随机字符串）
JWT_SECRET=你的随机JWT密钥字符串

# 端口配置
PORT=5000
```

### 步骤 6: 执行部署

#### 自动部署（推荐）
```bash
# 执行群晖专用部署脚本
./synology-deploy.sh
```

#### 手动部署
```bash
# 检查 Docker 状态
docker --version
docker-compose --version

# 停止可能存在的旧容器
docker-compose down

# 构建并启动服务
docker-compose up -d --build

# 查看服务状态
docker-compose ps
```

### 步骤 7: 验证部署

1. **检查容器状态**：
```bash
docker-compose ps
```
应该看到三个容器都是 "Up" 状态。

2. **查看日志**：
```bash
# 查看所有服务日志
docker-compose logs

# 查看特定服务日志
docker-compose logs server
docker-compose logs client
docker-compose logs mysql
```

3. **测试访问**：
   - 前端：`http://群晖IP地址`
   - 后端API：`http://群晖IP地址/api/health`

## 🌐 访问系统

### 获取群晖 IP 地址
```bash
# 在群晖 SSH 中执行
ip addr show | grep inet
```

### 访问地址
- **前端界面**：`http://群晖IP地址`
- **后端API**：`http://群晖IP地址/api`

### 默认登录信息
- 用户名：`admin`
- 密码：`admin123`

**⚠️ 重要：首次登录后立即修改密码！**

## 🔧 端口配置

### 默认端口
- 前端：80
- 后端：8080
- 数据库：3306

### 修改端口（如果冲突）
编辑 `docker-compose.yml` 文件：
```yaml
services:
  client:
    ports:
      - "8081:80"    # 前端改为 8081 端口
  server:
    ports:
      - "8081:8080"  # 后端改为 8081 端口
  mysql:
    ports:
      - "3307:3306"  # 数据库改为 3307 端口
```

## 📊 管理和维护

### 使用管理脚本
```bash
# 查看服务状态
./manage.sh status

# 启动服务
./manage.sh start

# 停止服务
./manage.sh stop

# 重启服务
./manage.sh restart

# 查看日志
./manage.sh logs

# 备份数据
./manage.sh backup

# 更新系统
./manage.sh update

# 健康检查
./manage.sh health

# 查看所有可用命令
./manage.sh help
```

### 手动管理命令
```bash
# 查看容器状态
docker-compose ps

# 查看实时日志
docker-compose logs -f

# 重启特定服务
docker-compose restart server

# 进入容器调试
docker-compose exec server sh
docker-compose exec mysql mysql -u root -p

# 查看资源使用
docker stats
```

## 💾 数据备份

### 自动备份
```bash
# 执行备份
./manage.sh backup
```

### 手动备份
```bash
# 备份数据库
docker-compose exec mysql mysqldump -u root -p community_parking > backup_$(date +%Y%m%d).sql

# 备份上传文件
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz server/uploads/
```

### 设置定时备份
```bash
# 编辑 crontab
crontab -e

# 添加定时任务（每天凌晨2点备份）
0 2 * * * cd /volume1/docker/parking-system && ./manage.sh backup
```

## 🔍 故障排除

### 常见问题

#### 1. 端口被占用
```bash
# 查看端口占用
netstat -tuln | grep :80

# 解决方案：修改 docker-compose.yml 中的端口映射
```

#### 2. 容器启动失败
```bash
# 查看详细错误
docker-compose logs [service_name]

# 重新构建
docker-compose down
docker-compose up -d --build
```

#### 3. 数据库连接失败
```bash
# 检查数据库状态
docker-compose logs mysql

# 重置数据库
docker-compose down
docker volume rm parking-system_mysql_data
docker-compose up -d
```

#### 4. 前端无法访问后端
```bash
# 检查网络连接
docker-compose exec client ping server

# 检查 nginx 配置
docker-compose exec client cat /etc/nginx/conf.d/default.conf
```

### 性能优化

#### 1. 调整内存限制
编辑 `docker-compose.yml`：
```yaml
services:
  mysql:
    deploy:
      resources:
        limits:
          memory: 1G
  server:
    deploy:
      resources:
        limits:
          memory: 512M
```

#### 2. 数据库优化
```yaml
mysql:
  command: >
    --default-authentication-plugin=mysql_native_password
    --innodb-buffer-pool-size=512M
    --max-connections=200
```

## 🔒 安全建议

1. **修改默认密码**：首次登录后立即修改
2. **使用强密码**：数据库和 JWT 密钥使用复杂密码
3. **防火墙设置**：只开放必要端口
4. **定期更新**：定期更新 Docker 镜像
5. **备份策略**：设置自动备份计划
6. **SSL 证书**：生产环境建议配置 HTTPS

## 📞 技术支持

### 获取帮助
1. 查看日志文件
2. 检查网络连接
3. 验证配置文件
4. 查看系统资源

### 联系支持
- 查看项目文档
- 提交 GitHub Issue
- 社区论坛求助

## 📝 部署检查清单

- [ ] 群晖 DSM 7.0+
- [ ] Docker 套件已安装
- [ ] 项目文件已上传到 `/volume1/docker/parking-system/`
- [ ] SSH 连接正常
- [ ] 环境变量已配置（`.env` 文件）
- [ ] 脚本权限已设置
- [ ] 容器成功启动
- [ ] 前端可以访问
- [ ] 后端 API 正常
- [ ] 数据库连接成功
- [ ] 默认密码已修改
- [ ] 备份策略已设置

完成以上步骤后，你的停车管理系统就成功部署在群晖 NAS 上了！