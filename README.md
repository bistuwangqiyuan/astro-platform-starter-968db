# Astro on Netlify Platform Starter

[Live Demo](https://astro-platform-starter.netlify.app/)

一个基于Astro.js、Tailwind和Supabase的现代化平台，提供完整的用户认证、数据分析和管理功能。

## 项目架构

### 技术栈
- **前端**: Astro.js + React + Tailwind CSS
- **后端**: Supabase (数据库 + 认证 + API)
- **部署**: Netlify (Edge Functions + CDN)
- **样式**: Tailwind CSS (移动优先响应式设计)

### 目录结构
```
src/
├── components/          # 可复用组件
│   ├── layout/         # 布局组件 (Header, Footer, Navigation)
│   └── ui/             # UI组件 (Button, Input, Modal, Table)
├── layouts/            # 页面布局
├── pages/              # 页面和API路由
│   ├── api/            # API端点
│   │   ├── auth/       # 认证相关API
│   │   └── analyze/    # 数据分析API
│   └── auth/           # 认证页面
├── utils/              # 工具函数
├── types/              # TypeScript类型定义
└── styles/             # 全局样式
```

## 任务列表

### 核心架构 - 2024-01-15
- [x] 建立基础项目结构和配置 ✅
- [x] 配置Supabase集成 ✅
- [x] 创建统一的Header和Footer组件 ✅
- [x] 建立BaseLayout布局系统 ✅
- [x] 配置Tailwind CSS和全局样式 ✅

### 用户认证系统 - 2024-01-15
- [x] 用户注册功能 ✅
- [x] 用户登录功能 ✅
- [x] 用户登出功能 ✅
- [x] 密码修改功能 ✅
- [x] 用户信息获取API ✅
- [x] 认证中间件 ✅
- [x] 用户资料页面 ✅

### 数据分析功能 - 2024-01-15
- [ ] 单个数据分析API
- [ ] 批量数据分析API
- [ ] 分析结果页面
- [ ] 数据可视化组件

### 用户收藏系统 - 2024-01-15
- [ ] 收藏功能API
- [ ] 收藏页面
- [ ] 收藏管理

### 历史记录系统 - 2024-01-15
- [ ] 历史记录API
- [ ] 历史记录页面
- [ ] 历史数据管理

### UI组件库 - 2024-01-15
- [x] Button组件 ✅
- [x] Input组件 ✅
- [x] Modal组件 ✅
- [x] Table组件 ✅
- [ ] Alert组件

### 测试和质量保证 - 2024-01-15
- [ ] 单元测试覆盖
- [ ] 端到端测试
- [ ] 代码质量检查
- [ ] 性能优化

### 部署和配置 - 2024-01-15
- [x] 环境变量配置 ✅
- [ ] Netlify部署配置
- [x] 健康检查API ✅
- [x] 错误页面 (404, 500) ✅

### 发现的子任务
(在开发过程中发现的新任务将在这里添加)

## Astro Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 开发规范

### 代码风格
- 使用ES6+语法
- 驼峰命名法 (camelCase)
- 模块化组织代码
- 相对路径导入

### 设计原则
- 移动优先的响应式设计
- 组件化架构
- 一致的命名约定
- 清晰的注释和文档

### 数据管理
- 所有数据通过Supabase API访问
- 使用真实数据，禁止模拟数据
- Supabase处理所有权限管理
- 实时数据同步

## Deploying to Netlify

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/netlify-templates/astro-platform-starter)

## Developing Locally

| Prerequisites                                                                |
| :--------------------------------------------------------------------------- |
| [Node.js](https://nodejs.org/) v18.14+.                                      |
| (optional) [nvm](https://github.com/nvm-sh/nvm) for Node version management. |

1. Clone this repository, then run `npm install` in its root directory.

2. For the starter to have full functionality locally (e.g. edge functions, blob store), please ensure you have an up-to-date version of Netlify CLI. Run:

```
npm install netlify-cli@latest -g
```

3. Link your local repository to the deployed Netlify site. This will ensure you're using the same runtime version for both local development and your deployed site.

```
netlify link
```

4. Then, run the Astro.js development server via Netlify CLI:

```
netlify dev
```

If your browser doesn't navigate to the site automatically, visit [localhost:8888](http://localhost:8888).

## 环境配置

创建 `.env` 文件并设置以下变量：

```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```
