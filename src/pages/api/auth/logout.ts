import type { APIRoute } from 'astro';
import { AuthService } from '../../../utils/auth';

export const POST: APIRoute = async ({ request }) => {
  console.log('[API] 开始处理用户登出请求');
  
  try {
    // Reason: 调用认证服务进行登出
    const result = await AuthService.logout();
    
    console.log(`[API] 登出结果: ${result.success ? '成功' : '失败'}`);
    
    // Reason: 清除认证cookie
    const headers = new Headers({
      'Content-Type': 'application/json'
    });
    
    // Reason: 设置过期的cookie来清除认证信息
    headers.set('Set-Cookie', [
      'sb-access-token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0',
      'sb-refresh-token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0'
    ].join(', '));
    
    if (result.success) {
      return new Response(
        JSON.stringify({
          success: true,
          message: result.message
        }),
        {
          status: 200,
          headers
        }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: result.error
        }),
        {
          status: 400,
          headers
        }
      );
    }
  } catch (error: any) {
    console.error('[API] 登出过程出错:', error);
    
    // Reason: 即使出错也要清除cookie
    const headers = new Headers({
      'Content-Type': 'application/json'
    });
    
    headers.set('Set-Cookie', [
      'sb-access-token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0',
      'sb-refresh-token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0'
    ].join(', '));
    
    return new Response(
      JSON.stringify({
        success: false,
        error: '服务器内部错误，但已清除登录状态'
      }),
      {
        status: 500,
        headers
      }
    );
  }
};