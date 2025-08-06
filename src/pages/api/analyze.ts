import type { APIRoute } from 'astro';
import { getCurrentUser, DatabaseService } from '../../utils/supabase';
import type { AnalysisRequest, ApiResponse, AnalysisResult } from '../../types/supabase';

export const prerender = false;

/**
 * 统计分析处理器
 */
function performStatisticalAnalysis(data: Record<string, any>): { summary: string; insights: string[] } {
  console.log('执行统计分析:', { dataKeys: Object.keys(data) });
  
  const insights: string[] = [];
  let summary = '';
  
  try {
    // Reason: 处理数值数据的统计分析
    const numericData = Object.entries(data)
      .filter(([_, value]) => typeof value === 'number' || (Array.isArray(value) && value.every(v => typeof v === 'number')))
      .map(([key, value]) => ({ key, value: Array.isArray(value) ? value : [value] }));
    
    if (numericData.length > 0) {
      summary = `统计分析完成，共分析 ${numericData.length} 个数值字段`;
      
      numericData.forEach(({ key, value }) => {
        const flatValues = value.flat();
        const sum = flatValues.reduce((a, b) => a + b, 0);
        const avg = sum / flatValues.length;
        const max = Math.max(...flatValues);
        const min = Math.min(...flatValues);
        
        insights.push(`${key}: 平均值 ${avg.toFixed(2)}, 最大值 ${max}, 最小值 ${min}, 总计 ${sum}`);
      });
      
      if (numericData.length > 1) {
        insights.push('建议：比较不同指标的相关性以发现潜在模式');
      }
    } else {
      summary = '未发现可统计的数值数据';
      insights.push('建议：确保数据包含数值字段以进行统计分析');
    }
  } catch (error) {
    console.error('统计分析发生错误:', error);
    summary = '统计分析过程中发生错误';
    insights.push('错误：无法完成统计分析，请检查数据格式');
  }
  
  return { summary, insights };
}

/**
 * 趋势分析处理器
 */
function performTrendAnalysis(data: Record<string, any>): { summary: string; insights: string[] } {
  console.log('执行趋势分析:', { dataKeys: Object.keys(data) });
  
  const insights: string[] = [];
  let summary = '';
  
  try {
    // Reason: 识别时间序列数据进行趋势分析
    const timeSeriesData = Object.entries(data)
      .filter(([_, value]) => Array.isArray(value) && value.length > 1)
      .map(([key, value]) => ({ key, value }));
    
    if (timeSeriesData.length > 0) {
      summary = `趋势分析完成，共分析 ${timeSeriesData.length} 个时间序列`;
      
      timeSeriesData.forEach(({ key, value }) => {
        if (value.every(v => typeof v === 'number')) {
          const firstHalf = value.slice(0, Math.floor(value.length / 2));
          const secondHalf = value.slice(Math.floor(value.length / 2));
          
          const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
          const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
          
          const trend = secondAvg > firstAvg ? '上升' : secondAvg < firstAvg ? '下降' : '平稳';
          const change = Math.abs(secondAvg - firstAvg);
          const changePercent = ((change / firstAvg) * 100).toFixed(1);
          
          insights.push(`${key}: 呈现${trend}趋势，变化幅度 ${changePercent}%`);
        }
      });
      
      insights.push('建议：关注趋势变化的关键时间点，分析影响因素');
    } else {
      summary = '未发现适合趋势分析的时间序列数据';
      insights.push('建议：提供包含时间序列的数组数据以进行趋势分析');
    }
  } catch (error) {
    console.error('趋势分析发生错误:', error);
    summary = '趋势分析过程中发生错误';
    insights.push('错误：无法完成趋势分析，请检查数据格式');
  }
  
  return { summary, insights };
}

/**
 * 对比分析处理器
 */
function performComparisonAnalysis(data: Record<string, any>): { summary: string; insights: string[] } {
  console.log('执行对比分析:', { dataKeys: Object.keys(data) });
  
  const insights: string[] = [];
  let summary = '';
  
  try {
    const entries = Object.entries(data);
    
    if (entries.length >= 2) {
      summary = `对比分析完成，比较了 ${entries.length} 个数据项`;
      
      // Reason: 比较数值类型的数据项
      const numericEntries = entries.filter(([_, value]) => typeof value === 'number');
      
      if (numericEntries.length >= 2) {
        const sorted = numericEntries.sort(([_, a], [__, b]) => b - a);
        const highest = sorted[0];
        const lowest = sorted[sorted.length - 1];
        
        insights.push(`最高值: ${highest[0]} (${highest[1]})`);
        insights.push(`最低值: ${lowest[0]} (${lowest[1]})`);
        insights.push(`差异倍数: ${(highest[1] / lowest[1]).toFixed(1)}倍`);
        
        if (sorted.length > 2) {
          const median = sorted[Math.floor(sorted.length / 2)];
          insights.push(`中位数: ${median[0]} (${median[1]})`);
        }
      }
      
      // 比较数组长度
      const arrayEntries = entries.filter(([_, value]) => Array.isArray(value));
      if (arrayEntries.length >= 2) {
        const lengthComparison = arrayEntries.map(([key, value]) => ({ key, length: value.length }))
          .sort((a, b) => b.length - a.length);
        
        insights.push(`数据量最多: ${lengthComparison[0].key} (${lengthComparison[0].length} 项)`);
        insights.push(`数据量最少: ${lengthComparison[lengthComparison.length - 1].key} (${lengthComparison[lengthComparison.length - 1].length} 项)`);
      }
    } else {
      summary = '数据项不足，无法进行有效对比';
      insights.push('建议：提供至少2个数据项以进行对比分析');
    }
  } catch (error) {
    console.error('对比分析发生错误:', error);
    summary = '对比分析过程中发生错误';
    insights.push('错误：无法完成对比分析，请检查数据格式');
  }
  
  return { summary, insights };
}

export const POST: APIRoute = async ({ request }) => {
  try {
    console.log('处理数据分析请求');
    
    // 验证用户认证
    const user = await getCurrentUser();
    if (!user) {
      console.error('分析请求失败: 用户未认证');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: '请先登录后再进行数据分析' 
        } as ApiResponse),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
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

    const body = await request.json() as AnalysisRequest;
    
    // 输入验证
    if (!body.title || !body.data || !body.analysisType) {
      console.error('分析请求失败: 缺少必需字段', { 
        title: !!body.title, 
        data: !!body.data, 
        analysisType: !!body.analysisType 
      });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: '标题、数据和分析类型不能为空' 
        } as ApiResponse),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // 验证分析类型
    const validTypes = ['statistical', 'trend', 'comparison', 'other'];
    if (!validTypes.includes(body.analysisType)) {
      console.error('分析请求失败: 无效的分析类型', { analysisType: body.analysisType });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: '无效的分析类型' 
        } as ApiResponse),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // 验证数据不为空
    if (typeof body.data !== 'object' || Object.keys(body.data).length === 0) {
      console.error('分析请求失败: 数据为空或格式无效');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: '分析数据不能为空' 
        } as ApiResponse),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    console.log('开始数据分析:', { 
      userId: user.id, 
      title: body.title, 
      analysisType: body.analysisType,
      dataKeys: Object.keys(body.data)
    });
    
    // 根据分析类型执行相应的分析
    let analysisResult: { summary: string; insights: string[] };
    
    switch (body.analysisType) {
      case 'statistical':
        analysisResult = performStatisticalAnalysis(body.data);
        break;
      case 'trend':
        analysisResult = performTrendAnalysis(body.data);
        break;
      case 'comparison':
        analysisResult = performComparisonAnalysis(body.data);
        break;
      default:
        analysisResult = {
          summary: '通用分析完成',
          insights: [
            `数据包含 ${Object.keys(body.data).length} 个字段`,
            '建议：选择更具体的分析类型以获得深入洞察'
          ]
        };
    }
    
    // 保存分析结果到数据库
    const saveResult = await DatabaseService.insert('analysis_data', {
      user_id: user.id,
      title: body.title,
      description: body.description || null,
      data: body.data,
      analysis_type: body.analysisType,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    if (!saveResult.success) {
      console.error('保存分析结果失败:', saveResult.error);
      // Reason: 即使保存失败也返回分析结果，但记录错误
    }
    
    const result: AnalysisResult = {
      id: saveResult.data?.[0]?.id || `temp-${Date.now()}`,
      summary: analysisResult.summary,
      insights: analysisResult.insights,
      visualizations: [
        {
          type: 'table',
          data: {
            headers: Object.keys(body.data),
            rows: [Object.values(body.data)]
          }
        }
      ],
      createdAt: new Date().toISOString()
    };
    
    console.log('数据分析完成:', { 
      resultId: result.id, 
      insightsCount: result.insights.length,
      saved: saveResult.success 
    });
    
    return new Response(
      JSON.stringify({ 
        success: true,
        data: result,
        message: '数据分析完成'
      } as ApiResponse),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error('数据分析API发生未知错误:', error);
    
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

export const GET: APIRoute = async ({ request, url }) => {
  try {
    console.log('获取用户分析历史');
    
    // 验证用户认证
    const user = await getCurrentUser();
    if (!user) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: '请先登录后再查看分析历史' 
        } as ApiResponse),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    const searchParams = new URL(url).searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');
    const analysisType = searchParams.get('type');
    
    const queryOptions: any = {
      filter: { user_id: user.id },
      orderBy: { column: 'created_at', ascending: false },
      limit: Math.min(limit, 50) // 最多50条
    };
    
    if (analysisType) {
      queryOptions.filter.analysis_type = analysisType;
    }
    
    const result = await DatabaseService.select('analysis_data', queryOptions);
    
    if (result.success) {
      console.log('成功获取分析历史:', { count: result.data?.length });
      
      return new Response(
        JSON.stringify({ 
          success: true,
          data: result.data,
          message: '成功获取分析历史'
        } as ApiResponse),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } else {
      console.error('获取分析历史失败:', result.error);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: result.error || '获取分析历史失败' 
        } as ApiResponse),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
  } catch (error) {
    console.error('获取分析历史API发生错误:', error);
    
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