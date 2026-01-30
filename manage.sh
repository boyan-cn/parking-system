#!/bin/bash

# 停车管理系统管理脚本
# Community Parking System Management Script

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目信息
PROJECT_NAME="停车管理系统"
COMPOSE_FILE="docker-compose.yml"

# 显示帮助信息
show_help() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}    $PROJECT_NAME 管理脚本${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    echo "用法: $0 {命令}"
    echo ""
    echo "可用命令:"
    echo -e "  ${GREEN}start${NC}     - 启动所有服务"
    echo -e "  ${GREEN}stop${NC}      - 停止所有服务"
    echo -e "  ${GREEN}restart${NC}   - 重启所有服务"
    echo -e "  ${GREEN}status${NC}    - 查看服务状态"
    echo -e "  ${GREEN}logs${NC}      - 查看服务日志"
    echo -e "  ${GREEN}build${NC}     - 重新构建并启动服务"
    echo -e "  ${GREEN}backup${NC}    - 备份数据库和上传文件"
    echo -e "  ${GREEN}restore${NC}   - 恢复数据库备份"
    echo -e "  ${GREEN}update${NC}    - 更新系统（拉取最新代码并重新部署）"
    echo -e "  ${GREEN}clean${NC}     - 清理无用的Docker镜像和容器"
    echo -e "  ${GREEN}health${NC}    - 健康检查"
    echo -e "  ${GREEN}shell${NC}     - 进入服务器容器"
    echo -e "  ${GREEN}mysql${NC}     - 进入MySQL容器"
    echo -e "  ${GREEN}help${NC}      - 显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 start    # 启动系统"
    echo "  $0 logs     # 查看日志"
    echo "  $0 backup   # 备份数据"
    echo ""
}

# 检查Docker和Docker Compose
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker 未安装或未启动${NC}"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}❌ Docker Compose 未安装${NC}"
        exit 1
    fi
}

# 检查项目文件
check_project() {
    if [ ! -f "$COMPOSE_FILE" ]; then
        echo -e "${RED}❌ 找不到 $COMPOSE_FILE 文件${NC}"
        echo "请确保在项目根目录下运行此脚本"
        exit 1
    fi
}

# 启动服务
start_services() {
    echo -e "${BLUE}🚀 启动 $PROJECT_NAME...${NC}"
    docker-compose up -d
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ 服务启动成功${NC}"
        echo ""
        show_access_info
    else
        echo -e "${RED}❌ 服务启动失败${NC}"
        exit 1
    fi
}

# 停止服务
stop_services() {
    echo -e "${YELLOW}🛑 停止 $PROJECT_NAME...${NC}"
    docker-compose down
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ 服务已停止${NC}"
    else
        echo -e "${RED}❌ 停止服务时出错${NC}"
        exit 1
    fi
}

# 重启服务
restart_services() {
    echo -e "${BLUE}🔄 重启 $PROJECT_NAME...${NC}"
    docker-compose restart
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ 服务重启成功${NC}"
        show_access_info
    else
        echo -e "${RED}❌ 服务重启失败${NC}"
        exit 1
    fi
}

# 查看服务状态
show_status() {
    echo -e "${BLUE}📊 $PROJECT_NAME 服务状态:${NC}"
    echo ""
    docker-compose ps
    echo ""
    
    # 检查服务健康状态
    echo -e "${BLUE}🏥 健康检查:${NC}"
    
    # 检查前端
    if curl -s http://localhost > /dev/null 2>&1; then
        echo -e "  前端服务: ${GREEN}✅ 正常${NC}"
    else
        echo -e "  前端服务: ${RED}❌ 异常${NC}"
    fi
    
    # 检查后端
    if curl -s http://localhost:8080/api/health > /dev/null 2>&1; then
        echo -e "  后端服务: ${GREEN}✅ 正常${NC}"
    else
        echo -e "  后端服务: ${RED}❌ 异常${NC}"
    fi
    
    # 检查数据库
    if docker-compose exec -T mysql mysqladmin ping -h localhost -u root -p$(grep DB_PASSWORD .env | cut -d'=' -f2) > /dev/null 2>&1; then
        echo -e "  数据库服务: ${GREEN}✅ 正常${NC}"
    else
        echo -e "  数据库服务: ${RED}❌ 异常${NC}"
    fi
}

# 查看日志
show_logs() {
    echo -e "${BLUE}📋 $PROJECT_NAME 服务日志:${NC}"
    echo ""
    echo "按 Ctrl+C 退出日志查看"
    echo ""
    docker-compose logs -f --tail=100
}

# 重新构建
build_services() {
    echo -e "${BLUE}🔨 重新构建 $PROJECT_NAME...${NC}"
    docker-compose down
    docker-compose build --no-cache
    docker-compose up -d
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ 构建并启动成功${NC}"
        show_access_info
    else
        echo -e "${RED}❌ 构建失败${NC}"
        exit 1
    fi
}

# 备份数据
backup_data() {
    echo -e "${BLUE}💾 备份 $PROJECT_NAME 数据...${NC}"
    
    # 创建备份目录
    BACKUP_DIR="backups"
    mkdir -p $BACKUP_DIR
    
    # 获取当前时间戳
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    
    # 备份数据库
    echo "正在备份数据库..."
    DB_PASSWORD=$(grep DB_PASSWORD .env | cut -d'=' -f2)
    docker-compose exec -T mysql mysqldump -u root -p$DB_PASSWORD community_parking > "$BACKUP_DIR/database_$TIMESTAMP.sql"
    
    if [ $? -eq 0 ]; then
        echo -e "  数据库备份: ${GREEN}✅ 成功${NC}"
    else
        echo -e "  数据库备份: ${RED}❌ 失败${NC}"
    fi
    
    # 备份上传文件
    echo "正在备份上传文件..."
    if [ -d "server/uploads" ]; then
        tar -czf "$BACKUP_DIR/uploads_$TIMESTAMP.tar.gz" server/uploads/
        echo -e "  文件备份: ${GREEN}✅ 成功${NC}"
    else
        echo -e "  文件备份: ${YELLOW}⚠️  uploads目录不存在${NC}"
    fi
    
    # 备份配置文件
    echo "正在备份配置文件..."
    cp .env "$BACKUP_DIR/env_$TIMESTAMP.backup" 2>/dev/null
    
    echo ""
    echo -e "${GREEN}✅ 备份完成！${NC}"
    echo "备份文件位置: $BACKUP_DIR/"
    ls -la $BACKUP_DIR/ | tail -5
}

# 恢复数据
restore_data() {
    echo -e "${BLUE}🔄 恢复 $PROJECT_NAME 数据...${NC}"
    
    BACKUP_DIR="backups"
    
    if [ ! -d "$BACKUP_DIR" ]; then
        echo -e "${RED}❌ 备份目录不存在${NC}"
        exit 1
    fi
    
    # 列出可用的备份文件
    echo "可用的数据库备份文件:"
    ls -la $BACKUP_DIR/database_*.sql 2>/dev/null | nl
    
    echo ""
    read -p "请输入要恢复的备份文件编号 (或按回车取消): " choice
    
    if [ -z "$choice" ]; then
        echo "取消恢复操作"
        return
    fi
    
    # 获取选择的文件
    backup_file=$(ls $BACKUP_DIR/database_*.sql 2>/dev/null | sed -n "${choice}p")
    
    if [ -z "$backup_file" ]; then
        echo -e "${RED}❌ 无效的选择${NC}"
        exit 1
    fi
    
    echo "正在恢复数据库: $backup_file"
    DB_PASSWORD=$(grep DB_PASSWORD .env | cut -d'=' -f2)
    docker-compose exec -T mysql mysql -u root -p$DB_PASSWORD community_parking < "$backup_file"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ 数据库恢复成功${NC}"
    else
        echo -e "${RED}❌ 数据库恢复失败${NC}"
    fi
}

# 更新系统
update_system() {
    echo -e "${BLUE}🔄 更新 $PROJECT_NAME...${NC}"
    
    # 检查是否是Git仓库
    if [ -d ".git" ]; then
        echo "正在拉取最新代码..."
        git pull
        
        if [ $? -ne 0 ]; then
            echo -e "${RED}❌ 代码更新失败${NC}"
            exit 1
        fi
    else
        echo -e "${YELLOW}⚠️  不是Git仓库，跳过代码更新${NC}"
    fi
    
    # 重新构建和部署
    echo "正在重新构建服务..."
    docker-compose down
    docker-compose build --no-cache
    docker-compose up -d
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ 系统更新成功${NC}"
        show_access_info
    else
        echo -e "${RED}❌ 系统更新失败${NC}"
        exit 1
    fi
}

# 清理系统
clean_system() {
    echo -e "${BLUE}🧹 清理 Docker 资源...${NC}"
    
    echo "正在清理无用的镜像和容器..."
    docker system prune -f
    
    echo "正在清理无用的卷..."
    docker volume prune -f
    
    echo -e "${GREEN}✅ 清理完成${NC}"
}

# 健康检查
health_check() {
    echo -e "${BLUE}🏥 $PROJECT_NAME 健康检查${NC}"
    echo ""
    
    # 检查容器状态
    echo "📦 容器状态:"
    docker-compose ps
    echo ""
    
    # 检查服务响应
    echo "🌐 服务响应检查:"
    
    # 前端检查
    if curl -s -o /dev/null -w "%{http_code}" http://localhost | grep -q "200\|301\|302"; then
        echo -e "  前端 (http://localhost): ${GREEN}✅ 正常${NC}"
    else
        echo -e "  前端 (http://localhost): ${RED}❌ 无响应${NC}"
    fi
    
    # 后端API检查
    if curl -s http://localhost:8080/api/health | grep -q "OK\|success"; then
        echo -e "  后端API (http://localhost:8080/api): ${GREEN}✅ 正常${NC}"
    else
        echo -e "  后端API (http://localhost:8080/api): ${RED}❌ 无响应${NC}"
    fi
    
    # 数据库检查
    DB_PASSWORD=$(grep DB_PASSWORD .env | cut -d'=' -f2 2>/dev/null)
    if [ -n "$DB_PASSWORD" ] && docker-compose exec -T mysql mysqladmin ping -h localhost -u root -p$DB_PASSWORD > /dev/null 2>&1; then
        echo -e "  数据库: ${GREEN}✅ 正常${NC}"
    else
        echo -e "  数据库: ${RED}❌ 连接失败${NC}"
    fi
    
    # 磁盘空间检查
    echo ""
    echo "💾 磁盘空间:"
    df -h . | tail -1 | awk '{print "  可用空间: " $4 " / " $2 " (" $5 " 已使用)"}'
    
    # 内存使用检查
    echo ""
    echo "🧠 内存使用:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" | grep -E "(parking|CONTAINER)"
}

# 进入服务器容器
enter_server() {
    echo -e "${BLUE}🖥️  进入服务器容器...${NC}"
    docker-compose exec server sh
}

# 进入MySQL容器
enter_mysql() {
    echo -e "${BLUE}🗄️  进入MySQL容器...${NC}"
    DB_PASSWORD=$(grep DB_PASSWORD .env | cut -d'=' -f2 2>/dev/null)
    if [ -n "$DB_PASSWORD" ]; then
        docker-compose exec mysql mysql -u root -p$DB_PASSWORD community_parking
    else
        echo -e "${RED}❌ 无法获取数据库密码${NC}"
        exit 1
    fi
}

# 显示访问信息
show_access_info() {
    # 获取本机IP
    LOCAL_IP=$(ip route get 1 | awk '{print $7; exit}' 2>/dev/null || echo "localhost")
    
    echo ""
    echo -e "${GREEN}🎉 系统运行中！${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo -e "📱 访问地址:"
    echo -e "   前端: ${GREEN}http://$LOCAL_IP${NC}"
    echo -e "   后端API: ${GREEN}http://$LOCAL_IP:8080/api${NC}"
    echo ""
    echo -e "🔐 默认账号:"
    echo -e "   用户名: ${YELLOW}admin${NC}"
    echo -e "   密码: ${YELLOW}admin123${NC}"
    echo -e "   ${RED}⚠️  请首次登录后修改密码！${NC}"
    echo -e "${BLUE}========================================${NC}"
}

# 主函数
main() {
    # 检查环境
    check_docker
    check_project
    
    case "$1" in
        start)
            start_services
            ;;
        stop)
            stop_services
            ;;
        restart)
            restart_services
            ;;
        status)
            show_status
            ;;
        logs)
            show_logs
            ;;
        build)
            build_services
            ;;
        backup)
            backup_data
            ;;
        restore)
            restore_data
            ;;
        update)
            update_system
            ;;
        clean)
            clean_system
            ;;
        health)
            health_check
            ;;
        shell)
            enter_server
            ;;
        mysql)
            enter_mysql
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            echo -e "${RED}❌ 未知命令: $1${NC}"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# 如果没有参数，显示帮助
if [ $# -eq 0 ]; then
    show_help
    exit 1
fi

# 执行主函数
main "$@"