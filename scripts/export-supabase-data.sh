#!/bin/bash

##############################################
# 从 Supabase 导出数据到本地 SQL 文件
# 用于腾讯云 PostgreSQL 初始化
##############################################

set -e

# Supabase 直连信息（从 Supabase Dashboard → Settings → Database 获取）
# 请替换为你的实际信息
SUPABASE_HOST="aws-0-ap-southeast-1.pooler.supabase.com"
SUPABASE_PORT="6543"
SUPABASE_DB="postgres"
SUPABASE_USER="postgres.sdxnvnqosliyjhdvzeve"
# 密码会在运行时提示输入

OUTPUT_FILE="data/seed_data.sql"

echo "================================"
echo "Supabase 数据导出工具"
echo "================================"
echo ""
echo "将从 Supabase 导出 companies 和 monthly_reports 表的数据"
echo "导出文件: $OUTPUT_FILE"
echo ""

# 创建 data 目录
mkdir -p data

# 导出数据（只导出数据，不导出结构）
echo "开始导出数据..."
echo "请输入 Supabase 数据库密码（在 Dashboard → Settings → Database 中查找）"
echo ""

pg_dump \
    -h "$SUPABASE_HOST" \
    -p "$SUPABASE_PORT" \
    -U "$SUPABASE_USER" \
    -d "$SUPABASE_DB" \
    --data-only \
    --table=companies \
    --table=monthly_reports \
    --no-owner \
    --no-privileges \
    --column-inserts \
    > "$OUTPUT_FILE"

echo ""
echo "✓ 数据导出成功！"
echo "  文件: $OUTPUT_FILE"
echo "  大小: $(du -h $OUTPUT_FILE | cut -f1)"
echo ""
echo "下一步:"
echo "  1. 将此文件提交到 Git"
echo "  2. 在腾讯云服务器上 git pull"
echo "  3. 启动容器后导入:"
echo "     docker-compose exec -T postgres psql -U employment_user employment_db < $OUTPUT_FILE"
