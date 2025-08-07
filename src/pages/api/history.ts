import type { APIRoute } from 'astro';
import { createServerClient } from '../../utils/supabase';

// 日志记录
const log = (message: string, data?: any) => {
  console.log(`[API/history] ${message}`, data || '');
};

// 操作类型映射
const actionLabels: { [key: string]: string } = {
  'analyze': '文本分析',
  'batch_analyze': '批量分析',
  'favorite_add': '添加收藏',
  'favorite_remove': '删除收藏',
  'login': '用户登录',
  'logout': '用户登出',
  'register': '账户注册',
  'password_change': '修改密码',
};

// 获取用户的历史记录
export const GET: APIRoute = async ({ request, url }) => {
  try {
    log('获取历史记录请求开始');
    
    // 创建服务端Supabase客户端
    const supabase = createServerClient(request);
    
    // 获取当前用户
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      log('获取历史记录失败：用户未登录');
      return new Response(
        JSON.stringify({ error: '请先登录' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    log('用户请求历史记录', { userId: user.id });
    
    // 获取查询参数
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const action = url.searchParams.get('action') || null;
    const startDate = url.searchParams.get('startDate') || null;
    const endDate = url.searchParams.get('endDate') || null;
    
    const offset = (page - 1) * limit;
    
    // 构建查询
    let query = supabase
      .from('history')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id);
    
    // 应用过滤条件
    if (action) {
      query = query.eq('action', action);
    }
    
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    
    if (endDate) {
      // 添加一天以包含整个结束日期
      const end = new Date(endDate);
      end.setDate(end.getDate() + 1);
      query = query.lt('created_at', end.toISOString());
    }
    
    // 获取总数
    const { count, error: countError } = await query;
    
    if (countError) {
      log('获取历史记录总数失败', countError);
      throw countError;
    }
    
    // 获取历史记录
    const { data: history, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      log('获取历史记录失败', error);
      throw error;
    }
    
    // 处理历史记录，添加可读的标签
    const processedHistory = history?.map(item => ({
      ...item,
      actionLabel: actionLabels[item.action] || item.action,
    })) || [];
    
    log('获取历史记录成功', { count: processedHistory.length });
    
    return new Response(
      JSON.stringify({
        history: processedHistory,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
        filters: {
          action,
          startDate,
          endDate,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    log('获取历史记录出错', error);
    return new Response(
      JSON.stringify({ error: '服务器错误，请稍后重试' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// 清除历史记录
export const DELETE: APIRoute = async ({ request, url }) => {
  try {
    log('清除历史记录请求开始');
    
    // 创建服务端Supabase客户端
    const supabase = createServerClient(request);
    
    // 获取当前用户
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      log('清除历史记录失败：用户未登录');
      return new Response(
        JSON.stringify({ error: '请先登录' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    log('用户请求清除历史记录', { userId: user.id });
    
    // 获取要清除的类型
    const action = url.searchParams.get('action');
    const all = url.searchParams.get('all') === 'true';
    
    if (!all && !action) {
      log('清除历史记录失败：参数无效');
      return new Response(
        JSON.stringify({ error: '请指定要清除的操作类型或选择清除全部' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // 构建删除查询
    let deleteQuery = supabase
      .from('history')
      .delete()
      .eq('user_id', user.id);
    
    if (action && !all) {
      deleteQuery = deleteQuery.eq('action', action);
      log('清除特定类型历史记录', { action });
    } else {
      log('清除所有历史记录');
    }
    
    // 执行删除
    const { error: deleteError } = await deleteQuery;
    
    if (deleteError) {
      log('清除历史记录失败', deleteError);
      throw deleteError;
    }
    
    log('清除历史记录成功');
    
    return new Response(
      JSON.stringify({ 
        message: all ? '已清除所有历史记录' : `已清除${actionLabels[action!] || action}相关的历史记录` 
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    log('清除历史记录出错', error);
    return new Response(
      JSON.stringify({ error: '服务器错误，请稍后重试' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};