# 🔌 端口配置说明

## 📊 默认端口配置

### 系统端口分配
- **前端服务**: 80 (HTTP)
- **后端API**: 8080 (避免与DSM 5000/5001冲突)
- **数据库**: 3306 (MySQL默认)

### 群晖DSM端口避让
考虑到群晖DSM使用以下端口：
- DSM管理界面: 5000 (HTTP)
- DSM管理界面: 5001 (HTTPS)

本系统已将后端端口改为 **8080**，避免冲突。

## ⚙️ 端口修改方法

### 1. 修改后端端口

#### 环境变量文件
```bash
# server/.env
PORT=8080  # 修改为你想要的端口

# .env.docker
PORT=8080  # 同步修改
```

#### Docker配置
```yaml
# docker-compose.yml
services:
  server:
    ports:
      - "8080:8080"  # 宿主机端口:容器端口
    environment:
      PORT: 8080
```

### 2. 修改前端端口

```yaml
# docker-compose.yml
services:
  client:
    ports:
      - "8081:80"  # 前端改为8081端口
```

### 3. 修改数据库端口

```yaml
# docker-compose.yml
services:
  mysql:
    ports:
      - "3307:3306"  # 数据库改为3307端口
```

## 🔍 端口冲突检测

### 检查端口占用
```bash
# Linux/macOS
netstat -tuln | grep :8080

# Windows
netstat -an | findstr :8080

# 或使用lsof (Linux/macOS)
lsof -i :8080
```

### 群晖端口检查
```bash
# SSH连接群晖后执行
netstat -tuln | grep -E ":(80|8080|3306|5000|5001)"
```

## 🚀 部署时端口配置

### 自动端口检测
部署脚本会自动检测端口冲突：

```bash
# synology-deploy.sh 会检查以下端口
PORTS=(80 8080 3306)

# 如果发现冲突，会自动建议替代端口
```

### 手动端口配置
如果需要使用特定端口：

1. **修改 docker-compose.yml**
```yaml
services:
  server:
    ports:
      - "你的端口:8080"
```

2. **更新环境变量**
```bash
# .env 文件
PORT=你的端口
```

3. **更新前端API地址**
```bash
# client/.env
REACT_APP_API_URL=http://localhost:你的端口
```

## 📋 常用端口建议

### Web应用端口
- 8080 (推荐) - 常用Web应用端口
- 8081 - 备选Web应用端口
- 8082 - 第二备选端口
- 3000 - 开发服务器常用端口
- 4000 - 备选开发端口

### 避免使用的端口
- 5000/5001 - 群晖DSM管理界面
- 22 - SSH
- 80/443 - 可能被其他Web服务占用
- 3306 - 如果已有MySQL服务

## 🔧 生产环境端口配置

### 反向代理配置
如果使用Nginx反向代理：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:80;  # 前端
    }
    
    location /api/ {
        proxy_pass http://localhost:8080/api/;  # 后端API
    }
}
```

### 群晖反向代理
在DSM控制面板 > 应用程序门户 > 反向代理：

- **来源**: your-domain.com:80
- **目标**: localhost:80 (前端)

- **来源**: your-domain.com/api
- **目标**: localhost:8080/api (后端)

## 🛡️ 防火墙配置

### 群晖防火墙
控制面板 > 安全性 > 防火墙：

允许端口：
- 80 (前端)
- 8080 (后端API)
- 3306 (数据库，仅内网)

### iptables配置
```bash
# 允许前端端口
iptables -A INPUT -p tcp --dport 80 -j ACCEPT

# 允许后端API端口
iptables -A INPUT -p tcp --dport 8080 -j ACCEPT

# 数据库端口仅允许本地访问
iptables -A INPUT -p tcp -s 127.0.0.1 --dport 3306 -j ACCEPT
```

## 📊 端口监控

### 实时监控
```bash
# 监控端口使用情况
watch -n 1 'netstat -tuln | grep -E ":(80|8080|3306)"'

# 检查服务状态
curl -s http://localhost:8080/api/health
```

### Docker容器端口
```bash
# 查看容器端口映射
docker-compose ps

# 查看特定容器端口
docker port parking-server-prod
```

## ❓ 常见问题

### Q: 端口被占用怎么办？
A: 
1. 找出占用进程：`lsof -i :8080`
2. 停止进程或修改配置使用其他端口
3. 重新启动服务

### Q: 如何在群晖上使用非标准端口？
A: 
1. 修改docker-compose.yml中的端口映射
2. 在群晖防火墙中开放对应端口
3. 如果需要域名访问，配置反向代理

### Q: 数据库端口需要对外开放吗？
A: 
不建议。数据库端口应该只允许应用服务器访问，不要对外网开放。

---

💡 **提示**: 修改端口后记得重启相关服务，并更新防火墙规则！