# Astro Platform Starter - 数据分析平台

[Live Demo](https://astro-platform-starter.netlify.app/)

基于 Astro.js、Tailwind 和 [Netlify Core Primitives](https://docs.netlify.com/core/overview/#develop) (Edge Functions, Image CDN, Blob Store) 的现代数据分析平台启动器。

## 项目架构

### 技术栈

- **前端框架**: Astro.js + React
- **样式**: Tailwind CSS v4
- **数据库**: Supabase (远程数据库服务)
- **部署**: Netlify (Edge Functions + Serverless Functions)
- **认证**: Supabase Auth
- **存储**: Supabase Storage + Netlify Blob Store

### 目录结构

```
src/
├── components/          # 可复用组件
│   ├── layout/         # 布局组件 (Header, Footer, Navigation)
│   └── ui/            # UI组件 (Button, Input, Modal, Table)
├── layouts/           # 页面布局
├── pages/            # 页面路由
│   ├── api/          # API端点
│   └── auth/         # 认证页面
├── utils/            # 工具函数
├── types/            # TypeScript类型定义
└── styles/           # 全局样式
```

### 核心功能

- 🔍 数据分析 (批处理 + 实时分析)
- ⭐ 收藏系统 (数据收藏和管理)
- 📝 历史记录 (操作历史追踪)
- 🔐 用户认证 (登录/注册/权限管理)
- 📱 响应式设计 (移动优先)

## 任务列表

### 已完成功能 ✅

- [x] 更新 README.md 添加项目架构、任务列表和开发指南 (2024-01-20)
- [x] 配置 Supabase 数据库服务和环境变量 (2024-01-20)
- [x] 创建数据分析 API 端点和批处理功能 (2024-01-20)
- [x] 创建数据分析页面和前端界面 (2024-01-20)
- [x] 创建收藏系统 API 端点 (2024-01-20)
- [x] 创建历史记录系统 API 端点 (2024-01-20)
- [x] 完善 Alert 组件，支持多种类型和样式 (2024-01-20)
- [x] 创建统一的 BaseLayout 布局系统 (2024-01-20)
- [x] 实现 Header、Footer、Navigation 组件 (2024-01-20)

### 待完善功能 🚧

- [ ] 创建收藏页面和管理界面
- [ ] 创建历史记录页面和查看界面
- [ ] 为所有新功能创建单元测试覆盖
- [ ] 创建认证页面（登录/注册）
- [ ] 实现完整的数据分析前端界面
- [ ] 添加数据可视化图表组件

### 工作中发现的子任务

<!-- 开发过程中发现的新任务会添加到这里 -->

## 功能完成总结

### 🎯 核心功能已实现

**1. 数据分析系统**

- ✅ 完整的分析 API 端点 (`/api/analyze`)
- ✅ 批处理分析功能 (`/api/analyze/batch`)
- ✅ 支持 7 种分析类型：描述性、相关性、回归、聚类、分类、时间序列、自定义
- ✅ 异步处理和状态管理
- ✅ 真实数据计算，无模拟数据污染

**2. 收藏系统**

- ✅ 完整的收藏 API (`/api/favorites`)
- ✅ 支持添加、删除、批量操作
- ✅ 多种收藏类型支持
- ✅ 权限验证和数据关联

**3. 历史记录系统**

- ✅ 详细的历史记录 API (`/api/history`)
- ✅ 操作追踪和统计分析
- ✅ 时间线和趋势分析
- ✅ 自动清理和管理功能

**4. 用户认证与权限**

- ✅ Supabase 认证集成
- ✅ 安全的 API 中间件
- ✅ 表单验证和错误处理
- ✅ 会话管理

**5. UI 组件系统**

- ✅ 响应式 BaseLayout 布局
- ✅ 功能完整的 Alert 组件（5 种类型、3 种样式）
- ✅ Header/Footer/Navigation 组件
- ✅ 无障碍设计和键盘导航
- ✅ 深色模式和高对比度支持

**6. 开发基础设施**

- ✅ TypeScript 类型定义
- ✅ Supabase 数据库配置
- ✅ 环境变量管理
- ✅ 全局工具函数
- ✅ 错误处理机制

### 📊 技术特色

- **真实数据处理**: 所有分析使用真实算法，避免模拟数据
- **批处理能力**: 支持最多 10 个任务的并行处理
- **实时状态**: WebSocket 支持的实时状态更新
- **权限安全**: 完整的用户权限验证机制
- **响应式设计**: 移动优先的现代 UI 设计
- **可维护性**: 模块化架构，易于扩展

### 🚀 下一步开发

剩余的主要工作包括：

1. 前端页面实现（分析、收藏、历史页面）
2. 认证页面（登录/注册界面）
3. 数据可视化图表组件
4. 单元测试覆盖
5. 性能优化和用户体验提升

## 开发指南

### 代码规范

- 使用 ES6+语法，模块化组织代码
- 变量命名使用 camelCase
- 优先使用相对导入路径
- 代码文件不超过 99999 行，超过需拆分模块
- 复杂逻辑添加 `# Reason:` 注释说明原因

### 数据库设计

- 所有数据访问通过 Supabase API
- 数据权限管理由 Supabase 远程服务处理
- 不使用本地数据库或后端服务
- 必须使用真实数据，禁止模拟数据

### 测试要求

- 测试文件放在 `/tests` 目录，镜像主应用结构
- 每个功能至少包含：1 个预期用例测试、1 个边界案例测试、1 个失败案例测试
- 更新逻辑后检查并更新相关单元测试

### UI/UX 规范

- 移动优先的响应式设计
- 统一使用 Header 和 Footer 组件
- 遵循现代 UI 最佳实践
- 所有页面使用 BaseLayout 布局

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

## 部署到 Netlify

### 快速部署

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/your-username/astro-platform-starter)

### 详细部署指南

请查看 [DEPLOY.md](./DEPLOY.md) 文件了解详细的部署步骤和配置说明。

### 部署前准备

1. 确保已经创建 Supabase 项目并获取凭据
2. Fork 或克隆此仓库到你的 GitHub 账户
3. 在 Netlify 中配置必要的环境变量

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
