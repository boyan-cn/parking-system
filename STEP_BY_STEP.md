# 🚀 群晖部署：一步步操作指南

## 📋 准备工作（5分钟）

### 1️⃣ 确认群晖环境
- ✅ DSM 7.0 或更高版本
- ✅ 至少 2GB 可用内存
- ✅ 至少 5GB 可用存储

### 2️⃣ 安装 Docker 套件
1. 打开 DSM 控制面板
2. 点击 **套件中心**
3. 搜索 "Docker"
4. 点击 **安装**
5. 等待安装完成

## 📁 文件上传（10分钟）

### 3️⃣ 创建项目目录
1. 打开 **File Station**
2. 点击左侧的 **docker** 文件夹（如果没有就创建一个）
3. 在 docker 文件夹内，点击 **新增** → **新增文件夹**
4. 命名为 `parking-system`

### 4️⃣ 上传所有项目文件
**方法A：拖拽上传（简单）**
1. 在 File Station 中进入 `/docker/parking-system/`
2. 将本地的所有项目文件拖拽到这个文件夹
3. 等待上传完成

**方法B：SSH上传（推荐）**
```bash
# 在你的电脑上执行（替换群晖IP地址）
scp -r ./parking-system admin@192.168.1.100:/volume1/docker/
```

## ⚙️ SSH 配置（5分钟）

### 5️⃣ 启用 SSH
1. DSM 控制面板 → **终端机和 SNMP**
2. 勾选 **启动 SSH 功能**
3. 端口保持默认 22
4. 点击 **应用**

### 6️⃣ SSH 连接群晖
```bash
# 替换为你的群晖IP地址
ssh admin@192.168.1.100
# 输入管理员密码
```

### 7️⃣ 进入项目目录
```bash
cd /volume1/docker/parking-system/
ls -la  # 查看文件是否都在
```

## 🔧 配置环境（3分钟）

### 8️⃣ 设置文件权限
```bash
# 给脚本执行权限
chmod +x *.sh

# 创建必要目录
mkdir -p server/uploads logs
chmod 755 server/uploads
```

### 9️⃣ 配置环境变量
```bash
# 复制环境变量模板
cp .env.docker .env

# 编辑配置文件
nano .env
```

**重要：修改这些配置**
```env
# 修改数据库密码（必须改）
DB_PASSWORD=你的安全密码123

# 修改JWT密钥（必须改）
JWT_SECRET=你的随机JWT密钥字符串abc123xyz
```

按 `Ctrl+X`，然后按 `Y`，再按 `Enter` 保存。

## 🚀 一键部署（2分钟）

### 🔟 执行部署脚本
```bash
# 运行群晖专用部署脚本
./synology-deploy.sh
```

脚本会自动：
- ✅ 检查环境
- ✅ 生成随机密码
- ✅ 构建 Docker 镜像
- ✅ 启动所有服务
- ✅ 显示访问地址

## 🎉 验证部署（2分钟）

### 1️⃣1️⃣ 检查服务状态
```bash
docker-compose ps
```
应该看到 3 个容器都是 "Up" 状态。

### 1️⃣2️⃣ 访问系统
1. 打开浏览器
2. 访问：`http://你的群晖IP地址`
3. 使用默认账号登录：
   - 用户名：`admin`
   - 密码：`admin123`

### 1️⃣3️⃣ 修改默认密码（重要！）
1. 登录后点击右上角用户名
2. 选择 **修改密码**
3. 设置新的安全密码

## 🔍 常见问题解决

### ❓ 端口被占用怎么办？
```bash
# 查看哪个端口被占用
netstat -tuln | grep :80

# 修改端口（编辑 docker-compose.yml）
nano docker-compose.yml
# 将 "80:80" 改为 "8080:80"
```

### ❓ 容器启动失败怎么办？
```bash
# 查看错误日志
docker-compose logs

# 重新启动
docker-compose down
docker-compose up -d --build
```

### ❓ 无法访问网页怎么办？
1. 检查群晖防火墙设置
2. 确认端口映射正确
3. 查看容器日志：`docker-compose logs client`

## 📊 日常管理

### 管理命令
```bash
# 查看状态
./manage.sh status

# 查看日志
./manage.sh logs

# 重启服务
./manage.sh restart

# 备份数据
./manage.sh backup
```

### 停止/启动服务
```bash
# 停止所有服务
docker-compose down

# 启动所有服务
docker-compose up -d
```

## 🎯 快速检查清单

部署完成后，确认以下项目：

- [ ] 3个容器都在运行（`docker-compose ps`）
- [ ] 可以访问前端页面（`http://群晖IP`）
- [ ] 可以正常登录系统
- [ ] 已修改默认密码
- [ ] 车辆查询功能正常
- [ ] 违停举报功能正常
- [ ] 图片上传功能正常

## 📞 获取帮助

如果遇到问题：

1. **查看日志**：`docker-compose logs -f`
2. **检查配置**：确认 `.env` 文件配置正确
3. **重新部署**：`docker-compose down && docker-compose up -d --build`
4. **查看文档**：参考 `SYNOLOGY_DEPLOYMENT_GUIDE.md`

## 🎉 恭喜！

如果所有步骤都完成了，你的停车管理系统就成功部署在群晖上了！

**访问地址**：`http://你的群晖IP地址`

现在你可以：
- 👥 管理用户账号
- 🚗 查询车辆信息  
- 📸 举报违停行为
- 📊 查看违停记录
- 📱 在手机上使用

享受你的新系统吧！ 🎊