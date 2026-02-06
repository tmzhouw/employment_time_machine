#!/bin/bash

##############################################
# 企业用工时光机 - 一键部署脚本
# 适用于腾讯云服务器 (4核4GB)
##############################################

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}企业用工时光机 - 自动部署${NC}"
echo -e "${GREEN}================================${NC}"
echo ""

# 检查是否以 root 运行
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}错误: 请使用 root 权限运行此脚本${NC}"
    echo "使用命令: sudo bash deploy.sh"
    exit 1
fi

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Docker 未安装，正在安装...${NC}"
    curl -fsSL https://get.docker.com | bash
    systemctl enable docker
    systemctl start docker
    echo -e "${GREEN}✓ Docker 安装完成${NC}"
else
    echo -e "${GREEN}✓ Docker 已安装${NC}"
fi

# 检查 Docker Compose 是否安装
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}Docker Compose 未安装，正在安装...${NC}"
    curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}✓ Docker Compose 安装完成${NC}"
else
    echo -e "${GREEN}✓ Docker Compose 已安装${NC}"
fi

# 检查 .env.production 文件
if [ ! -f .env.production ]; then
    echo -e "${YELLOW}未找到 .env.production 文件，从示例复制...${NC}"
    cp .env.production.example .env.production
    echo -e "${RED}请编辑 .env.production 文件，设置数据库密码！${NC}"
    echo "使用命令: nano .env.production"
    exit 1
fi

# 创建必要的目录
echo -e "${YELLOW}创建必要的目录...${NC}"
mkdir -p nginx/ssl
mkdir -p nginx/logs
mkdir -p backups
echo -e "${GREEN}✓ 目录创建完成${NC}"

# 检查端口占用
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo -e "${RED}错误: 端口 $1 已被占用${NC}"
        echo "请释放端口后重试，或使用以下命令查看占用进程:"
        echo "  lsof -i :$1"
        exit 1
    fi
}

echo -e "${YELLOW}检查端口占用...${NC}"
check_port 80
check_port 443
check_port 3000
echo -e "${GREEN}✓ 端口检查通过${NC}"

# 构建并启动服务
echo -e "${YELLOW}构建 Docker 镜像...${NC}"
docker-compose build --no-cache

echo -e "${YELLOW}启动服务...${NC}"
docker-compose up -d

# 等待服务启动
echo -e "${YELLOW}等待服务启动...${NC}"
sleep 10

# 检查服务状态
echo -e "${YELLOW}检查服务状态...${NC}"
docker-compose ps

# 检查数据库连接
echo -e "${YELLOW}检查数据库连接...${NC}"
if docker-compose exec -T postgres pg_isready -U employment_user; then
    echo -e "${GREEN}✓ 数据库连接正常${NC}"
else
    echo -e "${RED}✗ 数据库连接失败${NC}"
    echo "查看日志: docker-compose logs postgres"
    exit 1
fi

# 检查应用状态
echo -e "${YELLOW}检查应用状态...${NC}"
sleep 5
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 应用启动成功${NC}"
else
    echo -e "${RED}✗ 应用启动失败${NC}"
    echo "查看日志: docker-compose logs app"
    exit 1
fi

# 获取服务器IP
SERVER_IP=$(curl -s ifconfig.me || echo "无法获取")

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}部署成功！${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo -e "访问地址: ${GREEN}http://${SERVER_IP}${NC}"
echo -e "或: ${GREEN}http://localhost${NC} (本机)"
echo ""
echo -e "${YELLOW}常用命令:${NC}"
echo "  查看日志: docker-compose logs -f"
echo "  停止服务: docker-compose down"
echo "  重启服务: docker-compose restart"
echo "  查看状态: docker-compose ps"
echo ""
echo -e "${YELLOW}下一步:${NC}"
echo "  1. 配置域名解析（可选）"
echo "  2. 配置 HTTPS 证书（推荐）"
echo "  3. 导入初始数据"
echo "  4. 设置定时备份"
echo ""
echo -e "${GREEN}详细文档请查看: DEPLOYMENT.md${NC}"
