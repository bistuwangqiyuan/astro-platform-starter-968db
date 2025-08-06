# 离线构建和部署指南

由于网络连接问题，这里提供几种解决方案来构建和部署项目。

## 🚨 当前问题

网络无法连接到 npm 镜像源，导致无法安装依赖包。

## 💡 解决方案

### 方案 1：网络恢复后构建

等待网络恢复后，按以下步骤操作：

```bash
# 1. 设置可用的镜像源
pnpm config set registry https://registry.npmmirror.com

# 2. 安装依赖
pnpm install

# 3. 构建项目
pnpm run build

# 4. 本地预览
pnpm run preview
```

### 方案 2：使用移动热点或其他网络

如果主网络有问题，可以尝试：

1. 使用手机热点
2. 切换到其他网络
3. 使用 VPN

然后执行上述命令。

### 方案 3：使用已有的 node_modules

如果你之前在其他地方成功安装过依赖：

```bash
# 复制之前的node_modules到当前项目
# 然后直接构建
pnpm run build
```

## 🔧 可尝试的镜像源

如果某个镜像源不可用，可以尝试其他的：

```bash
# 字节跳动镜像
pnpm config set registry https://registry.npmmirror.com

# 阿里云镜像
pnpm config set registry https://registry.npm.taobao.org

# 腾讯云镜像
pnpm config set registry https://mirrors.cloud.tencent.com/npm/

# 华为云镜像
pnpm config set registry https://repo.huaweicloud.com/repository/npm/

# 官方源（如果网络允许）
pnpm config set registry https://registry.npmjs.org
```

## 📦 项目构建命令

一旦依赖安装成功，使用以下命令：

```bash
# 开发模式
pnpm run dev

# 构建生产版本
pnpm run build

# 预览构建结果
pnpm run preview

# 检查类型
pnpm run astro check
```

## 🚀 部署到 Netlify

### 1. 通过 GitHub 自动部署

```bash
# 推送代码到GitHub（网络恢复后）
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. 手动部署

如果网络问题只影响 npm 但 GitHub 可访问：

1. 在有网络的其他环境构建项目
2. 将构建产物(`dist/`目录)上传到 GitHub
3. 或直接将`dist/`目录拖拽到 Netlify 部署

### 3. 使用 Netlify CLI

```bash
# 网络恢复后
netlify login
netlify deploy --prod
```

## 🔍 测试网络连接

使用以下命令测试网络：

```bash
# 测试基本网络
ping baidu.com

# 测试npm镜像源
ping registry.npmmirror.com
ping registry.npm.taobao.org

# 测试GitHub连接
ping github.com

# 测试Netlify连接
ping netlify.com
```

## 📋 部署检查清单

网络恢复后的部署步骤：

- [ ] 网络连接正常
- [ ] 设置可用的 npm 镜像源
- [ ] 安装项目依赖：`pnpm install`
- [ ] 创建环境变量文件：`cp .env.example .env`
- [ ] 填写 Supabase 配置信息
- [ ] 本地测试：`pnpm run dev`
- [ ] 构建项目：`pnpm run build`
- [ ] 推送代码：`git push origin main`
- [ ] 在 Netlify 配置部署

## 🆘 紧急部署方案

如果急需部署，可以：

1. 在有网络的其他设备/环境完成构建
2. 将`dist/`目录复制过来
3. 直接上传到 Netlify 或其他静态托管服务

## 📞 获取帮助

如果仍有问题，请检查：

1. 网络设置和防火墙
2. DNS 配置
3. 代理设置
4. VPN 连接

---

**提示**: 一旦网络连接恢复，项目就可以正常构建和部署了！
