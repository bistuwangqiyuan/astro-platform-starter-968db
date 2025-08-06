import { supabase, dbHelpers } from './supabase';
import type { User, LoginForm, RegisterForm, ChangePasswordForm } from '../types/global.d';

// Reason: 认证状态管理和用户操作的核心工具函数
export class AuthService {
  
  // 用户注册
  static async register(formData: RegisterForm) {
    console.log('[Auth] 开始用户注册流程');
    
    try {
      // 检查密码一致性
      if (formData.password !== formData.confirmPassword) {
        throw new Error('密码确认不一致');
      }
      
      // 注册用户
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name || ''
          }
        }
      });
      
      if (error) {
        console.error('[Auth] 注册失败:', error);
        throw error;
      }
      
      console.log('[Auth] 注册成功，等待邮箱验证');
      
      // Reason: 如果用户信息存在，同步到自定义users表
      if (data.user) {
        try {
          await dbHelpers.users.upsert({
            id: data.user.id,
            email: data.user.email!,
            name: formData.name || null,
            avatar_url: data.user.user_metadata?.avatar_url || null
          });
          console.log('[Auth] 用户信息同步成功');
        } catch (dbError) {
          console.warn('[Auth] 用户信息同步失败，但注册成功:', dbError);
        }
      }
      
      return {
        success: true,
        data: data.user,
        message: '注册成功！请检查邮箱验证链接。'
      };
    } catch (error: any) {
      console.error('[Auth] 注册过程失败:', error);
      return {
        success: false,
        error: error.message || '注册失败，请重试'
      };
    }
  }
  
  // 用户登录
  static async login(formData: LoginForm) {
    console.log('[Auth] 开始用户登录流程');
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });
      
      if (error) {
        console.error('[Auth] 登录失败:', error);
        throw error;
      }
      
      console.log('[Auth] 登录成功');
      
      // Reason: 同步用户信息到数据库
      if (data.user) {
        try {
          await dbHelpers.users.upsert({
            id: data.user.id,
            email: data.user.email!,
            name: data.user.user_metadata?.name || null,
            avatar_url: data.user.user_metadata?.avatar_url || null
          });
          console.log('[Auth] 用户信息同步成功');
        } catch (dbError) {
          console.warn('[Auth] 用户信息同步失败，但登录成功:', dbError);
        }
        
        // 记录登录历史
        try {
          await dbHelpers.history.add(data.user.id, 'login', {
            timestamp: new Date().toISOString(),
            ip: 'unknown' // TODO: 从请求中获取真实IP
          });
        } catch (historyError) {
          console.warn('[Auth] 登录历史记录失败:', historyError);
        }
      }
      
      return {
        success: true,
        data: data.user,
        message: '登录成功！'
      };
    } catch (error: any) {
      console.error('[Auth] 登录过程失败:', error);
      return {
        success: false,
        error: error.message || '登录失败，请检查邮箱和密码'
      };
    }
  }
  
  // 用户登出
  static async logout() {
    console.log('[Auth] 开始用户登出流程');
    
    try {
      // 获取当前用户信息（记录登出历史）
      const currentUser = await this.getCurrentUser();
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('[Auth] 登出失败:', error);
        throw error;
      }
      
      console.log('[Auth] 登出成功');
      
      // 记录登出历史
      if (currentUser) {
        try {
          await dbHelpers.history.add(currentUser.id, 'logout', {
            timestamp: new Date().toISOString()
          });
        } catch (historyError) {
          console.warn('[Auth] 登出历史记录失败:', historyError);
        }
      }
      
      return {
        success: true,
        message: '已成功登出'
      };
    } catch (error: any) {
      console.error('[Auth] 登出过程失败:', error);
      return {
        success: false,
        error: error.message || '登出失败，请重试'
      };
    }
  }
  
  // 修改密码
  static async changePassword(formData: ChangePasswordForm) {
    console.log('[Auth] 开始密码修改流程');
    
    try {
      // 检查新密码一致性
      if (formData.newPassword !== formData.confirmPassword) {
        throw new Error('新密码确认不一致');
      }
      
      // 先验证当前密码
      const user = await this.getCurrentUser();
      if (!user) {
        throw new Error('用户未登录');
      }
      
      // 重新登录验证当前密码
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: formData.currentPassword
      });
      
      if (verifyError) {
        throw new Error('当前密码不正确');
      }
      
      // 更新密码
      const { error } = await supabase.auth.updateUser({
        password: formData.newPassword
      });
      
      if (error) {
        console.error('[Auth] 密码修改失败:', error);
        throw error;
      }
      
      console.log('[Auth] 密码修改成功');
      
      // 记录密码修改历史
      try {
        await dbHelpers.history.add(user.id, 'password_change', {
          timestamp: new Date().toISOString()
        });
      } catch (historyError) {
        console.warn('[Auth] 密码修改历史记录失败:', historyError);
      }
      
      return {
        success: true,
        message: '密码修改成功！'
      };
    } catch (error: any) {
      console.error('[Auth] 密码修改过程失败:', error);
      return {
        success: false,
        error: error.message || '密码修改失败，请重试'
      };
    }
  }
  
  // 获取当前用户信息
  static async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        return null;
      }
      
      // 从数据库获取完整用户信息
      try {
        const dbUser = await dbHelpers.users.getById(user.id);
        return dbUser;
      } catch (dbError) {
        console.warn('[Auth] 从数据库获取用户信息失败，使用认证信息:', dbError);
        return {
          id: user.id,
          email: user.email!,
          name: user.user_metadata?.name || null,
          avatar_url: user.user_metadata?.avatar_url || null,
          created_at: user.created_at,
          updated_at: user.updated_at || user.created_at
        };
      }
    } catch (error) {
      console.error('[Auth] 获取当前用户失败:', error);
      return null;
    }
  }
  
  // 检查用户是否已登录
  static async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user !== null;
  }
  
  // 获取访问令牌
  static async getAccessToken(): Promise<string | null> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        return null;
      }
      
      return session.access_token;
    } catch (error) {
      console.error('[Auth] 获取访问令牌失败:', error);
      return null;
    }
  }
  
  // 刷新令牌
  static async refreshToken() {
    console.log('[Auth] 刷新访问令牌');
    
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('[Auth] 令牌刷新失败:', error);
        throw error;
      }
      
      console.log('[Auth] 令牌刷新成功');
      return data.session;
    } catch (error: any) {
      console.error('[Auth] 令牌刷新过程失败:', error);
      throw error;
    }
  }
}

// Reason: 服务端认证验证辅助函数
export const serverAuth = {
  async verifyToken(accessToken: string) {
    try {
      const { data: { user }, error } = await supabase.auth.getUser(accessToken);
      
      if (error || !user) {
        return null;
      }
      
      return user;
    } catch (error) {
      console.error('[ServerAuth] 令牌验证失败:', error);
      return null;
    }
  },
  
  async getUserFromRequest(request: Request) {
    const authHeader = request.headers.get('Authorization');
    const cookieHeader = request.headers.get('Cookie');
    
    let accessToken = null;
    
    // 从Authorization header获取token
    if (authHeader && authHeader.startsWith('Bearer ')) {
      accessToken = authHeader.substring(7);
    }
    
    // 从cookie获取token（如果没有Authorization header）
    if (!accessToken && cookieHeader) {
      const cookies = new URLSearchParams(cookieHeader.replace(/; /g, '&'));
      accessToken = cookies.get('sb-access-token');
    }
    
    if (!accessToken) {
      return null;
    }
    
    return await this.verifyToken(accessToken);
  }
};