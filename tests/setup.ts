import { beforeAll, afterAll, vi } from 'vitest';

// 全局测试设置
beforeAll(() => {
  // 设置环境变量
  process.env.PUBLIC_SUPABASE_URL = 'http://localhost:54321';
  process.env.PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  process.env.APP_ENV = 'test';
  
  // Mock console methods to reduce noise in tests
  console.log = vi.fn();
  console.info = vi.fn();
  console.warn = vi.fn();
  console.error = vi.fn();
});

afterAll(() => {
  // 清理工作
  vi.restoreAllMocks();
});

// 全局Mock对象
global.fetch = vi.fn();

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(),
      getSession: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn()
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn()
    }))
  }))
}));

// Mock window objects for browser APIs
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    hostname: 'localhost',
    search: '',
    reload: vi.fn()
  },
  writable: true
});

Object.defineProperty(window, 'history', {
  value: {
    length: 1,
    back: vi.fn(),
    pushState: vi.fn(),
    replaceState: vi.fn()
  },
  writable: true
});

Object.defineProperty(navigator, 'userAgent', {
  value: 'Test User Agent',
  writable: true
});