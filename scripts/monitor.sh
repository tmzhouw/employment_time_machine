#!/bin/bash

##############################################
# 系统监控脚本
# 监控 CPU、内存、磁盘使用率
# 建议通过 crontab 每5分钟执行一次
# crontab: */5 * * * * /path/to/monitor.sh
##############################################

# 阈值设置
CPU_THRESHOLD=85
MEM_THRESHOLD=85
DISK_THRESHOLD=80

# 日志文件
LOG_FILE="/var/log/employment_monitor.log"

# 获取当前时间
NOW=$(date "+%Y-%m-%d %H:%M:%S")

# CPU 使用率
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}')
CPU_USAGE_INT=${CPU_USAGE%.*}

# 内存使用率
MEM_USAGE=$(free | grep Mem | awk '{print ($3/$2) * 100.0}')
MEM_USAGE_INT=${MEM_USAGE%.*}

# 磁盘使用率
DISK_USAGE=$(df -h / | tail -1 | awk '{print $5}' | sed 's/%//')

# 检查 Docker 容器状态
CONTAINER_STATUS=$(docker-compose ps --services --filter "status=running" | wc -l)
EXPECTED_CONTAINERS=3  # postgres, app, nginx

# 输出到日志
echo "[${NOW}] CPU: ${CPU_USAGE_INT}% | MEM: ${MEM_USAGE_INT}% | DISK: ${DISK_USAGE}% | Containers: ${CONTAINER_STATUS}/${EXPECTED_CONTAINERS}" >> ${LOG_FILE}

# 告警检查
ALERT=0

if [ ${CPU_USAGE_INT} -gt ${CPU_THRESHOLD} ]; then
    echo "[${NOW}] 告警: CPU 使用率过高 (${CPU_USAGE_INT}%)" >> ${LOG_FILE}
    ALERT=1
fi

if [ ${MEM_USAGE_INT} -gt ${MEM_THRESHOLD} ]; then
    echo "[${NOW}] 告警: 内存使用率过高 (${MEM_USAGE_INT}%)" >> ${LOG_FILE}
    ALERT=1
fi

if [ ${DISK_USAGE} -gt ${DISK_THRESHOLD} ]; then
    echo "[${NOW}] 告警: 磁盘使用率过高 (${DISK_USAGE}%)" >> ${LOG_FILE}
    ALERT=1
fi

if [ ${CONTAINER_STATUS} -lt ${EXPECTED_CONTAINERS} ]; then
    echo "[${NOW}] 告警: 部分容器未运行 (${CONTAINER_STATUS}/${EXPECTED_CONTAINERS})" >> ${LOG_FILE}
    ALERT=1
fi

# 可选: 发送告警通知（邮件、企业微信等）
if [ ${ALERT} -eq 1 ]; then
    # 这里可以添加告警通知逻辑
    # 例如: curl -X POST "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=YOUR_KEY" -d "..."
    echo "[${NOW}] 已触发告警" >> ${LOG_FILE}
fi

# 保留最近7天的日志
find /var/log -name "employment_monitor.log" -type f -mtime +7 -delete
