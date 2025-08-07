import type { APIRoute } from 'astro';
import { createServerClient } from '../../../utils/supabase';

// 日志记录
const log = (message: string, data?: any) => {
  console.log(`[API/auth/logout] ${message}`, data || '');
};

export const POST: APIRoute = async ({ request }) => {
  try {
    log('登出请求开始');
    
    // 创建服务端Supabase客户端
    const supabase = createServerClient(request);

    // 获取当前用户（用于日志）
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      log('用户登出', { userId: user.id, email: user.email });
    }

    // 执行登出
    const { error } = await supabase.auth.signOut();

    if (error) {
      log('登出失败', error.message);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    log('登出成功');

    // 创建响应并清除cookie
    const response = new Response(
      JSON.stringify({ message: '登出成功' }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    // 清除认证cookie
    response.headers.append(
      'Set-Cookie',
      'sb-access-token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
    );
    response.headers.append(
      'Set-Cookie',
      'sb-refresh-token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
    );

    return response;
  } catch (error) {
    log('登出处理出错', error);
    return new Response(
      JSON.stringify({ error: '服务器错误，请稍后重试' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};