import { WritingQualityAnalyzer } from '../services/implementations/WritingQualityAnalyzer';
import {
  ContractResult,
  ITextAnalysisEngine,
  TextSegment,
} from '../types/contracts';
import { describe, test, expect, beforeEach, vi } from 'vitest';

// Mock ITextAnalysisEngine
const mockTextAnalysisEngine: ITextAnalysisEngine = {
    parseText: vi.fn(),
    identifyDialogue: vi.fn(),
    extractAttributions: vi.fn(),
};

describe('WritingQualityAnalyzer', () => {
  let analyzer: WritingQualityAnalyzer;

  beforeEach(() => {
    // @ts-ignore
    analyzer = new WritingQualityAnalyzer(mockTextAnalysisEngine);
    vi.resetAllMocks();
  });

  describe('analyzeTropes', () => {
    it('should identify a known trope from the dictionary', async () => {
      const text = 'The prophecy foretold that only the heir, the chosen one, could save them.';
      const result = await analyzer.analyzeTropes(text);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      if (result.data) {
        expect(result.data.length).toBe(1);
        expect(result.data[0].name).toBe('The Chosen One');
      }
    });
  });

  describe('analyzeVoiceConsistency', () => {
    beforeEach(() => {
        (mockTextAnalysisEngine.parseText as any).mockImplementation(async (text: string): Promise<ContractResult<TextSegment[]>> => {
            if (!text) {
                return { success: true, data: [] };
            }
            const sentences = text.split('. ').filter(s => s.length > 0);
            const segments: TextSegment[] = sentences.map((s, i) => {
                const parts = s.split(': ');
                return {
                    id: `seg${i}`,
                    content: parts[1] || parts[0],
                    speaker: parts.length > 1 ? parts[0] : 'Narrator',
                    type: 'dialogue',
                    startPosition: 0,
                    endPosition: 0
                }
            });
            return { success: true, data: segments };
        });
    });

    test('should return success with empty data for empty text', async () => {
        const result = await analyzer.analyzeVoiceConsistency('');
        expect(result.success).toBe(true);
        expect(result.data?.fingerprints).toEqual([]);
        expect(result.data?.warnings).toEqual([]);
    });
  });
});
