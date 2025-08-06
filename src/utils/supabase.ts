import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

// Reason: 从环境变量获取Supabase配置，确保应用安全性
const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('缺少Supabase环境变量配置。请检查SUPABASE_URL和SUPABASE_ANON_KEY是否正确设置。');
}

// Reason: 创建类型安全的Supabase客户端实例
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true, // 自动刷新token
    persistSession: true,   // 持久化会话
    detectSessionInUrl: true // 检测URL中的会话信息
  }
});

// Reason: 用于服务端的Supabase客户端，可以传入自定义的访问token
export const createServerSupabaseClient = (accessToken?: string) => {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    },
    global: {
      headers: accessToken ? {
        Authorization: `Bearer ${accessToken}`
      } : {}
    }
  });
};

// Reason: 常用的数据库操作辅助函数
export const dbHelpers = {
  // 用户相关操作
  users: {
    async getById(id: string) {
      console.log(`[DB] 获取用户信息: ${id}`);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('[DB] 获取用户失败:', error);
        throw error;
      }
      
      console.log('[DB] 用户信息获取成功');
      return data;
    },
    
    async upsert(user: Database['public']['Tables']['users']['Insert']) {
      console.log(`[DB] 更新/插入用户: ${user.email}`);
      const { data, error } = await supabase
        .from('users')
        .upsert(user, { onConflict: 'id' })
        .select()
        .single();
      
      if (error) {
        console.error('[DB] 用户更新失败:', error);
        throw error;
      }
      
      console.log('[DB] 用户更新成功');
      return data;
    }
  },

  // 分析数据相关操作
  analysis: {
    async create(analysis: Database['public']['Tables']['analysis_data']['Insert']) {
      console.log(`[DB] 创建分析数据: ${analysis.title}`);
      const { data, error } = await supabase
        .from('analysis_data')
        .insert(analysis)
        .select()
        .single();
      
      if (error) {
        console.error('[DB] 创建分析失败:', error);
        throw error;
      }
      
      console.log('[DB] 分析数据创建成功');
      return data;
    },
    
    async getByUserId(userId: string, limit = 10, offset = 0) {
      console.log(`[DB] 获取用户分析列表: ${userId}`);
      const { data, error } = await supabase
        .from('analysis_data')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (error) {
        console.error('[DB] 获取分析列表失败:', error);
        throw error;
      }
      
      console.log(`[DB] 获取到 ${data?.length || 0} 条分析记录`);
      return data || [];
    },
    
    async getById(id: string) {
      console.log(`[DB] 获取分析详情: ${id}`);
      const { data, error } = await supabase
        .from('analysis_data')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('[DB] 获取分析详情失败:', error);
        throw error;
      }
      
      console.log('[DB] 分析详情获取成功');
      return data;
    }
  },

  // 收藏相关操作
  favorites: {
    async add(userId: string, analysisId: string) {
      console.log(`[DB] 添加收藏: ${analysisId}`);
      const { data, error } = await supabase
        .from('favorites')
        .insert({ user_id: userId, analysis_id: analysisId })
        .select()
        .single();
      
      if (error) {
        console.error('[DB] 添加收藏失败:', error);
        throw error;
      }
      
      console.log('[DB] 收藏添加成功');
      return data;
    },
    
    async remove(userId: string, analysisId: string) {
      console.log(`[DB] 移除收藏: ${analysisId}`);
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('analysis_id', analysisId);
      
      if (error) {
        console.error('[DB] 移除收藏失败:', error);
        throw error;
      }
      
      console.log('[DB] 收藏移除成功');
    },
    
    async getByUserId(userId: string) {
      console.log(`[DB] 获取用户收藏列表: ${userId}`);
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          *,
          analysis_data(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('[DB] 获取收藏列表失败:', error);
        throw error;
      }
      
      console.log(`[DB] 获取到 ${data?.length || 0} 条收藏记录`);
      return data || [];
    }
  },

  // 历史记录相关操作
  history: {
    async add(userId: string, action: string, details: any) {
      console.log(`[DB] 添加历史记录: ${action}`);
      const { data, error } = await supabase
        .from('history')
        .insert({ 
          user_id: userId, 
          action, 
          details: details || {} 
        })
        .select()
        .single();
      
      if (error) {
        console.error('[DB] 添加历史记录失败:', error);
        throw error;
      }
      
      console.log('[DB] 历史记录添加成功');
      return data;
    },
    
    async getByUserId(userId: string, limit = 20, offset = 0) {
      console.log(`[DB] 获取用户历史记录: ${userId}`);
      const { data, error } = await supabase
        .from('history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (error) {
        console.error('[DB] 获取历史记录失败:', error);
        throw error;
      }
      
      console.log(`[DB] 获取到 ${data?.length || 0} 条历史记录`);
      return data || [];
    }
  }
};