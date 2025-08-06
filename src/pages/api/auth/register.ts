import type { APIRoute } from 'astro';
import { signUp } from '../../../utils/supabase';
import type { SignUpData, ApiResponse } from '../../../types/supabase';

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

    const body = await request.json() as SignUpData;
    
    // 输入验证
    if (!body.email || !body.password) {
      console.error('注册失败: 缺少必需字段', { email: !!body.email, password: !!body.password });
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
      console.error('注册失败: 邮箱格式无效', { email: body.email });
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

    // 密码强度验证
    if (body.password.length < 8) {
      console.error('注册失败: 密码长度不足', { passwordLength: body.password.length });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: '密码长度至少为8位' 
        } as ApiResponse),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Reason: 强密码验证确保账户安全
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(body.password)) {
      console.error('注册失败: 密码强度不足', { email: body.email });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: '密码必须包含大小写字母、数字和特殊字符' 
        } as ApiResponse),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 全名验证
    if (body.fullName && (body.fullName.length < 2 || body.fullName.length > 50)) {
      console.error('注册失败: 全名长度无效', { fullNameLength: body.fullName.length });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: '全名长度应在2-50字符之间' 
        } as ApiResponse),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('尝试用户注册:', { email: body.email, fullName: body.fullName });
    
    // 准备用户元数据
    const metadata = {
      full_name: body.fullName || '',
      ...body.metadata
    };
    
    // 调用Supabase注册函数
    const result = await signUp(body.email, body.password, metadata);
    
    if (result.success) {
      console.log('用户注册成功:', { 
        userId: result.data?.user?.id, 
        email: result.data?.user?.email,
        needsEmailConfirmation: !result.data?.user?.email_confirmed_at
      });
      
      // Reason: 根据Supabase配置，可能需要邮箱确认
      const needsConfirmation = !result.data?.user?.email_confirmed_at;
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: {
            user: {
              id: result.data.user.id,
              email: result.data.user.email,
              emailConfirmed: result.data.user.email_confirmed_at !== null,
              fullName: result.data.user.user_metadata?.full_name || null
            },
            session: result.data.session ? {
              accessToken: result.data.session.access_token,
              refreshToken: result.data.session.refresh_token,
              expiresAt: result.data.session.expires_at
            } : null,
            needsEmailConfirmation: needsConfirmation
          },
          message: needsConfirmation ? '注册成功，请查看邮箱确认链接' : '注册成功' 
        } as ApiResponse),
        { 
          status: 201,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } else {
      console.error('用户注册失败:', { email: body.email, error: result.error });
      
      // Reason: 根据不同错误类型返回不同的HTTP状态码
      let statusCode = 400;
      if (result.error?.includes('User already registered')) {
        statusCode = 409; // Conflict
      } else if (result.error?.includes('Password should be')) {
        statusCode = 400; // Bad Request
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: result.error || '注册失败' 
        } as ApiResponse),
        { 
          status: statusCode,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    console.error('注册API发生未知错误:', error);
    
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