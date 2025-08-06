import type { APIRoute } from 'astro';
import { AuthService } from '../../../utils/auth';
import type { LoginForm } from '../../../types/global.d';

export const POST: APIRoute = async ({ request }) => {
  console.log('[API] 开始处理用户登录请求');
  
  try {
    // Reason: 解析请求体
    const body = await request.json();
    const { email, password } = body as LoginForm;
    
    // Reason: 验证必填字段
    if (!email || !password) {
      console.log('[API] 登录失败: 缺少必填字段');
      return new Response(
        JSON.stringify({
          success: false,
          error: '邮箱和密码不能为空'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Reason: 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('[API] 登录失败: 邮箱格式无效');
      return new Response(
        JSON.stringify({
          success: false,
          error: '邮箱格式无效'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Reason: 调用认证服务进行登录
    const result = await AuthService.login({
      email,
      password
    });
    
    console.log(`[API] 登录结果: ${result.success ? '成功' : '失败'}`);
    
    if (result.success) {
      // Reason: 获取访问令牌
      const accessToken = await AuthService.getAccessToken();
      
      // Reason: 设置认证cookie
      const headers = new Headers({
        'Content-Type': 'application/json'
      });
      
      if (accessToken) {
        // Reason: 设置httpOnly cookie存储访问令牌
        headers.set('Set-Cookie', [
          `sb-access-token=${accessToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${60 * 60 * 24 * 7}`, // 7天
          `sb-refresh-token=true; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${60 * 60 * 24 * 30}` // 30天
        ].join(', '));
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          message: result.message,
          data: {
            id: result.data?.id,
            email: result.data?.email,
            name: result.data?.user_metadata?.name || null,
            avatar_url: result.data?.user_metadata?.avatar_url || null
          }
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
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error: any) {
    console.error('[API] 登录过程出错:', error);
    
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