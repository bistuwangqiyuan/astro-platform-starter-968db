// 测试环境设置文件
import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

// 全局测试配置
const TEST_CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:4321',
  timeout: 30000,
  retries: 2
};

// 模拟浏览器环境的全局对象
global.window = {
  location: {
    href: TEST_CONFIG.baseUrl,
    origin: TEST_CONFIG.baseUrl,
    pathname: '/',
    search: '',
    hash: ''
  },
  logKeyStep: (step: string, data?: any) => {
    console.log(`[LOG] ${step}`, data ? JSON.stringify(data, null, 2) : '');
  }
} as any;

global.console = {
  ...console,
  log: (...args) => {
    // 只在详细模式下显示日志
    if (process.env.VERBOSE_TESTS === 'true') {
      console.log('[TEST]', ...args);
    }
  },
  error: (...args) => {
    console.error('[TEST ERROR]', ...args);
  },
  warn: (...args) => {
    console.warn('[TEST WARN]', ...args);
  }
};

// 全局 fetch 配置
const originalFetch = global.fetch;

global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  let url = typeof input === 'string' ? input : input.toString();
  
  // 如果是相对路径，添加基础URL
  if (url.startsWith('/')) {
    url = TEST_CONFIG.baseUrl + url;
  }

  console.log(`[FETCH] ${init?.method || 'GET'} ${url}`);

  try {
    const response = await originalFetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers
      }
    });

    console.log(`[FETCH] ${response.status} ${url}`);
    
    return response;
  } catch (error) {
    console.error(`[FETCH ERROR] ${url}:`, error);
    throw error;
  }
};

// 测试环境检查
beforeAll(async () => {
  console.log('[SETUP] 开始测试环境初始化');
  console.log('[SETUP] 基础URL:', TEST_CONFIG.baseUrl);
  
  try {
    // 检查API健康状态
    const healthResponse = await fetch('/api/health');
    if (!healthResponse.ok) {
      console.warn('[SETUP] API健康检查失败，但继续测试');
    } else {
      console.log('[SETUP] API健康检查通过');
    }
  } catch (error) {
    console.warn('[SETUP] 无法连接到API服务器，使用模拟模式');
  }

  console.log('[SETUP] 测试环境初始化完成');
});

afterAll(async () => {
  console.log('[CLEANUP] 开始测试环境清理');
  
  try {
    // 这里可以添加清理逻辑，比如删除测试数据
    console.log('[CLEANUP] 测试环境清理完成');
  } catch (error) {
    console.error('[CLEANUP] 清理过程出错:', error);
  }
});

// 每个测试前的设置
beforeEach(() => {
  // 重置全局状态
  global.testStartTime = Date.now();
});

// 每个测试后的清理
afterEach(() => {
  const duration = Date.now() - global.testStartTime;
  if (duration > 5000) { // 超过5秒的测试
    console.warn(`[PERF] 慢测试检测: ${duration}ms`);
  }
});

// 错误处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('[TEST] 未处理的Promise拒绝:', reason);
  console.error('[TEST] Promise:', promise);
});

process.on('uncaughtException', (error) => {
  console.error('[TEST] 未捕获的异常:', error);
  process.exit(1);
});

// 导出测试工具函数
export const testUtils = {
  // 等待函数
  wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // 重试函数
  retry: async <T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> => {
    try {
      return await fn();
    } catch (error) {
      if (retries > 0) {
        console.log(`[RETRY] 重试中... 剩余次数: ${retries}`);
        await testUtils.wait(delay);
        return testUtils.retry(fn, retries - 1, delay);
      }
      throw error;
    }
  },
  
  // 生成随机测试数据
  generateTestEmail: () => `test-${Date.now()}-${Math.random().toString(36).substr(2, 5)}@example.com`,
  generateTestKeyword: () => `测试关键词-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
  
  // 创建测试用户
  createTestUser: async () => {
    const email = testUtils.generateTestEmail();
    const password = 'testpassword123';
    
    const registerResponse = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        name: 'Test User'
      }),
    });

    const registerResult = await registerResponse.json();
    
    if (!registerResult.success) {
      throw new Error(`创建测试用户失败: ${registerResult.error}`);
    }

    const loginResponse = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const loginResult = await loginResponse.json();
    
    if (!loginResult.success) {
      throw new Error(`测试用户登录失败: ${loginResult.error}`);
    }

    return {
      email,
      password,
      user: loginResult.user,
      token: loginResult.token
    };
  },
  
  // 清理测试用户
  cleanupTestUser: async (email: string, token?: string) => {
    try {
      // 这里可以添加删除用户的逻辑
      console.log(`[CLEANUP] 清理测试用户: ${email}`);
    } catch (error) {
      console.warn(`[CLEANUP] 清理用户失败: ${email}`, error);
    }
  }
};

console.log('[SETUP] 测试工具加载完成');
