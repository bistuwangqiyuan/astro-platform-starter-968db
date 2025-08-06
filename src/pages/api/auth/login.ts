import type { APIRoute } from 'astro';
import { signIn } from '../../../utils/supabase';
import type { SignInData, ApiResponse } from '../../../types/supabase';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const contentType = request.headers.get('content-type');
    
    if (!contentType || !contentType.includes('application/json')) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: '请求头必须包含 Content-Type: application/json' 
        } as ApiResponse),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const body = await request.json() as SignInData;
    
    // 输入验证
    if (!body.email || !body.password) {
      console.error('登录失败: 缺少必需字段', { email: !!body.email, password: !!body.password });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: '邮箱和密码不能为空' 
        } as ApiResponse),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      console.error('登录失败: 邮箱格式无效', { email: body.email });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: '邮箱格式无效' 
        } as ApiResponse),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 密码长度验证
    if (body.password.length < 6) {
      console.error('登录失败: 密码长度不足', { passwordLength: body.password.length });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: '密码长度至少为6位' 
        } as ApiResponse),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('尝试用户登录:', { email: body.email });
    
    // 调用Supabase登录函数
    const result = await signIn(body.email, body.password);
    
    if (result.success) {
      console.log('用户登录成功:', { 
        userId: result.data?.user?.id, 
        email: result.data?.user?.email 
      });
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: {
            user: {
              id: result.data.user.id,
              email: result.data.user.email,
              emailConfirmed: result.data.user.email_confirmed_at !== null
            },
            session: {
              accessToken: result.data.session.access_token,
              refreshToken: result.data.session.refresh_token,
              expiresAt: result.data.session.expires_at
            }
          },
          message: '登录成功' 
        } as ApiResponse),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } else {
      console.error('用户登录失败:', { email: body.email, error: result.error });
      
      // Reason: 根据不同错误类型返回不同的HTTP状态码
      let statusCode = 400;
      if (result.error?.includes('Invalid login credentials')) {
        statusCode = 401;
      } else if (result.error?.includes('Email not confirmed')) {
        statusCode = 403;
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: result.error || '登录失败' 
        } as ApiResponse),
        { 
          status: statusCode,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    console.error('登录API发生未知错误:', error);
    
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