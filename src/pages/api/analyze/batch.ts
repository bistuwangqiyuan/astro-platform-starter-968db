import type { APIRoute } from 'astro';
import { createServerClient } from '../../../utils/supabase';

// 日志记录
const log = (message: string, data?: any) => {
  console.log(`[API/analyze/batch] ${message}`, data || '');
};

// 复用单个分析的逻辑
const performAnalysis = async (content: string): Promise<any> => {
  log('执行批量中的单个分析', { contentLength: content.length });
  
  // 模拟分析过程
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const words = content.trim().split(/\s+/).length;
  const characters = content.length;
  const sentences = content.split(/[.!?]+/).filter(s => s.trim()).length;
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim()).length;
  
  return {
    summary: `文本包含 ${words} 个词，${sentences} 个句子，${paragraphs} 个段落。`,
    statistics: {
      words,
      characters,
      charactersWithoutSpaces: content.replace(/\s/g, '').length,
      sentences,
      paragraphs,
      averageWordLength: characters / words,
      averageSentenceLength: words / sentences,
    },
    keywords: extractKeywords(content),
    sentiment: analyzeSentiment(content),
    readability: calculateReadability(words, sentences),
    processedAt: new Date().toISOString(),
  };
};

// 提取关键词
const extractKeywords = (content: string): string[] => {
  const words = content.toLowerCase().match(/\b[a-zA-Z\u4e00-\u9fa5]+\b/g) || [];
  const wordCount: { [key: string]: number } = {};
  
  words.forEach(word => {
    if (word.length > 3) {
      wordCount[word] = (wordCount[word] || 0) + 1;
    }
  });
  
  return Object.entries(wordCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5) // 批量分析时减少关键词数量
    .map(([word]) => word);
};

// 情感分析
const analyzeSentiment = (content: string): string => {
  const positiveWords = ['好', '优秀', '喜欢', '成功', '快乐', 'good', 'great', 'excellent', 'happy', 'success'];
  const negativeWords = ['坏', '差', '失败', '难过', '糟糕', 'bad', 'poor', 'fail', 'sad', 'terrible'];
  
  const words = content.toLowerCase().split(/\s+/);
  let positiveCount = 0;
  let negativeCount = 0;
  
  words.forEach(word => {
    if (positiveWords.some(pw => word.includes(pw))) positiveCount++;
    if (negativeWords.some(nw => word.includes(nw))) negativeCount++;
  });
  
  if (positiveCount > negativeCount) return '积极';
  if (negativeCount > positiveCount) return '消极';
  return '中性';
};

// 计算可读性
const calculateReadability = (words: number, sentences: number): string => {
  const avgWordsPerSentence = words / sentences;
  
  if (avgWordsPerSentence < 10) return '非常容易';
  if (avgWordsPerSentence < 15) return '容易';
  if (avgWordsPerSentence < 20) return '中等';
  if (avgWordsPerSentence < 25) return '困难';
  return '非常困难';
};

export const POST: APIRoute = async ({ request }) => {
  try {
    log('批量分析请求开始');
    
    // 创建服务端Supabase客户端
    const supabase = createServerClient(request);
    
    // 获取当前用户
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      log('批量分析失败：用户未登录');
      return new Response(
        JSON.stringify({ error: '请先登录' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    log('用户请求批量分析', { userId: user.id });
    
    // 获取请求数据
    const data = await request.json();
    const { contents } = data;
    
    // 验证输入
    if (!Array.isArray(contents) || contents.length === 0) {
      log('批量分析失败：内容为空');
      return new Response(
        JSON.stringify({ error: '请提供要分析的内容数组' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    if (contents.length > 10) {
      log('批量分析失败：数量过多');
      return new Response(
        JSON.stringify({ error: '批量分析最多支持10个文本' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // 验证每个内容
    for (let i = 0; i < contents.length; i++) {
      if (!contents[i] || typeof contents[i] !== 'string') {
        return new Response(
          JSON.stringify({ error: `第${i + 1}个内容无效` }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (contents[i].length > 10000) {
        return new Response(
          JSON.stringify({ error: `第${i + 1}个内容过长，批量分析每个文本限制在10000字符以内` }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
    
    log('开始执行批量分析', { count: contents.length });
    
    // 执行批量分析
    const results = await Promise.all(
      contents.map(async (content, index) => {
        try {
          const result = await performAnalysis(content);
          
          // 保存每个分析记录
          const { data: analysis, error: insertError } = await supabase
            .from('analyses')
            .insert({
              user_id: user.id,
              content: content.substring(0, 1000),
              result,
            })
            .select()
            .single();
          
          if (insertError) {
            log(`保存第${index + 1}个分析记录失败`, insertError);
          }
          
          return {
            index,
            id: analysis?.id,
            success: true,
            result,
          };
        } catch (error) {
          log(`第${index + 1}个分析失败`, error);
          return {
            index,
            success: false,
            error: '分析失败',
          };
        }
      })
    );
    
    // 记录批量分析历史
    await supabase
      .from('history')
      .insert({
        user_id: user.id,
        action: 'batch_analyze',
        details: {
          count: contents.length,
          successCount: results.filter(r => r.success).length,
          timestamp: new Date().toISOString(),
        },
      });
    
    log('批量分析完成', {
      total: contents.length,
      success: results.filter(r => r.success).length,
    });
    
    return new Response(
      JSON.stringify({
        results,
        summary: {
          total: contents.length,
          success: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length,
        },
        message: '批量分析完成',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    log('批量分析处理出错', error);
    return new Response(
      JSON.stringify({ error: '服务器错误，请稍后重试' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};