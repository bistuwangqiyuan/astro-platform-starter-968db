@echo off
echo 紧急部署脚本 - Astro Platform Starter
echo =====================================
echo.

REM 创建临时构建目录
if not exist "emergency-dist" mkdir emergency-dist

REM 复制简化版本到构建目录
copy simple-build.html emergency-dist\index.html

REM 创建基本的文件结构
if not exist "emergency-dist\auth" mkdir emergency-dist\auth
if not exist "emergency-dist\api" mkdir emergency-dist\api

REM 创建登录页面
echo ^<!DOCTYPE html^>^<html^>^<head^>^<title^>登录^</title^>^<script src="https://cdn.tailwindcss.com"^>^</script^>^</head^>^<body class="bg-gray-100"^>^<div class="min-h-screen flex items-center justify-center"^>^<div class="bg-white p-8 rounded-lg shadow-md w-96"^>^<h2 class="text-2xl font-bold mb-6"^>用户登录^</h2^>^<form^>^<div class="mb-4"^>^<label class="block text-gray-700 text-sm font-bold mb-2"^>邮箱^</label^>^<input type="email" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"^>^</div^>^<div class="mb-6"^>^<label class="block text-gray-700 text-sm font-bold mb-2"^>密码^</label^>^<input type="password" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"^>^</div^>^<button type="submit" class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"^>登录^</button^>^</form^>^<p class="mt-4 text-center"^>^<a href="register.html" class="text-blue-600 hover:underline"^>注册新账户^</a^>^</p^>^</div^>^</div^>^</body^>^</html^> > emergency-dist\auth\login.html

REM 创建注册页面
echo ^<!DOCTYPE html^>^<html^>^<head^>^<title^>注册^</title^>^<script src="https://cdn.tailwindcss.com"^>^</script^>^</head^>^<body class="bg-gray-100"^>^<div class="min-h-screen flex items-center justify-center"^>^<div class="bg-white p-8 rounded-lg shadow-md w-96"^>^<h2 class="text-2xl font-bold mb-6"^>用户注册^</h2^>^<form^>^<div class="mb-4"^>^<label class="block text-gray-700 text-sm font-bold mb-2"^>邮箱^</label^>^<input type="email" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"^>^</div^>^<div class="mb-4"^>^<label class="block text-gray-700 text-sm font-bold mb-2"^>密码^</label^>^<input type="password" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"^>^</div^>^<div class="mb-6"^>^<label class="block text-gray-700 text-sm font-bold mb-2"^>确认密码^</label^>^<input type="password" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"^>^</div^>^<button type="submit" class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"^>注册^</button^>^</form^>^<p class="mt-4 text-center"^>^<a href="login.html" class="text-blue-600 hover:underline"^>已有账户？登录^</a^>^</p^>^</div^>^</div^>^</body^>^</html^> > emergency-dist\auth\register.html

REM 创建_redirects文件
echo /* /index.html 200 > emergency-dist\_redirects

echo.
echo 紧急构建完成！
echo 构建文件位于: emergency-dist/
echo.
echo 部署选项：
echo 1. 将 emergency-dist 文件夹内容上传到 Netlify
echo 2. 或者将文件夹重命名为 dist 并使用正常部署流程
echo.
pause
