# 快速部署到 Netlify

## 最快部署方式

### 方法1：通过 Netlify UI（推荐）

1. **准备工作**
   ```bash
   # 确保代码已推送到 GitHub
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **登录 Netlify**
   - 访问 [https://app.netlify.com](https://app.netlify.com)
   - 使用 GitHub 账号登录

3. **导入项目**
   - 点击 "Add new site" → "Import an existing project"
   - 选择 "GitHub"
   - 授权并选择你的仓库

4. **配置构建设置**
   ```
   Build command: npm run build
   Publish directory: dist
   ```

5. **添加环境变量**
   点击 "Show advanced" 并添加：
   ```
   PUBLIC_SUPABASE_URL = 你的_supabase_url
   PUBLIC_SUPABASE_ANON_KEY = 你的_supabase_anon_key
   ```

6. **部署**
   - 点击 "Deploy site"
   - 等待部署完成（约2-3分钟）

### 方法2：使用 Netlify CLI

```bash
# 1. 安装 Netlify CLI
npm install -g netlify-cli

# 2. 登录
netlify login

# 3. 初始化并部署
netlify init
netlify deploy --prod
```

## 部署后配置

### 1. 自定义域名（可选）
- Site settings → Domain management → Add custom domain

### 2. 环境变量
- Site settings → Environment variables → Add variable

### 3. 构建设置
- Site settings → Build & deploy → Build settings

## 常见问题

### 构建失败？
1. 检查环境变量是否正确设置
2. 确保使用 Node.js 18+
3. 查看构建日志排查错误

### 页面 404？
确保 `_redirects` 文件存在于 `public` 目录

### Supabase 连接失败？
1. 检查环境变量名称（必须以 `PUBLIC_` 开头）
2. 验证 Supabase 项目是否已启用

## 部署成功后

访问你的站点：`https://你的站点名.netlify.app`

恭喜！你的应用已成功部署 🎉
