import type { APIRoute } from 'astro';
import { createServerClient } from '../../utils/supabase';

// 日志记录
const log = (message: string, data?: any) => {
  console.log(`[API/favorites] ${message}`, data || '');
};

// 获取用户的收藏列表
export const GET: APIRoute = async ({ request, url }) => {
  try {
    log('获取收藏列表请求开始');
    
    // 创建服务端Supabase客户端
    const supabase = createServerClient(request);
    
    // 获取当前用户
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      log('获取收藏失败：用户未登录');
      return new Response(
        JSON.stringify({ error: '请先登录' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    log('用户请求收藏列表', { userId: user.id });
    
    // 获取分页参数
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;
    
    // 获取收藏总数
    const { count, error: countError } = await supabase
      .from('favorites')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    
    if (countError) {
      log('获取收藏总数失败', countError);
      throw countError;
    }
    
    // 获取收藏列表（包含关联的分析数据）
    const { data: favorites, error } = await supabase
      .from('favorites')
      .select(`
        id,
        created_at,
        analysis:analyses (
          id,
          content,
          result,
          created_at
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      log('获取收藏列表失败', error);
      throw error;
    }
    
    log('获取收藏列表成功', { count: favorites?.length });
    
    return new Response(
      JSON.stringify({
        favorites,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    log('获取收藏列表出错', error);
    return new Response(
      JSON.stringify({ error: '服务器错误，请稍后重试' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// 添加收藏
export const POST: APIRoute = async ({ request }) => {
  try {
    log('添加收藏请求开始');
    
    // 创建服务端Supabase客户端
    const supabase = createServerClient(request);
    
    // 获取当前用户
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      log('添加收藏失败：用户未登录');
      return new Response(
        JSON.stringify({ error: '请先登录' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // 获取请求数据
    const data = await request.json();
    const { analysisId } = data;
    
    if (!analysisId) {
      log('添加收藏失败：缺少分析ID');
      return new Response(
        JSON.stringify({ error: '请提供要收藏的分析ID' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    log('用户添加收藏', { userId: user.id, analysisId });
    
    // 检查分析是否存在且属于当前用户
    const { data: analysis, error: analysisError } = await supabase
      .from('analyses')
      .select('id, user_id')
      .eq('id', analysisId)
      .single();
    
    if (analysisError || !analysis) {
      log('添加收藏失败：分析不存在');
      return new Response(
        JSON.stringify({ error: '分析不存在' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    if (analysis.user_id !== user.id) {
      log('添加收藏失败：无权限');
      return new Response(
        JSON.stringify({ error: '您无权收藏此分析' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // 检查是否已收藏
    const { data: existing, error: existingError } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('analysis_id', analysisId)
      .single();
    
    if (existing) {
      log('添加收藏失败：已存在');
      return new Response(
        JSON.stringify({ error: '该分析已被收藏' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // 添加收藏
    const { data: favorite, error: insertError } = await supabase
      .from('favorites')
      .insert({
        user_id: user.id,
        analysis_id: analysisId,
      })
      .select()
      .single();
    
    if (insertError) {
      log('添加收藏失败', insertError);
      throw insertError;
    }
    
    // 记录历史
    await supabase
      .from('history')
      .insert({
        user_id: user.id,
        action: 'favorite_add',
        details: {
          favoriteId: favorite.id,
          analysisId,
          timestamp: new Date().toISOString(),
        },
      });
    
    log('添加收藏成功', { favoriteId: favorite.id });
    
    return new Response(
      JSON.stringify({
        favorite,
        message: '收藏成功',
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    log('添加收藏出错', error);
    return new Response(
      JSON.stringify({ error: '服务器错误，请稍后重试' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// 删除收藏
export const DELETE: APIRoute = async ({ request, url }) => {
  try {
    log('删除收藏请求开始');
    
    // 创建服务端Supabase客户端
    const supabase = createServerClient(request);
    
    // 获取当前用户
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      log('删除收藏失败：用户未登录');
      return new Response(
        JSON.stringify({ error: '请先登录' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // 获取要删除的收藏ID
    const favoriteId = url.searchParams.get('id');
    
    if (!favoriteId) {
      log('删除收藏失败：缺少收藏ID');
      return new Response(
        JSON.stringify({ error: '请提供要删除的收藏ID' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    log('用户删除收藏', { userId: user.id, favoriteId });
    
    // 检查收藏是否存在且属于当前用户
    const { data: favorite, error: fetchError } = await supabase
      .from('favorites')
      .select('id, analysis_id')
      .eq('id', favoriteId)
      .eq('user_id', user.id)
      .single();
    
    if (fetchError || !favorite) {
      log('删除收藏失败：收藏不存在或无权限');
      return new Response(
        JSON.stringify({ error: '收藏不存在或您无权删除' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // 删除收藏
    const { error: deleteError } = await supabase
      .from('favorites')
      .delete()
      .eq('id', favoriteId)
      .eq('user_id', user.id);
    
    if (deleteError) {
      log('删除收藏失败', deleteError);
      throw deleteError;
    }
    
    // 记录历史
    await supabase
      .from('history')
      .insert({
        user_id: user.id,
        action: 'favorite_remove',
        details: {
          favoriteId,
          analysisId: favorite.analysis_id,
          timestamp: new Date().toISOString(),
        },
      });
    
    log('删除收藏成功');
    
    return new Response(
      JSON.stringify({ message: '删除成功' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    log('删除收藏出错', error);
    return new Response(
      JSON.stringify({ error: '服务器错误，请稍后重试' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};