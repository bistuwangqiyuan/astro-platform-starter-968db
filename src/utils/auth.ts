import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';

// 日志记录函数
const log = (action: string, details?: any) => {
  console.log(`[Auth] ${action}`, details || '');
};

// 注册新用户
export const signUp = async (email: string, password: string) => {
  try {
    log('用户注册开始', { email });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      log('注册失败', error.message);
      throw error;
    }

    log('注册成功', { userId: data.user?.id });
    return { user: data.user, session: data.session };
  } catch (error) {
    log('注册出错', error);
    throw error;
  }
};

// 用户登录
export const signIn = async (email: string, password: string) => {
  try {
    log('用户登录开始', { email });
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      log('登录失败', error.message);
      throw error;
    }

    log('登录成功', { userId: data.user?.id });
    return { user: data.user, session: data.session };
  } catch (error) {
    log('登录出错', error);
    throw error;
  }
};

// 用户登出
export const signOut = async () => {
  try {
    log('用户登出开始');
    const { error } = await supabase.auth.signOut();

    if (error) {
      log('登出失败', error.message);
      throw error;
    }

    log('登出成功');
    return { success: true };
  } catch (error) {
    log('登出出错', error);
    throw error;
  }
};

// 修改密码
export const updatePassword = async (newPassword: string) => {
  try {
    log('修改密码开始');
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      log('修改密码失败', error.message);
      throw error;
    }

    log('修改密码成功');
    return { user: data.user };
  } catch (error) {
    log('修改密码出错', error);
    throw error;
  }
};

// 重置密码邮件
export const resetPassword = async (email: string) => {
  try {
    log('发送重置密码邮件', { email });
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      log('发送重置密码邮件失败', error.message);
      throw error;
    }

    log('重置密码邮件发送成功');
    return { success: true };
  } catch (error) {
    log('发送重置密码邮件出错', error);
    throw error;
  }
};

// 获取当前用户
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    log('获取当前用户');
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      log('获取用户失败', error.message);
      throw error;
    }

    log('获取用户成功', { userId: user?.id });
    return user;
  } catch (error) {
    log('获取用户出错', error);
    return null;
  }
};

// 验证用户是否已登录
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const user = await getCurrentUser();
    const authenticated = !!user;
    log('认证状态', { authenticated });
    return authenticated;
  } catch (error) {
    log('检查认证状态出错', error);
    return false;
  }
};

// 监听认证状态变化
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  log('设置认证状态监听');
  
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      log('认证状态变化', { event, userId: session?.user?.id });
      callback(session?.user || null);
    }
  );

  return subscription;
};