# Git 工作流程 - 本地开发 → GitHub 备份 → 腾讯云部署

## 📐 工作流程图

```
本地开发 (Mac)
    ↓ git push
GitHub 仓库 (代码托管)
    ↓ git pull
腾讯云服务器 (生产环境)
```

---

## 🎯 一次性初始化配置

### 1. 本地：初始化 Git 仓库

```bash
cd /Users/bbxiangqianchong/Desktop/employment_time_machine

# 初始化 Git（如果还没有）
git init

# 创建 .gitignore 文件（排除敏感文件）
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Next.js
.next/
out/
build/
dist/

# Production
.env.local
.env.production
.env*.local

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Misc
*.pem
.vercel

# Docker
docker-compose.override.yml

# Backup files
backups/
*.sql
*.sql.gz

# Logs
logs/
*.log
nginx/logs/
EOF

# 添加所有文件
git add .

# 首次提交
git commit -m "Initial commit: Employment Time Machine"
```

### 2. 本地：关联 GitHub 仓库

```bash
# 在 GitHub 创建仓库后，获取仓库地址
# 例如: https://github.com/yourusername/employment_time_machine.git

# 添加远程仓库
git remote add origin https://github.com/yourusername/employment_time_machine.git

# 首次推送
git branch -M main
git push -u origin main
```

### 3. 腾讯云：首次克隆

```bash
# SSH 连接到腾讯云服务器
ssh root@your-server-ip

# 克隆代码
cd /opt
git clone https://github.com/yourusername/employment_time_machine.git

# 进入目录
cd employment_time_machine

# 创建生产环境变量（不要上传到 Git）
cp .env.production.example .env.production
nano .env.production  # 设置生产环境的数据库密码

# 首次部署
chmod +x scripts/deploy.sh
sudo bash scripts/deploy.sh
```

---

## 🔄 日常开发流程

### **场景1: 添加新功能**

#### 本地开发
```bash
# 1. 确保代码是最新的
cd /Users/bbxiangqianchong/Desktop/employment_time_machine
git pull origin main

# 2. 创建新分支（可选，推荐）
git checkout -b feature/new-analytics

# 3. 开发和测试
npm run dev  # 本地调试
# ... 开发新功能 ...

# 4. 提交代码
git add .
git commit -m "feat: Add new analytics dashboard"

# 5. 推送到 GitHub
git push origin feature/new-analytics
# 或者直接推送到 main 分支（小团队）
git checkout main
git merge feature/new-analytics
git push origin main
```

#### 部署到腾讯云
```bash
# SSH 连接到服务器
ssh root@your-server-ip

# 进入项目目录
cd /opt/employment_time_machine

# 拉取最新代码
git pull origin main

# 重新构建并部署
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# 查看日志确认
docker-compose logs -f app
```

---

### **场景2: 修复 Bug**

#### 本地修复
```bash
# 1. 拉取最新代码
git pull origin main

# 2. 修复 Bug
# ... 修改代码 ...

# 3. 本地测试
npm run dev

# 4. 提交
git add .
git commit -m "fix: Fix data display issue in dashboard"
git push origin main
```

#### 快速部署（热更新）
```bash
# SSH 到服务器
ssh root@your-server-ip
cd /opt/employment_time_machine

# 拉取代码并重启
git pull origin main
docker-compose restart app  # 只重启应用，不重建
```

---

### **场景3: 修改配置文件（如 Nginx、Docker）**

```bash
# 本地修改
git add nginx/nginx.conf
git commit -m "chore: Update Nginx configuration for HTTPS"
git push origin main

# 服务器部署（需要重建容器）
ssh root@your-server-ip
cd /opt/employment_time_machine
git pull origin main
docker-compose down
docker-compose up -d --build
```

---

## 🚀 自动化部署脚本（推荐）

### 方式1: 服务器上创建更新脚本

```bash
# 在服务器上创建快速更新脚本
ssh root@your-server-ip
nano /opt/employment_time_machine/scripts/update.sh
```

**update.sh 内容**：
```bash
#!/bin/bash
set -e

echo "🔄 开始更新..."

cd /opt/employment_time_machine

# 1. 拉取最新代码
echo "📥 拉取最新代码..."
git pull origin main

# 2. 检查是否有 Docker 相关文件变化
if git diff HEAD@{1} --name-only | grep -E "Dockerfile|docker-compose.yml|nginx/"; then
    echo "🔨 检测到配置变化，重新构建..."
    docker-compose down
    docker-compose build --no-cache
    docker-compose up -d
else
    echo "♻️ 仅代码变化，重启应用..."
    docker-compose restart app
fi

# 3. 查看状态
echo "✅ 更新完成！"
docker-compose ps
```

**使用方法**：
```bash
# 本地推送代码后
git push origin main

# SSH 到服务器执行更新
ssh root@your-server-ip 'bash /opt/employment_time_machine/scripts/update.sh'

# 或者登录服务器后执行
ssh root@your-server-ip
bash /opt/employment_time_machine/scripts/update.sh
```

---

### 方式2: 本地一键部署脚本

在本地创建一个脚本，自动推送并部署：

```bash
# 在本地项目目录创建
nano scripts/deploy-to-production.sh
```

**deploy-to-production.sh 内容**：
```bash
#!/bin/bash
set -e

SERVER_IP="your-server-ip"
SERVER_USER="root"
PROJECT_PATH="/opt/employment_time_machine"

echo "🚀 开始自动部署..."

# 1. 本地提交
echo "📝 提交本地代码..."
git add .
read -p "提交信息: " COMMIT_MSG
git commit -m "$COMMIT_MSG" || echo "没有新改动"

# 2. 推送到 GitHub
echo "📤 推送到 GitHub..."
git push origin main

# 3. 部署到服务器
echo "🌐 部署到腾讯云服务器..."
ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
cd /opt/employment_time_machine
git pull origin main
docker-compose down
docker-compose build --no-cache
docker-compose up -d
docker-compose ps
ENDSSH

echo "✅ 部署完成！"
echo "访问: http://${SERVER_IP}"
```

**使用方法**：
```bash
# 本地执行
chmod +x scripts/deploy-to-production.sh
bash scripts/deploy-to-production.sh
```

---

## 🔐 GitHub 私有仓库配置

### 如果使用私有仓库，需要在服务器配置 SSH 密钥：

```bash
# 在服务器上生成 SSH 密钥
ssh root@your-server-ip
ssh-keygen -t ed25519 -C "your_email@example.com"

# 查看公钥
cat ~/.ssh/id_ed25519.pub

# 复制公钥，添加到 GitHub:
# GitHub → Settings → SSH and GPG keys → New SSH key
```

然后修改 Git 仓库地址为 SSH：
```bash
cd /opt/employment_time_machine
git remote set-url origin git@github.com:yourusername/employment_time_machine.git
```

---

## 📋 最佳实践

### 1. 分支策略（推荐）
```
main (生产分支)
  ↑
develop (开发分支)
  ↑
feature/* (功能分支)
```

### 2. 提交信息规范
```bash
# 功能
git commit -m "feat: Add new dashboard widget"

# 修复
git commit -m "fix: Fix calculation error in statistics"

# 文档
git commit -m "docs: Update deployment guide"

# 配置
git commit -m "chore: Update Docker configuration"
```

### 3. 代码审查（可选）
```bash
# 开发新功能时创建分支
git checkout -b feature/analytics

# 推送到 GitHub
git push origin feature/analytics

# 在 GitHub 创建 Pull Request
# 审查通过后合并到 main
# 然后部署到服务器
```

### 4. 版本标记
```bash
# 重要版本打 tag
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# 部署时可以指定版本
git checkout v1.0.0
```

---

## 🛡️ 安全注意事项

### ⚠️ 绝对不要上传到 Git 的文件：
- ✅ 已在 `.gitignore` 中：
  - `.env.local`
  - `.env.production`
  - `node_modules/`
  - 数据库备份文件（`*.sql`, `*.sql.gz`）
  - SSL 证书（`*.pem`）

### ✅ 应该上传到 Git 的文件：
- ✅ 源代码（`.ts`, `.tsx`, `.js` 等）
- ✅ 配置模板（`.env.production.example`）
- ✅ Docker 配置（`docker-compose.yml`, `Dockerfile`）
- ✅ 脚本（`scripts/*.sh`）
- ✅ 文档（`*.md`）

---

## 🔄 完整工作流示例

```bash
# ========== 本地开发 ==========
cd ~/Desktop/employment_time_machine

# 1. 拉取最新代码
git pull origin main

# 2. 开发新功能
npm run dev
# ... 修改代码 ...

# 3. 测试
npm run build
npm start

# 4. 提交代码
git add .
git commit -m "feat: Add year-over-year analysis"
git push origin main

# ========== 部署到服务器 ==========
ssh root@your-server-ip

cd /opt/employment_time_machine

# 更新代码
git pull origin main

# 重新部署
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# 验证
docker-compose logs -f app

# 退出
exit

# ========== 访问验证 ==========
# 浏览器访问: http://服务器IP
```

---

## 📞 常见问题

### Q1: 忘记提交 `.env.production`，服务器报错？
**A**: `.env.production` 不应该上传到 Git。在服务器手动创建：
```bash
ssh root@your-server-ip
cd /opt/employment_time_machine
cp .env.production.example .env.production
nano .env.production  # 手动填写生产环境配置
```

### Q2: 如何回滚到之前的版本？
```bash
# 查看提交历史
git log --oneline

# 回滚到指定提交
git checkout <commit-hash>

# 或者回滚到上一个版本
git reset --hard HEAD~1
git push origin main --force  # 强制推送
```

### Q3: 本地和服务器代码不一致？
```bash
# 服务器强制同步
cd /opt/employment_time_machine
git fetch origin
git reset --hard origin/main
```

---

**现在您有了完整的开发-备份-部署流程！** 🎉
