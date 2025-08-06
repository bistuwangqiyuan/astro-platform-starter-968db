import type { APIRoute } from 'astro';
import { AuthService } from '../../../utils/auth';

export const GET: APIRoute = async ({ locals }) => {
  console.log('[API] 开始处理获取用户信息请求');
  
  try {
    // Reason: 从中间件获取用户信息（已经过认证验证）
    const user = locals.user;
    
    if (!user) {
      console.log('[API] 获取用户信息失败: 用户未认证');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Unauthorized',
          message: '用户未认证'
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    console.log(`[API] 获取用户信息成功: ${user.email}`);
    
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar_url: user.avatar_url,
          created_at: user.created_at,
          updated_at: user.updated_at
        }
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error: any) {
    console.error('[API] 获取用户信息过程出错:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: '服务器内部错误，请稍后重试'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};