import { defineMiddleware } from 'astro/middleware';
import { serverAuth } from './utils/auth';

// Reason: 定义需要认证的路径模式
const protectedPaths = [
  '/profile',
  '/analyze',
  '/favorites',
  '/history',
  '/api/auth/me',
  '/api/auth/change-password',
  '/api/analyze',
  '/api/favorites',
  '/api/history'
];

// Reason: 定义不需要认证的API路径
const publicApiPaths = [
  '/api/health',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/logout'
];

// Reason: 认证中间件主函数
export const onRequest = defineMiddleware(async (context, next) => {
  const { request, url, redirect } = context;
  const pathname = url.pathname;
  
  console.log(`[Middleware] 处理请求: ${request.method} ${pathname}`);
  
  // Reason: 检查是否为受保护的路径
  const isProtectedPath = protectedPaths.some(path => 
    pathname.startsWith(path)
  );
  
  const isPublicApiPath = publicApiPaths.some(path =>
    pathname.startsWith(path)
  );
  
  // Reason: 如果不是受保护的路径，直接继续
  if (!isProtectedPath) {
    return next();
  }
  
  // Reason: 如果是公开的API路径，直接继续
  if (isPublicApiPath) {
    return next();
  }
  
  try {
    // Reason: 验证用户认证状态
    const user = await serverAuth.getUserFromRequest(request);
    
    if (!user) {
      console.log(`[Middleware] 未认证访问受保护路径: ${pathname}`);
      
      // Reason: 如果是API请求，返回401状态
      if (pathname.startsWith('/api/')) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Unauthorized',
            message: '请先登录'
          }),
          {
            status: 401,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
      }
      
      // Reason: 如果是页面请求，重定向到登录页
      const loginUrl = new URL('/auth/login', url.origin);
      loginUrl.searchParams.set('redirect', pathname);
      return redirect(loginUrl.toString());
    }
    
    // Reason: 将用户信息添加到context中，供后续处理使用
    context.locals.user = user;
    
    console.log(`[Middleware] 用户认证成功: ${user.email}`);
    
    return next();
  } catch (error) {
    console.error('[Middleware] 认证验证失败:', error);
    
    // Reason: 认证验证失败时的处理
    if (pathname.startsWith('/api/')) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Authentication Error',
          message: '认证验证失败'
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    // Reason: 页面请求时重定向到登录页
    return redirect('/auth/login');
  }
});

// Reason: 扩展Astro的locals类型定义
declare global {
  namespace App {
    interface Locals {
      user?: {
        id: string;
        email: string;
        name?: string;
        avatar_url?: string;
        created_at: string;
        updated_at: string;
      };
    }
  }
}