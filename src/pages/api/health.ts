import type { APIRoute } from 'astro';
import { supabase } from '../../utils/supabase';
import type { ApiResponse } from '../../types/supabase';

export const prerender = false;

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  environment: string;
  services: {
    database: ServiceStatus;
    authentication: ServiceStatus;
    storage: ServiceStatus;
  };
  performance: {
    responseTime: number;
    memoryUsage?: number;
  };
}

interface ServiceStatus {
  status: 'operational' | 'degraded' | 'down';
  responseTime?: number;
  lastCheck: string;
  error?: string;
}

// Reason: 记录服务启动时间用于计算运行时长
const startTime = Date.now();

/**
 * 检查数据库连接状态
 */
async function checkDatabaseHealth(): Promise<ServiceStatus> {
  const checkStart = Date.now();
  
  try {
    console.log('开始数据库健康检查');
    
    // Reason: 执行简单查询检查数据库连接
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
      .single();
    
    const responseTime = Date.now() - checkStart;
    
    if (error) {
      console.error('数据库健康检查失败:', error.message);
      return {
        status: 'down',
        responseTime,
        lastCheck: new Date().toISOString(),
        error: error.message
      };
    }
    
    console.log('数据库健康检查通过:', { responseTime });
    return {
      status: responseTime > 1000 ? 'degraded' : 'operational',
      responseTime,
      lastCheck: new Date().toISOString()
    };
  } catch (error) {
    const responseTime = Date.now() - checkStart;
    console.error('数据库健康检查异常:', error);
    
    return {
      status: 'down',
      responseTime,
      lastCheck: new Date().toISOString(),
      error: error instanceof Error ? error.message : '未知错误'
    };
  }
}

/**
 * 检查认证服务状态
 */
async function checkAuthenticationHealth(): Promise<ServiceStatus> {
  const checkStart = Date.now();
  
  try {
    console.log('开始认证服务健康检查');
    
    // Reason: 通过获取当前会话检查认证服务
    const { data, error } = await supabase.auth.getSession();
    
    const responseTime = Date.now() - checkStart;
    
    if (error) {
      console.error('认证服务健康检查失败:', error.message);
      return {
        status: 'down',
        responseTime,
        lastCheck: new Date().toISOString(),
        error: error.message
      };
    }
    
    console.log('认证服务健康检查通过:', { responseTime });
    return {
      status: responseTime > 500 ? 'degraded' : 'operational',
      responseTime,
      lastCheck: new Date().toISOString()
    };
  } catch (error) {
    const responseTime = Date.now() - checkStart;
    console.error('认证服务健康检查异常:', error);
    
    return {
      status: 'down',
      responseTime,
      lastCheck: new Date().toISOString(),
      error: error instanceof Error ? error.message : '未知错误'
    };
  }
}

/**
 * 检查存储服务状态
 */
async function checkStorageHealth(): Promise<ServiceStatus> {
  const checkStart = Date.now();
  
  try {
    console.log('开始存储服务健康检查');
    
    // Reason: 检查存储服务可用性（这里模拟检查）
    // 在实际项目中，可以检查文件上传、CDN等服务
    const responseTime = Date.now() - checkStart;
    
    // 简单的模拟检查
    await new Promise(resolve => setTimeout(resolve, 10));
    
    console.log('存储服务健康检查通过:', { responseTime });
    return {
      status: 'operational',
      responseTime: Date.now() - checkStart,
      lastCheck: new Date().toISOString()
    };
  } catch (error) {
    const responseTime = Date.now() - checkStart;
    console.error('存储服务健康检查异常:', error);
    
    return {
      status: 'down',
      responseTime,
      lastCheck: new Date().toISOString(),
      error: error instanceof Error ? error.message : '未知错误'
    };
  }
}

/**
 * 计算总体健康状态
 */
function calculateOverallStatus(services: HealthStatus['services']): HealthStatus['status'] {
  const statuses = Object.values(services).map(service => service.status);
  
  if (statuses.every(status => status === 'operational')) {
    return 'healthy';
  } else if (statuses.some(status => status === 'down')) {
    return 'unhealthy';
  } else {
    return 'degraded';
  }
}

export const GET: APIRoute = async ({ request }) => {
  const healthCheckStart = Date.now();
  
  try {
    console.log('开始系统健康检查');
    
    // 并行检查所有服务
    const [databaseStatus, authStatus, storageStatus] = await Promise.all([
      checkDatabaseHealth(),
      checkAuthenticationHealth(),
      checkStorageHealth()
    ]);
    
    const services = {
      database: databaseStatus,
      authentication: authStatus,
      storage: storageStatus
    };
    
    const overallStatus = calculateOverallStatus(services);
    const totalResponseTime = Date.now() - healthCheckStart;
    
    // Reason: 获取环境信息和版本信息
    const environment = import.meta.env.APP_ENV || 'development';
    const version = import.meta.env.npm_package_version || '1.0.0';
    const uptime = Date.now() - startTime;
    
    const healthStatus: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version,
      uptime,
      environment,
      services,
      performance: {
        responseTime: totalResponseTime,
        // 在Node.js环境中可以获取内存使用情况
        memoryUsage: typeof process !== 'undefined' ? process.memoryUsage().heapUsed : undefined
      }
    };
    
    console.log('系统健康检查完成:', {
      status: overallStatus,
      responseTime: totalResponseTime,
      services: Object.fromEntries(
        Object.entries(services).map(([key, value]) => [key, value.status])
      )
    });
    
    // Reason: 根据健康状态返回不同的HTTP状态码
    let httpStatus = 200;
    if (overallStatus === 'degraded') {
      httpStatus = 200; // 部分降级但仍可用
    } else if (overallStatus === 'unhealthy') {
      httpStatus = 503; // 服务不可用
    }
    
    return new Response(
      JSON.stringify({
        success: overallStatus !== 'unhealthy',
        data: healthStatus,
        message: `系统状态: ${overallStatus}`
      } as ApiResponse<HealthStatus>),
      {
        status: httpStatus,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Health-Status': overallStatus,
          'X-Response-Time': totalResponseTime.toString()
        }
      }
    );
    
  } catch (error) {
    const totalResponseTime = Date.now() - healthCheckStart;
    console.error('系统健康检查发生错误:', error);
    
    const errorHealthStatus: HealthStatus = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: import.meta.env.npm_package_version || '1.0.0',
      uptime: Date.now() - startTime,
      environment: import.meta.env.APP_ENV || 'development',
      services: {
        database: {
          status: 'down',
          lastCheck: new Date().toISOString(),
          error: '健康检查失败'
        },
        authentication: {
          status: 'down',
          lastCheck: new Date().toISOString(),
          error: '健康检查失败'
        },
        storage: {
          status: 'down',
          lastCheck: new Date().toISOString(),
          error: '健康检查失败'
        }
      },
      performance: {
        responseTime: totalResponseTime
      }
    };
    
    return new Response(
      JSON.stringify({
        success: false,
        data: errorHealthStatus,
        error: '系统健康检查失败',
        message: 'System health check failed'
      } as ApiResponse<HealthStatus>),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Health-Status': 'unhealthy',
          'X-Response-Time': totalResponseTime.toString()
        }
      }
    );
  }
};

// 支持HEAD请求用于简单的存活检查
export const HEAD: APIRoute = async ({ request }) => {
  try {
    // 简单的存活检查，不执行详细的健康检查
    return new Response(null, {
      status: 200,
      headers: {
        'X-Health-Status': 'alive',
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    return new Response(null, {
      status: 503,
      headers: {
        'X-Health-Status': 'error',
        'Cache-Control': 'no-cache'
      }
    });
  }
};