# 部署前检查清单

在部署到 Netlify 之前，请确保完成以下步骤：

## ✅ 必需步骤

### 1. Supabase 设置
- [ ] 创建 Supabase 项目
- [ ] 获取 `PUBLIC_SUPABASE_URL`
- [ ] 获取 `PUBLIC_SUPABASE_ANON_KEY`
- [ ] 执行数据库表创建脚本（见 DEPLOY.md）

### 2. 环境变量
- [ ] 复制 `.env.example` 到 `.env`
- [ ] 填写所有必需的环境变量：
  ```
  PUBLIC_SUPABASE_URL=你的值
  PUBLIC_SUPABASE_ANON_KEY=你的值
  ```

### 3. GitHub 准备
- [ ] 初始化 Git 仓库：`git init`
- [ ] 添加所有文件：`git add .`
- [ ] 提交代码：`git commit -m "Initial commit"`
- [ ] 创建 GitHub 仓库
- [ ] 推送代码：`git push -u origin main`

### 4. 本地测试
- [ ] 安装依赖：`npm install`
- [ ] 本地运行：`npm run dev`
- [ ] 测试功能：
  - [ ] 访问首页
  - [ ] 测试注册/登录
  - [ ] 检查 API：`http://localhost:4321/api/health`

## 📝 Netlify 部署步骤

### 通过 UI 部署
1. 登录 [Netlify](https://app.netlify.com)
2. 点击 "Add new site" → "Import an existing project"
3. 选择 GitHub 并授权
4. 选择你的仓库
5. 配置构建设置：
   - Build command: `npm run build`
   - Publish directory: `dist`
6. 添加环境变量
7. 点击 "Deploy site"

### 通过 CLI 部署
```bash
# 安装 CLI
npm install -g netlify-cli

# 登录
netlify login

# 部署
netlify deploy --prod
```

## 🔍 部署后验证

- [ ] 访问站点 URL
- [ ] 测试所有页面加载
- [ ] 验证 API 端点：`/api/health`
- [ ] 测试用户认证功能
- [ ] 检查控制台是否有错误

## ⚠️ 常见问题

### 构建失败
- 检查 Node.js 版本（需要 18+）
- 确认所有依赖已安装
- 查看 Netlify 构建日志

### 环境变量问题
- 确保变量名以 `PUBLIC_` 开头
- 在 Netlify UI 中正确设置
- 重新部署以应用更改

### 404 错误
- 确认 `_redirects` 文件存在
- 检查 `netlify.toml` 配置

## 📞 需要帮助？

1. 查看 [DEPLOY.md](./DEPLOY.md) 获取详细说明
2. 查看 [QUICK_DEPLOY.md](./QUICK_DEPLOY.md) 获取快速部署
3. 查看 Netlify 文档：https://docs.netlify.com
