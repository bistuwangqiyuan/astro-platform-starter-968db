# 手动部署指南

由于当前网络连接问题，这里提供手动部署到 Netlify 的完整指南。

## 第一步：准备环境

### 1. 安装依赖

```bash
# 确保网络连接正常后执行
npm config set registry https://registry.npmmirror.com
npm install
```

### 2. 创建环境变量文件

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，填入你的 Supabase 凭据：
# PUBLIC_SUPABASE_URL=你的_supabase_url
# PUBLIC_SUPABASE_ANON_KEY=你的_supabase_anon_key
```

## 第二步：本地测试

```bash
# 启动开发服务器
npm run dev

# 访问 http://localhost:4321 测试功能
```

## 第三步：构建项目

```bash
# 构建生产版本
npm run build

# 构建成功后会生成 dist/ 目录
```

## 第四步：推送到 GitHub

```bash
# 确保网络连接正常后执行
git status
git add .
git commit -m "Ready for deployment"
git push origin main
```

## 第五步：部署到 Netlify

### 方法 1：通过 Netlify UI（最简单）

1. **访问 Netlify**

   - 打开 [https://app.netlify.com](https://app.netlify.com)
   - 使用 GitHub 账号登录

2. **导入项目**

   - 点击 "Add new site" → "Import an existing project"
   - 选择 "GitHub" 并授权
   - 选择你的仓库 `astro-platform-starter-968db`

3. **配置构建设置**

   ```
   Build command: npm run build
   Publish directory: dist
   ```

4. **添加环境变量**

   - 点击 "Show advanced" → "New variable"
   - 添加以下变量：
     ```
     PUBLIC_SUPABASE_URL = 你的_supabase_url
     PUBLIC_SUPABASE_ANON_KEY = 你的_supabase_anon_key
     ```

5. **开始部署**
   - 点击 "Deploy site"
   - 等待构建完成（约 2-3 分钟）

### 方法 2：通过 Netlify CLI

```bash
# 确保网络连接正常后执行
netlify login
netlify init
netlify deploy --prod
```

### 方法 3：手动上传（如果其他方法都不行）

1. 本地构建项目：`npm run build`
2. 在 Netlify 上创建新站点
3. 将 `dist/` 目录的内容拖拽到 Netlify 部署区域

## 第六步：配置 Supabase 数据库

在部署之前，需要在 Supabase 中创建数据库表。执行以下 SQL：

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

-- 启用行级安全
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE history ENABLE ROW LEVEL SECURITY;

-- 创建安全策略（详见 DEPLOY.md）
```

## 第七步：验证部署

1. **访问站点**

   - 使用 Netlify 提供的 URL（形如：`https://你的站点名.netlify.app`）

2. **测试功能**
   - 首页加载正常
   - 用户注册/登录功能
   - API 健康检查：`/api/health`

## 故障排除

### 构建失败

- 检查 Node.js 版本（需要 18+）
- 确认环境变量设置正确
- 查看 Netlify 构建日志

### 网络问题

- 使用中国镜像源：`npm config set registry https://registry.npmmirror.com`
- 尝试使用 VPN 或其他网络

### Supabase 连接失败

- 验证环境变量名称和值
- 确保 Supabase 项目已正确配置

## 部署成功后

🎉 恭喜！你的 Astro Platform Starter 已成功部署到 Netlify。

- **站点 URL**: `https://你的站点名.netlify.app`
- **管理面板**: [Netlify Dashboard](https://app.netlify.com)
- **源代码**: GitHub 仓库

享受你的新平台吧！
