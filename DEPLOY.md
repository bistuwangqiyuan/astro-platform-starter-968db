# 部署到 Netlify 指南

本指南将帮助你将 Astro Platform Starter 项目部署到 Netlify。

## 前置要求

1. **GitHub 账号** - 用于存储代码
2. **Netlify 账号** - 用于部署应用
3. **Supabase 账号** - 用于数据库服务

## 步骤 1: 准备 Supabase

1. 登录 [Supabase](https://supabase.com) 并创建新项目
2. 在项目设置中获取：

   - `SUPABASE_URL` - 项目 URL
   - `SUPABASE_ANON_KEY` - 匿名密钥

3. 在 Supabase 中创建以下表结构：

```sql
-- 创建用户配置文件表
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}'::jsonb
);

-- 创建分析数据表
CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  data_source TEXT NOT NULL,
  analysis_type TEXT NOT NULL,
  parameters JSONB DEFAULT '{}'::jsonb,
  results JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT
);

-- 创建收藏表
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL,
  item_type TEXT NOT NULL
);

-- 创建历史记录表
CREATE TABLE history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb
);

-- 创建索引以提高查询性能
CREATE INDEX idx_analyses_user_id ON analyses(user_id);
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_history_user_id ON history(user_id);

-- 启用行级安全 (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE history ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略
-- Profiles 策略
CREATE POLICY "用户可以查看自己的配置文件" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "用户可以更新自己的配置文件" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Analyses 策略
CREATE POLICY "用户可以查看自己的分析" ON analyses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户可以创建分析" ON analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的分析" ON analyses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的分析" ON analyses
  FOR DELETE USING (auth.uid() = user_id);

-- Favorites 策略
CREATE POLICY "用户可以查看自己的收藏" ON favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户可以添加收藏" ON favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的收藏" ON favorites
  FOR DELETE USING (auth.uid() = user_id);

-- History 策略
CREATE POLICY "用户可以查看自己的历史" ON history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户可以创建历史记录" ON history
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

## 步骤 2: 准备代码仓库

1. 将代码推送到 GitHub：

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/你的用户名/你的仓库名.git
git push -u origin main
```

## 步骤 3: 在 Netlify 上部署

### 方法 1: 通过 Netlify UI（推荐）

1. 登录 [Netlify](https://app.netlify.com)
2. 点击 "Add new site" > "Import an existing project"
3. 选择 GitHub 并授权访问
4. 选择你的仓库
5. 配置构建设置：

   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Functions directory**: `netlify/functions` (如果使用)

6. 添加环境变量：

   - 点击 "Show advanced" > "New variable"
   - 添加以下变量：
     ```
     PUBLIC_SUPABASE_URL=你的_supabase_url
     PUBLIC_SUPABASE_ANON_KEY=你的_supabase_anon_key
     NODE_VERSION=18
     ```

7. 点击 "Deploy site"

### 方法 2: 通过 Netlify CLI

1. 安装 Netlify CLI：

```bash
npm install -g netlify-cli
```

2. 登录 Netlify：

```bash
netlify login
```

3. 初始化站点：

```bash
netlify init
```

4. 创建 `.env` 文件：

```bash
cp .env.example .env
# 编辑 .env 文件，填入你的 Supabase 凭据
```

5. 部署：

```bash
netlify deploy --prod
```

### 方法 3: 通过 GitHub Actions（自动化）

1. 在 GitHub 仓库设置中添加 Secrets：

   - 进入 Settings > Secrets and variables > Actions
   - 添加以下 secrets：
     - `NETLIFY_AUTH_TOKEN` - 从 Netlify 账户设置获取
     - `NETLIFY_SITE_ID` - 从 Netlify 站点设置获取
     - `PUBLIC_SUPABASE_URL` - Supabase 项目 URL
     - `PUBLIC_SUPABASE_ANON_KEY` - Supabase 匿名密钥

2. 推送代码到 main 分支会自动触发部署

## 步骤 4: 配置域名（可选）

1. 在 Netlify 站点设置中，进入 "Domain management"
2. 添加自定义域名
3. 按照说明配置 DNS 记录

## 步骤 5: 验证部署

1. 访问 Netlify 提供的 URL（格式：`https://你的站点名.netlify.app`）
2. 测试以下功能：
   - 主页加载
   - 用户注册/登录
   - API 健康检查：`/api/health`

## 常见问题

### 1. 构建失败

- 检查 Node.js 版本是否为 18+
- 确保所有依赖都已正确安装
- 查看 Netlify 构建日志

### 2. 环境变量未生效

- 确保变量名以 `PUBLIC_` 开头（对于客户端可见的变量）
- 在 Netlify UI 中重新部署

### 3. Supabase 连接失败

- 验证 URL 和密钥是否正确
- 检查 Supabase 项目是否已启用所需的服务

### 4. 404 错误

- 确保 `_redirects` 文件在 `public` 目录中
- 检查 `netlify.toml` 配置

## 维护和更新

- **自动部署**：推送到 main 分支会自动触发部署
- **预览部署**：PR 会创建预览部署
- **回滚**：在 Netlify UI 中可以一键回滚到之前的部署

## 监控

1. 使用 Netlify Analytics 监控流量
2. 查看函数日志了解 API 使用情况
3. 使用 Supabase 仪表板监控数据库性能

## 安全建议

1. 定期更新依赖项
2. 使用环境变量存储敏感信息
3. 启用 Netlify 的安全功能（如 DDoS 保护）
4. 定期备份 Supabase 数据

---

恭喜！你的 Astro Platform Starter 现已部署到 Netlify 🎉
