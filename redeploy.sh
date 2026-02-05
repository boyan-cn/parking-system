#!/bin/bash

# 快速重新部署脚本

echo "🔄 重新部署停车管理系统..."

# 停止现有容器
echo "🛑 停止现有容器..."
docker-compose down

# 删除MySQL数据卷（如果需要重置数据库）
read -p "是否重置数据库？这将删除所有数据 (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️  删除MySQL数据卷..."
    docker volume rm parking-system_mysql_data 2>/dev/null || true
fi

# 重新启动服务
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
echo "🎉 重新部署完成！"
echo "================================"
echo "📱 访问地址:"
echo "   前端: http://$LOCAL_IP"
echo "   后端API: http://$LOCAL_IP:8083/api"
echo ""
echo "🔐 默认账号:"
echo "   用户名: admin"
echo "   密码: admin123"
echo ""
echo "📋 端口配置:"
echo "   前端: 80"
echo "   后端: 8083"
echo "   数据库: 3306"
echo ""

# 健康检查
echo "🏥 健康检查..."
sleep 5

if curl -s http://localhost > /dev/null 2>&1; then
    echo "✅ 前端服务正常"
else
    echo "⚠️  前端服务可能未就绪"
fi

if curl -s http://localhost:8083/api/health > /dev/null 2>&1; then
    echo "✅ 后端服务正常"
else
    echo "⚠️  后端服务可能未就绪"
fi

echo ""
echo "📋 管理命令:"
echo "   查看状态: ./manage.sh status"
echo "   查看日志: ./manage.sh logs"
echo "   重启服务: ./manage.sh restart"