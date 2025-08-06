// 仪表板API - 获取用户统计数据
import type { APIRoute } from 'astro';
import { supabase } from '../../utils/supabase';

export const GET: APIRoute = async ({ request, locals }) => {
  console.log('[API] 开始处理仪表板数据请求');
  
  try {
    // 从中间件获取用户信息（已经过认证验证）
    const user = locals.user;
    
    if (!user) {
      console.log('[API] 获取仪表板数据失败: 用户未认证');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Unauthorized',
          message: '用户未认证'
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`[API] 获取用户仪表板数据: ${user.email}`);

    // 并行获取各项统计数据
    const [
      analysesResult,
      favoritesResult,
      userProfileResult,
      trendsResult
    ] = await Promise.all([
      getAnalysesStats(user.id),
      getFavoritesStats(user.id),
      getUserProfile(user.id),
      getAnalysesTrends(user.id)
    ]);

    // 获取热门关键词
    const hotKeywords = await getHotKeywords(user.id);

    // 获取数据源分布
    const sourceDistribution = await getSourceDistribution(user.id);

    // 构建响应数据
    const dashboardData = {
      stats: {
        totalAnalyses: analysesResult.total || 0,
        totalFavorites: favoritesResult.total || 0,
        apiUsed: userProfileResult.apiUsed || 0,
        apiLimit: userProfileResult.apiLimit || 100,
        successRate: analysesResult.successRate || 0,
        analysesGrowth: analysesResult.growth || 0,
        favoritesGrowth: favoritesResult.growth || 0
      },
      trends: trendsResult,
      sources: sourceDistribution,
      keywords: hotKeywords
    };

    console.log(`[API] 仪表板数据获取成功`, {
      userId: user.id,
      totalAnalyses: dashboardData.stats.totalAnalyses,
      totalFavorites: dashboardData.stats.totalFavorites,
      trendsCount: dashboardData.trends.length,
      keywordsCount: dashboardData.keywords.length
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: dashboardData,
        message: '仪表板数据获取成功'
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('[API] 获取仪表板数据过程出错:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: '服务器内部错误，请稍后重试',
        details: error.message
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

// 获取分析统计数据
async function getAnalysesStats(userId: string) {
  try {
    // 获取总分析次数
    const { count: total, error: countError } = await supabase
      .from('analyses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (countError) {
      console.error('[DASHBOARD] 获取分析总数失败:', countError);
      return { total: 0, successRate: 0, growth: 0 };
    }

    // 获取成功率
    const { count: successCount, error: successError } = await supabase
      .from('analyses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed');

    if (successError) {
      console.error('[DASHBOARD] 获取成功分析数失败:', successError);
    }

    const successRate = total && total > 0 ? ((successCount || 0) / total) * 100 : 0;

    // 获取本月增长
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: recentCount, error: recentError } = await supabase
      .from('analyses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (recentError) {
      console.error('[DASHBOARD] 获取最近分析数失败:', recentError);
    }

    // 简单的增长率计算（实际应该比较上个月）
    const growth = total && total > 0 ? ((recentCount || 0) / total) * 100 : 0;

    console.log(`[DASHBOARD] 分析统计: 总计${total}, 成功率${successRate.toFixed(1)}%`);

    return {
      total: total || 0,
      successRate: Math.round(successRate),
      growth: Math.round(growth)
    };

  } catch (error) {
    console.error('[DASHBOARD] 获取分析统计失败:', error);
    return { total: 0, successRate: 0, growth: 0 };
  }
}

// 获取收藏统计数据
async function getFavoritesStats(userId: string) {
  try {
    const { count: total, error: countError } = await supabase
      .from('favorites')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (countError) {
      console.error('[DASHBOARD] 获取收藏总数失败:', countError);
      return { total: 0, growth: 0 };
    }

    // 获取本月新增收藏
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: recentCount, error: recentError } = await supabase
      .from('favorites')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (recentError) {
      console.error('[DASHBOARD] 获取最近收藏数失败:', recentError);
    }

    const growth = total && total > 0 ? ((recentCount || 0) / total) * 100 : 0;

    console.log(`[DASHBOARD] 收藏统计: 总计${total}`);

    return {
      total: total || 0,
      growth: Math.round(growth)
    };

  } catch (error) {
    console.error('[DASHBOARD] 获取收藏统计失败:', error);
    return { total: 0, growth: 0 };
  }
}

// 获取用户配额信息
async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('api_quota_used, api_quota_limit')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('[DASHBOARD] 获取用户配额失败:', error);
      return { apiUsed: 0, apiLimit: 100 };
    }

    console.log(`[DASHBOARD] 用户配额: ${data.api_quota_used}/${data.api_quota_limit}`);

    return {
      apiUsed: data.api_quota_used || 0,
      apiLimit: data.api_quota_limit || 100
    };

  } catch (error) {
    console.error('[DASHBOARD] 获取用户配额失败:', error);
    return { apiUsed: 0, apiLimit: 100 };
  }
}

// 获取分析趋势数据
async function getAnalysesTrends(userId: string) {
  try {
    // 获取过去30天的数据
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabase
      .from('analyses')
      .select('created_at')
      .eq('user_id', userId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[DASHBOARD] 获取趋势数据失败:', error);
      return [];
    }

    // 按日期分组统计
    const trendsMap = new Map();
    
    if (data && data.length > 0) {
      data.forEach(item => {
        const date = new Date(item.created_at).toISOString().split('T')[0];
        trendsMap.set(date, (trendsMap.get(date) || 0) + 1);
      });
    }

    // 生成过去30天的完整数据（包括0值）
    const trends = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      trends.push({
        date: dateStr,
        count: trendsMap.get(dateStr) || 0
      });
    }

    console.log(`[DASHBOARD] 趋势数据: ${trends.length} 天`);

    return trends;

  } catch (error) {
    console.error('[DASHBOARD] 获取趋势数据失败:', error);
    return [];
  }
}

// 获取热门关键词
async function getHotKeywords(userId: string) {
  try {
    const { data, error } = await supabase
      .from('analyses')
      .select('keyword')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(100); // 获取最近100个分析

    if (error) {
      console.error('[DASHBOARD] 获取热门关键词失败:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // 统计关键词频次
    const keywordMap = new Map();
    data.forEach(item => {
      const keyword = item.keyword;
      keywordMap.set(keyword, (keywordMap.get(keyword) || 0) + 1);
    });

    // 排序并取前10个
    const hotKeywords = Array.from(keywordMap.entries())
      .map(([keyword, count]) => ({ keyword, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    console.log(`[DASHBOARD] 热门关键词: ${hotKeywords.length} 个`);

    return hotKeywords;

  } catch (error) {
    console.error('[DASHBOARD] 获取热门关键词失败:', error);
    return [];
  }
}

// 获取数据源分布
async function getSourceDistribution(userId: string) {
  try {
    const { data, error } = await supabase
      .from('analyses')
      .select('source')
      .eq('user_id', userId)
      .eq('status', 'completed');

    if (error) {
      console.error('[DASHBOARD] 获取数据源分布失败:', error);
      return {};
    }

    if (!data || data.length === 0) {
      return {};
    }

    // 统计各数据源使用次数
    const sourceMap = new Map();
    data.forEach(item => {
      const source = item.source || 'unknown';
      sourceMap.set(source, (sourceMap.get(source) || 0) + 1);
    });

    const distribution = Object.fromEntries(sourceMap);

    console.log(`[DASHBOARD] 数据源分布:`, distribution);

    return distribution;

  } catch (error) {
    console.error('[DASHBOARD] 获取数据源分布失败:', error);
    return {};
  }
}
