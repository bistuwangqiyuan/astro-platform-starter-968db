# 智能文本分析平台 (Astro + Supabase)

[Live Demo](https://astro-platform-starter.netlify.app/)

一个基于 Astro.js、Tailwind CSS 和 Supabase 构建的现代文本分析平台，提供智能文本分析、收藏管理、历史记录等功能。

## 项目架构

### 技术栈
- **前端框架**: Astro.js v5
- **样式**: Tailwind CSS v4
- **数据库**: Supabase (PostgreSQL)
- **认证**: Supabase Auth
- **部署**: Netlify
- **语言**: TypeScript

### 项目结构
```
src/
├── components/     # UI组件
│   ├── layout/    # 布局组件 (Header, Footer, Navigation)
│   └── ui/        # 通用UI组件 (Button, Input, Modal, Table)
├── layouts/       # 页面布局
├── pages/         # 页面和API路由
│   ├── api/       # API端点
│   │   ├── auth/  # 认证相关API
│   │   └── analyze/ # 分析相关API
│   └── auth/      # 认证页面
├── utils/         # 工具函数
├── types/         # 类型定义
└── styles/        # 全局样式
```

## 主要功能

### ✅ 已完成功能

1. **用户认证系统** (2025-01-07)
   - ✅ 用户注册
   - ✅ 用户登录
   - ✅ 用户登出
   - ✅ 修改密码
   - ✅ 获取用户信息

2. **文本分析功能** (2025-01-07)
   - ✅ 单个文本分析
   - ✅ 批量文本分析（最多10个）
   - ✅ 文本统计（字数、句子数、段落数）
   - ✅ 关键词提取
   - ✅ 情感分析
   - ✅ 可读性评估

3. **收藏管理** (2025-01-07)
   - ✅ 添加收藏
   - ✅ 查看收藏列表
   - ✅ 删除收藏
   - ✅ 分页展示

4. **历史记录** (2025-01-07)
   - ✅ 自动记录所有操作
   - ✅ 按类型过滤
   - ✅ 按日期范围过滤
   - ✅ 清除历史记录

5. **UI组件库** (2025-01-07)
   - ✅ Button组件
   - ✅ Input组件
   - ✅ Table组件
   - ✅ Modal组件
   - ✅ Header/Footer/Navigation布局组件

6. **中间件和安全** (2025-01-07)
   - ✅ 认证中间件
   - ✅ 路由保护
   - ✅ API认证验证

7. **错误处理** (2025-01-07)
   - ✅ 404错误页面
   - ✅ 500错误页面

8. **个人资料管理** (2025-01-07)
   - ✅ 查看个人信息
   - ✅ 使用统计
   - ✅ 清除数据功能

### ⏳ 待开发功能

1. **测试**
   - ⏳ 单元测试
   - ⏳ 集成测试
   - ⏳ E2E测试

2. **性能优化**
   - ⏳ 图片优化
   - ⏳ 代码分割
   - ⏳ 缓存策略

3. **增强功能**
   - ⏳ 导出分析报告
   - ⏳ 分享分析结果
   - ⏳ 更多分析维度

## 开发指南

### 环境要求

| 依赖项 | 版本要求 |
| :--- | :--- |
| Node.js | v18.14+ |
| npm | v9.0+ |
| Netlify CLI | 最新版 |

### 本地开发

1. 克隆项目并安装依赖：
```bash
git clone <repository-url>
cd astro-platform-starter
npm install
```

2. 配置环境变量：
```bash
cp .env.example .env
# 编辑 .env 文件，填入您的 Supabase 配置
```

3. 设置 Supabase 数据库：
   - 创建以下数据表：
     - `users` - 用户信息
     - `analyses` - 分析记录
     - `favorites` - 收藏记录
     - `history` - 历史记录

4. 运行开发服务器：
```bash
netlify dev
```

访问 [http://localhost:8888](http://localhost:8888)

### 部署到 Netlify

1. 在 Netlify 控制台创建新站点
2. 连接 GitHub 仓库
3. 配置环境变量：
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `PUBLIC_SITE_URL`
4. 部署站点

### 命令说明

| 命令 | 说明 |
| :--- | :--- |
| `npm install` | 安装依赖 |
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run preview` | 预览构建结果 |
| `netlify dev` | 使用 Netlify CLI 启动开发服务器 |

## 编码规范

- **文件命名**: 使用 kebab-case
- **组件命名**: 使用 PascalCase
- **变量命名**: 使用 camelCase
- **TypeScript**: 所有代码都使用 TypeScript
- **样式**: 使用 Tailwind CSS utilities
- **注释**: 关键逻辑必须添加注释

## 数据库结构

### users 表
- id (uuid, primary key)
- email (text, unique)
- created_at (timestamp)
- updated_at (timestamp)

### analyses 表
- id (uuid, primary key)
- user_id (uuid, foreign key)
- content (text)
- result (jsonb)
- created_at (timestamp)
- updated_at (timestamp)

### favorites 表
- id (uuid, primary key)
- user_id (uuid, foreign key)
- analysis_id (uuid, foreign key)
- created_at (timestamp)

### history 表
- id (uuid, primary key)
- user_id (uuid, foreign key)
- action (text)
- details (jsonb)
- created_at (timestamp)

## 任务跟踪

### TASK

#### 已完成任务 (2025-01-07)
- [x] 设置 Supabase 数据库连接和配置
- [x] 实现用户认证系统（注册、登录、登出、修改密码）
- [x] 实现文本分析功能（单个分析和批量分析）
- [x] 实现收藏管理功能
- [x] 实现历史记录功能
- [x] 完成所有 UI 组件
- [x] 实现认证中间件
- [x] 创建错误页面
- [x] 创建个人资料页面
- [x] 更新首页设计

#### 待完成任务
- [ ] 编写单元测试
- [ ] 编写集成测试
- [ ] 性能优化
- [ ] 添加更多分析维度
- [ ] 实现导出功能
- [ ] 实现分享功能

### 开发过程中发现的任务
- 需要添加数据导入/导出功能
- 需要添加批量删除功能
- 需要优化移动端体验
- 需要添加深色模式支持

## 许可证

MIT License

## 更新日志

### 2025-01-07
- 完成所有核心功能开发
- 实现完整的用户认证系统
- 实现文本分析、收藏、历史记录功能
- 创建所有必要的 UI 组件
- 设置项目基础架构
