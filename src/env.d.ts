/// <reference types="astro/client" />

interface ImportMetaEnv {
  // Supabase 配置
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_ANON_KEY: string;
  
  // Netlify 配置
  readonly NETLIFY_SITE_ID: string;
  readonly NETLIFY_AUTH_TOKEN: string;
  
  // 应用配置
  readonly APP_ENV: 'development' | 'staging' | 'production';
  readonly APP_DEBUG: string;
  
  // 邮件配置
  readonly EMAIL_FROM: string;
  readonly EMAIL_PROVIDER: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}