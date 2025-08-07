import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

// Supabase配置
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
}

// 创建Supabase客户端
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    }
});

// 用户认证工具函数
export const auth = {
    // 登录
    async signIn(email: string, password: string) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        return { data, error };
    },

    // 注册
    async signUp(email: string, password: string, metadata?: Record<string, any>) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: metadata
            }
        });
        return { data, error };
    },

    // 登出
    async signOut() {
        const { error } = await supabase.auth.signOut();
        return { error };
    },

    // 获取当前用户
    async getCurrentUser() {
        const { data: { user }, error } = await supabase.auth.getUser();
        return { user, error };
    },

    // 更新密码
    async updatePassword(password: string) {
        const { data, error } = await supabase.auth.updateUser({
            password
        });
        return { data, error };
    }
};

// 数据库操作工具函数
export const db = {
    // 分析数据操作
    analyses: {
        async create(data: any) {
            const { data: result, error } = await supabase
                .from('analyses')
                .insert(data)
                .select()
                .single();
            return { data: result, error };
        },

        async getAll(userId?: string) {
            let query = supabase.from('analyses').select('*');
            if (userId) {
                query = query.eq('user_id', userId);
            }
            const { data, error } = await query.order('created_at', { ascending: false });
            return { data, error };
        },

        async getById(id: string) {
            const { data, error } = await supabase
                .from('analyses')
                .select('*')
                .eq('id', id)
                .single();
            return { data, error };
        },

        async update(id: string, updates: any) {
            const { data, error } = await supabase
                .from('analyses')
                .update(updates)
                .eq('id', id)
                .select()
                .single();
            return { data, error };
        },

        async delete(id: string) {
            const { error } = await supabase
                .from('analyses')
                .delete()
                .eq('id', id);
            return { error };
        }
    },

    // 收藏操作
    favorites: {
        async add(userId: string, itemId: string, itemType: string) {
            const { data, error } = await supabase
                .from('favorites')
                .insert({ user_id: userId, item_id: itemId, item_type: itemType })
                .select()
                .single();
            return { data, error };
        },

        async remove(userId: string, itemId: string) {
            const { error } = await supabase
                .from('favorites')
                .delete()
                .eq('user_id', userId)
                .eq('item_id', itemId);
            return { error };
        },

        async getByUser(userId: string) {
            const { data, error } = await supabase
                .from('favorites')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });
            return { data, error };
        },

        async checkExists(userId: string, itemId: string) {
            const { data, error } = await supabase
                .from('favorites')
                .select('id')
                .eq('user_id', userId)
                .eq('item_id', itemId)
                .single();
            return { exists: !!data, error };
        }
    },

    // 历史记录操作
    history: {
        async add(userId: string, action: string, details: any) {
            const { data, error } = await supabase
                .from('history')
                .insert({
                    user_id: userId,
                    action,
                    details,
                    created_at: new Date().toISOString()
                })
                .select()
                .single();
            return { data, error };
        },

        async getByUser(userId: string, limit = 50) {
            const { data, error } = await supabase
                .from('history')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(limit);
            return { data, error };
        },

        async deleteOld(userId: string, daysOld = 30) {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);
            
            const { error } = await supabase
                .from('history')
                .delete()
                .eq('user_id', userId)
                .lt('created_at', cutoffDate.toISOString());
            return { error };
        }
    }
};

// 实时订阅工具
export const realtime = {
    // 订阅表格变化
    subscribeToTable(table: string, callback: (payload: any) => void) {
        return supabase
            .channel(`${table}_changes`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table
            }, callback)
            .subscribe();
    },

    // 取消订阅
    unsubscribe(subscription: any) {
        return supabase.removeChannel(subscription);
    }
};

// 趋势分析API
export class TrendsAPI {
    // 记录分析
    async recordAnalysis(data: {
        type: string;
        provider: string;
        textLength: number;
    }) {
        try {
            const { data: user } = await supabase.auth.getUser();
            const userId = user?.user?.id;
            
            const { error } = await supabase
                .from('analysis_trends')
                .insert({
                    user_id: userId,
                    analysis_type: data.type,
                    provider: data.provider,
                    text_length: data.textLength,
                    created_at: new Date().toISOString()
                });
                
            if (error) {
                console.error('[TrendsAPI] 记录分析失败:', error);
            }
        } catch (error) {
            console.error('[TrendsAPI] 记录分析错误:', error);
        }
    }
    
    // 获取趋势数据
    async getTrends(userId?: string, days = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        let query = supabase
            .from('analysis_trends')
            .select('*')
            .gte('created_at', startDate.toISOString())
            .order('created_at', { ascending: false });
            
        if (userId) {
            query = query.eq('user_id', userId);
        }
        
        const { data, error } = await query;
        return { data, error };
    }
    
    // 获取统计数据
    async getStatistics(userId?: string) {
        let query = supabase.from('analysis_trends').select('analysis_type, provider');
        
        if (userId) {
            query = query.eq('user_id', userId);
        }
        
        const { data, error } = await query;
        
        if (error || !data) {
            return { data: null, error };
        }
        
        // 计算统计
        const stats = {
            totalAnalyses: data.length,
            byType: {} as Record<string, number>,
            byProvider: {} as Record<string, number>
        };
        
        data.forEach((item) => {
            // 按类型统计
            stats.byType[item.analysis_type] = (stats.byType[item.analysis_type] || 0) + 1;
            // 按提供商统计
            stats.byProvider[item.provider] = (stats.byProvider[item.provider] || 0) + 1;
        });
        
        return { data: stats, error: null };
    }
}