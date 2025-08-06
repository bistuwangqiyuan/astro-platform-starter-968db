import type { APIRoute } from 'astro';
import { AuthService } from '../../../utils/auth';
import type { RegisterForm } from '../../../types/global.d';

export const POST: APIRoute = async ({ request }) => {
  console.log('[API] 开始处理用户注册请求');
  
  try {
    // Reason: 解析请求体
    const body = await request.json();
    const { email, password, confirmPassword, name } = body as RegisterForm;
    
    // Reason: 验证必填字段
    if (!email || !password) {
      console.log('[API] 注册失败: 缺少必填字段');
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
      console.log('[API] 注册失败: 邮箱格式无效');
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
    
    // Reason: 验证密码强度
    if (password.length < 6) {
      console.log('[API] 注册失败: 密码太短');
      return new Response(
        JSON.stringify({
          success: false,
          error: '密码长度不能少于6位'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Reason: 验证密码确认
    if (password !== confirmPassword) {
      console.log('[API] 注册失败: 密码确认不一致');
      return new Response(
        JSON.stringify({
          success: false,
          error: '密码确认不一致'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Reason: 调用认证服务进行注册
    const result = await AuthService.register({
      email,
      password,
      confirmPassword,
      name
    });
    
    console.log(`[API] 注册结果: ${result.success ? '成功' : '失败'}`);
    
    if (result.success) {
      return new Response(
        JSON.stringify({
          success: true,
          message: result.message,
          data: {
            email: result.data?.email,
            needsVerification: true
          }
        }),
        {
          status: 201,
          headers: { 'Content-Type': 'application/json' }
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
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error: any) {
    console.error('[API] 注册过程出错:', error);
    
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