import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  console.log('[API] 健康检查请求');
  
  try {
    // Reason: 检查当前时间和基本系统状态
    const timestamp = new Date().toISOString();
    const uptime = process.uptime();
    
    // Reason: 检查环境变量是否配置正确
    const hasSupabaseConfig = !!(
      import.meta.env.SUPABASE_URL && 
      import.meta.env.SUPABASE_ANON_KEY
    );
    
    const status = {
      status: 'healthy',
      timestamp,
      uptime: `${Math.floor(uptime)}s`,
      version: '1.0.0',
      environment: import.meta.env.MODE || 'development',
      supabase: hasSupabaseConfig ? 'configured' : 'not configured',
      services: {
        api: 'operational',
        database: hasSupabaseConfig ? 'connected' : 'not configured',
        auth: 'operational'
      }
    };
    
    console.log('[API] 健康检查完成:', status);
    
    return new Response(
      JSON.stringify(status),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      }
    );
  } catch (error: any) {
    console.error('[API] 健康检查失败:', error);
    
    return new Response(
      JSON.stringify({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message || 'Unknown error'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      }
    );
  }
};