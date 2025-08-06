import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

// Reason: 使用环境变量配置Supabase连接，确保敏感信息不被硬编码
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('缺少Supabase环境变量。请在.env文件中设置PUBLIC_SUPABASE_URL和PUBLIC_SUPABASE_ANON_KEY');
}

// 创建Supabase客户端实例
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

/**
 * 获取当前用户信息
 * @returns 当前认证用户或null
 */
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('获取用户信息失败:', error.message);
      return null;
    }
    return user;
  } catch (error) {
    console.error('获取用户信息时发生错误:', error);
    return null;
  }
}

/**
 * 检查用户是否已认证
 * @returns 用户认证状态
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}

/**
 * 用户登录
 * @param email 邮箱地址
 * @param password 密码
 * @returns 登录结果
 */
export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('登录失败:', error.message);
      return { success: false, error: error.message, data: null };
    }
    
    console.log('用户登录成功:', data.user?.email);
    return { success: true, error: null, data };
  } catch (error) {
    console.error('登录时发生错误:', error);
    return { success: false, error: '登录时发生未知错误', data: null };
  }
}

/**
 * 用户注册
 * @param email 邮箱地址
 * @param password 密码
 * @param metadata 额外用户信息
 * @returns 注册结果
 */
export async function signUp(email: string, password: string, metadata?: Record<string, any>) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata || {}
      }
    });
    
    if (error) {
      console.error('注册失败:', error.message);
      return { success: false, error: error.message, data: null };
    }
    
    console.log('用户注册成功:', data.user?.email);
    return { success: true, error: null, data };
  } catch (error) {
    console.error('注册时发生错误:', error);
    return { success: false, error: '注册时发生未知错误', data: null };
  }
}

/**
 * 用户登出
 * @returns 登出结果
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('登出失败:', error.message);
      return { success: false, error: error.message };
    }
    
    console.log('用户登出成功');
    return { success: true, error: null };
  } catch (error) {
    console.error('登出时发生错误:', error);
    return { success: false, error: '登出时发生未知错误' };
  }
}

/**
 * 数据库操作封装类
 */
export class DatabaseService {
  /**
   * 查询数据表
   * @param table 表名
   * @param options 查询选项
   * @returns 查询结果
   */
  static async select<T = any>(
    table: string, 
    options?: {
      columns?: string;
      filter?: Record<string, any>;
      orderBy?: { column: string; ascending?: boolean };
      limit?: number;
    }
  ): Promise<{ success: boolean; data: T[] | null; error: string | null }> {
    try {
      let query = supabase.from(table).select(options?.columns || '*');
      
      // 添加过滤条件
      if (options?.filter) {
        Object.entries(options.filter).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }
      
      // 添加排序
      if (options?.orderBy) {
        query = query.order(options.orderBy.column, { 
          ascending: options.orderBy.ascending !== false 
        });
      }
      
      // 添加限制
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error(`查询表 ${table} 失败:`, error.message);
        return { success: false, data: null, error: error.message };
      }
      
      return { success: true, data: data as T[], error: null };
    } catch (error) {
      console.error(`查询表 ${table} 时发生错误:`, error);
      return { success: false, data: null, error: '查询时发生未知错误' };
    }
  }

  /**
   * 插入数据
   * @param table 表名
   * @param data 插入的数据
   * @returns 插入结果
   */
  static async insert<T = any>(
    table: string, 
    data: Record<string, any> | Record<string, any>[]
  ): Promise<{ success: boolean; data: T[] | null; error: string | null }> {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .insert(data)
        .select();
      
      if (error) {
        console.error(`插入数据到表 ${table} 失败:`, error.message);
        return { success: false, data: null, error: error.message };
      }
      
      console.log(`成功插入数据到表 ${table}:`, result);
      return { success: true, data: result as T[], error: null };
    } catch (error) {
      console.error(`插入数据到表 ${table} 时发生错误:`, error);
      return { success: false, data: null, error: '插入时发生未知错误' };
    }
  }

  /**
   * 更新数据
   * @param table 表名
   * @param updates 更新的数据
   * @param filter 更新条件
   * @returns 更新结果
   */
  static async update<T = any>(
    table: string,
    updates: Record<string, any>,
    filter: Record<string, any>
  ): Promise<{ success: boolean; data: T[] | null; error: string | null }> {
    try {
      let query = supabase.from(table).update(updates);
      
      // 添加过滤条件
      Object.entries(filter).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
      
      const { data, error } = await query.select();
      
      if (error) {
        console.error(`更新表 ${table} 失败:`, error.message);
        return { success: false, data: null, error: error.message };
      }
      
      console.log(`成功更新表 ${table}:`, data);
      return { success: true, data: data as T[], error: null };
    } catch (error) {
      console.error(`更新表 ${table} 时发生错误:`, error);
      return { success: false, data: null, error: '更新时发生未知错误' };
    }
  }

  /**
   * 删除数据
   * @param table 表名
   * @param filter 删除条件
   * @returns 删除结果
   */
  static async delete(
    table: string,
    filter: Record<string, any>
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      let query = supabase.from(table).delete();
      
      // 添加过滤条件
      Object.entries(filter).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
      
      const { error } = await query;
      
      if (error) {
        console.error(`删除表 ${table} 数据失败:`, error.message);
        return { success: false, error: error.message };
      }
      
      console.log(`成功删除表 ${table} 数据`);
      return { success: true, error: null };
    } catch (error) {
      console.error(`删除表 ${table} 数据时发生错误:`, error);
      return { success: false, error: '删除时发生未知错误' };
    }
  }
}

export default supabase;