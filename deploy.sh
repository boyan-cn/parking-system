#!/bin/bash

# 停车管理系统通用部署脚本
# Community Parking System Universal Deployment Script

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 停车管理系统部署脚本${NC}"
echo "================================"

# 检查 Docker 和 Docker Compose
echo "🔍 检查环境..."
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker 未安装，请先安装 Docker${NC}"
    echo "安装指南: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose 未安装，请先安装 Docker Compose${NC}"
    echo "安装命令: sudo pip3 install docker-compose"
    exit 1
fi

echo -e "${GREEN}✅ Docker 环境检查完成${NC}"

# 检查环境变量文件
if [ ! -f .env ]; then
    echo -e "${YELLOW}📝 创建环境变量文件...${NC}"
    if [ -f .env.docker ]; then
        cp .env.docker .env
        echo -e "${GREEN}✅ 已从模板创建 .env 文件${NC}"
        
        # 生成随机密码
        if command -v openssl &> /dev/null; then
            DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
            JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-50)
            
            # 更新 .env 文件
            sed -i "s/your_secure_password_here/$DB_PASSWORD/g" .env
            sed -i "s/your_jwt_secret_key_here_change_this_to_random_string/$JWT_SECRET/g" .env
            
            echo -e "${GREEN}✅ 已生成随机密码和密钥${NC}"
        else
            echo -e "${YELLOW}⚠️  请手动编辑 .env 文件，设置数据库密码和 JWT 密钥${NC}"
            echo "   nano .env"
            read -p "按回车键继续..."
        fi
    else
        echo -e "${RED}❌ 找不到 .env.docker 模板文件${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ 环境变量文件已存在${NC}"
fi

# 创建必要的目录
echo "📂 创建目录结构..."
mkdir -p server/uploads
mkdir -p logs
chmod 755 server/uploads
echo -e "${GREEN}✅ 目录创建完成${NC}"

# 检查端口占用
echo "🔍 检查端口占用..."
PORTS=(80 8080 3306)
PORT_CONFLICTS=false

for port in "${PORTS[@]}"; do
    if netstat -tuln 2>/dev/null | grep ":$port " > /dev/null; then
        echo -e "${YELLOW}⚠️  端口 $port 已被占用${NC}"
        PORT_CONFLICTS=true
        case $port in
            80)
                echo "   建议修改前端端口为 8081"
                ;;
            8080)
                echo "   建议修改后端端口为 8081"
                ;;
            3306)
                echo "   建议修改数据库端口为 3307"
                ;;
        esac
    fi
done

if [ "$PORT_CONFLICTS" = true ]; then
    echo ""
    read -p "发现端口冲突，是否继续部署？(y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "部署已取消"
        exit 1
    fi
fi

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
    echo -e "${GREEN}✅ 服务启动成功${NC}"
else
    echo -e "${RED}❌ 服务启动失败${NC}"
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

# 检查前端
if curl -s http://localhost > /dev/null 2>&1; then
    echo -e "  前端服务: ${GREEN}✅ 正常${NC}"
else
    echo -e "  前端服务: ${YELLOW}⚠️  可能未就绪${NC}"
fi

# 检查后端
if curl -s http://localhost:8080/api/health > /dev/null 2>&1; then
    echo -e "  后端服务: ${GREEN}✅ 正常${NC}"
else
    echo -e "  后端服务: ${YELLOW}⚠️  可能未就绪${NC}"
fi

# 获取本机IP地址
LOCAL_IP=$(ip route get 1 2>/dev/null | awk '{print $7; exit}' || echo "localhost")

# 显示部署结果
echo ""
echo -e "${GREEN}🎉 部署完成！${NC}"
echo "================================"
echo -e "📱 访问信息:"
echo -e "   前端地址: ${GREEN}http://$LOCAL_IP${NC}"
echo -e "   后端API:  ${GREEN}http://$LOCAL_IP:8080/api${NC}"
echo ""
echo -e "🔐 默认管理员账号:"
echo -e "   用户名: ${YELLOW}admin${NC}"
echo -e "   密码: ${YELLOW}admin123${NC}"
echo -e "   ${RED}⚠️  请首次登录后立即修改密码！${NC}"
echo ""
echo -e "📋 管理命令:"
echo -e "   查看状态: ${BLUE}./manage.sh status${NC}"
echo -e "   查看日志: ${BLUE}./manage.sh logs${NC}"
echo -e "   重启服务: ${BLUE}./manage.sh restart${NC}"
echo -e "   停止服务: ${BLUE}./manage.sh stop${NC}"
echo -e "   备份数据: ${BLUE}./manage.sh backup${NC}"
echo ""
echo -e "📁 重要文件位置:"
echo -e "   配置文件: ${BLUE}$(pwd)/.env${NC}"
echo -e "   上传文件: ${BLUE}$(pwd)/server/uploads/${NC}"
echo -e "   日志文件: ${BLUE}$(pwd)/logs/${NC}"
echo ""

# 创建管理脚本的快捷方式
if [ ! -f manage.sh ]; then
    echo -e "${YELLOW}⚠️  manage.sh 文件不存在，请确保已下载完整项目${NC}"
else
    chmod +x manage.sh
    echo -e "${GREEN}✅ 已设置管理脚本权限${NC}"
fi

echo -e "🎯 下一步:"
echo "1. 访问前端地址进行初始化设置"
echo "2. 修改默认管理员密码"
echo "3. 导入现有的业主车辆数据"
echo "4. 配置定期备份计划"
echo ""
echo -e "📖 详细文档请查看 ${BLUE}README.md${NC}"

# 询问是否查看日志
echo ""
read -p "是否查看服务启动日志？(y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "按 Ctrl+C 退出日志查看"
    sleep 2
    docker-compose logs -f
fi