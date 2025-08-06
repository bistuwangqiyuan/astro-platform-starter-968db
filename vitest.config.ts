import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // 测试环境设置
    environment: 'jsdom',
    
    // 测试文件匹配模式
    include: ['tests/**/*.{test,spec}.{js,ts}'],
    exclude: ['node_modules', 'dist', '.astro'],
    
    // 全局设置
    globals: true,
    
    // 覆盖率配置
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        'dist/',
        '.astro/'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    
    // 测试设置
    testTimeout: 10000,
    hookTimeout: 10000,
    
    // 设置测试
    setupFiles: ['./tests/setup.ts']
  },
  
  // 解析别名
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@utils': '/src/utils',
      '@types': '/src/types'
    }
  }
});