#!/bin/bash

# MySQL 配置修复脚本

echo "🔧 修复 MySQL 配置问题..."

# 停止所有容器
echo "🛑 停止现有容器..."
docker-compose down

# 删除有问题的 MySQL 数据卷
echo "🗑️  删除有问题的 MySQL 数据卷..."
docker volume rm parking-system_mysql_data 2>/dev/null || true

# 检查并更新 .env 文件
echo "⚙️  检查环境变量配置..."
if [ -f .env ]; then
    # 确保使用 root 用户
    if grep -q "DB_USER=parking_user" .env; then
        sed -i 's/DB_USER=parking_user/DB_USER=root/g' .env
        echo "✅ 已更新 DB_USER 为 root"
    fi
    
    # 检查密码是否设置
    if grep -q "DB_PASSWORD=your_secure_password_here" .env; then
        echo "⚠️  请设置数据库密码！"
        echo "编辑 .env 文件，将 DB_PASSWORD 设置为安全密码"
        read -p "按回车键继续..."
    fi
else
    echo "❌ .env 文件不存在，正在创建..."
    cp .env.docker .env
    echo "✅ 已创建 .env 文件"
fi

# 重新启动服务
echo "🚀 重新启动服务..."
docker-compose up -d --build

# 等待服务启动
echo "⏳ 等待 MySQL 启动..."
sleep 30

# 检查 MySQL 状态
echo "🏥 检查 MySQL 状态..."
if docker-compose exec mysql mysqladmin ping -h localhost -u root -p$(grep DB_PASSWORD .env | cut -d'=' -f2) > /dev/null 2>&1; then
    echo "✅ MySQL 启动成功！"
else
    echo "❌ MySQL 启动失败，查看日志："
    docker-compose logs mysql
    exit 1
fi

# 检查所有服务状态
echo "📊 检查所有服务状态..."
docker-compose ps

echo ""
echo "🎉 修复完成！"
echo "如果还有问题，请查看日志："
echo "  docker-compose logs mysql"