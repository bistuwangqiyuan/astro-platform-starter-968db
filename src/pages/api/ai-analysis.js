// AI分析API端点
// 处理各种AI模型的分析请求
console.log('[api/ai-analysis.js] 初始化AI分析API');

import { aiManager, ANALYSIS_TYPES } from '../../utils/ai-clients.js';
import { TrendsAPI } from '../../utils/supabase';

export async function post({ request }) {
    console.log('[api/ai-analysis.js] 收到AI分析请求');
    
    try {
        const { text, analysisType = 'general', provider = 'auto' } = await request.json();
        
        if (!text) {
            return new Response(JSON.stringify({
                success: false,
                error: '请提供要分析的文本'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // 记录分析历史
        const trendsAPI = new TrendsAPI();
        await trendsAPI.recordAnalysis({
            type: analysisType,
            provider: provider,
            textLength: text.length
        });
        
        // 执行AI分析
        const result = await aiManager.analyze({
            text,
            type: analysisType,
            provider: provider
        });
        
        return new Response(JSON.stringify({
            success: true,
            data: result
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('[api/ai-analysis.js] 分析错误:', error);
        
        return new Response(JSON.stringify({
            success: false,
            error: error.message || '分析失败'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
