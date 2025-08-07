import { defineMiddleware } from 'astro:middleware';
import { createServerClient } from './utils/supabase';

// 日志记录
const log = (message: string, data?: any) => {
  console.log(`[Middleware] ${message}`, data || '');
};

// 需要认证的路径
const protectedPaths = [
  '/analyze',
  '/favorites', 
  '/history',
  '/profile',
  '/api/analyze',
  '/api/favorites',
  '/api/history',
  '/api/auth/change-password',
  '/api/auth/me',
];

// 检查路径是否需要认证
const isProtectedPath = (pathname: string): boolean => {
  return protectedPaths.some(path => 
    pathname === path || pathname.startsWith(path + '/')
  );
};

export const onRequest = defineMiddleware(async ({ request, redirect }, next) => {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  log('请求路径', pathname);
  
  // 检查是否是需要保护的路径
  if (isProtectedPath(pathname)) {
    log('访问受保护路径', pathname);
    
    try {
      // 创建服务端Supabase客户端
      const supabase = createServerClient(request);
      
      // 检查用户认证状态
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        log('用户未认证，重定向到登录页');
        
        // API端点返回401
        if (pathname.startsWith('/api/')) {
          return new Response(
            JSON.stringify({ error: '未授权，请先登录' }),
            { 
              status: 401, 
              headers: { 'Content-Type': 'application/json' } 
            }
          );
        }
        
        // 页面重定向到登录页
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return redirect(loginUrl.toString());
      }
      
      log('用户已认证', { userId: user.id, email: user.email });
    } catch (error) {
      log('认证检查出错', error);
      
      // 出错时也重定向到登录页
      if (!pathname.startsWith('/api/')) {
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return redirect(loginUrl.toString());
      }
      
      return new Response(
        JSON.stringify({ error: '服务器错误' }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }
  }
  
  // 继续处理请求
  return next();
});