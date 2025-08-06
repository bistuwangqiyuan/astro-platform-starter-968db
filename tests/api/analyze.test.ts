// 分析API测试
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Analyze API', () => {
  let authToken: string;
  const testKeyword = `测试关键词-${Date.now()}`;
  const testEmail = `test-analyze-${Date.now()}@example.com`;
  const testPassword = 'testpassword123';

  beforeEach(async () => {
    console.log('[TEST] 开始分析API测试');
    
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
    console.log('[TEST] 分析API测试完成');
  });

  describe('POST /api/analyze', () => {
    it('应该成功创建分析任务', async () => {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
        body: JSON.stringify({
          keyword: testKeyword,
          source: 'google',
          region: 'CN',
          timeRange: '12months',
          analysisType: 'detailed'
        }),
      });

      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.keyword).toBe(testKeyword);
      expect(result.data.status).toBe('pending');
      expect(result.data.id).toBeDefined();

      console.log('[TEST] 分析任务创建成功:', result.data.id);
    });

    it('应该拒绝空关键词', async () => {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
        body: JSON.stringify({
          keyword: '',
          source: 'google',
        }),
      });

      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toContain('关键词不能为空');

      console.log('[TEST] 空关键词被正确拒绝');
    });

    it('应该拒绝无效的数据源', async () => {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
        body: JSON.stringify({
          keyword: testKeyword,
          source: 'invalid-source',
        }),
      });

      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toContain('数据源');

      console.log('[TEST] 无效数据源被正确拒绝');
    });

    it('应该拒绝未认证用户', async () => {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword: testKeyword,
          source: 'google',
        }),
      });

      const result = await response.json();

      expect(response.status).toBe(401);
      expect(result.success).toBe(false);
      expect(result.error).toContain('认证');

      console.log('[TEST] 未认证请求被正确拒绝');
    });

    it('应该检查API配额限制', async () => {
      // 模拟超出配额的情况
      // 先快速创建多个分析任务来测试配额限制
      const promises = [];
      for (let i = 0; i < 150; i++) { // 超过默认100的限制
        promises.push(
          fetch('/api/analyze', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(authToken && { 'Authorization': `Bearer ${authToken}` })
            },
            body: JSON.stringify({
              keyword: `${testKeyword}-${i}`,
              source: 'google',
            }),
          })
        );
      }

      const responses = await Promise.all(promises);
      const results = await Promise.all(
        responses.map(r => r.json())
      );

      // 应该有一些请求因为配额限制而失败
      const failedRequests = results.filter(r => !r.success && r.error?.includes('配额'));
      expect(failedRequests.length).toBeGreaterThan(0);

      console.log('[TEST] API配额限制正常工作:', failedRequests.length);
    });
  });

  describe('GET /api/analyze', () => {
    let testAnalysisId: string;

    beforeEach(async () => {
      // 创建测试分析任务
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
        body: JSON.stringify({
          keyword: testKeyword,
          source: 'google',
        }),
      });

      const result = await response.json();
      testAnalysisId = result.data?.id;
    });

    it('应该成功获取分析状态', async () => {
      const response = await fetch(`/api/analyze?id=${testAnalysisId}`, {
        method: 'GET',
        headers: {
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        }
      });

      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.id).toBe(testAnalysisId);
      expect(result.data.keyword).toBe(testKeyword);

      console.log('[TEST] 获取分析状态成功:', result.data.status);
    });

    it('应该拒绝获取不存在的分析', async () => {
      const response = await fetch('/api/analyze?id=non-existent-id', {
        method: 'GET',
        headers: {
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        }
      });

      const result = await response.json();

      expect(response.status).toBe(404);
      expect(result.success).toBe(false);
      expect(result.error).toContain('不存在');

      console.log('[TEST] 不存在分析被正确拒绝');
    });

    it('应该拒绝访问其他用户的分析', async () => {
      // 创建另一个用户
      const otherEmail = `other-${Date.now()}@example.com`;
      await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: otherEmail,
          password: testPassword,
        }),
      });

      const otherLoginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: otherEmail,
          password: testPassword,
        }),
      });

      const otherLoginResult = await otherLoginResponse.json();
      const otherAuthToken = otherLoginResult.token || '';

      // 尝试访问其他用户的分析
      const response = await fetch(`/api/analyze?id=${testAnalysisId}`, {
        method: 'GET',
        headers: {
          ...(otherAuthToken && { 'Authorization': `Bearer ${otherAuthToken}` })
        }
      });

      const result = await response.json();

      expect(response.status).toBe(404);
      expect(result.success).toBe(false);

      console.log('[TEST] 跨用户访问被正确阻止');
    });
  });

  describe('POST /api/analyze/batch', () => {
    it('应该成功创建批量分析任务', async () => {
      const keywords = [`${testKeyword}-1`, `${testKeyword}-2`, `${testKeyword}-3`];
      
      const response = await fetch('/api/analyze/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
        body: JSON.stringify({
          keywords: keywords,
          source: 'google',
          region: 'CN'
        }),
      });

      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.analyses).toBeInstanceOf(Array);
      expect(result.data.analyses.length).toBe(keywords.length);

      console.log('[TEST] 批量分析任务创建成功:', result.data.analyses.length);
    });

    it('应该拒绝过多的关键词', async () => {
      const keywords = Array.from({ length: 15 }, (_, i) => `${testKeyword}-${i}`);
      
      const response = await fetch('/api/analyze/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
        body: JSON.stringify({
          keywords: keywords,
          source: 'google',
        }),
      });

      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toContain('关键词数量');

      console.log('[TEST] 过多关键词被正确拒绝');
    });

    it('应该拒绝空关键词列表', async () => {
      const response = await fetch('/api/analyze/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
        body: JSON.stringify({
          keywords: [],
          source: 'google',
        }),
      });

      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toContain('关键词列表不能为空');

      console.log('[TEST] 空关键词列表被正确拒绝');
    });
  });

  describe('分析结果处理', () => {
    it('应该正确处理Google数据源分析', async () => {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
        body: JSON.stringify({
          keyword: 'JavaScript框架',
          source: 'google',
          region: 'CN',
          analysisType: 'detailed'
        }),
      });

      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data.source).toBe('google');

      console.log('[TEST] Google数据源分析正常');
    });

    it('应该正确处理百度数据源分析', async () => {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
        body: JSON.stringify({
          keyword: 'JavaScript框架',
          source: 'baidu',
          region: 'CN',
          analysisType: 'detailed'
        }),
      });

      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data.source).toBe('baidu');

      console.log('[TEST] 百度数据源分析正常');
    });

    it('应该记录分析历史', async () => {
      // 创建分析任务
      const analyzeResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
        body: JSON.stringify({
          keyword: testKeyword,
          source: 'google',
        }),
      });

      const analyzeResult = await analyzeResponse.json();
      expect(analyzeResult.success).toBe(true);

      // 等待一下让分析任务有时间处理
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 检查历史记录
      const historyResponse = await fetch('/api/history', {
        method: 'GET',
        headers: {
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        }
      });

      const historyResult = await historyResponse.json();

      expect(historyResult.success).toBe(true);
      expect(historyResult.data.records).toBeInstanceOf(Array);

      // 查找对应的历史记录
      const analysisHistory = historyResult.data.records.find(
        (record: any) => record.target_id === analyzeResult.data.id
      );

      expect(analysisHistory).toBeDefined();
      expect(analysisHistory.action).toBe('analyze');

      console.log('[TEST] 分析历史记录正常');
    });
  });
});
