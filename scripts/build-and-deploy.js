#!/usr/bin/env node

// 构建和部署脚本
// 确保项目在部署前完全准备就绪

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.dirname(__dirname);

// 日志函数
function log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'warn' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
}

// 检查必需文件
function checkRequiredFiles() {
    log('检查必需文件...');

    const requiredFiles = ['package.json', 'astro.config.mjs', 'tailwind.config.mjs', 'netlify.toml', 'src/pages/index.astro', 'database-schema.sql'];

    // 切换到项目根目录
    process.chdir(projectRoot);

    for (const file of requiredFiles) {
        if (!fs.existsSync(file)) {
            log(`缺少必需文件: ${file}`, 'error');
            process.exit(1);
        }
    }

    log('必需文件检查通过', 'success');
}

// 检查环境变量
function checkEnvironmentVariables() {
    log('检查环境变量...');

    // 检查是否有环境变量文件或系统环境变量
    const envFile = '.env';
    const hasEnvFile = fs.existsSync(envFile);

    if (!hasEnvFile) {
        log('未找到 .env 文件，请确保在生产环境中设置了环境变量', 'warn');
        log('参考 env.example 文件创建 .env 文件', 'warn');
    } else {
        log('找到 .env 文件', 'success');
    }

    // 检查关键环境变量
    const requiredEnvVars = ['PUBLIC_SUPABASE_URL', 'PUBLIC_SUPABASE_ANON_KEY'];

    let hasRequiredVars = true;
    if (hasEnvFile) {
        const envContent = fs.readFileSync(envFile, 'utf8');
        for (const envVar of requiredEnvVars) {
            if (!envContent.includes(envVar) || envContent.includes(`${envVar}=your_`)) {
                log(`环境变量 ${envVar} 未配置或使用默认值`, 'warn');
                hasRequiredVars = false;
            }
        }
    }

    if (hasRequiredVars && hasEnvFile) {
        log('环境变量检查通过', 'success');
    } else {
        log('请配置正确的环境变量后再部署', 'warn');
    }
}

// 检查依赖
function checkDependencies() {
    log('检查依赖安装...');

    if (!fs.existsSync('node_modules')) {
        log('正在安装依赖...', 'info');
        try {
            execSync('npm install', { stdio: 'inherit' });
            log('依赖安装完成', 'success');
        } catch (error) {
            log('依赖安装失败', 'error');
            log(error.message, 'error');
            process.exit(1);
        }
    } else {
        log('依赖已安装', 'success');
    }
}

// 运行类型检查
function runTypeCheck() {
    log('运行类型检查...');

    try {
        execSync('npx astro check', { stdio: 'inherit' });
        log('类型检查通过', 'success');
    } catch (error) {
        log('类型检查发现问题，但继续构建', 'warn');
    }
}

// 构建项目
function buildProject() {
    log('开始构建项目...');

    try {
        // 清理旧的构建文件
        if (fs.existsSync('dist')) {
            execSync('rm -rf dist', { stdio: 'inherit' });
        }

        // 执行构建
        execSync('npm run build', { stdio: 'inherit' });

        // 检查构建结果
        if (!fs.existsSync('dist')) {
            throw new Error('构建失败：dist 目录不存在');
        }

        log('项目构建完成', 'success');

        // 显示构建统计
        const distStats = getDirectoryStats('dist');
        log(`构建结果：${distStats.files} 个文件，总大小 ${distStats.size} KB`);
    } catch (error) {
        log('构建失败', 'error');
        log(error.message, 'error');
        process.exit(1);
    }
}

// 验证构建结果
function validateBuild() {
    log('验证构建结果...');

    const requiredBuildFiles = ['dist/index.html', 'dist/_redirects'];

    for (const file of requiredBuildFiles) {
        if (!fs.existsSync(file)) {
            log(`构建文件缺失: ${file}`, 'error');
            process.exit(1);
        }
    }

    // 检查 _redirects 文件内容
    const redirectsContent = fs.readFileSync('dist/_redirects', 'utf8');
    if (!redirectsContent.includes('/api/*')) {
        log('_redirects 文件可能配置不正确', 'warn');
    }

    log('构建结果验证通过', 'success');
}

// 获取目录统计信息
function getDirectoryStats(dirPath) {
    let fileCount = 0;
    let totalSize = 0;

    function traverse(currentPath) {
        const items = fs.readdirSync(currentPath);

        for (const item of items) {
            const itemPath = path.join(currentPath, item);
            const stats = fs.statSync(itemPath);

            if (stats.isDirectory()) {
                traverse(itemPath);
            } else {
                fileCount++;
                totalSize += stats.size;
            }
        }
    }

    traverse(dirPath);

    return {
        files: fileCount,
        size: Math.round(totalSize / 1024)
    };
}

// 创建部署信息文件
function createDeployInfo() {
    log('创建部署信息...');

    const deployInfo = {
        buildTime: new Date().toISOString(),
        nodeVersion: process.version,
        platform: process.platform,
        gitCommit: getGitCommit(),
        gitBranch: getGitBranch(),
        projectVersion: getProjectVersion()
    };

    fs.writeFileSync('dist/deploy-info.json', JSON.stringify(deployInfo, null, 2));
    log('部署信息已创建', 'success');
}

// 获取 Git 提交信息
function getGitCommit() {
    try {
        return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    } catch {
        return 'unknown';
    }
}

// 获取 Git 分支信息
function getGitBranch() {
    try {
        return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    } catch {
        return 'unknown';
    }
}

// 获取项目版本
function getProjectVersion() {
    try {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        return packageJson.version || '1.0.0';
    } catch {
        return '1.0.0';
    }
}

// 显示部署指南
function showDeployGuide() {
    log('\n🚀 构建完成！部署指南：');
    console.log(`
📦 部署选项：

1. Netlify 自动部署 (推荐)：
   - 将代码推送到 GitHub
   - 在 Netlify 连接 GitHub 仓库
   - 配置环境变量

2. Netlify CLI 部署：
   netlify deploy --prod --dir=dist

3. 手动拖拽部署：
   - 压缩 dist 目录
   - 拖拽到 Netlify 部署页面

🔧 环境变量配置：
   PUBLIC_SUPABASE_URL=你的_supabase_url
   PUBLIC_SUPABASE_ANON_KEY=你的_supabase_anon_key
   PUBLIC_APP_URL=https://你的域名.netlify.app
   GOOGLE_API_KEY=你的_google_api_key (可选)
   GOOGLE_CSE_ID=你的_search_engine_id (可选)

📋 部署后检查清单：
   ✅ 访问主页正常加载
   ✅ 路由导航工作正常
   ✅ API 端点响应正确
   ✅ 数据库连接成功
   ✅ 认证功能正常

📚 更多信息：
   - 查看 SUPABASE_SETUP.md 配置数据库
   - 查看 DEPLOY.md 详细部署说明
    `);
}

// 主函数
function main() {
    log('🏗️ 开始构建和部署准备...');

    try {
        checkRequiredFiles();
        checkEnvironmentVariables();
        checkDependencies();
        runTypeCheck();
        buildProject();
        validateBuild();
        createDeployInfo();
        showDeployGuide();

        log('🎉 构建和部署准备完成！', 'success');
    } catch (error) {
        log('构建过程中发生错误', 'error');
        log(error.message, 'error');
        process.exit(1);
    }
}

// 运行脚本
main();
