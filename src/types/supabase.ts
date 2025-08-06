// Supabase数据库类型定义

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      analysis_data: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          data: Record<string, any>;
          analysis_type: 'statistical' | 'trend' | 'comparison' | 'other';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          data: Record<string, any>;
          analysis_type: 'statistical' | 'trend' | 'comparison' | 'other';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          data?: Record<string, any>;
          analysis_type?: 'statistical' | 'trend' | 'comparison' | 'other';
          created_at?: string;
          updated_at?: string;
        };
      };
      user_sessions: {
        Row: {
          id: string;
          user_id: string;
          session_token: string;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_token: string;
          expires_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          session_token?: string;
          expires_at?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      analysis_type: 'statistical' | 'trend' | 'comparison' | 'other';
    };
  };
}

// 便利类型定义
export type User = Database['public']['Tables']['users']['Row'];
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type UserUpdate = Database['public']['Tables']['users']['Update'];

export type AnalysisData = Database['public']['Tables']['analysis_data']['Row'];
export type AnalysisDataInsert = Database['public']['Tables']['analysis_data']['Insert'];
export type AnalysisDataUpdate = Database['public']['Tables']['analysis_data']['Update'];

export type UserSession = Database['public']['Tables']['user_sessions']['Row'];
export type UserSessionInsert = Database['public']['Tables']['user_sessions']['Insert'];
export type UserSessionUpdate = Database['public']['Tables']['user_sessions']['Update'];

export type AnalysisType = Database['public']['Enums']['analysis_type'];

// 认证相关类型
export interface AuthResponse {
  success: boolean;
  error: string | null;
  data?: any;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface SignUpData {
  email: string;
  password: string;
  fullName?: string;
  metadata?: Record<string, any>;
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 分析数据相关类型
export interface AnalysisRequest {
  title: string;
  description?: string;
  data: Record<string, any>;
  analysisType: AnalysisType;
}

export interface AnalysisResult {
  id: string;
  summary: string;
  insights: string[];
  visualizations?: {
    type: 'chart' | 'table' | 'graph';
    data: any;
  }[];
  createdAt: string;
}

// 用户配置类型
export interface UserProfile {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  preferences?: {
    theme: 'light' | 'dark';
    language: 'zh' | 'en';
    notifications: boolean;
  };
}

// 错误类型
export interface DatabaseError {
  code: string;
  message: string;
  details?: string;
  hint?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  code: 'required' | 'invalid' | 'too_short' | 'too_long' | 'format';
}