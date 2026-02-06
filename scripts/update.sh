#!/bin/bash

##############################################
# 自动更新部署脚本
# 用于服务器端快速更新代码
##############################################

set -e

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}企业用工时光机 - 自动更新${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

cd /opt/employment_time_machine

# 1. 拉取最新代码
echo -e "${YELLOW}📥 拉取最新代码...${NC}"
git pull origin main

# 2. 检查是否有 Docker 相关文件变化
CHANGED_FILES=$(git diff HEAD@{1} --name-only)

if echo "$CHANGED_FILES" | grep -E "Dockerfile|docker-compose.yml|nginx/"; then
    echo -e "${YELLOW}🔨 检测到配置文件变化，需要重新构建容器...${NC}"
    
    # 备份当前容器（以防回滚）
    echo -e "${YELLOW}💾 备份当前容器状态...${NC}"
    docker-compose ps > /tmp/containers_backup.txt
    
    # 停止并重建
    docker-compose down
    docker-compose build --no-cache
    docker-compose up -d
    
    echo -e "${GREEN}✅ 重新构建完成${NC}"
else
    echo -e "${YELLOW}♻️ 仅代码变化，快速重启应用...${NC}"
    docker-compose restart app
    echo -e "${GREEN}✅ 应用重启完成${NC}"
fi

# 3. 等待服务启动
echo -e "${YELLOW}⏳ 等待服务启动...${NC}"
sleep 5

# 4. 健康检查
echo -e "${YELLOW}🏥 健康检查...${NC}"
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 应用运行正常${NC}"
else
    echo -e "${RED}❌ 应用启动失败，查看日志:${NC}"
    docker-compose logs --tail=50 app
    exit 1
fi

# 5. 显示服务状态
echo ""
echo -e "${YELLOW}📊 服务状态:${NC}"
docker-compose ps

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}更新完成！${NC}"
echo -e "${GREEN}================================${NC}"

# 6. 显示最近的提交
echo ""
echo -e "${YELLOW}📝 最新提交:${NC}"
git log -1 --pretty=format:"%h - %s (%cr) <%an>" --abbrev-commit
echo ""
