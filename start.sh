#!/bin/bash

echo "=== 小区车辆违停管理系统启动脚本 ==="

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "错误: Node.js 未安装，请先安装 Node.js"
    exit 1
fi

# 检查MySQL是否运行
if ! command -v mysql &> /dev/null; then
    echo "警告: MySQL 命令未找到，请确保 MySQL 已安装并运行"
fi

echo "1. 安装依赖..."
npm run install-all

echo "2. 检查环境配置..."
if [ ! -f "server/.env" ]; then
    echo "警告: server/.env 文件不存在，请配置数据库连接信息"
    echo "复制 server/.env 文件并编辑数据库配置"
fi

echo "3. 创建上传目录..."
mkdir -p server/uploads

echo "4. 启动应用..."
echo "前端地址: http://localhost:3000"
echo "后端地址: http://localhost:5000"
echo "按 Ctrl+C 停止服务"

npm run dev