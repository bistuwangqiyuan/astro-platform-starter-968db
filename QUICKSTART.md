# 快速启动指南 - 智能文本分析平台

本指南将帮助您快速启动和运行文本分析平台。

## 前置要求

1. Node.js v18.14+ 和 npm v9.0+
2. Supabase 账户（免费）
3. Netlify CLI（可选，用于本地开发）

## 快速开始（5分钟）

### 1. 设置 Supabase

1. 访问 [Supabase](https://supabase.com) 并创建账户
2. 创建新项目
3. 在 SQL 编辑器中运行 `scripts/supabase-init.sql` 中的所有 SQL
4. 在项目设置中获取：
   - `API URL` (SUPABASE_URL)
   - `anon public` key (SUPABASE_ANON_KEY)
   - `service_role` key (SUPABASE_SERVICE_ROLE_KEY)

### 2. 配置项目

```bash
# 克隆项目
git clone <repository-url>
cd astro-platform-starter

# 安装依赖
npm install

# 创建环境变量文件
cp .env.example .env
```

编辑 `.env` 文件，填入您的 Supabase 配置：
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
PUBLIC_SITE_URL=http://localhost:8888
```

### 3. 启动开发服务器

```bash
# 使用 Netlify CLI（推荐）
netlify dev

# 或使用 Astro
npm run dev
```

访问 http://localhost:8888 (Netlify) 或 http://localhost:4321 (Astro)

### 4. 创建账户并开始使用

1. 点击"注册"创建新账户
2. 使用邮箱和密码登录
3. 开始分析文本！

## 功能概览

### 文本分析
- 输入或粘贴文本
- 获取详细分析结果：
  - 文本统计（字数、句子数等）
  - 关键词提取
  - 情感分析
  - 可读性评估

### 批量分析
- 一次分析多个文本（最多10个）
- 对比不同文本的分析结果

### 收藏管理
- 收藏重要的分析结果
- 随时查看和管理收藏

### 历史记录
- 自动记录所有操作
- 按时间和类型过滤
- 清除不需要的记录

### 个人资料
- 查看使用统计
- 修改密码
- 管理数据

## 部署到 Netlify

### 方法一：一键部署
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/your-username/your-repo)

### 方法二：手动部署
1. Fork 或推送代码到 GitHub
2. 在 Netlify 控制台创建新站点
3. 连接 GitHub 仓库
4. 在环境变量中添加：
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `PUBLIC_SITE_URL`
5. 部署！

## 常见问题

### Q: 登录时提示"Missing Supabase environment variables"
A: 确保已正确设置环境变量，并重启开发服务器。

### Q: 注册后无法登录
A: 检查 Supabase 项目的认证设置，确保已启用邮箱认证。

### Q: 分析结果没有保存
A: 检查 Supabase 的 RLS 策略是否正确设置。

### Q: 如何备份数据？
A: 在 Supabase 控制台使用数据导出功能。

## 获取帮助

- 查看完整文档：[README.md](./README.md)
- 报告问题：[GitHub Issues](https://github.com/your-username/your-repo/issues)
- Supabase 文档：[supabase.com/docs](https://supabase.com/docs)
- Netlify 文档：[docs.netlify.com](https://docs.netlify.com)

## 下一步

- 探索更多功能
- 自定义分析算法
- 添加新的分析维度
- 集成其他服务

祝您使用愉快！🚀