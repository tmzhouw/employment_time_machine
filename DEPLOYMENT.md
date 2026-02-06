# 企业用工时光机 - 部署文档

## 📋 目录

1. [服务器要求](#服务器要求)
2. [快速部署](#快速部署)
3. [详细部署步骤](#详细部署步骤)
4. [HTTPS 配置](#https-配置)
5. [数据库管理](#数据库管理)
6. [监控与维护](#监控与维护)
7. [故障排查](#故障排查)
8. [常用命令](#常用命令)

---

## 服务器要求

### 最低配置
- **CPU**: 4核
- **内存**: 4GB
- **硬盘**: 40GB SSD
- **带宽**: 3Mbps+
- **系统**: Ubuntu 20.04+ / CentOS 7+

### 推荐配置
- **CPU**: 4核
- **内存**: 8GB
- **硬盘**: 100GB SSD
- **带宽**: 5Mbps+

---

## 快速部署

### 方式1: 一键部署脚本（推荐）

```bash
# 1. 上传代码到服务器
git clone <your-repository> /opt/employment_time_machine
cd /opt/employment_time_machine

# 2. 配置环境变量
cp .env.production.example .env.production
nano .env.production  # 修改数据库密码

# 3. 运行一键部署脚本
chmod +x scripts/deploy.sh
sudo bash scripts/deploy.sh
```

**部署完成后**，访问 `http://服务器IP` 即可看到应用！

---

## 详细部署步骤

### 步骤1: 连接到服务器

```bash
ssh root@your-server-ip
```

### 步骤2: 安装必要软件

```bash
# 更新系统
apt update && apt upgrade -y

# 安装 Git
apt install git -y

# 安装 Docker（一键脚本）
curl -fsSL https://get.docker.com | bash

# 安装 Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# 验证安装
docker --version
docker-compose --version
```

### 步骤3: 上传代码

```bash
# 方式1: 从 Git 仓库克隆
git clone <your-repository> /opt/employment_time_machine

# 方式2: 从本地上传（在本地执行）
rsync -avz --exclude 'node_modules' --exclude '.next' \
  /path/to/local/employment_time_machine \
  root@your-server-ip:/opt/
```

### 步骤4: 配置环境变量

```bash
cd /opt/employment_time_machine

# 复制环境变量模板
cp .env.production.example .env.production

# 编辑配置（重要！）
nano .env.production
```

**必须修改的配置**：
```env
DB_USER=employment_user
DB_PASSWORD=YOUR_STRONG_PASSWORD_HERE  # 改成强密码！
```

### 步骤5: 配置防火墙

```bash
# 开放 HTTP 和 HTTPS 端口
ufw allow 80/tcp
ufw allow 443/tcp

# 限制 SSH 端口（可选，提高安全性）
ufw allow 22/tcp
ufw enable
```

### 步骤6: 启动服务

```bash
# 构建镜像
docker-compose build

# 启动所有服务
docker-compose up -d

# 查看启动日志
docker-compose logs -f
```

### 步骤7: 验证部署

```bash
# 检查容器状态
docker-compose ps

# 应该看到 3 个容器都在运行:
# - employment_db (postgres)
# - employment_app (Next.js)
# - employment_nginx (nginx)

# 测试访问
curl http://localhost
```

---

## HTTPS 配置

### 方式1: Let's Encrypt 免费证书（推荐）

```bash
# 安装 Certbot
apt install certbot -y

# 申请证书（替换为你的域名）
certbot certonly --standalone -d your-domain.com

# 证书会保存在:
# /etc/letsencrypt/live/your-domain.com/fullchain.pem
# /etc/letsencrypt/live/your-domain.com/privkey.pem

# 复制证书到项目目录
mkdir -p nginx/ssl
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/
cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/

# 修改 Nginx 配置
nano nginx/nginx.conf
# 取消 HTTPS 配置的注释，并修改域名

# 重启 Nginx
docker-compose restart nginx
```

### 自动续期证书

```bash
# 添加到 crontab
crontab -e

# 添加以下行（每天凌晨2点检查续期）
0 2 * * * certbot renew --quiet && cp /etc/letsencrypt/live/your-domain.com/*.pem /opt/employment_time_machine/nginx/ssl/ && docker-compose restart nginx
```

---

## 数据库管理

### 导入初始数据

```bash
# 从 Supabase 导出数据
# 在本地执行:
pg_dump -h xxx.supabase.co -U postgres employment_db > init.sql

# 上传到服务器
scp init.sql root@your-server-ip:/opt/employment_time_machine/

# 导入数据
docker-compose exec -T postgres psql -U employment_user employment_db < init.sql
```

### 手动备份数据库

```bash
# 进入项目目录
cd /opt/employment_time_machine

# 执行备份
bash scripts/backup.sh
```

### 设置定时备份

```bash
# 编辑 crontab
crontab -e

# 添加以下行（每天凌晨3点自动备份）
0 3 * * * cd /opt/employment_time_machine && bash scripts/backup.sh
```

### 恢复数据库

```bash
# 查看备份列表
ls -lh /root/employment_backups/

# 恢复指定备份
bash scripts/restore.sh /root/employment_backups/employment_db_20260206.sql.gz
```

---

## 监控与维护

### 设置系统监控

```bash
# 编辑 crontab
crontab -e

# 添加以下行（每5分钟监控一次）
*/5 * * * * cd /opt/employment_time_machine && bash scripts/monitor.sh
```

### 查看监控日志

```bash
tail -f /var/log/employment_monitor.log
```

### 资源使用监控

```bash
# 实时查看容器资源使用
docker stats

# 查看磁盘使用
df -h

# 查看内存使用
free -h
```

### 日志管理

```bash
# 查看应用日志
docker-compose logs -f app

# 查看数据库日志
docker-compose logs -f postgres

# 查看 Nginx 日志
docker-compose logs -f nginx

# 清理旧日志（释放空间）
docker system prune -a --volumes
```

---

## 故障排查

### 问题1: 容器无法启动

```bash
# 查看容器状态
docker-compose ps

# 查看详细日志
docker-compose logs

# 重新构建并启动
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### 问题2: 数据库连接失败

```bash
# 检查数据库容器状态
docker-compose exec postgres pg_isready -U employment_user

# 检查环境变量配置
cat .env.production

# 检查数据库日志
docker-compose logs postgres
```

### 问题3: 应用报错 500

```bash
# 查看应用详细错误
docker-compose logs app

# 检查数据库连接
docker-compose exec app node -e "console.log(process.env.DATABASE_URL)"

# 重启应用
docker-compose restart app
```

### 问题4: Nginx 报错

```bash
# 测试 Nginx 配置语法
docker-compose exec nginx nginx -t

# 查看 Nginx 错误日志
docker-compose logs nginx

# 检查端口占用
lsof -i :80
lsof -i :443
```

### 问题5: 内存不足

```bash
# 查看内存使用
free -h

# 重启所有服务（释放内存）
docker-compose restart

# 如果持续内存不足，考虑:
# 1. 升级服务器配置到 8GB
# 2. 启用 Swap（虚拟内存）
```

---

## 常用命令

### Docker Compose 命令

```bash
# 启动所有服务
docker-compose up -d

# 停止所有服务
docker-compose down

# 重启所有服务
docker-compose restart

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 重新构建镜像
docker-compose build --no-cache

# 查看资源使用
docker stats
```

### 数据库命令

```bash
# 连接到数据库
docker-compose exec postgres psql -U employment_user employment_db

# 备份数据库
bash scripts/backup.sh

# 恢复数据库
bash scripts/restore.sh <备份文件>

# 查看数据库大小
docker-compose exec postgres psql -U employment_user -c "SELECT pg_size_pretty(pg_database_size('employment_db'));"
```

### 系统维护命令

```bash
# 查看磁盘使用
df -h

# 查看内存使用
free -h

# 查看 CPU 使用
top

# 清理 Docker 缓存
docker system prune -a

# 查看服务器 IP
curl ifconfig.me
```

---

## 性能优化建议

### 数据库优化

```bash
# 定期 VACUUM（清理死元组）
docker-compose exec postgres psql -U employment_user employment_db -c "VACUUM ANALYZE;"

# 创建索引（根据实际查询优化）
docker-compose exec postgres psql -U employment_user employment_db -c "
CREATE INDEX IF NOT EXISTS idx_company_name ON employment_data(company_name);
CREATE INDEX IF NOT EXISTS idx_industry ON employment_data(industry);
CREATE INDEX IF NOT EXISTS idx_month ON employment_data(month);
"
```

### 应用优化

- **启用 CDN**：将静态资源托管到腾讯云 CDN
- **配置 Redis 缓存**：缓存首页数据（需要额外配置）
- **启用 Gzip 压缩**：Nginx 已默认启用

---

## 安全建议

1. **修改数据库密码** - 使用至少16位的强密码
2. **定期更新系统** - `apt update && apt upgrade`
3. **启用 HTTPS** - 使用 Let's Encrypt 免费证书
4. **限制 SSH 登录** - 禁用密码登录，只允许密钥认证
5. **配置防火墙** - 只开放必要端口（80, 443, 22）
6. **定期备份数据** - 每天自动备份数据库

---

## 联系与支持

如遇到问题，请检查:
1. 查看日志: `docker-compose logs -f`
2. 查看服务状态: `docker-compose ps`
3. 查看系统资源: `docker stats`

---

**最后更新**: 2026-02-06
