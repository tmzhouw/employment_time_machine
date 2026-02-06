#!/bin/bash

##############################################
# 本地一键部署到生产环境脚本
# 在本地执行，自动提交、推送、部署
##############################################

set -e

# 配置（请修改为您的服务器信息）
SERVER_IP="your-server-ip"
SERVER_USER="root"
PROJECT_PATH="/opt/employment_time_machine"

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}自动部署到生产环境${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# 1. 检查是否有未提交的改动
if [[ -n $(git status -s) ]]; then
    echo -e "${YELLOW}📝 检测到本地改动，准备提交...${NC}"
    
    # 显示改动文件
    echo -e "${YELLOW}改动的文件:${NC}"
    git status -s
    echo ""
    
    # 询问提交信息
    read -p "请输入提交信息: " COMMIT_MSG
    
    if [ -z "$COMMIT_MSG" ]; then
        echo -e "${RED}❌ 提交信息不能为空${NC}"
        exit 1
    fi
    
    # 提交
    git add .
    git commit -m "$COMMIT_MSG"
    echo -e "${GREEN}✅ 代码已提交${NC}"
else
    echo -e "${GREEN}✅ 没有新的改动需要提交${NC}"
fi

# 2. 推送到 GitHub
echo ""
echo -e "${YELLOW}📤 推送到 GitHub...${NC}"
git push origin main
echo -e "${GREEN}✅ 推送成功${NC}"

# 3. 部署到服务器
echo ""
echo -e "${YELLOW}🌐 连接到腾讯云服务器并部署...${NC}"
echo -e "${YELLOW}服务器: ${SERVER_IP}${NC}"
echo ""

ssh ${SERVER_USER}@${SERVER_IP} << ENDSSH
set -e

echo "进入项目目录..."
cd ${PROJECT_PATH}

echo "拉取最新代码..."
git pull origin main

echo "重新构建并启动服务..."
docker-compose down
docker-compose build --no-cache
docker-compose up -d

echo "等待服务启动..."
sleep 10

echo "检查服务状态..."
docker-compose ps

echo ""
echo "✅ 服务器部署完成！"
ENDSSH

# 4. 验证部署
echo ""
echo -e "${YELLOW}🔍 验证部署...${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://${SERVER_IP})

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ 应用访问正常 (HTTP ${HTTP_CODE})${NC}"
else
    echo -e "${RED}⚠️ 应用可能有问题 (HTTP ${HTTP_CODE})${NC}"
fi

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}部署完成！${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo -e "${YELLOW}访问地址: ${NC}http://${SERVER_IP}"
echo -e "${YELLOW}查看日志: ${NC}ssh ${SERVER_USER}@${SERVER_IP} 'cd ${PROJECT_PATH} && docker-compose logs -f'"
echo ""
