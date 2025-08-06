// 收藏API测试
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Favorites API', () => {
  let authToken: string;
  let testFavoriteId: string;
  const testKeyword = `测试关键词-${Date.now()}`;
  const testEmail = `test-favorites-${Date.now()}@example.com`;
  const testPassword = 'testpassword123';

  beforeEach(async () => {
    console.log('[TEST] 开始收藏API测试');
    
    // 注册并登录测试用户
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
    authToken = loginResult.token || '';
    
    console.log('[TEST] 测试用户认证完成');
  });

  afterEach(() => {
    console.log('[TEST] 收藏API测试完成');
  });

  describe('POST /api/favorites', () => {
    it('应该成功添加新收藏', async () => {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
        body: JSON.stringify({
          keyword: testKeyword,
          category: '测试分类',
          priority: 4,
          tags: ['测试', 'API'],
          notes: '这是一个测试收藏'
        }),
      });

      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.keyword).toBe(testKeyword);
      expect(result.data.category).toBe('测试分类');
      expect(result.data.priority).toBe(4);

      testFavoriteId = result.data.id;
      console.log('[TEST] 收藏添加成功:', result.data.id);
    });

    it('应该拒绝重复添加相同关键词', async () => {
      // 先添加一个收藏
      await fetch('/api/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
        body: JSON.stringify({
          keyword: testKeyword,
          category: '测试分类',
        }),
      });

      // 再次添加相同关键词
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
        body: JSON.stringify({
          keyword: testKeyword,
          category: '测试分类',
        }),
      });

      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toContain('已收藏');

      console.log('[TEST] 重复收藏被正确拒绝');
    });

    it('应该拒绝空关键词', async () => {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
        body: JSON.stringify({
          keyword: '',
          category: '测试分类',
        }),
      });

      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toContain('关键词不能为空');

      console.log('[TEST] 空关键词被正确拒绝');
    });

    it('应该拒绝未认证用户', async () => {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword: testKeyword,
        }),
      });

      const result = await response.json();

      expect(response.status).toBe(401);
      expect(result.success).toBe(false);
      expect(result.error).toContain('认证');

      console.log('[TEST] 未认证请求被正确拒绝');
    });
  });

  describe('GET /api/favorites', () => {
    beforeEach(async () => {
      // 添加测试收藏
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
        body: JSON.stringify({
          keyword: testKeyword,
          category: '测试分类',
          priority: 3,
        }),
      });

      const result = await response.json();
      testFavoriteId = result.data?.id;
    });

    it('应该成功获取用户收藏列表', async () => {
      const response = await fetch('/api/favorites', {
        method: 'GET',
        headers: {
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        }
      });

      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.favorites).toBeInstanceOf(Array);
      expect(result.data.favorites.length).toBeGreaterThan(0);
      expect(result.data.pagination).toBeDefined();

      console.log('[TEST] 获取收藏列表成功:', result.data.favorites.length);
    });

    it('应该支持关键词筛选', async () => {
      const response = await fetch(`/api/favorites?keyword=${encodeURIComponent(testKeyword)}`, {
        method: 'GET',
        headers: {
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        }
      });

      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data.favorites.length).toBeGreaterThan(0);
      expect(result.data.favorites[0].keyword).toBe(testKeyword);

      console.log('[TEST] 关键词筛选功能正常');
    });

    it('应该支持分页', async () => {
      const response = await fetch('/api/favorites?page=1&limit=5', {
        method: 'GET',
        headers: {
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        }
      });

      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data.pagination).toBeDefined();
      expect(result.data.pagination.page).toBe(1);
      expect(result.data.pagination.limit).toBe(5);

      console.log('[TEST] 分页功能正常');
    });
  });

  describe('PUT /api/favorites', () => {
    beforeEach(async () => {
      // 添加测试收藏
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
        body: JSON.stringify({
          keyword: testKeyword,
          category: '原始分类',
          priority: 3,
        }),
      });

      const result = await response.json();
      testFavoriteId = result.data?.id;
    });

    it('应该成功更新收藏', async () => {
      const response = await fetch('/api/favorites', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
        body: JSON.stringify({
          id: testFavoriteId,
          keyword: testKeyword,
          category: '更新分类',
          priority: 5,
          notes: '更新的备注'
        }),
      });

      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data.category).toBe('更新分类');
      expect(result.data.priority).toBe(5);
      expect(result.data.notes).toBe('更新的备注');

      console.log('[TEST] 收藏更新成功');
    });

    it('应该拒绝更新不存在的收藏', async () => {
      const response = await fetch('/api/favorites', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
        body: JSON.stringify({
          id: 'non-existent-id',
          keyword: testKeyword,
        }),
      });

      const result = await response.json();

      expect(response.status).toBe(404);
      expect(result.success).toBe(false);
      expect(result.error).toContain('不存在');

      console.log('[TEST] 更新不存在收藏被正确拒绝');
    });
  });

  describe('DELETE /api/favorites', () => {
    beforeEach(async () => {
      // 添加测试收藏
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
        body: JSON.stringify({
          keyword: testKeyword,
          category: '测试分类',
        }),
      });

      const result = await response.json();
      testFavoriteId = result.data?.id;
    });

    it('应该成功删除单个收藏', async () => {
      const response = await fetch('/api/favorites', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
        body: JSON.stringify({
          ids: [testFavoriteId]
        }),
      });

      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);

      console.log('[TEST] 收藏删除成功');

      // 验证收藏已被删除
      const getResponse = await fetch('/api/favorites', {
        method: 'GET',
        headers: {
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        }
      });

      const getResult = await getResponse.json();
      const deletedFavorite = getResult.data.favorites.find((f: any) => f.id === testFavoriteId);
      expect(deletedFavorite).toBeUndefined();

      console.log('[TEST] 删除验证成功');
    });

    it('应该支持批量删除', async () => {
      // 添加多个测试收藏
      const favorites = [];
      for (let i = 0; i < 3; i++) {
        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(authToken && { 'Authorization': `Bearer ${authToken}` })
          },
          body: JSON.stringify({
            keyword: `${testKeyword}-${i}`,
            category: '批量测试',
          }),
        });

        const result = await response.json();
        favorites.push(result.data.id);
      }

      // 批量删除
      const response = await fetch('/api/favorites', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
        body: JSON.stringify({
          ids: favorites
        }),
      });

      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);

      console.log('[TEST] 批量删除成功:', favorites.length);
    });

    it('应该拒绝删除不存在的收藏', async () => {
      const response = await fetch('/api/favorites', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
        body: JSON.stringify({
          ids: ['non-existent-id']
        }),
      });

      const result = await response.json();

      expect(response.status).toBe(404);
      expect(result.success).toBe(false);

      console.log('[TEST] 删除不存在收藏被正确处理');
    });
  });
});
