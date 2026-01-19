#!/bin/bash

# 群晖停车管理系统 Docker 部署脚本

echo "🚀 开始部署停车管理系统..."

# 检查 Docker 和 Docker Compose
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先安装 Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose 未安装，请先安装 Docker Compose"
    exit 1
fi

# 检查环境变量文件
if [ ! -f .env ]; then
    echo "📝 创建环境变量文件..."
    cp .env.docker .env
    echo "⚠️  请编辑 .env 文件，设置数据库密码和 JWT 密钥"
    echo "   nano .env"
    read -p "按回车键继续..."
fi

# 停止现有容器
echo "🛑 停止现有容器..."
docker-compose down

# 构建并启动服务
echo "🔨 构建并启动服务..."
docker-compose up -d --build

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 30

# 检查服务状态
echo "📊 检查服务状态..."
docker-compose ps

# 显示访问信息
echo ""
echo "✅ 部署完成！"
echo "🌐 前端访问地址: http://localhost"
echo "🔧 后端API地址: http://localhost/api"
echo "🗄️  数据库端口: 3306"
echo ""
echo "📋 管理命令:"
echo "   查看日志: docker-compose logs -f"
echo "   停止服务: docker-compose down"
echo "   重启服务: docker-compose restart"
echo "   查看状态: docker-compose ps"
echo ""
echo "🔐 默认管理员账号:"
echo "   用户名: admin"
echo "   密码: admin123"
echo "   (首次登录后请修改密码)"