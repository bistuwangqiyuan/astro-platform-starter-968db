export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      analyses: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          title: string
          description?: string
          data_source: string
          analysis_type: string
          parameters: Json
          results: Json
          status: 'pending' | 'processing' | 'completed' | 'failed'
          error_message?: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          title: string
          description?: string
          data_source: string
          analysis_type: string
          parameters: Json
          results?: Json
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          error_message?: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          title?: string
          description?: string
          data_source?: string
          analysis_type?: string
          parameters?: Json
          results?: Json
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          error_message?: string
        }
      }
      favorites: {
        Row: {
          id: string
          created_at: string
          user_id: string
          item_id: string
          item_type: string
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          item_id: string
          item_type: string
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          item_id?: string
          item_type?: string
        }
      }
      history: {
        Row: {
          id: string
          created_at: string
          user_id: string
          action: string
          details: Json
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          action: string
          details: Json
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          action?: string
          details?: Json
        }
      }
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          email: string
          full_name?: string
          avatar_url?: string
          preferences: Json
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          email: string
          full_name?: string
          avatar_url?: string
          preferences?: Json
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          email?: string
          full_name?: string
          avatar_url?: string
          preferences?: Json
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      analysis_status: 'pending' | 'processing' | 'completed' | 'failed'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// 辅助类型
export type Analysis = Database['public']['Tables']['analyses']['Row']
export type AnalysisInsert = Database['public']['Tables']['analyses']['Insert']
export type AnalysisUpdate = Database['public']['Tables']['analyses']['Update']

export type Favorite = Database['public']['Tables']['favorites']['Row']
export type FavoriteInsert = Database['public']['Tables']['favorites']['Insert']

export type History = Database['public']['Tables']['history']['Row']
export type HistoryInsert = Database['public']['Tables']['history']['Insert']

export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

// 分析类型枚举
export enum AnalysisType {
  DESCRIPTIVE = 'descriptive',
  CORRELATION = 'correlation',
  REGRESSION = 'regression',
  CLUSTERING = 'clustering',
  CLASSIFICATION = 'classification',
  TIME_SERIES = 'time_series',
  CUSTOM = 'custom'
}

// 数据源类型
export enum DataSourceType {
  CSV = 'csv',
  JSON = 'json',
  API = 'api',
  DATABASE = 'database',
  URL = 'url'
}