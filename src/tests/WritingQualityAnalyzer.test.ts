import { WritingQualityAnalyzer } from '../services/implementations/WritingQualityAnalyzer';
import {
  ContractResult,
  ITextAnalysisEngine,
  TextSegment,
  VoiceConsistencyResult,
  CharacterFingerprint,
} from '../types/contracts';
import { describe, test, expect, beforeEach } from 'vitest';

// Mock ITextAnalysisEngine
class MockTextAnalysisEngine implements ITextAnalysisEngine {
  private segments: TextSegment[] | null = null;
  private shouldSucceed: boolean = true;
  private errorMessage: string = 'Mock TextAnalysisEngine Error';

  setSegments(segments: TextSegment[] | null) {
    this.segments = segments;
  }

  setShouldSucceed(shouldSucceed: boolean, errorMessage?: string) {
    this.shouldSucceed = shouldSucceed;
    if (errorMessage) {
      this.errorMessage = errorMessage;
    }
  }

  async parseText(text: string): Promise<ContractResult<TextSegment[]>> {
    if (!this.shouldSucceed) {
      return { success: false, error: this.errorMessage };
    }
    return { success: true, data: this.segments || [] };
  }

  // Other methods of ITextAnalysisEngine are not used by WritingQualityAnalyzer's analyzeVoiceConsistency
  async identifyDialogue(text: string): Promise<ContractResult<any>> {
    throw new Error('Method not implemented.');
  }
  async extractAttributions(text: string): Promise<ContractResult<any>> {
    throw new Error('Method not implemented.');
  }
}

describe('WritingQualityAnalyzer.analyzeVoiceConsistency', () => {
  let mockTextAnalysisEngine: MockTextAnalysisEngine;
  let analyzer: WritingQualityAnalyzer;

  beforeEach(() => {
    mockTextAnalysisEngine = new MockTextAnalysisEngine();
    analyzer = new WritingQualityAnalyzer(mockTextAnalysisEngine);
  });

  // Test Case 1: Basic Happy Path
  test('should return correct fingerprints and no warnings for distinct characters', async () => {
    const segments: TextSegment[] = [
      { id: '1', content: "Hello world. This is a test.", speaker: "John", type: 'dialogue', startPosition: 0, endPosition: 20 },
      { id: '2', content: "Indeed. Another sentence here.", speaker: "Sarah", type: 'dialogue', startPosition: 21, endPosition: 40 },
    ];
    mockTextAnalysisEngine.setSegments(segments);

    const result = await analyzer.analyzeVoiceConsistency("Some text");

    expect(result.success).toBe(true);
    expect(result.data?.fingerprints).toHaveLength(2);
    expect(result.data?.warnings).toHaveLength(0);

    const johnFingerprint = result.data?.fingerprints.find(f => f.characterName === 'John');
    expect(johnFingerprint).toBeDefined();
    // John: "Hello world. This is a test." -> sentences: ["Hello world", " This is a test"]. totalWordsInSentences = 2+4=6. averageSentenceLength = 6/2 = 3.
    expect(johnFingerprint?.metrics.averageSentenceLength).toBeCloseTo(3);
                                                                    // For "Hello world. This is a test." -> words: "hello", "world", "this", "is", "test" (common "a" removed). Total 5. Sentences: "Hello world", "This is a test". Avg length: 2.5 words.
                                                                    // Let's re-evaluate based on code: sentences = combinedDialogue.split(/[.!?]+/g).filter(s => s.trim().length > 0);
                                                                    // John: "Hello world. This is a test." -> sentences: ["Hello world", " This is a test"]. totalWordsInSentences = 2+4=6. averageSentenceLength = 6/2 = 3.
    expect(johnFingerprint?.metrics.vocabularyRichness).toBeGreaterThan(0);
    expect(johnFingerprint?.metrics.topWords.length).toBeGreaterThanOrEqual(0); // could be less than 5 if not enough unique words

    const sarahFingerprint = result.data?.fingerprints.find(f => f.characterName === 'Sarah');
    expect(sarahFingerprint).toBeDefined();
    // Sarah: "Indeed. Another sentence here." -> sentences: ["Indeed", " Another sentence here"]. totalWordsInSentences = 1+3=4. averageSentenceLength = 4/2 = 2.
    expect(sarahFingerprint?.metrics.averageSentenceLength).toBeCloseTo(2);
    expect(sarahFingerprint?.metrics.vocabularyRichness).toBeGreaterThan(0);
  });

  // Test Case 2: Similar Characters (Trigger Warning)
  test('should generate warnings for characters with similar vocabulary', async () => {
    const segments: TextSegment[] = [
      { id: '1', content: "The quick brown fox jumps over the lazy dog. Cryptography is fun.", speaker: "John", type: 'dialogue', startPosition: 0, endPosition: 50 },
      { id: '2', content: "A quick brown dog jumps over the lazy fox. Cryptography is interesting.", speaker: "Jane", type: 'dialogue', startPosition: 51, endPosition: 100 },
    ];
    mockTextAnalysisEngine.setSegments(segments);
    // Common words: "the", "a", "is", "over"
    // John: "quick", "brown", "fox", "jumps", "lazy", "dog", "cryptography", "fun" (8 unique non-common)
    // Jane: "quick", "brown", "dog", "jumps", "lazy", "fox", "cryptography", "interesting" (8 unique non-common)
    // Common unique non-common: "quick", "brown", "fox", "jumps", "lazy", "dog", "cryptography" (7 words)
    // John top 5 (example): "cryptography", "quick", "brown", "fox", "jumps"
    // Jane top 5 (example): "cryptography", "quick", "brown", "dog", "jumps"
    // Intersection: "cryptography", "quick", "brown", "jumps" (4)
    // Union: "cryptography", "quick", "brown", "fox", "jumps", "dog" (6)
    // Jaccard: 4/6 = 0.666 * 100 = 66.6% -> Warning should be triggered

    const result = await analyzer.analyzeVoiceConsistency("Some text");

    expect(result.success).toBe(true);
    expect(result.data?.fingerprints).toHaveLength(2);
    expect(result.data?.warnings).toHaveLength(1);
    expect(result.data?.warnings[0]).toContain("John and Jane have a");
    expect(result.data?.warnings[0]).toContain("vocabulary overlap");
  });

  // Test Case 3: No Dialogue
  test('should return empty fingerprints and specific warning if no dialogue segments found', async () => {
    const segments: TextSegment[] = [
      { id: '1', content: "The sun set.", speaker: "Narrator", type: 'narration', startPosition: 0, endPosition: 10 },
    ];
    mockTextAnalysisEngine.setSegments(segments);

    const result = await analyzer.analyzeVoiceConsistency("Some text");

    expect(result.success).toBe(true);
    expect(result.data?.fingerprints).toHaveLength(0);
    expect(result.data?.warnings).toHaveLength(1);
    expect(result.data?.warnings[0]).toBe('No dialogue segments found for voice consistency analysis.');
  });

  test('should return empty fingerprints and specific warning if segments array is empty', async () => {
    mockTextAnalysisEngine.setSegments([]); // No segments at all

    const result = await analyzer.analyzeVoiceConsistency("Some text");

    expect(result.success).toBe(true);
    expect(result.data?.fingerprints).toHaveLength(0);
    expect(result.data?.warnings).toHaveLength(1);
    expect(result.data?.warnings[0]).toBe('No dialogue segments found for voice consistency analysis.');
  });


  // Test Case 4: Dialogue with Only Common Words
  test('should handle dialogue with only common words gracefully', async () => {
    const segments: TextSegment[] = [
      { id: '1', content: "It is a good day. Yes it is.", speaker: "Tom", type: 'dialogue', startPosition: 0, endPosition: 20 },
      { id: '2', content: "A good day it is. Yes it is.", speaker: "Jerry", type: 'dialogue', startPosition: 21, endPosition: 40 },
    ];
    mockTextAnalysisEngine.setSegments(segments);
    // Tom: "it", "is", "a", "good", "day", "yes", "it", "is" -> non-common: "good", "day", "yes"
    // Jerry: "a", "good", "day", "it", "is", "yes", "it", "is" -> non-common: "good", "day", "yes"
    // Both have same 3 top words: "good", "day", "yes". Intersection 3, Union 3. Jaccard 100%.

    const result = await analyzer.analyzeVoiceConsistency("Some text");

    expect(result.success).toBe(true);
    expect(result.data?.fingerprints).toHaveLength(2);
    const tomFingerprint = result.data?.fingerprints.find(f => f.characterName === 'Tom');
    expect(tomFingerprint?.metrics.vocabularyRichness).toBeCloseTo(1); // 3 unique / 3 total filtered words
    expect(tomFingerprint?.metrics.topWords.map(tw => tw.word).sort()).toEqual(['day', 'good', 'yes']);

    const jerryFingerprint = result.data?.fingerprints.find(f => f.characterName === 'Jerry');
    expect(jerryFingerprint?.metrics.vocabularyRichness).toBeCloseTo(1);
    expect(jerryFingerprint?.metrics.topWords.map(tw => tw.word).sort()).toEqual(['day', 'good', 'yes']);

    expect(result.data?.warnings).toHaveLength(1); // Should trigger a warning due to 100% overlap
    expect(result.data?.warnings[0]).toContain("Tom and Jerry have a 100% vocabulary overlap");
  });

  // Test Case 5: TextAnalysisEngine Failure
  test('should return success:false when TextAnalysisEngine fails', async () => {
    mockTextAnalysisEngine.setShouldSucceed(false, "Engine exploded");

    const result = await analyzer.analyzeVoiceConsistency("Some text");

    expect(result.success).toBe(false);
    expect(result.data).toBeUndefined();
    expect(result.error).toBe('Failed to parse text for voice consistency analysis: Engine exploded');
  });

  // Test Case 6: Single Character Dialogue
  test('should process single character dialogue without warnings', async () => {
    const segments: TextSegment[] = [
      { id: '1', content: "I am talking to myself. It is quite interesting.", speaker: "Solo", type: 'dialogue', startPosition: 0, endPosition: 30 },
    ];
    mockTextAnalysisEngine.setSegments(segments);
    // Solo: "talking", "myself", "quite", "interesting"
    // Sentences: "I am talking to myself", "It is quite interesting"
    // Words: 4, 4. Avg: 4
    const result = await analyzer.analyzeVoiceConsistency("Some text");

    expect(result.success).toBe(true);
    expect(result.data?.fingerprints).toHaveLength(1);
    expect(result.data?.warnings).toHaveLength(0);
    const soloFingerprint = result.data?.fingerprints[0];
    expect(soloFingerprint?.characterName).toBe('Solo');
    // Solo: "I am talking to myself. It is quite interesting."
    // Sentences: "I am talking to myself" (5 words), "It is quite interesting" (4 words)
    // Avg: (5+4)/2 = 4.5
    expect(soloFingerprint?.metrics.averageSentenceLength).toBe(4.5);
    expect(soloFingerprint?.metrics.vocabularyRichness).toBe(1); // "talking", "myself", "quite", "interesting" -> 4 unique / 4 total non-common
    expect(soloFingerprint?.metrics.topWords.length).toBe(4);
  });

  // Test Case 7: Punctuation and Sentence Splitting
  test('should correctly calculate averageSentenceLength with various punctuation', async () => {
    const segments: TextSegment[] = [
      { id: '1', content: "First sentence. Second sentence! Third sentence? End.", speaker: "Punctual", type: 'dialogue', startPosition: 0, endPosition: 30 },
    ];
    // Sentences: "First sentence", " Second sentence", " Third sentence", " End"
    // Words: 2, 2, 2, 1. Total 7. Num sentences 4. Avg: 7/4 = 1.75
    mockTextAnalysisEngine.setSegments(segments);
    const result = await analyzer.analyzeVoiceConsistency("Some text");

    expect(result.success).toBe(true);
    const punctualFingerprint = result.data?.fingerprints.find(f => f.characterName === 'Punctual');
    expect(punctualFingerprint?.metrics.averageSentenceLength).toBeCloseTo(1.75);
  });

  // Test Case 8: Case Insensitivity and Word Tokenization
  test('should handle case insensitivity and tokenization correctly', async () => {
    const segments: TextSegment[] = [
      { id: '1', content: "  Hello... World! world IS HELLO.  ", speaker: "Echo", type: 'dialogue', startPosition: 0, endPosition: 20 },
    ];
    // Words: "hello", "world", "world", "is", "hello"
    // Filtered (common "is" removed): "hello", "world", "world", "hello"
    // Unique filtered: "hello", "world" (2)
    // Total filtered: 4
    // Richness: 2/4 = 0.5
    // Top words: "hello" (2), "world" (2)
    mockTextAnalysisEngine.setSegments(segments);
    const result = await analyzer.analyzeVoiceConsistency("Some text");

    expect(result.success).toBe(true);
    const echoFingerprint = result.data?.fingerprints.find(f => f.characterName === 'Echo');
    expect(echoFingerprint).toBeDefined();
    expect(echoFingerprint?.metrics.vocabularyRichness).toBeCloseTo(0.5);
    expect(echoFingerprint?.metrics.topWords).toHaveLength(2);
    const topWords = echoFingerprint?.metrics.topWords.map(tw => tw.word).sort();
    expect(topWords).toEqual(['hello', 'world']);
    const freqs = echoFingerprint?.metrics.topWords.map(tw => tw.frequency).sort();
    expect(freqs).toEqual([2,2]);
  });

  test('should handle empty dialogue string for a character', async () => {
    const segments: TextSegment[] = [
      { id: '1', content: "", speaker: "SilentBob", type: 'dialogue', startPosition: 0, endPosition: 0 },
      { id: '2', content: "I speak.", speaker: "Talker", type: 'dialogue', startPosition: 1, endPosition: 10 },
    ];
    mockTextAnalysisEngine.setSegments(segments);
    const result = await analyzer.analyzeVoiceConsistency("Test");

    expect(result.success).toBe(true);
    expect(result.data?.fingerprints).toHaveLength(2);
    const bobFingerprint = result.data?.fingerprints.find(f => f.characterName === "SilentBob");
    expect(bobFingerprint).toBeDefined();
    expect(bobFingerprint?.metrics.averageSentenceLength).toBe(0);
    expect(bobFingerprint?.metrics.vocabularyRichness).toBe(0);
    expect(bobFingerprint?.metrics.topWords).toEqual([]);

    const talkerFingerprint = result.data?.fingerprints.find(f => f.characterName === "Talker");
    expect(talkerFingerprint?.metrics.averageSentenceLength).toBe(2); // "I speak." -> 2 words, 1 sentence
    expect(talkerFingerprint?.metrics.vocabularyRichness).toBe(1); // "speak" (unique:1, total:1)
    expect(talkerFingerprint?.metrics.topWords.map(t=>t.word)).toEqual(["speak"]);

    expect(result.data?.warnings).toHaveLength(0);
  });

  test('should correctly calculate Jaccard Index for warnings', async () => {
    const segments: TextSegment[] = [
      // Char1: top words A, B, C
      { id: '1', content: "Alpha bravo charlie delta echo.", speaker: "Char1", type: 'dialogue', startPosition: 0, endPosition: 20 },
      // Char2: top words C, D, E
      { id: '2', content: "Charlie delta echo foxtrot golf.", speaker: "Char2", type: 'dialogue', startPosition: 21, endPosition: 40 },
      // Char3: top words X, Y, Z (no overlap with 1 or 2)
      { id: '3', content: "Xray yankee zulu.", speaker: "Char3", type: 'dialogue', startPosition: 41, endPosition: 60 },
       // Char4: top words A, B, F (overlap with 1, little with 2)
      { id: '4', content: "Alpha bravo foxtrot hotel india.", speaker: "Char4", type: 'dialogue', startPosition: 61, endPosition: 80 },

    ];
    // Assuming topWords count is 3 for simplicity in this test's mock content
    // Char1: non-common: "alpha", "bravo", "charlie", "delta", "echo" -> top3: alpha, bravo, charlie (example)
    // Char2: non-common: "charlie", "delta", "echo", "foxtrot", "golf" -> top3: charlie, delta, echo (example)
    // Char1 top: {alpha, bravo, charlie}
    // Char2 top: {charlie, delta, echo}
    // Intersection(1,2): {charlie} (1)
    // Union(1,2): {alpha, bravo, charlie, delta, echo} (5)
    // Jaccard(1,2): 1/5 = 20%

    // Char4 top: {alpha, bravo, foxtrot}
    // Intersection(1,4): {alpha, bravo} (2)
    // Union(1,4): {alpha, bravo, charlie, foxtrot} (4)
    // Jaccard(1,4): 2/4 = 50%

    // Intersection(2,4): {foxtrot} (via "Charlie delta echo foxtrot golf" vs "Alpha bravo foxtrot hotel india")
    // Char2's actual words: charlie, delta, echo, foxtrot, golf -> top assumed charlie, delta, echo
    // Char4's actual words: alpha, bravo, foxtrot, hotel, india -> top assumed alpha, bravo, foxtrot
    // Intersection(2,4) based on these assumed tops: empty set. Jaccard 0%.
    // This test needs to be robust to the actual top words calculation.
    // Let's make content so top words are predictable:
    // Char1: "wordA wordA wordA wordB wordB wordC" -> Top: wordA, wordB, wordC
    // Char2: "wordC wordC wordC wordD wordD wordE" -> Top: wordC, wordD, wordE
    // Intersection(C1,C2) = {wordC} (1). Union = {A,B,C,D,E} (5). Jaccard = 1/5 = 20%
    // Char4: "wordA wordA wordA wordB wordB wordF" -> Top: wordA, wordB, wordF
    // Intersection(C1,C4) = {wordA, wordB} (2). Union = {A,B,C,F} (4). Jaccard = 2/4 = 50%
    // Intersection(C2,C4) = {} (0). Union = {A,B,C,D,E,F} (6). Jaccard = 0/6 = 0%

    const segmentsPrecise: TextSegment[] = [
      { id: 's1', content: "wordA wordA wordA wordA wordA wordB wordB wordB wordB wordC wordC wordC wordUnique1", speaker: "Char1", type: 'dialogue', startPosition: 0, endPosition: 1 },
      { id: 's2', content: "wordC wordC wordC wordC wordC wordD wordD wordD wordD wordE wordE wordE wordUnique2", speaker: "Char2", type: 'dialogue', startPosition: 0, endPosition: 1 },
      { id: 's3', content: "wordX wordX wordX wordX wordX wordY wordY wordY wordY wordZ wordZ wordZ wordUnique3", speaker: "Char3", type: 'dialogue', startPosition: 0, endPosition: 1 },
      { id: 's4', content: "wordA wordA wordA wordA wordA wordB wordB wordB wordB wordF wordF wordF wordUnique4", speaker: "Char4", type: 'dialogue', startPosition: 0, endPosition: 1 },
    ];

    mockTextAnalysisEngine.setSegments(segmentsPrecise);
    const result = await analyzer.analyzeVoiceConsistency("Test Jaccard");

    expect(result.success).toBe(true);
    const char1FP = result.data?.fingerprints.find(f => f.characterName === 'Char1');
    const char2FP = result.data?.fingerprints.find(f => f.characterName === 'Char2');
    const char4FP = result.data?.fingerprints.find(f => f.characterName === 'Char4');

    // Char1: "wordA wordA wordA wordA wordA wordB wordB wordB wordB wordC wordC wordC wordUnique1" -> Top: worda (5), wordb (4), wordc (3), wordunique1 (1)
    expect(char1FP?.metrics.topWords.map(tw=>tw.word).sort()).toEqual(['worda','wordb','wordc', 'wordunique1']);
    // Char2: "wordC wordC wordC wordC wordC wordD wordD wordD wordD wordE wordE wordE wordUnique2" -> Top: wordc (5), wordd (4), worde (3), wordunique2 (1)
    expect(char2FP?.metrics.topWords.map(tw=>tw.word).sort()).toEqual(['wordc','wordd','worde', 'wordunique2']);
    // Char4: "wordA wordA wordA wordA wordA wordB wordB wordB wordB wordF wordF wordF wordUnique4" -> Top: worda (5), wordb (4), wordf (3), wordunique4 (1)
    expect(char4FP?.metrics.topWords.map(tw=>tw.word).sort()).toEqual(['worda','wordb','wordf', 'wordunique4']);

    // Expected Jaccard:
    // C1 vs C2: Intersection {wordc} (1). Union {worda, wordb, wordc, wordd, worde} (5). Jaccard = 1/5 = 20%. No warning.
    // C1 vs C3: Intersection {} (0). Union {worda, wordb, wordc, wordx, wordy, wordz} (6). Jaccard = 0/6 = 0%. No warning.
    // C1 vs C4: Intersection {worda, wordb} (2). Union {worda, wordb, wordc, wordf} (4). Jaccard = 2/4 = 50%. No warning.
    // C2 vs C3: Intersection {} (0). Union {wordc, wordd, worde, wordx, wordy, wordz} (6). Jaccard = 0/6 = 0%. No warning.
    // C2 vs C4: Intersection {} (0). Union {worda, wordb, wordc, wordd, worde, wordf} (6). Jaccard = 0/6 = 0%. No warning.
    // C3 vs C4: Intersection {} (0). Union {worda, wordb, wordf, wordx, wordy, wordz} (6). Jaccard = 0/6 = 0%. No warning.

    // Let's adjust for a warning:
    // Char5: wordA wordA wordA wordB wordB wordG wordG -> top: wordA, wordB, wordG
    // Char1 vs Char5: Intersection {wordA, wordB} (2). Union {wordA, wordB, wordC, wordG} (4). Jaccard = 50%.
    // To get a warning (Jaccard > 60%):
    // Char1: A A A B B C (top A,B,C)
    // Char6: A A A B B B (top A,B) -> topWords will be A (freq 3), B (freq 3).
    // Intersection {A,B} (2). Union {A,B,C} (3). Jaccard = 2/3 = 66.7%. This should trigger warning.
     const segmentsForWarning: TextSegment[] = [
      { id: 's1w', content: "wordA wordA wordA wordB wordB wordC", speaker: "Char1W", type: 'dialogue', startPosition: 0, endPosition: 1 },
      { id: 's2w', content: "wordA wordA wordA wordB wordB wordB", speaker: "Char6W", type: 'dialogue', startPosition: 0, endPosition: 1 },
      { id: 's3w', content: "wordX wordX wordY", speaker: "CharOther", type: 'dialogue', startPosition: 0, endPosition: 1 },

    ];
    mockTextAnalysisEngine.setSegments(segmentsForWarning);
    const resultW = await analyzer.analyzeVoiceConsistency("Test Jaccard Warning");
    expect(resultW.data?.warnings).toHaveLength(1);
    expect(resultW.data?.warnings[0]).toContain("Char1W and Char6W have a 67% vocabulary overlap"); // 2 common / 3 union = 66.66...%

    const char1WFp = resultW.data?.fingerprints.find(f=>f.characterName==='Char1W');
    const char6WFp = resultW.data?.fingerprints.find(f=>f.characterName==='Char6W');
    expect(char1WFp?.metrics.topWords.map(t=>t.word).sort()).toEqual(['worda','wordb','wordc']);
    // For Char6W: "wordA" (3), "wordB" (3). topWords could be just [wordA, wordB] or padded if code allows
    // The code takes top 5. So it will be [wordA, wordB]
    expect(char6WFp?.metrics.topWords.map(t=>t.word).sort()).toEqual(['worda','wordb']);
  });

});
