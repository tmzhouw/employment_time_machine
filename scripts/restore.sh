#!/bin/bash

##############################################
# 数据库恢复脚本
# 用法: bash restore.sh <备份文件>
# 示例: bash restore.sh /root/employment_backups/employment_db_20260206.sql.gz
##############################################

set -e

if [ -z "$1" ]; then
    echo "错误: 请指定备份文件"
    echo "用法: bash restore.sh <备份文件路径>"
    echo "示例: bash restore.sh /root/employment_backups/employment_db_20260206.sql.gz"
    exit 1
fi

BACKUP_FILE=$1

if [ ! -f "${BACKUP_FILE}" ]; then
    echo "错误: 备份文件不存在: ${BACKUP_FILE}"
    exit 1
fi

echo "警告: 此操作将覆盖当前数据库！"
read -p "确认恢复？(yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "已取消"
    exit 0
fi

echo "开始恢复数据库..."

# 停止应用（避免数据冲突）
docker-compose stop app

# 恢复数据库
gunzip < ${BACKUP_FILE} | docker-compose exec -T postgres psql -U employment_user employment_db

# 重启应用
docker-compose start app

echo "✓ 数据库恢复完成！"
