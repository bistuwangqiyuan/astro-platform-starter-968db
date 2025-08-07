# Supabase 数据库设置指南

## 🚀 快速开始

### 1. 创建 Supabase 项目

1. 访问 [Supabase](https://supabase.com)
2. 点击 "Start your project"
3. 创建新组织（如果需要）
4. 点击 "New project"
5. 填写项目信息：
   - Project name: `astro-platform-starter`
   - Database password: 设置强密码
   - Region: 选择离你最近的区域

### 2. 获取项目凭据

1. 项目创建完成后，进入项目仪表板
2. 在左侧菜单点击 "Settings"
3. 点击 "API"
4. 复制以下信息：
   - Project URL (用作 `PUBLIC_SUPABASE_URL`)
   - anon public key (用作 `PUBLIC_SUPABASE_ANON_KEY`)

### 3. 创建环境变量文件

在项目根目录创建 `.env` 文件：

```bash
# 将从 Supabase 获取的凭据填入
PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# 其他配置
PUBLIC_APP_URL=http://localhost:4321
PUBLIC_APP_NAME=AIKeyword

# Google API (可选，用于真实数据)
GOOGLE_API_KEY=your-google-api-key
GOOGLE_CSE_ID=your-custom-search-engine-id
```

### 4. 创建数据库表结构

1. 在 Supabase 仪表板，点击左侧的 "SQL Editor"
2. 点击 "+ New query"
3. 复制 `database-schema.sql` 文件的全部内容
4. 粘贴到 SQL 编辑器中
5. 点击 "Run" 执行 SQL

### 5. 设置认证配置

1. 在左侧菜单点击 "Authentication"
2. 点击 "Settings" 标签
3. 在 "Site URL" 部分：
   - 开发环境：`http://localhost:4321`
   - 生产环境：`https://your-app.netlify.app`
4. 在 "Redirect URLs" 添加：
   - `http://localhost:4321/auth/callback`
   - `https://your-app.netlify.app/auth/callback`

### 6. 启用 Row Level Security

确保所有表都启用了 RLS（已在 schema 中设置）：

```sql
-- 检查 RLS 状态
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

### 7. 测试数据库连接

运行项目并测试连接：

```bash
npm install
npm run dev
```

访问 `http://localhost:4321` 检查：

- 数据库连接正常
- 认证功能工作
- API 端点响应

## 🔧 数据库表说明

### 主要表结构

1. **analyses** - 关键词分析记录

   - 存储分析任务和结果
   - 关联用户和分析状态

2. **favorites** - 用户收藏

   - 关键词收藏功能
   - 支持分类和标签

3. **history** - 操作历史

   - 记录用户所有操作
   - 用于审计和分析

4. **user_profiles** - 用户扩展信息

   - 用户配置和配额
   - API 使用统计

5. **api_usage** - API 使用记录
   - 性能监控
   - 配额管理

### 安全策略

- 启用 Row Level Security (RLS)
- 用户只能访问自己的数据
- 自动用户资料创建
- API 使用量统计和限制

## 🚨 常见问题

### 连接错误

如果遇到连接错误：

1. 检查环境变量是否正确
2. 确认 Supabase 项目状态
3. 检查网络连接
4. 确认 API 密钥有效

### RLS 权限错误

如果遇到权限错误：

1. 确认已执行完整的 schema
2. 检查用户是否已认证
3. 确认 RLS 策略正确

### API 配额问题

免费计划限制：

- 500MB 数据库存储
- 5GB 带宽
- 50,000 月活用户

## 📝 生产环境部署

### 环境变量配置

在 Netlify 部署设置中添加：

```
PUBLIC_SUPABASE_URL=你的生产环境URL
PUBLIC_SUPABASE_ANON_KEY=你的生产环境密钥
PUBLIC_APP_URL=https://你的域名.netlify.app
GOOGLE_API_KEY=你的Google API密钥
GOOGLE_CSE_ID=你的搜索引擎ID
```

### 数据备份

建议定期备份数据：

1. 在 Supabase 仪表板使用备份功能
2. 导出重要数据
3. 监控数据库使用情况

---

**🎯 完成以上步骤后，你的数据库就完全配置好了！**
