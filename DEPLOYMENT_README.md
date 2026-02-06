# 部署文件说明

本目录包含腾讯云服务器部署的所有必要文件。

## 📁 文件结构

```
employment_time_machine/
├── docker-compose.yml          # Docker Compose 配置
├── Dockerfile                  # Next.js 应用容器构建文件
├── .env.production.example     # 环境变量模板
├── init.sql                    # 数据库初始化脚本
├── DEPLOYMENT.md               # 详细部署文档
├── nginx/
│   └── nginx.conf              # Nginx 反向代理配置
└── scripts/
    ├── deploy.sh               # 一键部署脚本
    ├── backup.sh               # 数据库备份脚本
    ├── restore.sh              # 数据库恢复脚本
    └── monitor.sh              # 系统监控脚本
```

## 🚀 快速开始

### 1. 上传代码到服务器

```bash
# 方式1: Git克隆（推荐）
git clone <repository-url> /opt/employment_time_machine

# 方式2: 本地上传
rsync -avz employment_time_machine root@server-ip:/opt/
```

### 2. 配置环境变量

```bash
cd /opt/employment_time_machine
cp .env.production.example .env.production
nano .env.production  # 修改数据库密码
```

### 3. 一键部署

```bash
chmod +x scripts/deploy.sh
sudo bash scripts/deploy.sh
```

## 📚 详细文档

请查看 [DEPLOYMENT.md](./DEPLOYMENT.md) 获取完整部署指南。

## ⚙️ 配置说明

### docker-compose.yml
- **postgres**: PostgreSQL 15 数据库
- **app**: Next.js 应用（端口3000）
- **nginx**: Web服务器（端口80/443）

### 内存限制
- PostgreSQL: 最多 1.2GB
- Next.js App: 最多 500MB
- Nginx: 最多 100MB

### 环境变量
必须在 `.env.production` 中配置：
- `DB_USER`: 数据库用户名
- `DB_PASSWORD`: 数据库密码（务必修改！）

## 🛠️ 常用命令

```bash
# 启动服务
docker-compose up -d

# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 备份数据库
bash scripts/backup.sh

# 监控系统
bash scripts/monitor.sh
```

## 🔒 安全提示

1. ✅ 修改 `.env.production` 中的数据库密码
2. ✅ 配置防火墙，只开放必要端口
3. ✅ 启用 HTTPS（Let's Encrypt）
4. ✅ 定期备份数据库
5. ✅ 定期更新系统和 Docker 镜像

## 📞 技术支持

遇到问题请查看:
1. [DEPLOYMENT.md](./DEPLOYMENT.md) - 详细部署文档
2. `docker-compose logs` - 查看容器日志
3. `/var/log/employment_monitor.log` - 系统监控日志
