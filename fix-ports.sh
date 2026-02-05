#!/bin/bash

# 端口冲突修复脚本

echo "🔍 检测和修复端口冲突..."

# 停止现有容器
echo "🛑 停止现有容器..."
docker-compose down

# 检查端口占用情况
check_port() {
    local port=$1
    if netstat -tuln 2>/dev/null | grep ":$port " > /dev/null; then
        return 0  # 端口被占用
    else
        return 1  # 端口可用
    fi
}

# 寻找可用端口
find_available_port() {
    local start_port=$1
    local port=$start_port
    
    while check_port $port; do
        port=$((port + 1))
        if [ $port -gt $((start_port + 100)) ]; then
            echo "❌ 无法找到可用端口"
            exit 1
        fi
    done
    
    echo $port
}

# 检查并分配端口
echo "🔍 检查端口占用情况..."

# 前端端口 (从80开始)
if check_port 80; then
    FRONTEND_PORT=$(find_available_port 8081)
    echo "⚠️  端口80被占用，前端将使用端口: $FRONTEND_PORT"
else
    FRONTEND_PORT=80
    echo "✅ 前端使用端口: $FRONTEND_PORT"
fi

# 后端端口 (从8080开始)
if check_port 8080; then
    BACKEND_PORT=$(find_available_port 8082)
    echo "⚠️  端口8080被占用，后端将使用端口: $BACKEND_PORT"
else
    BACKEND_PORT=8080
    echo "✅ 后端使用端口: $BACKEND_PORT"
fi

# 数据库端口 (从3306开始)
if check_port 3306; then
    DB_PORT=$(find_available_port 3307)
    echo "⚠️  端口3306被占用，数据库将使用端口: $DB_PORT"
else
    DB_PORT=3306
    echo "✅ 数据库使用端口: $DB_PORT"
fi

# 备份原始配置文件
echo "💾 备份原始配置文件..."
cp docker-compose.yml docker-compose.yml.backup

# 更新 docker-compose.yml 文件
echo "⚙️  更新端口配置..."
cat > docker-compose.yml << EOF
version: '3.8'

services:
  # MySQL 数据库
  mysql:
    image: mysql:8.0
    container_name: parking-mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: \${DB_PASSWORD}
      MYSQL_DATABASE: \${DB_NAME}
      TZ: Asia/Shanghai
    volumes:
      - mysql_data:/var/lib/mysql
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    ports:
      - "$DB_PORT:3306"
    networks:
      - parking-network
    command: >
      --default-authentication-plugin=mysql_native_password
      --character-set-server=utf8mb4
      --collation-server=utf8mb4_unicode_ci
      --innodb-buffer-pool-size=256M
      --max-connections=100
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-p\${DB_PASSWORD}"]
      timeout: 20s
      retries: 10
      interval: 30s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  # 后端服务
  server:
    build:
      context: .
      dockerfile: Dockerfile.server
    container_name: parking-server
    restart: unless-stopped
    environment:
      DB_HOST: mysql
      DB_USER: root
      DB_PASSWORD: \${DB_PASSWORD}
      DB_NAME: \${DB_NAME}
      JWT_SECRET: \${JWT_SECRET}
      PORT: 8080
      TZ: Asia/Shanghai
    volumes:
      - ./server/uploads:/app/uploads
      - ./logs:/app/logs
    ports:
      - "$BACKEND_PORT:8080"
    depends_on:
      mysql:
        condition: service_healthy
    networks:
      - parking-network
    healthcheck:
      test: ["CMD", "node", "/app/healthcheck.js"]
      timeout: 10s
      retries: 3
      interval: 30s
      start_period: 40s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  # 前端服务
  client:
    build:
      context: .
      dockerfile: Dockerfile.client
    container_name: parking-client
    restart: unless-stopped
    environment:
      TZ: Asia/Shanghai
    ports:
      - "$FRONTEND_PORT:80"
    depends_on:
      server:
        condition: service_healthy
    networks:
      - parking-network
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost/"]
      timeout: 10s
      retries: 3
      interval: 30s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

volumes:
  mysql_data:
    driver: local

networks:
  parking-network:
    driver: bridge
EOF

echo "✅ 端口配置已更新"

# 更新 nginx 配置以支持动态后端端口
echo "⚙️  更新 Nginx 配置..."
cat > nginx.conf << EOF
server {
    listen 80;
    server_name localhost;
    
    # 前端静态文件
    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files \$uri \$uri/ /index.html;
    }
    
    # API 代理到后端
    location /api/ {
        proxy_pass http://server:8080/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # 增加超时时间
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # 支持文件上传
        client_max_body_size 10M;
    }
    
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)\$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# 启动服务
echo "🚀 启动服务..."
docker-compose up -d --build

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 30

# 检查服务状态
echo "📊 检查服务状态..."
docker-compose ps

# 获取本机IP
LOCAL_IP=$(ip route get 1 2>/dev/null | awk '{print $7; exit}' || echo "localhost")

# 显示访问信息
echo ""
echo "🎉 部署完成！"
echo "================================"
echo "📱 访问地址:"
if [ "$FRONTEND_PORT" = "80" ]; then
    echo "   前端: http://$LOCAL_IP"
else
    echo "   前端: http://$LOCAL_IP:$FRONTEND_PORT"
fi

if [ "$BACKEND_PORT" = "8080" ]; then
    echo "   后端API: http://$LOCAL_IP:8080/api"
else
    echo "   后端API: http://$LOCAL_IP:$BACKEND_PORT/api"
fi

echo ""
echo "🔐 默认账号:"
echo "   用户名: admin"
echo "   密码: admin123"
echo ""
echo "📋 使用的端口:"
echo "   前端: $FRONTEND_PORT"
echo "   后端: $BACKEND_PORT"  
echo "   数据库: $DB_PORT"
echo ""
echo "💡 如果需要恢复原始配置:"
echo "   cp docker-compose.yml.backup docker-compose.yml"
EOF