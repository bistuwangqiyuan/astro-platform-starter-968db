import type { APIRoute } from 'astro';
import { createServerClient } from '../../../utils/supabase';

// 日志记录
const log = (message: string, data?: any) => {
  console.log(`[API/auth/change-password] ${message}`, data || '');
};

export const POST: APIRoute = async ({ request }) => {
  try {
    log('修改密码请求开始');
    
    // 创建服务端Supabase客户端
    const supabase = createServerClient(request);

    // 检查用户是否已登录
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      log('修改密码失败：用户未登录');
      return new Response(
        JSON.stringify({ error: '请先登录' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    log('用户请求修改密码', { userId: user.id, email: user.email });

    // 获取请求数据
    const data = await request.json();
    const { currentPassword, newPassword, confirmPassword } = data;

    // 验证输入
    if (!currentPassword || !newPassword) {
      log('修改密码失败：缺少必要参数');
      return new Response(
        JSON.stringify({ error: '当前密码和新密码不能为空' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 验证新密码长度
    if (newPassword.length < 6) {
      log('修改密码失败：新密码太短');
      return new Response(
        JSON.stringify({ error: '新密码至少需要6个字符' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 验证密码确认
    if (confirmPassword && newPassword !== confirmPassword) {
      log('修改密码失败：密码不匹配');
      return new Response(
        JSON.stringify({ error: '两次输入的新密码不一致' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 验证当前密码是否正确
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword,
    });

    if (signInError) {
      log('修改密码失败：当前密码错误');
      return new Response(
        JSON.stringify({ error: '当前密码不正确' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 执行密码修改
    const { data: updateData, error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      log('修改密码失败', updateError.message);
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    log('修改密码成功', { userId: user.id });

    // 返回成功响应
    return new Response(
      JSON.stringify({
        message: '密码修改成功',
        user: {
          id: updateData.user?.id,
          email: updateData.user?.email,
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
    log('修改密码处理出错', error);
    return new Response(
      JSON.stringify({ error: '服务器错误，请稍后重试' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};