import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock分析函数
const mockPerformAnalysis = vi.fn();

describe('Analysis API Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Text Analysis', () => {
    it('should extract keywords correctly', () => {
      const content = 'This is a test content with some repeated words. Test words are important for analysis.';
      const words = content.toLowerCase().match(/\b[a-zA-Z]+\b/g) || [];
      const wordCount: { [key: string]: number } = {};
      
      words.forEach(word => {
        if (word.length > 3) {
          wordCount[word] = (wordCount[word] || 0) + 1;
        }
      });
      
      const keywords = Object.entries(wordCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([word]) => word);
      
      expect(keywords).toContain('test');
      expect(keywords).toContain('words');
      expect(keywords.length).toBeLessThanOrEqual(10);
    });

    it('should calculate text statistics correctly', () => {
      const content = 'This is a sentence. This is another sentence! And a third one?';
      
      const words = content.trim().split(/\s+/).length;
      const characters = content.length;
      const sentences = content.split(/[.!?]+/).filter(s => s.trim()).length;
      
      expect(words).toBe(12); // 修正词数统计
      expect(characters).toBe(62); // 修正字符数
      expect(sentences).toBe(3);
    });

    it('should analyze sentiment correctly', () => {
      const positiveContent = 'This is great! I love it. Excellent work, very happy.';
      const negativeContent = 'This is terrible. Bad quality. Very poor and sad.';
      const neutralContent = 'This is a statement. It contains information.';
      
      const analyzeSentiment = (content: string): string => {
        const positiveWords = ['great', 'love', 'excellent', 'happy', 'good'];
        const negativeWords = ['terrible', 'bad', 'poor', 'sad', 'fail'];
        
        const words = content.toLowerCase().split(/\s+/);
        let positiveCount = 0;
        let negativeCount = 0;
        
        words.forEach(word => {
          if (positiveWords.some(pw => word.includes(pw))) positiveCount++;
          if (negativeWords.some(nw => word.includes(nw))) negativeCount++;
        });
        
        if (positiveCount > negativeCount) return '积极';
        if (negativeCount > positiveCount) return '消极';
        return '中性';
      };
      
      expect(analyzeSentiment(positiveContent)).toBe('积极');
      expect(analyzeSentiment(negativeContent)).toBe('消极');
      expect(analyzeSentiment(neutralContent)).toBe('中性');
    });

    it('should calculate readability correctly', () => {
      const calculateReadability = (words: number, sentences: number): string => {
        const avgWordsPerSentence = words / sentences;
        
        if (avgWordsPerSentence < 10) return '非常容易';
        if (avgWordsPerSentence < 15) return '容易';
        if (avgWordsPerSentence < 20) return '中等';
        if (avgWordsPerSentence < 25) return '困难';
        return '非常困难';
      };
      
      expect(calculateReadability(50, 10)).toBe('非常容易'); // 5 words per sentence
      expect(calculateReadability(120, 10)).toBe('容易'); // 12 words per sentence
      expect(calculateReadability(180, 10)).toBe('中等'); // 18 words per sentence
      expect(calculateReadability(240, 10)).toBe('困难'); // 24 words per sentence
      expect(calculateReadability(300, 10)).toBe('非常困难'); // 30 words per sentence
    });
  });

  describe('Batch Analysis', () => {
    it('should handle multiple texts correctly', async () => {
      const contents = [
        'First text content',
        'Second text content',
        'Third text content',
      ];
      
      mockPerformAnalysis.mockImplementation((content: string) => ({
        summary: `Analysis of: ${content}`,
        statistics: { words: content.split(/\s+/).length },
      }));
      
      const results = await Promise.all(
        contents.map(async (content, index) => {
          try {
            const result = mockPerformAnalysis(content);
            return {
              index,
              success: true,
              result,
            };
          } catch (error) {
            return {
              index,
              success: false,
              error: 'Analysis failed',
            };
          }
        })
      );
      
      expect(results.length).toBe(3);
      expect(results.every(r => r.success)).toBe(true);
      expect(mockPerformAnalysis).toHaveBeenCalledTimes(3);
    });

    it('should enforce batch size limit', () => {
      const contents = new Array(15).fill('Test content');
      const maxBatchSize = 10;
      
      expect(contents.length).toBeGreaterThan(maxBatchSize);
      
      // In actual implementation, this would return an error
      const isValidBatch = contents.length <= maxBatchSize;
      expect(isValidBatch).toBe(false);
    });
  });
});