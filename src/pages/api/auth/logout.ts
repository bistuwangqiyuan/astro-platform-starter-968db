import type { APIRoute } from 'astro';
import { signOut } from '../../../utils/supabase';
import type { ApiResponse } from '../../../types/supabase';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    console.log('处理用户登出请求');
    
    // 调用Supabase登出函数
    const result = await signOut();
    
    if (result.success) {
      console.log('用户登出成功');
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: '登出成功' 
        } as ApiResponse),
        { 
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            // Reason: 清除客户端可能的认证相关缓存
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          }
        }
      );
    } else {
      console.error('用户登出失败:', result.error);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: result.error || '登出失败' 
        } as ApiResponse),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    console.error('登出API发生未知错误:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: '服务器内部错误，请稍后重试' 
      } as ApiResponse),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

// 支持GET请求以便于URL直接访问登出
export const GET: APIRoute = async ({ request }) => {
  return POST({ request });
};