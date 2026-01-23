#!/bin/bash

# 群晖 NAS 专用部署脚本
# 适用于 DSM 7.0+

echo "🏠 群晖停车管理系统部署脚本"
echo "================================"

# 检查是否在群晖系统上运行
if [ ! -f /etc/synoinfo.conf ]; then
    echo "⚠️  警告：此脚本专为群晖 NAS 设计"
    read -p "是否继续？(y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 获取群晖信息
if [ -f /etc/synoinfo.conf ]; then
    SYNOLOGY_MODEL=$(grep "unique" /etc/synoinfo.conf | cut -d'"' -f4)
    echo "📱 检测到群晖型号: $SYNOLOGY_MODEL"
fi

# 检查 Docker 套件
echo "🔍 检查 Docker 环境..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装"
    echo "请在 DSM 套件中心安装 Docker 套件"
    echo "1. 打开 DSM 控制面板"
    echo "2. 进入套件中心"
    echo "3. 搜索并安装 'Docker'"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose 未找到"
    echo "正在尝试安装 Docker Compose..."
    
    # 尝试通过 pip 安装
    if command -v pip3 &> /dev/null; then
        sudo pip3 install docker-compose
    else
        echo "请手动安装 Docker Compose"
        exit 1
    fi
fi

echo "✅ Docker 环境检查完成"

# 检查系统资源
echo "📊 检查系统资源..."
TOTAL_MEM=$(free -m | awk 'NR==2{printf "%.0f", $2}')
AVAILABLE_MEM=$(free -m | awk 'NR==2{printf "%.0f", $7}')
DISK_SPACE=$(df -h . | awk 'NR==2 {print $4}')

echo "   总内存: ${TOTAL_MEM}MB"
echo "   可用内存: ${AVAILABLE_MEM}MB"
echo "   可用磁盘: ${DISK_SPACE}"

if [ "$AVAILABLE_MEM" -lt 1024 ]; then
    echo "⚠️  警告：可用内存不足 1GB，可能影响性能"
fi

# 设置项目目录
PROJECT_DIR=$(pwd)
echo "📁 项目目录: $PROJECT_DIR"

# 创建必要的目录
echo "📂 创建目录结构..."
mkdir -p server/uploads
mkdir -p logs
chmod 755 server/uploads

# 配置环境变量
if [ ! -f .env ]; then
    echo "⚙️  配置环境变量..."
    cp .env.docker .env
    
    # 生成随机密码
    DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-50)
    
    # 更新 .env 文件
    sed -i "s/your_secure_password_here/$DB_PASSWORD/g" .env
    sed -i "s/your_jwt_secret_key_here_change_this_to_random_string/$JWT_SECRET/g" .env
    
    echo "✅ 已生成随机密码和密钥"
else
    echo "✅ 环境变量文件已存在"
fi

# 检查端口占用
echo "🔍 检查端口占用..."
PORTS=(80 8080 3306)
for port in "${PORTS[@]}"; do
    if netstat -tuln | grep ":$port " > /dev/null; then
        echo "⚠️  端口 $port 已被占用"
        case $port in
            80)
                echo "   建议修改前端端口为 8081"
                sed -i 's/"80:80"/"8081:80"/g' docker-compose.yml
                ;;
            8080)
                echo "   建议修改后端端口为 8081"
                sed -i 's/"8080:8080"/"8081:8080"/g' docker-compose.yml
                ;;
            3306)
                echo "   建议修改数据库端口为 3307"
                sed -i 's/"3306:3306"/"3307:3306"/g' docker-compose.yml
                ;;
        esac
    fi
done

# 停止现有容器
echo "🛑 停止现有容器..."
docker-compose down 2>/dev/null || true

# 清理旧镜像（可选）
read -p "是否清理旧的 Docker 镜像？(y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🧹 清理旧镜像..."
    docker system prune -f
fi

# 构建并启动服务
echo "🔨 构建并启动服务..."
echo "   这可能需要几分钟时间..."

if docker-compose up -d --build; then
    echo "✅ 服务启动成功"
else
    echo "❌ 服务启动失败"
    echo "查看错误日志:"
    docker-compose logs
    exit 1
fi

# 等待服务就绪
echo "⏳ 等待服务就绪..."
sleep 30

# 检查服务状态
echo "📊 检查服务状态..."
docker-compose ps

# 健康检查
echo "🏥 执行健康检查..."
FRONTEND_PORT=$(docker-compose port client 80 2>/dev/null | cut -d: -f2)
BACKEND_PORT=$(docker-compose port server 8080 2>/dev/null | cut -d: -f2)

if [ -n "$FRONTEND_PORT" ]; then
    if curl -s http://localhost:$FRONTEND_PORT > /dev/null; then
        echo "✅ 前端服务正常"
    else
        echo "⚠️  前端服务可能未就绪"
    fi
fi

if [ -n "$BACKEND_PORT" ]; then
    if curl -s http://localhost:$BACKEND_PORT/api/health > /dev/null; then
        echo "✅ 后端服务正常"
    else
        echo "⚠️  后端服务可能未就绪"
    fi
fi

# 获取群晖 IP 地址
SYNOLOGY_IP=$(ip route get 1 | awk '{print $7; exit}')

# 显示部署结果
echo ""
echo "🎉 部署完成！"
echo "================================"
echo "📱 访问信息:"
echo "   前端地址: http://$SYNOLOGY_IP:${FRONTEND_PORT:-80}"
echo "   后端API:  http://$SYNOLOGY_IP:${BACKEND_PORT:-8080}/api"
echo ""
echo "🔐 默认管理员账号:"
echo "   用户名: admin"
echo "   密码: admin123"
echo "   ⚠️  请首次登录后立即修改密码！"
echo ""
echo "📋 管理命令:"
echo "   查看状态: docker-compose ps"
echo "   查看日志: docker-compose logs -f"
echo "   重启服务: docker-compose restart"
echo "   停止服务: docker-compose down"
echo ""
echo "📁 重要文件位置:"
echo "   配置文件: $PROJECT_DIR/.env"
echo "   上传文件: $PROJECT_DIR/server/uploads/"
echo "   日志文件: $PROJECT_DIR/logs/"
echo ""
echo "🔧 如需修改端口或配置，请编辑:"
echo "   docker-compose.yml"
echo "   .env"
echo ""

# 创建管理脚本
cat > manage.sh << 'EOF'
#!/bin/bash
# 停车管理系统管理脚本

case "$1" in
    start)
        echo "启动服务..."
        docker-compose up -d
        ;;
    stop)
        echo "停止服务..."
        docker-compose down
        ;;
    restart)
        echo "重启服务..."
        docker-compose restart
        ;;
    logs)
        docker-compose logs -f
        ;;
    status)
        docker-compose ps
        ;;
    backup)
        echo "备份数据..."
        mkdir -p backups
        docker-compose exec mysql mysqldump -u root -p community_parking > "backups/backup_$(date +%Y%m%d_%H%M%S).sql"
        tar -czf "backups/uploads_$(date +%Y%m%d_%H%M%S).tar.gz" server/uploads/
        echo "备份完成"
        ;;
    update)
        echo "更新系统..."
        docker-compose down
        docker-compose pull
        docker-compose up -d --build
        ;;
    *)
        echo "用法: $0 {start|stop|restart|logs|status|backup|update}"
        exit 1
        ;;
esac
EOF

chmod +x manage.sh
echo "✅ 已创建管理脚本 manage.sh"
echo "   使用方法: ./manage.sh {start|stop|restart|logs|status|backup|update}"

echo ""
echo "🎯 下一步:"
echo "1. 访问前端地址进行初始化设置"
echo "2. 修改默认管理员密码"
echo "3. 导入现有的业主车辆数据"
echo "4. 配置定期备份计划"
echo ""
echo "📖 详细文档请查看 DEPLOYMENT.md"