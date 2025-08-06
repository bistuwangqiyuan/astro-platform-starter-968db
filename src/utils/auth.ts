import { auth } from './supabase';
import type { User } from '@supabase/supabase-js';

// 认证状态检查
export async function requireAuth(): Promise<User> {
    const { user, error } = await auth.getCurrentUser();
    
    if (error || !user) {
        throw new Error('Authentication required');
    }
    
    return user;
}

// 检查用户是否已登录
export async function isAuthenticated(): Promise<boolean> {
    const { user } = await auth.getCurrentUser();
    return !!user;
}

// 获取用户ID
export async function getUserId(): Promise<string | null> {
    const { user } = await auth.getCurrentUser();
    return user?.id || null;
}

// 表单验证
export const validation = {
    email: (email: string): { valid: boolean; message?: string } => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) {
            return { valid: false, message: '邮箱不能为空' };
        }
        if (!emailRegex.test(email)) {
            return { valid: false, message: '请输入有效的邮箱地址' };
        }
        return { valid: true };
    },

    password: (password: string): { valid: boolean; message?: string } => {
        if (!password) {
            return { valid: false, message: '密码不能为空' };
        }
        if (password.length < 6) {
            return { valid: false, message: '密码至少需要6个字符' };
        }
        return { valid: true };
    },

    confirmPassword: (password: string, confirmPassword: string): { valid: boolean; message?: string } => {
        if (password !== confirmPassword) {
            return { valid: false, message: '两次输入的密码不一致' };
        }
        return { valid: true };
    }
};

// API认证中间件
export async function withAuth<T>(
    handler: (user: User, ...args: any[]) => Promise<T>,
    ...args: any[]
): Promise<{ data?: T; error?: string; status: number }> {
    try {
        const user = await requireAuth();
        const data = await handler(user, ...args);
        return { data, status: 200 };
    } catch (error) {
        console.error('Auth error:', error);
        if (error instanceof Error && error.message === 'Authentication required') {
            return { error: 'Authentication required', status: 401 };
        }
        return { error: 'Internal server error', status: 500 };
    }
}

// Session管理
export const session = {
    // 获取会话信息
    async getSession() {
        try {
            const { user } = await auth.getCurrentUser();
            return { user, isLoggedIn: !!user };
        } catch (error) {
            console.error('Session error:', error);
            return { user: null, isLoggedIn: false };
        }
    },

    // 刷新会话
    async refreshSession() {
        try {
            const { user, error } = await auth.getCurrentUser();
            if (error) throw error;
            return { user, success: true };
        } catch (error) {
            console.error('Refresh session error:', error);
            return { user: null, success: false };
        }
    }
};

// 服务器端认证工具
export const serverAuth = {
    // 从请求中获取用户信息
    async getUserFromRequest(request: Request) {
        try {
            // 从Authorization header获取token
            const authorization = request.headers.get('authorization');
            if (!authorization) {
                return null;
            }

            const token = authorization.replace('Bearer ', '');
            const { user } = await auth.getCurrentUser();
            return user;
        } catch (error) {
            console.error('Server auth error:', error);
            return null;
        }
    },

    // 验证请求的认证状态
    async validateRequest(request: Request): Promise<{ user: User | null; error?: string }> {
        try {
            const user = await this.getUserFromRequest(request);
            return { user };
        } catch (error) {
            console.error('Validate request error:', error);
            return { user: null, error: 'Authentication failed' };
        }
    }
};

// 认证服务类
export const AuthService = {
    // 用户登录
    async login(credentials: { email: string; password: string }) {
        try {
            const { data, error } = await auth.signIn(credentials.email, credentials.password);
            if (error) {
                return { success: false, error: error.message };
            }
            return { success: true, user: data.user };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'Login failed' };
        }
    },

    // 用户注册
    async register(userData: { email: string; password: string; name?: string }) {
        try {
            const { data, error } = await auth.signUp(userData.email, userData.password, userData.name ? { name: userData.name } : undefined);
            if (error) {
                return { success: false, error: error.message };
            }
            return { success: true, user: data.user };
        } catch (error) {
            console.error('Register error:', error);
            return { success: false, error: 'Registration failed' };
        }
    },

    // 用户登出
    async logout() {
        try {
            const { error } = await auth.signOut();
            if (error) {
                return { success: false, error: error.message };
            }
            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            return { success: false, error: 'Logout failed' };
        }
    },

    // 获取访问令牌
    async getAccessToken() {
        try {
            // 需要从 supabase 客户端获取 session
            const { supabase } = await import('./supabase');
            const { data: { session } } = await supabase.auth.getSession();
            return session?.access_token || null;
        } catch (error) {
            console.error('Get access token error:', error);
            return null;
        }
    },

    // 修改密码
    async changePassword(newPassword: string) {
        try {
            const { data, error } = await auth.updatePassword(newPassword);
            if (error) {
                return { success: false, error: error.message };
            }
            return { success: true };
        } catch (error) {
            console.error('Change password error:', error);
            return { success: false, error: 'Password change failed' };
        }
    },

    // 重置密码
    async resetPassword(email: string) {
        try {
            // 需要从 supabase 客户端调用重置密码
            const { supabase } = await import('./supabase');
            const { error } = await supabase.auth.resetPasswordForEmail(email);
            if (error) {
                return { success: false, error: error.message };
            }
            return { success: true };
        } catch (error) {
            console.error('Reset password error:', error);
            return { success: false, error: 'Password reset failed' };
        }
    }
};