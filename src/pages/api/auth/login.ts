import type { APIRoute } from 'astro';
import { supabase } from '../../../utils/supabase';

// 日志记录
const log = (message: string, data?: any) => {
  console.log(`[API/auth/login] ${message}`, data || '');
};

export const POST: APIRoute = async ({ request }) => {
  try {
    log('登录请求开始');
    
    // 获取请求数据
    const data = await request.json();
    const { email, password } = data;

    // 验证输入
    if (!email || !password) {
      log('登录失败：缺少必要参数');
      return new Response(
        JSON.stringify({ error: '邮箱和密码不能为空' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    log('尝试登录', { email });

    // 执行登录
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      log('登录失败', error.message);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!authData.session) {
      log('登录失败：未创建会话');
      return new Response(
        JSON.stringify({ error: '登录失败，请重试' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    log('登录成功', { userId: authData.user?.id });

    // 返回成功响应
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
      }),
      {
        status: 200,
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
  } catch (error) {
    log('登录处理出错', error);
    return new Response(
      JSON.stringify({ error: '服务器错误，请稍后重试' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};