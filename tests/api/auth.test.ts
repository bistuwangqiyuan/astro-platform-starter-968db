// 认证API测试
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Authentication API', () => {
  let testUser: any;
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'testpassword123';

  beforeEach(() => {
    console.log('[TEST] 开始认证API测试');
  });

  afterEach(() => {
    console.log('[TEST] 认证API测试完成');
  });

  describe('POST /api/auth/register', () => {
    it('应该成功注册新用户', async () => {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
          name: 'Test User'
        }),
      });

      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(testEmail);

      testUser = result.user;
      console.log('[TEST] 用户注册成功:', result.user.email);
    });

    it('应该拒绝重复注册相同邮箱', async () => {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
        }),
      });

      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toContain('邮箱已存在');

      console.log('[TEST] 重复注册被正确拒绝');
    });

    it('应该拒绝无效的邮箱格式', async () => {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'invalid-email',
          password: testPassword,
        }),
      });

      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toContain('邮箱格式无效');

      console.log('[TEST] 无效邮箱被正确拒绝');
    });

    it('应该拒绝过短的密码', async () => {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: `test-short-${Date.now()}@example.com`,
          password: '123',
        }),
      });

      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toContain('密码长度不能少于6位');

      console.log('[TEST] 过短密码被正确拒绝');
    });
  });

  describe('POST /api/auth/login', () => {
    it('应该成功登录有效用户', async () => {
      // 先注册用户
      await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
        }),
      });

      // 然后登录
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
        }),
      });

      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(testEmail);

      console.log('[TEST] 用户登录成功:', result.user.email);
    });

    it('应该拒绝错误的密码', async () => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testEmail,
          password: 'wrongpassword',
        }),
      });

      const result = await response.json();

      expect(response.status).toBe(401);
      expect(result.success).toBe(false);
      expect(result.error).toContain('邮箱或密码错误');

      console.log('[TEST] 错误密码被正确拒绝');
    });

    it('应该拒绝不存在的用户', async () => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          password: testPassword,
        }),
      });

      const result = await response.json();

      expect(response.status).toBe(401);
      expect(result.success).toBe(false);
      expect(result.error).toContain('邮箱或密码错误');

      console.log('[TEST] 不存在用户被正确拒绝');
    });
  });

  describe('GET /api/auth/me', () => {
    it('应该返回当前认证用户信息', async () => {
      // 需要先登录获取认证状态
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
        }),
      });

      const loginResult = await loginResponse.json();
      expect(loginResult.success).toBe(true);

      // 获取用户信息
      const response = await fetch('/api/auth/me', {
        method: 'GET',
      });

      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.email).toBe(testEmail);

      console.log('[TEST] 获取当前用户信息成功');
    });

    it('应该拒绝未认证的请求', async () => {
      // 先登出
      await fetch('/api/auth/logout', { method: 'POST' });

      const response = await fetch('/api/auth/me', {
        method: 'GET',
      });

      const result = await response.json();

      expect(response.status).toBe(401);
      expect(result.success).toBe(false);
      expect(result.error).toContain('用户未认证');

      console.log('[TEST] 未认证请求被正确拒绝');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('应该成功登出用户', async () => {
      // 先登录
      await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
        }),
      });

      // 然后登出
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);

      console.log('[TEST] 用户登出成功');

      // 验证登出后无法访问受保护的资源
      const meResponse = await fetch('/api/auth/me');
      const meResult = await meResponse.json();

      expect(meResponse.status).toBe(401);
      expect(meResult.success).toBe(false);

      console.log('[TEST] 登出后访问控制正常');
    });
  });
});
