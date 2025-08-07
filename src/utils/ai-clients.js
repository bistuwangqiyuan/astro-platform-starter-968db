// AI客户端管理器
// 统一管理各种AI服务提供商的客户端

console.log('[utils/ai-clients.js] 初始化AI客户端管理器');

// 分析类型常量
export const ANALYSIS_TYPES = {
    GENERAL: 'general',
    SENTIMENT: 'sentiment',
    SUMMARY: 'summary',
    KEYWORDS: 'keywords',
    TRANSLATION: 'translation',
    CODE_REVIEW: 'code_review'
};

// AI提供商配置
const AI_PROVIDERS = {
    anthropic: {
        name: 'Anthropic Claude',
        apiKey: import.meta.env.ANTHROPIC_API_KEY,
        endpoint: 'https://api.anthropic.com/v1/messages',
        model: 'claude-3-sonnet-20240229'
    },
    deepseek: {
        name: 'DeepSeek',
        apiKey: import.meta.env.DEEPSEEK_API_KEY,
        endpoint: 'https://api.deepseek.com/v1/chat/completions',
        model: 'deepseek-chat'
    },
    moonshot: {
        name: 'Moonshot',
        apiKey: import.meta.env.MOONSHOT_API_KEY,
        endpoint: 'https://api.moonshot.cn/v1/chat/completions',
        model: 'moonshot-v1-8k'
    }
};

// AI管理器类
class AIManager {
    constructor() {
        this.providers = AI_PROVIDERS;
        this.defaultProvider = 'anthropic';
    }
    
    // 获取可用的提供商
    getAvailableProviders() {
        return Object.entries(this.providers)
            .filter(([_, config]) => config.apiKey)
            .map(([key, config]) => ({
                key,
                name: config.name
            }));
    }
    
    // 分析文本
    async analyze({ text, type = ANALYSIS_TYPES.GENERAL, provider = 'auto' }) {
        console.log(`[AIManager] 开始分析: type=${type}, provider=${provider}`);
        
        // 如果是auto，选择第一个可用的提供商
        if (provider === 'auto') {
            const available = this.getAvailableProviders();
            if (available.length === 0) {
                throw new Error('没有配置可用的AI提供商');
            }
            provider = available[0].key;
        }
        
        const providerConfig = this.providers[provider];
        if (!providerConfig) {
            throw new Error(`未知的AI提供商: ${provider}`);
        }
        
        if (!providerConfig.apiKey) {
            throw new Error(`AI提供商 ${provider} 未配置API密钥`);
        }
        
        // 根据分析类型构建提示词
        const prompt = this.buildPrompt(text, type);
        
        try {
            // 调用具体的API
            let result;
            switch (provider) {
                case 'anthropic':
                    result = await this.callAnthropic(providerConfig, prompt);
                    break;
                case 'deepseek':
                case 'moonshot':
                    result = await this.callOpenAICompatible(providerConfig, prompt);
                    break;
                default:
                    throw new Error(`不支持的提供商: ${provider}`);
            }
            
            return {
                provider: providerConfig.name,
                type,
                result,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error(`[AIManager] 分析失败:`, error);
            throw error;
        }
    }
    
    // 构建提示词
    buildPrompt(text, type) {
        const prompts = {
            [ANALYSIS_TYPES.GENERAL]: `请分析以下文本的主要内容和要点：\n\n${text}`,
            [ANALYSIS_TYPES.SENTIMENT]: `请分析以下文本的情感倾向（正面/负面/中性）：\n\n${text}`,
            [ANALYSIS_TYPES.SUMMARY]: `请为以下文本生成简洁的摘要：\n\n${text}`,
            [ANALYSIS_TYPES.KEYWORDS]: `请提取以下文本的关键词（最多10个）：\n\n${text}`,
            [ANALYSIS_TYPES.TRANSLATION]: `请将以下文本翻译成英文：\n\n${text}`,
            [ANALYSIS_TYPES.CODE_REVIEW]: `请审查以下代码，指出潜在问题和改进建议：\n\n${text}`
        };
        
        return prompts[type] || prompts[ANALYSIS_TYPES.GENERAL];
    }
    
    // 调用Anthropic API
    async callAnthropic(config, prompt) {
        const response = await fetch(config.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': config.apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: config.model,
                messages: [{
                    role: 'user',
                    content: prompt
                }],
                max_tokens: 1000
            })
        });
        
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Anthropic API错误: ${error}`);
        }
        
        const data = await response.json();
        return data.content[0].text;
    }
    
    // 调用OpenAI兼容API
    async callOpenAICompatible(config, prompt) {
        const response = await fetch(config.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`
            },
            body: JSON.stringify({
                model: config.model,
                messages: [{
                    role: 'user',
                    content: prompt
                }],
                max_tokens: 1000
            })
        });
        
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`${config.name} API错误: ${error}`);
        }
        
        const data = await response.json();
        return data.choices[0].message.content;
    }
}

// 创建全局实例
export const aiManager = new AIManager();

// 导出用于调试
if (import.meta.env.DEV) {
    window.aiManager = aiManager;
    console.log('[utils/ai-clients.js] AI管理器已导出到 window.aiManager');
}
