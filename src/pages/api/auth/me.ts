import type { APIRoute } from 'astro';
import { createServerClient } from '../../../utils/supabase';

// 日志记录
const log = (message: string, data?: any) => {
  console.log(`[API/auth/me] ${message}`, data || '');
};

export const GET: APIRoute = async ({ request }) => {
  try {
    log('获取用户信息请求开始');
    
    // 创建服务端Supabase客户端
    const supabase = createServerClient(request);

    // 获取当前用户
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      log('获取用户信息失败', error.message);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!user) {
      log('用户未登录');
      return new Response(
        JSON.stringify({ error: '未登录' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    log('获取用户信息成功', { userId: user.id, email: user.email });

    // 返回用户信息
    return new Response(
      JSON.stringify({
        user: {
          id: user.id,
          email: user.email,
          email_confirmed_at: user.email_confirmed_at,
          created_at: user.created_at,
          updated_at: user.updated_at,
          app_metadata: user.app_metadata,
          user_metadata: user.user_metadata,
        },
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    log('获取用户信息处理出错', error);
    return new Response(
      JSON.stringify({ error: '服务器错误，请稍后重试' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};