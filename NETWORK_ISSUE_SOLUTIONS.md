# 网络问题解决方案

## 🚨 当前问题

网络无法连接到 npm 注册表，导致无法安装依赖包和构建项目。

## 💡 解决方案

### 方案 1: 网络配置

```bash
# 检查网络连接
ping baidu.com
ping registry.npmjs.org

# 如果DNS有问题，尝试更换DNS
# Windows: 设置 -> 网络和Internet -> 更改适配器选项 -> 属性 -> IPv4 -> 使用以下DNS
# 推荐DNS: 8.8.8.8, 114.114.114.114, 223.5.5.5
```

### 方案 2: 离线安装依赖

如果你有其他可联网的设备：

1. **在联网设备上**:

```bash
git clone <你的仓库>
cd astro-platform-starter-968db
npm install  # 或 pnpm install
# 将整个 node_modules 目录复制到U盘
```

2. **在当前设备上**:

```bash
# 复制node_modules到项目目录
# 然后直接构建
npm run build
```

### 方案 3: 使用 CDN 构建替代方案

创建一个简化的 HTML 版本用于快速部署：

```html
<!-- 见下面的文件 simple-build.html -->
```

### 方案 4: 手机热点

```bash
# 连接手机热点
# 重新尝试安装
npm config set registry https://registry.npmmirror.com
npm install
npm run build
```

### 方案 5: 代理/VPN

如果有代理或 VPN：

```bash
# 设置代理
npm config set proxy http://proxy-server:port
npm config set https-proxy http://proxy-server:port

# 或设置环境变量
set HTTP_PROXY=http://proxy-server:port
set HTTPS_PROXY=http://proxy-server:port
```

## 📦 创建简化构建

如果无法安装完整依赖，我们可以创建一个简化版本：
