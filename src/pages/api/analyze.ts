import type { APIRoute } from 'astro';
import { createServerClient } from '../../utils/supabase';

// 日志记录
const log = (message: string, data?: any) => {
  console.log(`[API/analyze] ${message}`, data || '');
};

// 模拟分析函数（实际应用中应替换为真实的分析逻辑）
const performAnalysis = async (content: string): Promise<any> => {
  log('执行分析', { contentLength: content.length });
  
  // 模拟分析过程
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 返回分析结果
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
    .slice(0, 10)
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
    log('分析请求开始');
    
    // 创建服务端Supabase客户端
    const supabase = createServerClient(request);
    
    // 获取当前用户
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      log('分析失败：用户未登录');
      return new Response(
        JSON.stringify({ error: '请先登录' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    log('用户请求分析', { userId: user.id });
    
    // 获取请求数据
    const data = await request.json();
    const { content } = data;
    
    // 验证输入
    if (!content || typeof content !== 'string') {
      log('分析失败：内容为空');
      return new Response(
        JSON.stringify({ error: '请提供要分析的内容' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    if (content.length > 50000) {
      log('分析失败：内容过长');
      return new Response(
        JSON.stringify({ error: '内容过长，请限制在50000字符以内' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // 执行分析
    const result = await performAnalysis(content);
    
    // 保存分析记录到数据库
    const { data: analysis, error: insertError } = await supabase
      .from('analyses')
      .insert({
        user_id: user.id,
        content: content.substring(0, 1000), // 只保存前1000字符
        result,
      })
      .select()
      .single();
    
    if (insertError) {
      log('保存分析记录失败', insertError);
      // 即使保存失败，仍返回分析结果
    } else {
      log('分析记录已保存', { analysisId: analysis?.id });
    }
    
    // 记录历史
    await supabase
      .from('history')
      .insert({
        user_id: user.id,
        action: 'analyze',
        details: {
          analysisId: analysis?.id,
          contentLength: content.length,
          timestamp: new Date().toISOString(),
        },
      });
    
    log('分析完成');
    
    return new Response(
      JSON.stringify({
        id: analysis?.id,
        result,
        message: '分析完成',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    log('分析处理出错', error);
    return new Response(
      JSON.stringify({ error: '服务器错误，请稍后重试' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};