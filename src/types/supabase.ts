export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
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
          content: string;
          result: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          content: string;
          result?: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          content?: string;
          result?: any;
          created_at?: string;
          updated_at?: string;
        };
      };
      favorites: {
        Row: {
          id: string;
          user_id: string;
          analysis_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          analysis_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          analysis_id?: string;
          created_at?: string;
        };
      };
      history: {
        Row: {
          id: string;
          user_id: string;
          action: string;
          details: any;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          action: string;
          details?: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          action?: string;
          details?: any;
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
      [_ in never]: never;
    };
  };
};