import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

// 从环境变量获取配置
const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

// 日志记录函数
const log = (message: string, data?: any) => {
  console.log(`[Supabase] ${message}`, data || '');
};

// 验证环境变量
if (!supabaseUrl || !supabaseAnonKey) {
  const error = 'Missing Supabase environment variables';
  log('Error:', error);
  throw new Error(error);
}

// 创建用于客户端的Supabase实例（使用anon key）
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// 创建用于服务端的Supabase实例（使用service role key）
export const supabaseAdmin = supabaseServiceRoleKey
  ? createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

// 辅助函数：获取当前用户
export const getCurrentUser = async () => {
  try {
    log('获取当前用户');
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      log('获取用户失败:', error);
      throw error;
    }
    log('当前用户:', user?.email);
    return user;
  } catch (error) {
    log('获取用户出错:', error);
    return null;
  }
};

// 辅助函数：获取会话
export const getSession = async () => {
  try {
    log('获取会话');
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      log('获取会话失败:', error);
      throw error;
    }
    log('会话状态:', session ? '已登录' : '未登录');
    return session;
  } catch (error) {
    log('获取会话出错:', error);
    return null;
  }
};

// 辅助函数：创建服务端客户端
export const createServerClient = (request: Request) => {
  const cookies = request.headers.get('cookie') || '';
  
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        cookie: cookies,
      },
    },
  });
};