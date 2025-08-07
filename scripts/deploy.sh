#!/bin/bash

# 文本分析平台部署脚本

echo "🚀 开始部署文本分析平台..."

# 检查环境变量
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "❌ 错误：缺少必要的环境变量"
    echo "请设置以下环境变量："
    echo "  - SUPABASE_URL"
    echo "  - SUPABASE_ANON_KEY"
    echo "  - SUPABASE_SERVICE_ROLE_KEY (可选)"
    exit 1
fi

# 安装依赖
echo "📦 安装依赖..."
npm install

# 运行测试
echo "🧪 运行测试..."
npm test -- --run

# 构建项目
echo "🔨 构建项目..."
npm run build

# 检查构建结果
if [ -d "dist" ]; then
    echo "✅ 构建成功！"
    echo "📁 构建文件位于 ./dist 目录"
else
    echo "❌ 构建失败！"
    exit 1
fi

echo "🎉 部署准备完成！"
echo ""
echo "下一步："
echo "1. 提交代码到 Git 仓库"
echo "2. 在 Netlify 控制台连接仓库"
echo "3. 设置环境变量"
echo "4. 触发部署"