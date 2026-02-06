#!/bin/bash

##############################################
# 数据库自动备份脚本
# 建议通过 crontab 每天凌晨执行
# crontab: 0 3 * * * /path/to/backup.sh
##############################################

set -e

# 配置
BACKUP_DIR="/root/employment_backups"
RETENTION_DAYS=7  # 保留最近7天的备份
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="employment_db_${DATE}.sql.gz"

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}[$(date)] 开始数据库备份...${NC}"

# 创建备份目录
mkdir -p ${BACKUP_DIR}

# 执行备份
docker-compose exec -T postgres pg_dump -U employment_user employment_db | gzip > ${BACKUP_DIR}/${BACKUP_FILE}

# 检查备份是否成功
if [ -f "${BACKUP_DIR}/${BACKUP_FILE}" ]; then
    FILESIZE=$(du -h "${BACKUP_DIR}/${BACKUP_FILE}" | cut -f1)
    echo -e "${GREEN}✓ 备份成功: ${BACKUP_FILE} (${FILESIZE})${NC}"
else
    echo -e "${RED}✗ 备份失败${NC}"
    exit 1
fi

# 删除旧备份
echo -e "${YELLOW}清理 ${RETENTION_DAYS} 天前的旧备份...${NC}"
find ${BACKUP_DIR} -name "employment_db_*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete

# 列出所有备份
echo -e "${YELLOW}当前备份列表:${NC}"
ls -lh ${BACKUP_DIR}/employment_db_*.sql.gz

# 可选: 上传到腾讯云COS（需要安装 coscmd）
# if command -v coscmd &> /dev/null; then
#     echo -e "${YELLOW}上传备份到腾讯云COS...${NC}"
#     coscmd upload ${BACKUP_DIR}/${BACKUP_FILE} backups/${BACKUP_FILE}
#     echo -e "${GREEN}✓ 上传成功${NC}"
# fi

echo -e "${GREEN}[$(date)] 备份完成！${NC}"
