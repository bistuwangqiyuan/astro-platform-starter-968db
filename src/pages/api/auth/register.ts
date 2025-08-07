import type { APIRoute } from 'astro';
import { supabase } from '../../../utils/supabase';

// 日志记录
const log = (message: string, data?: any) => {
  console.log(`[API/auth/register] ${message}`, data || '');
};

export const POST: APIRoute = async ({ request }) => {
  try {
    log('注册请求开始');
    
    // 获取请求数据
    const data = await request.json();
    const { email, password, confirmPassword } = data;

    // 验证输入
    if (!email || !password) {
      log('注册失败：缺少必要参数');
      return new Response(
        JSON.stringify({ error: '邮箱和密码不能为空' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      log('注册失败：邮箱格式无效');
      return new Response(
        JSON.stringify({ error: '请输入有效的邮箱地址' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 验证密码长度
    if (password.length < 6) {
      log('注册失败：密码太短');
      return new Response(
        JSON.stringify({ error: '密码至少需要6个字符' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 验证密码确认
    if (confirmPassword && password !== confirmPassword) {
      log('注册失败：密码不匹配');
      return new Response(
        JSON.stringify({ error: '两次输入的密码不一致' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    log('尝试注册', { email });

    // 执行注册
    const { data: authData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          created_at: new Date().toISOString(),
        },
      },
    });

    if (error) {
      log('注册失败', error.message);
      
      // 处理特定错误
      if (error.message.includes('already registered')) {
        return new Response(
          JSON.stringify({ error: '该邮箱已被注册' }),
          { status: 409, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    log('注册成功', { userId: authData.user?.id });

    // 如果Supabase配置为自动登录，设置cookie
    if (authData.session) {
      const response = new Response(
        JSON.stringify({
          user: {
            id: authData.user?.id,
            email: authData.user?.email,
          },
          session: {
            access_token: authData.session.access_token,
            refresh_token: authData.session.refresh_token,
            expires_at: authData.session.expires_at,
          },
          message: '注册成功！',
        }),
        {
          status: 201,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      // 设置认证cookie
      response.headers.append(
        'Set-Cookie',
        `sb-access-token=${authData.session.access_token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`
      );
      response.headers.append(
        'Set-Cookie',
        `sb-refresh-token=${authData.session.refresh_token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`
      );

      return response;
    }

    // 如果需要邮箱验证
    return new Response(
      JSON.stringify({
        user: {
          id: authData.user?.id,
          email: authData.user?.email,
        },
        message: '注册成功！请检查您的邮箱以验证账户。',
      }),
      {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    log('注册处理出错', error);
    return new Response(
      JSON.stringify({ error: '服务器错误，请稍后重试' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};