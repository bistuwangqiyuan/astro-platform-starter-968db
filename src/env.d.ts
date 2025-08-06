/// <reference path="../.astro/types.d.ts" />

// AIKeyword项目类型定义
declare namespace App {
  interface Locals {
    user?: {
      id: string;
      email?: string;
      email_confirmed_at?: string;
      created_at: string;
      user_metadata?: {
        display_name?: string;
        avatar_url?: string;
      };
    };
    isAuthenticated?: boolean;
  }
}

// 环境变量类型定义
interface ImportMetaEnv {
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_ANON_KEY: string;
  readonly SUPABASE_SERVICE_KEY?: string;
  readonly PUBLIC_SITE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}