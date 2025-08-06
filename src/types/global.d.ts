/// <reference types="astro/client" />

// 全局类型定义
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface AnalysisData {
  id: string;
  user_id: string;
  title: string;
  content: string;
  result: any;
  created_at: string;
  updated_at: string;
}

export interface FavoriteItem {
  id: string;
  user_id: string;
  analysis_id: string;
  created_at: string;
}

export interface HistoryItem {
  id: string;
  user_id: string;
  action: string;
  details: any;
  created_at: string;
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 表单数据类型
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  name?: string;
}

export interface ChangePasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AnalysisForm {
  title: string;
  content: string;
}

// 环境变量类型
declare namespace ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_ANON_KEY: string;
  readonly PUBLIC_APP_URL: string;
}

declare namespace ImportMeta {
  readonly env: ImportMetaEnv;
}