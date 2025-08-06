import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

// Supabase配置
const supabaseUrl = import.meta.env.SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY || import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

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