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